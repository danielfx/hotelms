import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GuestPortalController } from './guest-portal.controller';
import { GuestPortalService } from './guest-portal.service';
@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET })], controllers: [GuestPortalController], providers: [GuestPortalService], exports: [GuestPortalService] })
export class GuestPortalModule {}
