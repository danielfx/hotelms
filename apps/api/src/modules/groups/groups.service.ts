import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, CreateGroupBlockDto, CreateRoomingListEntryDto, CreateEventSpaceDto, CreateEventBookingDto } from './dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async listGroups(propertyId: string, status?: string) {
    const where: any = { propertyId };
    if (status) where.status = status;
    return this.prisma.group.findMany({ where, include: { _count: { select: { blocks: true, roomingList: true } } }, orderBy: { checkIn: 'asc' } });
  }

  async getGroup(id: string, propertyId: string) {
    const group = await this.prisma.group.findFirst({ where: { id, propertyId }, include: { blocks: true, roomingList: true } });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async createGroup(propertyId: string, dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: { ...dto, propertyId, checkIn: new Date(dto.checkIn), checkOut: new Date(dto.checkOut), cutoffDate: dto.cutoffDate ? new Date(dto.cutoffDate) : null },
    });
  }

  async updateGroup(id: string, propertyId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findFirst({ where: { id, propertyId } });
    if (!group) throw new NotFoundException('Group not found');
    return this.prisma.group.update({ where: { id }, data: dto as any });
  }

  async deleteGroup(id: string, propertyId: string) {
    const group = await this.prisma.group.findFirst({ where: { id, propertyId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.status === 'DEFINITE') throw new BadRequestException('Cannot delete a confirmed group');
    await this.prisma.group.delete({ where: { id } });
    return { message: 'Group deleted' };
  }

  async addBlock(groupId: string, propertyId: string, dto: CreateGroupBlockDto) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId, propertyId } });
    if (!group) throw new NotFoundException('Group not found');
    return this.prisma.groupBlock.create({ data: { groupId, roomTypeCode: dto.roomTypeCode, date: new Date(dto.date), blocked: dto.blocked, rate: dto.rate } });
  }

  async removeBlock(blockId: string) {
    await this.prisma.groupBlock.delete({ where: { id: blockId } });
    return { message: 'Block removed' };
  }

  async addRoomingEntry(groupId: string, propertyId: string, dto: CreateRoomingListEntryDto) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId, propertyId } });
    if (!group) throw new NotFoundException('Group not found');
    return this.prisma.roomingList.create({ data: { ...dto, groupId, checkIn: new Date(dto.checkIn), checkOut: new Date(dto.checkOut) } });
  }

  async deleteRoomingEntry(entryId: string) {
    await this.prisma.roomingList.delete({ where: { id: entryId } });
    return { message: 'Entry removed' };
  }

  async listEventSpaces(propertyId: string) {
    return this.prisma.eventSpace.findMany({ where: { propertyId, isActive: true }, include: { _count: { select: { bookings: true } } }, orderBy: { name: 'asc' } });
  }

  async createEventSpace(propertyId: string, dto: CreateEventSpaceDto) {
    return this.prisma.eventSpace.create({ data: { ...dto, propertyId } });
  }

  async listEventBookings(propertyId: string, from?: string, to?: string) {
    const where: any = { eventSpace: { propertyId } };
    if (from && to) where.eventDate = { gte: new Date(from), lte: new Date(to) };
    return this.prisma.eventBooking.findMany({ where, include: { eventSpace: { select: { name: true, capacity: true } } }, orderBy: { eventDate: 'asc' } });
  }

  async createEventBooking(dto: CreateEventBookingDto) {
    return this.prisma.eventBooking.create({ data: { ...dto, eventDate: new Date(dto.eventDate) } });
  }
}
