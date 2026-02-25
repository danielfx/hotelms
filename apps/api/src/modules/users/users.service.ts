import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(propertyId: string) {
    return this.prisma.propertyUser.findMany({
      where: { propertyId },
      include: { user: { select: { id: true, email: true, name: true, avatar: true, isActive: true, lastLoginAt: true } } },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { properties: { include: { property: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result;
  }

  async create(data: { email: string; password: string; name: string; role: string; propertyId: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: { email: data.email, password: hashed, name: data.name },
    });

    await this.prisma.propertyUser.create({
      data: { userId: user.id, propertyId: data.propertyId, role: data.role as any, isDefault: true },
    });

    const { password, ...result } = user;
    return result;
  }

  async update(id: string, data: Partial<{ name: string; avatar: string; phone: string }>) {
    const user = await this.prisma.user.update({ where: { id }, data });
    const { password, ...result } = user;
    return result;
  }

  async deactivate(id: string) {
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
