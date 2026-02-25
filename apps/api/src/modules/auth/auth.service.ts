import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ─── VALIDATE USER (used by LocalStrategy) ────────────────────────────────
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        properties: {
          include: { property: true },
          where: { property: { isActive: true } },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  async login(user: any, ipAddress?: string, userAgent?: string) {
    const defaultProperty = user.properties.find((p: any) => p.isDefault) || user.properties[0];

    const payload = {
      sub: user.id,
      email: user.email,
      role: defaultProperty?.role,
      propertyId: defaultProperty?.propertyId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id, ipAddress, userAgent);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        propertyId: defaultProperty?.propertyId,
        action: 'LOGIN',
        resource: 'User',
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: defaultProperty?.role,
        propertyId: defaultProperty?.propertyId,
        property: defaultProperty?.property,
        properties: user.properties.map((p: any) => ({
          id: p.propertyId,
          name: p.property.name,
          slug: p.property.slug,
          role: p.role,
        })),
      },
    };
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────
  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            properties: {
              include: { property: true },
              where: { property: { isActive: true } },
            },
          },
        },
      },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = stored.user;
    const defaultProperty = user.properties.find(p => p.isDefault) || user.properties[0];

    const payload = {
      sub: user.id,
      email: user.email,
      role: defaultProperty?.role,
      propertyId: defaultProperty?.propertyId,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ─── LOGOUT ──────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { revokedAt: new Date() },
      });
    }
    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  // ─── GET PROFILE ─────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          include: { property: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result;
  }

  // ─── SWITCH PROPERTY ─────────────────────────────────────────────────────
  async switchProperty(userId: string, propertyId: string) {
    const assignment = await this.prisma.propertyUser.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
      include: { property: true },
    });

    if (!assignment) throw new UnauthorizedException('Access denied to this property');

    const payload = {
      sub: userId,
      email: (await this.prisma.user.findUnique({ where: { id: userId } }))?.email,
      role: assignment.role,
      propertyId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      property: assignment.property,
      role: assignment.role,
    };
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    // TODO: send email with reset link
    return { message: 'If the email exists, a reset link has been sent', token };
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  // ─── CHANGE PASSWORD ─────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully' };
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────
  private async generateRefreshToken(userId: string, ipAddress?: string, userAgent?: string) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt, ipAddress, userAgent },
    });

    return token;
  }
}
