import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GuestsModule } from './modules/guests/guests.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { FolioModule } from './modules/folio/folio.module';
import { NightAuditModule } from './modules/night-audit/night-audit.module';
import { RatesModule } from './modules/rates/rates.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { BookingEngineModule } from './modules/booking-engine/booking-engine.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { GuestPortalModule } from './modules/guest-portal/guest-portal.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { CrmModule } from './modules/crm/crm.module';
import { RevenueIntelligenceModule } from './modules/revenue-intelligence/revenue-intelligence.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AuditModule } from './modules/audit/audit.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { BillingModule } from './modules/billing/billing.module';
import { RoomServiceModule } from './modules/room-service/room-service.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    GuestsModule,
    ReservationsModule,
    FolioModule,
    NightAuditModule,
    RatesModule,
    ChannelsModule,
    BookingEngineModule,
    PaymentsModule,
    GuestPortalModule,
    CommunicationsModule,
    HousekeepingModule,
    ReportsModule,
    PropertiesModule,
    CrmModule,
    RevenueIntelligenceModule,
    ReputationModule,
    PortfolioModule,
    GroupsModule,
    MarketplaceModule,
    AuditModule,
    OnboardingModule,
    BillingModule,
    RoomServiceModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
