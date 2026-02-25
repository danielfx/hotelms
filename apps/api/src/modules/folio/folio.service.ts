import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChargeType, PaymentMethod, PaymentStatus, FolioStatus } from '@prisma/client';
import { AddChargeDto, AddPaymentDto } from '../reservations/dto';

@Injectable()
export class FolioService {
  private readonly logger = new Logger(FolioService.name);

  constructor(private prisma: PrismaService) {}

  // ─── GET FOLIO ────────────────────────────────────────────────────────────

  async getByReservation(reservationId: string, propertyId: string) {
    const folio = await this.prisma.folio.findFirst({
      where: { reservationId },
      include: {
        charges: {
          orderBy: { date: 'asc' },
        },
        reservation: {
          include: {
            guest: true,
            room: { include: { roomType: true } },
            payments: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
    if (!folio) throw new NotFoundException('Folio not found');
    return folio;
  }

  async getById(id: string) {
    const folio = await this.prisma.folio.findUnique({
      where: { id },
      include: {
        charges: { orderBy: { date: 'asc' } },
        reservation: {
          include: {
            guest: true,
            room: { include: { roomType: true } },
            payments: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
    if (!folio) throw new NotFoundException('Folio not found');
    return folio;
  }

  // ─── ADD CHARGE ───────────────────────────────────────────────────────────

  async addCharge(folioId: string, dto: AddChargeDto, userId: string) {
    const folio = await this.prisma.folio.findUnique({ where: { id: folioId } });
    if (!folio) throw new NotFoundException('Folio not found');
    if (folio.status === FolioStatus.CLOSED) throw new BadRequestException('Cannot add charges to a closed folio');
    if (folio.status === FolioStatus.VOID) throw new BadRequestException('Cannot add charges to a voided folio');

    const taxRate = dto.taxRate ?? 0;
    const amount = dto.quantity * dto.unitPrice;
    const taxAmount = amount * (taxRate / 100);

    const charge = await this.prisma.folioCharge.create({
      data: {
        folioId,
        type: dto.type as ChargeType,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        amount,
        taxRate,
        taxAmount,
        postedBy: userId,
      },
    });

    // Recalculate folio totals
    await this.recalculateFolio(folioId);
    return charge;
  }

  // ─── VOID CHARGE ──────────────────────────────────────────────────────────

  async voidCharge(chargeId: string, userId: string) {
    const charge = await this.prisma.folioCharge.findUnique({
      where: { id: chargeId },
      include: { folio: true },
    });
    if (!charge) throw new NotFoundException('Charge not found');
    if (charge.voided) throw new BadRequestException('Charge is already voided');
    if (charge.folio.status === FolioStatus.CLOSED) throw new BadRequestException('Cannot void charge on closed folio');

    await this.prisma.folioCharge.update({
      where: { id: chargeId },
      data: { voided: true, voidedAt: new Date(), voidedBy: userId },
    });

    await this.recalculateFolio(charge.folioId);
    return { message: 'Charge voided successfully' };
  }

  // ─── ADD PAYMENT ──────────────────────────────────────────────────────────

  async addPayment(reservationId: string, dto: AddPaymentDto, propertyId: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, propertyId },
      include: { folio: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (!reservation.folio) throw new NotFoundException('Folio not found');
    if (reservation.folio.status === FolioStatus.VOID) throw new BadRequestException('Folio is voided');

    const payment = await this.prisma.payment.create({
      data: {
        reservationId,
        propertyId,
        amount: dto.amount,
        currency: 'USD',
        method: dto.method as PaymentMethod,
        status: PaymentStatus.CAPTURED,
        last4: dto.last4,
        cardBrand: dto.cardBrand,
        reference: dto.reference,
        notes: dto.notes,
        processedAt: new Date(),
      },
    });

    // Update reservation paid amount
    const newPaid = Number(reservation.paidAmount) + dto.amount;
    const newBalance = Math.max(0, Number(reservation.totalAmount) - newPaid);

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { paidAmount: newPaid, balanceDue: newBalance },
    });

    // Update folio
    await this.recalculateFolio(reservation.folio.id);

    this.logger.log(`Payment of $${dto.amount} recorded for reservation ${reservationId}`);
    return payment;
  }

  // ─── CLOSE FOLIO ─────────────────────────────────────────────────────────

  async closeFolio(id: string, userId: string) {
    const folio = await this.prisma.folio.findUnique({
      where: { id },
      include: { reservation: true },
    });
    if (!folio) throw new NotFoundException('Folio not found');
    if (Number(folio.balance) > 0.01) {
      throw new BadRequestException(`Cannot close folio with outstanding balance of $${Number(folio.balance).toFixed(2)}`);
    }

    return this.prisma.folio.update({
      where: { id },
      data: { status: FolioStatus.CLOSED, closedAt: new Date() },
    });
  }

  // ─── GENERATE INVOICE ────────────────────────────────────────────────────

  async generateInvoice(id: string) {
    const folio = await this.getById(id);
    if (folio.status === FolioStatus.OPEN) throw new BadRequestException('Close the folio before generating invoice');

    const invoiceNo = `INV-${Date.now()}`;
    const updated = await this.prisma.folio.update({
      where: { id },
      data: { status: FolioStatus.INVOICED, invoiceNo, invoicedAt: new Date() },
      include: { charges: true, reservation: { include: { guest: true, room: { include: { roomType: true } } } } },
    });

    // Build invoice data
    return {
      ...updated,
      invoiceNo,
      property: await this.prisma.property.findUnique({
        where: { id: updated.reservation.propertyId },
      }),
    };
  }

  // ─── NIGHT AUDIT ROOM CHARGES ─────────────────────────────────────────────

  async postNightlyRoomCharges(propertyId: string, date: string, userId: string) {
    const auditDate = new Date(date);
    const results = { posted: 0, skipped: 0, errors: [] as string[] };

    // Get all checked-in reservations
    const checkedIn = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        status: 'CHECKED_IN',
        checkIn: { lte: auditDate },
        checkOut: { gt: auditDate },
      },
      include: {
        room: { include: { roomType: true } },
        folio: { include: { charges: true } },
        ratePlan: true,
      },
    });

    for (const res of checkedIn) {
      try {
        if (!res.folio) { results.skipped++; continue; }

        // Check if room charge already posted for this date
        const alreadyPosted = res.folio.charges.some(
          c => c.type === 'ROOM' &&
               new Date(c.date).toISOString().split('T')[0] === date &&
               !c.voided
        );
        if (alreadyPosted) { results.skipped++; continue; }

        const rate = Number(res.baseRate);
        const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
        const taxRate = property?.taxRate ?? 0;
        const taxAmount = rate * (taxRate / 100);

        await this.prisma.folioCharge.create({
          data: {
            folioId: res.folio.id,
            type: ChargeType.ROOM,
            description: `Room ${res.room.number} - ${res.room.roomType.name}`,
            quantity: 1,
            unitPrice: rate,
            amount: rate,
            taxRate,
            taxAmount,
            date: auditDate,
            postedBy: userId,
          },
        });

        await this.recalculateFolio(res.folio.id);
        results.posted++;
      } catch (e: any) {
        results.errors.push(`Reservation ${res.id}: ${e.message}`);
      }
    }

    return results;
  }

  // ─── PRIVATE: RECALCULATE ─────────────────────────────────────────────────

  private async recalculateFolio(folioId: string) {
    const charges = await this.prisma.folioCharge.findMany({
      where: { folioId, voided: false },
    });
    const payments = await this.prisma.payment.findMany({
      where: {
        reservation: { folio: { id: folioId } },
        status: { in: [PaymentStatus.CAPTURED, PaymentStatus.AUTHORIZED] },
      },
    });

    const totalCharges = charges.reduce((s, c) => s + Number(c.amount) + Number(c.taxAmount), 0);
    const totalTax = charges.reduce((s, c) => s + Number(c.taxAmount), 0);
    const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = totalCharges - totalPayments;

    await this.prisma.folio.update({
      where: { id: folioId },
      data: { totalCharges, totalTax, totalPayments, balance },
    });
  }
}
