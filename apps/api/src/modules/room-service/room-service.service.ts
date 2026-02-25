import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, MenuItemCategory, RoomServiceOrderStatus, ChargeType } from '@prisma/client';

@Injectable()
export class RoomServiceService {
  private readonly logger = new Logger(RoomServiceService.name);

  constructor(private prisma: PrismaService) {}

  // ─── MENU ─────────────────────────────────────────────────────────────────

  async listMenu(propertyId: string, filter: { category?: string; available?: boolean }) {
    const where: Prisma.MenuItemWhereInput = { propertyId };
    if (filter.category) where.category = filter.category as MenuItemCategory;
    if (filter.available !== undefined) where.isAvailable = filter.available;

    return this.prisma.menuItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createMenuItem(propertyId: string, dto: {
    name: string; category: string; description?: string; price: number;
    prepTime?: number; image?: string; allergens?: string[]; sortOrder?: number;
  }) {
    return this.prisma.menuItem.create({
      data: {
        propertyId,
        name: dto.name,
        category: dto.category as MenuItemCategory,
        description: dto.description,
        price: dto.price,
        prepTime: dto.prepTime ?? 15,
        image: dto.image,
        allergens: dto.allergens ?? [],
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateMenuItem(id: string, propertyId: string, dto: any) {
    const item = await this.prisma.menuItem.findFirst({ where: { id, propertyId } });
    if (!item) throw new NotFoundException('Menu item not found');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.category !== undefined) data.category = dto.category as MenuItemCategory;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.isAvailable !== undefined) data.isAvailable = dto.isAvailable;
    if (dto.prepTime !== undefined) data.prepTime = dto.prepTime;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.allergens !== undefined) data.allergens = dto.allergens;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    return this.prisma.menuItem.update({ where: { id }, data });
  }

  async toggleAvailability(id: string, propertyId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id, propertyId } });
    if (!item) throw new NotFoundException('Menu item not found');

    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
  }

  async deleteMenuItem(id: string, propertyId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id, propertyId } });
    if (!item) throw new NotFoundException('Menu item not found');

    await this.prisma.menuItem.delete({ where: { id } });
    return { message: 'Menu item deleted' };
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────

  async listOrders(propertyId: string, filter: { status?: string; date?: string; roomId?: string }) {
    const where: Prisma.RoomServiceOrderWhereInput = { propertyId };
    if (filter.status) where.status = filter.status as RoomServiceOrderStatus;
    if (filter.roomId) where.roomId = filter.roomId;

    if (filter.date) {
      const d = new Date(filter.date);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }

    return this.prisma.roomServiceOrder.findMany({
      where,
      include: {
        items: { include: { menuItem: true } },
        guest: true,
        room: { include: { roomType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(id: string, propertyId: string) {
    const order = await this.prisma.roomServiceOrder.findFirst({
      where: { id, propertyId },
      include: {
        items: { include: { menuItem: true } },
        guest: true,
        room: { include: { roomType: true } },
        reservation: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async createOrder(propertyId: string, dto: {
    reservationId: string;
    items: { menuItemId: string; quantity: number; notes?: string }[];
    specialInstructions?: string;
  }, userId: string) {
    // Validate reservation is checked in
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: dto.reservationId, propertyId, status: 'CHECKED_IN' },
      include: { folio: true },
    });
    if (!reservation) throw new BadRequestException('Reservation not found or guest not checked in');

    // Lookup menu items
    const menuItemIds = dto.items.map(i => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, propertyId, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    // Calculate totals
    const menuMap = new Map(menuItems.map(m => [m.id, m]));
    let subtotal = 0;
    let maxPrepTime = 0;

    const orderItems = dto.items.map(item => {
      const menu = menuMap.get(item.menuItemId)!;
      const unitPrice = Number(menu.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      if (menu.prepTime > maxPrepTime) maxPrepTime = menu.prepTime;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        notes: item.notes,
      };
    });

    // Get property tax rate
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    const taxRate = property?.taxRate ?? 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Estimated delivery: max prep time + 10 min
    const estimatedDelivery = new Date();
    estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + maxPrepTime + 10);

    // Create order + items + folio charge in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.roomServiceOrder.create({
        data: {
          propertyId,
          reservationId: dto.reservationId,
          roomId: reservation.roomId,
          guestId: reservation.guestId,
          totalAmount,
          taxAmount,
          specialInstructions: dto.specialInstructions,
          estimatedDelivery,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: { include: { menuItem: true } },
          guest: true,
          room: true,
        },
      });

      // Post folio charge
      if (reservation.folio) {
        const charge = await tx.folioCharge.create({
          data: {
            folioId: reservation.folio.id,
            type: ChargeType.FB,
            description: `Room Service Order #${newOrder.id.slice(-6).toUpperCase()}`,
            quantity: 1,
            unitPrice: subtotal,
            amount: subtotal,
            taxRate,
            taxAmount,
            postedBy: userId,
          },
        });

        await tx.roomServiceOrder.update({
          where: { id: newOrder.id },
          data: { folioChargeId: charge.id },
        });

        // Recalculate folio totals
        const allCharges = await tx.folioCharge.findMany({
          where: { folioId: reservation.folio.id, voided: false },
        });
        const totalCharges = allCharges.reduce((sum, c) => sum + Number(c.amount), 0);
        const totalTax = allCharges.reduce((sum, c) => sum + Number(c.taxAmount), 0);

        await tx.folio.update({
          where: { id: reservation.folio.id },
          data: {
            totalCharges,
            totalTax,
            balance: totalCharges + totalTax - Number(reservation.folio.totalPayments),
          },
        });
      }

      return newOrder;
    });

    this.logger.log(`Room service order created: ${order.id} for room ${reservation.roomId}`);
    return order;
  }

  // ─── STATUS MACHINE ──────────────────────────────────────────────────────

  private static readonly STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['DELIVERING'],
    DELIVERING: ['DELIVERED'],
  };

  async updateOrderStatus(id: string, propertyId: string, dto: {
    status: string; cancelReason?: string; preparedBy?: string; deliveredBy?: string;
  }, userId: string) {
    const order = await this.prisma.roomServiceOrder.findFirst({ where: { id, propertyId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = RoomServiceService.STATUS_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    const now = new Date();
    const data: any = { status: dto.status as RoomServiceOrderStatus };

    switch (dto.status) {
      case 'CONFIRMED':
        data.confirmedAt = now;
        break;
      case 'PREPARING':
        data.preparedBy = dto.preparedBy ?? userId;
        break;
      case 'READY':
        data.preparedAt = now;
        data.readyAt = now;
        break;
      case 'DELIVERING':
        data.deliveredBy = dto.deliveredBy ?? userId;
        break;
      case 'DELIVERED':
        data.deliveredAt = now;
        break;
      case 'CANCELLED':
        data.cancelledAt = now;
        data.cancelReason = dto.cancelReason ?? 'Cancelled by staff';
        break;
    }

    const updated = await this.prisma.roomServiceOrder.update({
      where: { id },
      data,
      include: {
        items: { include: { menuItem: true } },
        guest: true,
        room: true,
      },
    });

    this.logger.log(`Order ${id} status: ${order.status} → ${dto.status}`);
    return updated;
  }

  // ─── STATS ────────────────────────────────────────────────────────────────

  async getStats(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [statusCounts, todayOrders, deliveredOrders, popularItems] = await Promise.all([
      this.prisma.roomServiceOrder.groupBy({
        by: ['status'],
        where: { propertyId, createdAt: { gte: today, lt: tomorrow } },
        _count: true,
      }),
      this.prisma.roomServiceOrder.findMany({
        where: { propertyId, createdAt: { gte: today, lt: tomorrow } },
        select: { totalAmount: true, taxAmount: true },
      }),
      this.prisma.roomServiceOrder.findMany({
        where: {
          propertyId,
          status: 'DELIVERED',
          deliveredAt: { not: null },
          createdAt: { gte: today, lt: tomorrow },
        },
        select: { createdAt: true, deliveredAt: true },
      }),
      this.prisma.roomServiceOrderItem.groupBy({
        by: ['menuItemId'],
        where: { order: { propertyId, createdAt: { gte: today, lt: tomorrow } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Today's revenue
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Avg delivery time
    const deliveryTimes = deliveredOrders
      .filter(o => o.deliveredAt)
      .map(o => (o.deliveredAt!.getTime() - o.createdAt.getTime()) / 60000);
    const avgDeliveryTime = deliveryTimes.length > 0
      ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
      : 0;

    // Items served today
    const itemsServed = todayOrders.length;

    // Active orders (not delivered or cancelled)
    const activeStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING'];
    const activeOrders = statusCounts
      .filter(s => activeStatuses.includes(s.status))
      .reduce((sum, s) => sum + s._count, 0);

    // Enrich popular items with names
    const popularItemIds = popularItems.map(p => p.menuItemId);
    const menuItemNames = await this.prisma.menuItem.findMany({
      where: { id: { in: popularItemIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(menuItemNames.map(m => [m.id, m.name]));

    return {
      activeOrders,
      todayRevenue,
      avgDeliveryTime,
      itemsServed,
      statusBreakdown: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
      popularItems: popularItems.map(p => ({
        menuItemId: p.menuItemId,
        name: nameMap.get(p.menuItemId) ?? 'Unknown',
        quantity: p._sum.quantity,
      })),
    };
  }
}
