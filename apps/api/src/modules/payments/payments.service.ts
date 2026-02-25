import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from '../booking-engine/dto';

// In real impl: import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export interface ChargeResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── CREATE PAYMENT INTENT ────────────────────────────────────────────────

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    /*
     * Real Stripe implementation:
     *
     * const intent = await stripe.paymentIntents.create({
     *   amount: dto.amount,
     *   currency: dto.currency ?? 'usd',
     *   automatic_payment_methods: { enabled: true },
     *   metadata: { reservationId: dto.reservationId ?? '' },
     *   description: dto.description,
     * });
     * return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
     */

    // Simulated response for now
    const intentId = `pi_${Math.random().toString(36).substring(2, 18)}`;
    this.logger.log(`Created PaymentIntent ${intentId} for $${(dto.amount / 100).toFixed(2)}`);

    return {
      clientSecret: `${intentId}_secret_${Math.random().toString(36).substring(2)}`,
      paymentIntentId: intentId,
      amount: dto.amount,
      currency: dto.currency ?? 'usd',
    };
  }

  // ─── CHARGE CARD (for booking engine) ────────────────────────────────────

  async chargeCard(params: {
    paymentMethodId: string;
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, string>;
  }): Promise<ChargeResult> {
    /*
     * Real Stripe implementation:
     *
     * const intent = await stripe.paymentIntents.create({
     *   amount: params.amount,
     *   currency: params.currency,
     *   payment_method: params.paymentMethodId,
     *   confirm: true,
     *   description: params.description,
     *   metadata: params.metadata,
     *   automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
     * });
     *
     * if (intent.status !== 'succeeded') {
     *   throw new BadRequestException(`Payment ${intent.status}: ${intent.last_payment_error?.message}`);
     * }
     *
     * return { id: intent.id, status: intent.status, amount: intent.amount, currency: intent.currency };
     */

    // Simulate Stripe success
    const id = `pi_${Math.random().toString(36).substring(2, 18)}`;
    this.logger.log(`Charged $${(params.amount / 100).toFixed(2)} via ${params.paymentMethodId}`);

    return { id, status: 'succeeded', amount: params.amount, currency: params.currency };
  }

  // ─── CONFIRM PAYMENT ──────────────────────────────────────────────────────

  async confirmPayment(dto: ConfirmPaymentDto) {
    /*
     * const intent = await stripe.paymentIntents.confirm(dto.paymentIntentId);
     */

    if (dto.reservationId) {
      const payment = await this.prisma.payment.findFirst({
        where: { stripePaymentId: dto.paymentIntentId },
      });
      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'CAPTURED', processedAt: new Date() },
        });
      }
    }

    return { status: 'succeeded', paymentIntentId: dto.paymentIntentId };
  }

  // ─── REFUND ───────────────────────────────────────────────────────────────

  async refund(paymentIntentId: string, amountCents?: number) {
    /*
     * const refund = await stripe.refunds.create({
     *   payment_intent: paymentIntentId,
     *   ...(amountCents ? { amount: amountCents } : {}),
     * });
     * return { id: refund.id, status: refund.status, amount: refund.amount };
     */

    this.logger.log(`Refunding ${amountCents ? `$${(amountCents / 100).toFixed(2)}` : 'full amount'} for ${paymentIntentId}`);
    const id = `re_${Math.random().toString(36).substring(2, 18)}`;
    return { id, status: 'succeeded', amount: amountCents ?? 0 };
  }

  async processRefundDto(dto: RefundPaymentDto, propertyId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: dto.paymentId, propertyId },
    });
    if (!payment) throw new BadRequestException('Payment not found');
    if (!payment.stripePaymentId) throw new BadRequestException('No Stripe payment intent found');

    const amountCents = dto.amount ? dto.amount : Math.round(Number(payment.amount) * 100);
    const result = await this.refund(payment.stripePaymentId, amountCents);

    await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: { status: 'REFUNDED' },
    });

    return result;
  }

  // ─── STRIPE WEBHOOK HANDLER ───────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string) {
    /*
     * Real implementation:
     *
     * let event: Stripe.Event;
     * try {
     *   event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
     * } catch (err) {
     *   throw new BadRequestException(`Webhook signature verification failed`);
     * }
     *
     * switch (event.type) {
     *   case 'payment_intent.succeeded':
     *     await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
     *     break;
     *   case 'payment_intent.payment_failed':
     *     await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
     *     break;
     *   case 'charge.refunded':
     *     await this.handleRefund(event.data.object as Stripe.Charge);
     *     break;
     * }
     */

    this.logger.log('Webhook received');
    return { received: true };
  }

  // ─── GET PAYMENT HISTORY ─────────────────────────────────────────────────

  async getPaymentHistory(propertyId: string, limit = 50) {
    return this.prisma.payment.findMany({
      where: { propertyId },
      include: {
        reservation: {
          select: {
            confirmationNo: true,
            guest: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getStats(propertyId: string) {
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayTotal, monthTotal, pending, refunded] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { propertyId, status: 'CAPTURED', createdAt: { gte: today } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { propertyId, status: 'CAPTURED', createdAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.count({ where: { propertyId, status: 'AUTHORIZED' } }),
      this.prisma.payment.aggregate({
        where: { propertyId, status: 'REFUNDED', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    return {
      today: { amount: Number(todayTotal._sum.amount ?? 0), count: todayTotal._count },
      month: { amount: Number(monthTotal._sum.amount ?? 0), count: monthTotal._count },
      pending,
      refundedThisMonth: Number(refunded._sum.amount ?? 0),
    };
  }
}
