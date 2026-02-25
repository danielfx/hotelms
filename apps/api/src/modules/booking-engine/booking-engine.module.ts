import { Module } from '@nestjs/common';
import { BookingEngineController } from './booking-engine.controller';
import { BookingEngineService } from './booking-engine.service';
import { PaymentsModule } from '../payments/payments.module';
@Module({ imports: [PaymentsModule], controllers: [BookingEngineController], providers: [BookingEngineService], exports: [BookingEngineService] })
export class BookingEngineModule {}
