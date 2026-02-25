import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Real integrations: SendGrid (email), Twilio (SMS), Twilio/WhatsApp Business API
// import * as sgMail from '@sendgrid/mail';
// import twilio from 'twilio';

export type MessageChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PORTAL';
export type TemplateType =
  | 'BOOKING_CONFIRMATION' | 'PRE_ARRIVAL' | 'CHECK_IN_WELCOME'
  | 'CHECK_OUT_RECEIPT' | 'CANCELLATION' | 'PAYMENT_RECEIPT'
  | 'REVIEW_REQUEST' | 'PROMO' | 'CUSTOM';

interface SendResult { success: boolean; messageId?: string; error?: string; }

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(private prisma: PrismaService) {}

  // --- SEND MESSAGE ---------------------------------------------------------

  async sendMessage(params: {
    propertyId: string;
    reservationId?: string;
    guestId: string;
    channel: MessageChannel;
    templateType?: TemplateType;
    subject?: string;
    body: string;
    scheduledFor?: Date;
  }): Promise<SendResult> {

    if (!params.reservationId) {
      // Cannot create a GuestMessage without a reservationId
      this.logger.warn('Cannot save message without reservationId, sending without persisting');
      return this.dispatchMessage(params);
    }

    // Save to DB - GuestMessage uses `body` field, not `content`
    // GuestMessage has no `guestId`, `templateType`, `status`, `scheduledFor` fields
    const message = await this.prisma.guestMessage.create({
      data: {
        propertyId: params.propertyId,
        reservationId: params.reservationId,
        channel: params.channel,
        direction: 'OUTBOUND',
        subject: params.subject,
        body: params.body,
      },
    });

    if (params.scheduledFor && params.scheduledFor > new Date()) {
      return { success: true, messageId: message.id };
    }

    return this.dispatchAndUpdate(message.id, params);
  }

  private async dispatchAndUpdate(messageId: string, params: {
    guestId: string; channel: MessageChannel; subject?: string; body: string;
  }): Promise<SendResult> {
    let result: SendResult;

    try {
      result = await this.dispatchMessage(params);

      // GuestMessage has no `status`, `externalId`, `deliveredAt`, `errorMessage` fields
      // Update what we can: mark as read or store error in the `error` field
      if (!result.success && result.error) {
        await this.prisma.guestMessage.update({
          where: { id: messageId },
          data: { error: result.error },
        });
      } else if (result.success) {
        await this.prisma.guestMessage.update({
          where: { id: messageId },
          data: { sentAt: new Date() },
        });
      }
    } catch (e: any) {
      await this.prisma.guestMessage.update({
        where: { id: messageId },
        data: { error: e.message },
      });
      result = { success: false, error: e.message };
    }

    return result;
  }

  private async dispatchMessage(params: {
    guestId: string; channel: MessageChannel; subject?: string; body: string;
  }): Promise<SendResult> {
    switch (params.channel) {
      case 'EMAIL':
        return this.sendEmail(params.guestId, params.subject ?? '', params.body);
      case 'SMS':
        return this.sendSms(params.guestId, params.body);
      case 'WHATSAPP':
        return this.sendWhatsApp(params.guestId, params.body);
      case 'PORTAL':
        return { success: true, messageId: `portal_${Date.now()}` };
      default:
        return { success: false, error: 'Unknown channel' };
    }
  }

  // --- TEMPLATED SENDS ------------------------------------------------------

  async sendBookingConfirmation(reservationId: string) {
    const res = await this.getReservationWithGuest(reservationId);
    const body = this.renderTemplate('BOOKING_CONFIRMATION', res);

    return this.sendMessage({
      propertyId: res.propertyId,
      reservationId,
      guestId: res.guestId,
      channel: 'EMAIL',
      templateType: 'BOOKING_CONFIRMATION',
      subject: `Booking Confirmed -- ${res.confirmationNo} | ${res.property.name}`,
      body,
    });
  }

  async sendPreArrival(reservationId: string) {
    const res = await this.getReservationWithGuest(reservationId);
    const body = this.renderTemplate('PRE_ARRIVAL', res);

    // Send both email and WhatsApp if number available
    const results = await Promise.allSettled([
      this.sendMessage({
        propertyId: res.propertyId, reservationId, guestId: res.guestId,
        channel: 'EMAIL', templateType: 'PRE_ARRIVAL',
        subject: `Your stay at ${res.property.name} is coming up!`,
        body,
      }),
      ...(res.guest.phone ? [this.sendMessage({
        propertyId: res.propertyId, reservationId, guestId: res.guestId,
        channel: 'WHATSAPP', templateType: 'PRE_ARRIVAL',
        body: `Hi ${res.guest.firstName}! Your stay at ${res.property.name} is in ${Math.ceil((new Date(res.checkIn).getTime() - Date.now()) / 86400000)} day(s). Check in online: ${process.env.PORTAL_URL}/portal/${res.confirmationNo}`,
      })] : []),
    ]);

    return results.map(r => r.status === 'fulfilled' ? r.value : { success: false });
  }

  async sendCheckInWelcome(reservationId: string) {
    const res = await this.getReservationWithGuest(reservationId);
    const body = `Hi ${res.guest.firstName}! Welcome to ${res.property.name}. Your room is ${res.room?.number}. WiFi: HotelGuest / Pass: ${res.confirmationNo}. Need anything? Reply to this message. Enjoy your stay!`;

    return Promise.all([
      this.sendMessage({ propertyId: res.propertyId, reservationId, guestId: res.guestId, channel: 'SMS', templateType: 'CHECK_IN_WELCOME', body }),
      ...(res.guest.phone ? [this.sendMessage({ propertyId: res.propertyId, reservationId, guestId: res.guestId, channel: 'WHATSAPP', templateType: 'CHECK_IN_WELCOME', body })] : []),
    ]);
  }

  async sendCheckOutReceipt(reservationId: string) {
    const res = await this.getReservationWithGuest(reservationId);
    const body = this.renderTemplate('CHECK_OUT_RECEIPT', res);
    return this.sendMessage({
      propertyId: res.propertyId, reservationId, guestId: res.guestId,
      channel: 'EMAIL', templateType: 'CHECK_OUT_RECEIPT',
      subject: `Receipt for your stay -- ${res.confirmationNo}`,
      body,
    });
  }

  async sendReviewRequest(reservationId: string) {
    const res = await this.getReservationWithGuest(reservationId);
    // Schedule 2 hours post-checkout
    const scheduledFor = new Date(res.checkOut);
    scheduledFor.setHours(scheduledFor.getHours() + 2);
    return this.sendMessage({
      propertyId: res.propertyId, reservationId, guestId: res.guestId,
      channel: 'EMAIL', templateType: 'REVIEW_REQUEST',
      subject: `How was your stay at ${res.property.name}?`,
      body: `Dear ${res.guest.firstName}, we hope you enjoyed your stay! Please take a moment to share your experience.`,
      scheduledFor,
    });
  }

  async sendCancellationConfirmation(reservationId: string) {
    const res = await this.getReservationWithGuest(reservationId);
    return this.sendMessage({
      propertyId: res.propertyId, reservationId, guestId: res.guestId,
      channel: 'EMAIL', templateType: 'CANCELLATION',
      subject: `Cancellation confirmed -- ${res.confirmationNo}`,
      body: `Dear ${res.guest.firstName}, your reservation ${res.confirmationNo} has been cancelled. We hope to welcome you in the future.`,
    });
  }

  // --- BULK / MARKETING -----------------------------------------------------

  async sendBulkMessage(propertyId: string, dto: {
    guestIds?: string[];
    segmentFilter?: { vip?: boolean; nationality?: string; stayedAfter?: string };
    channel: MessageChannel;
    subject?: string;
    body: string;
    scheduledFor?: string;
  }) {
    let guestIds = dto.guestIds ?? [];

    if (!guestIds.length && dto.segmentFilter) {
      const guests = await this.prisma.guest.findMany({
        where: {
          propertyId,
          ...(dto.segmentFilter.vip ? { vip: true } : {}),
          ...(dto.segmentFilter.nationality ? { nationality: dto.segmentFilter.nationality } : {}),
          ...(dto.segmentFilter.stayedAfter ? {
            reservations: { some: { checkOut: { gte: new Date(dto.segmentFilter.stayedAfter) } } },
          } : {}),
        },
        select: { id: true },
      });
      guestIds = guests.map(g => g.id);
    }

    // Queue messages -- don't send all at once (rate limits)
    const results = [];
    for (const guestId of guestIds) {
      const r = await this.sendMessage({
        propertyId, guestId, channel: dto.channel,
        subject: dto.subject, body: dto.body,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      });
      results.push({ guestId, ...r });
    }

    return {
      total: guestIds.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };
  }

  // --- TEMPLATES (placeholder - messageTemplate model does not exist) -------

  async getTemplates(propertyId: string) {
    // messageTemplate model does not exist in the schema.
    // Return built-in template list as placeholder.
    const types: TemplateType[] = [
      'BOOKING_CONFIRMATION', 'PRE_ARRIVAL', 'CHECK_IN_WELCOME',
      'CHECK_OUT_RECEIPT', 'CANCELLATION', 'PAYMENT_RECEIPT',
      'REVIEW_REQUEST', 'PROMO', 'CUSTOM',
    ];
    return types.map(type => ({
      id: `tpl_${type.toLowerCase()}`,
      propertyId,
      type,
      channel: 'EMAIL',
      subject: '',
      body: '',
      isActive: true,
    }));
  }

  async upsertTemplate(propertyId: string, dto: {
    type: TemplateType;
    channel: MessageChannel;
    subject?: string;
    body: string;
    isActive?: boolean;
  }) {
    // messageTemplate model does not exist in the schema.
    // Return the dto as a mock saved template.
    return {
      id: `tpl_${dto.type.toLowerCase()}_${dto.channel.toLowerCase()}`,
      propertyId,
      ...dto,
      isActive: dto.isActive ?? true,
      updatedAt: new Date(),
    };
  }

  // --- INBOX ----------------------------------------------------------------

  async getInbox(propertyId: string, filter: { unreadOnly?: boolean; channel?: string }) {
    // Get conversations grouped by reservation
    const messages = await this.prisma.guestMessage.findMany({
      where: {
        propertyId,
        ...(filter.unreadOnly ? { isRead: false, direction: 'INBOUND' } : {}),
        ...(filter.channel ? { channel: filter.channel as any } : {}),
      },
      include: {
        reservation: {
          select: {
            confirmationNo: true,
            status: true,
            guest: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Group by reservation
    const conversations: Record<string, any> = {};
    for (const msg of messages) {
      const key = msg.reservationId;
      if (!conversations[key]) {
        conversations[key] = {
          reservationId: msg.reservationId,
          guest: msg.reservation?.guest,
          confirmationNo: msg.reservation?.confirmationNo,
          messages: [],
          lastMessage: msg,
          unreadCount: 0,
        };
      }
      conversations[key].messages.push(msg);
      if (!msg.isRead && msg.direction === 'INBOUND') conversations[key].unreadCount++;
    }

    return Object.values(conversations).sort((a, b) =>
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }

  async replyToGuest(propertyId: string, reservationId: string, body: string, channel: MessageChannel, staffUserId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, propertyId },
      include: { guest: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    return this.sendMessage({
      propertyId, reservationId,
      guestId: reservation.guestId,
      channel, body,
    });
  }

  async getStats(propertyId: string) {
    const [total, unread, byChannel] = await Promise.all([
      this.prisma.guestMessage.count({ where: { propertyId } }),
      this.prisma.guestMessage.count({ where: { propertyId, isRead: false, direction: 'INBOUND' } }),
      this.prisma.guestMessage.groupBy({ by: ['channel'], where: { propertyId }, _count: true }),
    ]);
    // GuestMessage has no `status` field, so we cannot filter by DELIVERED/FAILED
    return { total, delivered: 0, failed: 0, unread, deliveryRate: 0, byChannel };
  }

  // --- PRIVATE --------------------------------------------------------------

  private async getReservationWithGuest(reservationId: string) {
    const res = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        property: true,
        folio: { include: { charges: { where: { voided: false } } } },
      },
    });
    if (!res) throw new NotFoundException('Reservation not found');
    return res;
  }

  private renderTemplate(type: TemplateType, data: any): string {
    // In real impl: use Handlebars/Nunjucks templates from DB
    const templates: Record<TemplateType, (d: any) => string> = {
      BOOKING_CONFIRMATION: d => `Dear ${d.guest.firstName},\n\nYour booking at ${d.property.name} is confirmed!\n\nConfirmation: ${d.confirmationNo}\nCheck-in: ${new Date(d.checkIn).toDateString()}\nCheck-out: ${new Date(d.checkOut).toDateString()}\nRoom: ${d.room?.roomType?.name ?? 'To be assigned'}\n\nWe look forward to welcoming you.\n\nBest regards,\n${d.property.name}`,
      PRE_ARRIVAL: d => `Dear ${d.guest.firstName},\n\nYour stay at ${d.property.name} is coming up soon!\n\nCheck-in: ${new Date(d.checkIn).toDateString()} from ${d.property.checkInTime}\nCheck-out: ${new Date(d.checkOut).toDateString()} by ${d.property.checkOutTime}\n\nComplete your online check-in to skip the queue: ${process.env.PORTAL_URL}/portal/${d.confirmationNo}\n\nSee you soon!`,
      CHECK_IN_WELCOME: d => `Welcome to ${d.property.name}, ${d.guest.firstName}!`,
      CHECK_OUT_RECEIPT: d => `Dear ${d.guest.firstName},\n\nThank you for staying with us.\n\nConfirmation: ${d.confirmationNo}\nTotal charged: $${Number(d.folio?.totalCharges ?? 0).toFixed(2)}`,
      CANCELLATION: d => `Your booking ${d.confirmationNo} has been cancelled.`,
      PAYMENT_RECEIPT: d => `Payment received for ${d.confirmationNo}.`,
      REVIEW_REQUEST: d => `How was your stay at ${d.property.name}? We'd love your feedback.`,
      PROMO: d => `Special offer for you, ${d.guest.firstName}!`,
      CUSTOM: d => '',
    };
    return (templates[type] ?? templates.CUSTOM)(data);
  }

  private async sendEmail(guestId: string, subject: string, body: string): Promise<SendResult> {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest?.email) return { success: false, error: 'No email address' };

    /*
     * sgMail.setApiKey(process.env.SENDGRID_API_KEY);
     * const [response] = await sgMail.send({
     *   to: guest.email, from: process.env.FROM_EMAIL,
     *   subject, text: body, html: body.replace(/\n/g, '<br>'),
     * });
     * return { success: true, messageId: response.headers['x-message-id'] };
     */
    this.logger.log(`[EMAIL] -> ${guest.email}: ${subject}`);
    return { success: true, messageId: `sg_${Date.now()}` };
  }

  private async sendSms(guestId: string, body: string): Promise<SendResult> {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest?.phone && !guest?.mobile) return { success: false, error: 'No phone number' };

    /*
     * const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
     * const message = await client.messages.create({
     *   body, from: process.env.TWILIO_FROM, to: guest.mobile ?? guest.phone,
     * });
     * return { success: true, messageId: message.sid };
     */
    this.logger.log(`[SMS] -> ${guest.mobile ?? guest.phone}: ${body.slice(0, 50)}`);
    return { success: true, messageId: `SM${Date.now()}` };
  }

  private async sendWhatsApp(guestId: string, body: string): Promise<SendResult> {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest?.phone && !guest?.mobile) return { success: false, error: 'No phone number' };

    /*
     * const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
     * const message = await client.messages.create({
     *   body, from: `whatsapp:${process.env.WHATSAPP_FROM}`, to: `whatsapp:${guest.mobile ?? guest.phone}`,
     * });
     * return { success: true, messageId: message.sid };
     */
    this.logger.log(`[WHATSAPP] -> ${guest.mobile ?? guest.phone}: ${body.slice(0, 50)}`);
    return { success: true, messageId: `WA${Date.now()}` };
  }
}
