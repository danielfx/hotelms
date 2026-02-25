import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TaskStatus, HousekeepingTaskType, RoomStatus } from '@prisma/client';

@Injectable()
export class HousekeepingService {
  private readonly logger = new Logger(HousekeepingService.name);

  constructor(private prisma: PrismaService) {}

  // --- TASKS ----------------------------------------------------------------

  async getTasks(propertyId: string, filter: {
    status?: string; assignedTo?: string; floor?: number;
    priority?: string; type?: string; date?: string;
  }) {
    const where: Prisma.HousekeepingTaskWhereInput = { propertyId };
    if (filter.status) where.status = filter.status as TaskStatus;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    if (filter.priority) where.priority = filter.priority as any;
    if (filter.type) where.type = filter.type as HousekeepingTaskType;
    if (filter.floor) where.room = { floor: filter.floor };

    if (filter.date) {
      const d = new Date(filter.date);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }

    const tasks = await this.prisma.housekeepingTask.findMany({
      where,
      include: {
        room: { include: { roomType: true } },
      },
      orderBy: [
        { priority: 'asc' }, // HIGH first
        { room: { floor: 'asc' } },
        { room: { number: 'asc' } },
      ],
    });

    // Group by floor
    const byFloor: Record<number, typeof tasks> = {};
    for (const task of tasks) {
      const floor = task.room.floor ?? 0;
      if (!byFloor[floor]) byFloor[floor] = [];
      byFloor[floor].push(task);
    }

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'PENDING').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      verified: tasks.filter(t => t.status === 'VERIFIED').length,
    };

    return { tasks, byFloor, stats };
  }

  async createTask(propertyId: string, dto: {
    roomId: string; type: string; priority?: string;
    assignedTo?: string; notes?: string; scheduledFor?: string;
  }) {
    return this.prisma.housekeepingTask.create({
      data: {
        propertyId,
        roomId: dto.roomId,
        type: dto.type as HousekeepingTaskType,
        priority: dto.priority as any ?? 'NORMAL',
        status: 'PENDING',
        assignedTo: dto.assignedTo,
        notes: dto.notes,
      },
      include: { room: { include: { roomType: true } } },
    });
  }

  async assignTask(taskId: string, propertyId: string, attendantId: string) {
    const task = await this.prisma.housekeepingTask.findFirst({ where: { id: taskId, propertyId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.housekeepingTask.update({
      where: { id: taskId },
      data: { assignedTo: attendantId, status: 'PENDING' },
      include: { room: true },
    });
  }

  async startTask(taskId: string, attendantId: string) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id: taskId, assignedTo: attendantId },
      include: { room: true },
    });
    if (!task) throw new NotFoundException('Task not found or not assigned to you');

    await this.prisma.$transaction([
      this.prisma.housekeepingTask.update({
        where: { id: taskId },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      }),
      this.prisma.room.update({
        where: { id: task.roomId },
        data: { status: RoomStatus.CLEANING },
      }),
    ]);

    return { taskId, status: 'IN_PROGRESS' };
  }

  async completeTask(taskId: string, attendantId: string, dto: {
    notes?: string;
    minibarItems?: { item: string; quantity: number; price: number }[];
    maintenanceIssues?: string[];
  }) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id: taskId, assignedTo: attendantId },
      include: { room: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const ops: any[] = [
      this.prisma.housekeepingTask.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          notes: dto.notes,
        },
      }),
    ];

    // Update room status based on task type
    const newRoomStatus = task.type === 'CHECKOUT_CLEANING' || task.type === 'STAYOVER'
      ? RoomStatus.INSPECTING
      : RoomStatus.AVAILABLE;

    ops.push(this.prisma.room.update({
      where: { id: task.roomId },
      data: { status: newRoomStatus },
    }));

    // Auto-post minibar charges to folio
    if (dto.minibarItems?.length && task.room) {
      const reservation = await this.prisma.reservation.findFirst({
        where: { roomId: task.roomId, status: 'CHECKED_IN' },
        include: { folio: true },
      });
      if (reservation?.folio) {
        for (const item of dto.minibarItems) {
          ops.push(
            this.prisma.folioCharge.create({
              data: {
                folioId: reservation.folio.id,
                type: 'MINIBAR',
                description: item.item,
                quantity: item.quantity,
                unitPrice: item.price,
                amount: item.quantity * item.price,
                taxRate: 0,
                taxAmount: 0,
                date: new Date(),
                postedBy: attendantId,
              },
            })
          );
        }
      }
    }

    // Auto-create maintenance log if issues found
    if (dto.maintenanceIssues?.length) {
      ops.push(
        this.prisma.maintenanceLog.create({
          data: {
            propertyId: task.propertyId,
            roomId: task.roomId,
            title: 'Reported during housekeeping',
            description: dto.maintenanceIssues.join('; '),
            assignedTo: attendantId,
            status: 'PENDING',
          },
        })
      );
    }

    await this.prisma.$transaction(ops);
    this.logger.log(`Task ${taskId} completed by ${attendantId}`);
    return { taskId, status: 'COMPLETED' };
  }

  async inspectRoom(taskId: string, inspectorId: string, dto: {
    passed: boolean; notes?: string;
    checklist?: Record<string, boolean>;
    rating?: number;
  }) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id: taskId, status: 'COMPLETED' },
      include: { room: true },
    });
    if (!task) throw new NotFoundException('Completed task not found');

    const newRoomStatus = dto.passed ? RoomStatus.AVAILABLE : RoomStatus.CLEANING;

    await this.prisma.$transaction([
      this.prisma.housekeepingTask.update({
        where: { id: taskId },
        data: {
          status: dto.passed ? 'VERIFIED' : 'IN_PROGRESS',
          verifiedAt: new Date(),
          verifiedBy: inspectorId,
          checklistItems: dto.checklist as any,
          notes: dto.notes,
        },
      }),
      this.prisma.room.update({
        where: { id: task.roomId },
        data: { status: newRoomStatus, lastInspectedAt: new Date() },
      }),
    ]);

    // If failed, re-assign to original attendant
    if (!dto.passed && task.assignedTo) {
      await this.prisma.housekeepingTask.update({
        where: { id: taskId },
        data: { status: 'IN_PROGRESS', notes: `Re-clean required: ${dto.notes}` },
      });
    }

    return { passed: dto.passed, roomStatus: newRoomStatus };
  }

  // --- SCHEDULE GENERATION --------------------------------------------------

  async generateDailySchedule(propertyId: string, date: string) {
    const d = new Date(date);
    const next = new Date(d); next.setDate(d.getDate() + 1);

    // Get departures -> checkout cleaning (HIGH priority)
    const departures = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkOut: { gte: d, lt: next },
        status: 'CHECKED_IN',
      },
      include: { room: true },
    });

    // Get stayovers -> stayover cleaning (NORMAL priority)
    const stayovers = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        status: 'CHECKED_IN',
        checkIn: { lt: d },
        checkOut: { gte: next },
      },
      include: { room: true },
    });

    // Get arrivals -> checkout cleaning prep (HIGH priority)
    const arrivals = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { gte: d, lt: next },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: { room: true },
    });

    let created = 0;
    const existingCheck = async (roomId: string, type: string) => {
      const exists = await this.prisma.housekeepingTask.findFirst({
        where: {
          propertyId, roomId, type: type as any,
          createdAt: { gte: d, lt: next },
        },
      });
      return !!exists;
    };

    for (const res of departures) {
      if (await existingCheck(res.roomId, 'CHECKOUT_CLEANING')) continue;
      await this.prisma.housekeepingTask.create({
        data: { propertyId, roomId: res.roomId, type: 'CHECKOUT_CLEANING', status: 'PENDING', priority: 'HIGH' },
      });
      created++;
    }

    for (const res of stayovers) {
      if (await existingCheck(res.roomId, 'STAYOVER')) continue;
      await this.prisma.housekeepingTask.create({
        data: { propertyId, roomId: res.roomId, type: 'STAYOVER', status: 'PENDING', priority: 'NORMAL' },
      });
      created++;
    }

    for (const res of arrivals) {
      if (await existingCheck(res.roomId, 'CHECKOUT_CLEANING')) continue;
      await this.prisma.housekeepingTask.create({
        data: { propertyId, roomId: res.roomId, type: 'CHECKOUT_CLEANING', status: 'PENDING', priority: 'HIGH' },
      });
      created++;
    }

    return {
      date,
      checkouts: departures.length,
      stayovers: stayovers.length,
      arrivals: arrivals.length,
      tasksCreated: created,
    };
  }

  // --- ATTENDANT MANAGEMENT -------------------------------------------------

  async getAttendants(propertyId: string) {
    // User has no direct propertyId or housekeepingTasks relation.
    // Use PropertyUser junction table to find housekeeping staff.
    const propertyUsers = await this.prisma.propertyUser.findMany({
      where: {
        propertyId,
        role: { in: ['HOUSEKEEPER', 'HOUSEKEEPING_MANAGER'] },
      },
      include: {
        user: true,
      },
    });

    // For each attendant, fetch their active tasks
    const attendants = await Promise.all(
      propertyUsers.map(async (pu) => {
        const activeTasks = await this.prisma.housekeepingTask.findMany({
          where: {
            propertyId,
            assignedTo: pu.userId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
          select: { id: true, status: true, priority: true },
        });

        return {
          id: pu.userId,
          name: pu.user.name,
          email: pu.user.email,
          role: pu.role,
          activeTasks: activeTasks.length,
          highPriorityTasks: activeTasks.filter(t => t.priority === 'HIGH').length,
        };
      })
    );

    return attendants;
  }

  // --- MAINTENANCE LOGS -----------------------------------------------------

  async getMaintenanceLogs(propertyId: string, filter: { status?: string; roomId?: string }) {
    return this.prisma.maintenanceLog.findMany({
      where: {
        propertyId,
        ...(filter.status ? { status: filter.status as any } : {}),
        ...(filter.roomId ? { roomId: filter.roomId } : {}),
      },
      include: { room: { include: { roomType: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMaintenanceLog(propertyId: string, dto: {
    roomId: string; title: string; description: string; priority?: string; assignedTo?: string;
  }) {
    const log = await this.prisma.maintenanceLog.create({
      data: {
        propertyId,
        roomId: dto.roomId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority as any ?? 'NORMAL',
        assignedTo: dto.assignedTo,
        status: 'PENDING',
      },
      include: { room: true },
    });

    // If urgent priority, set room to OUT_OF_ORDER
    if (dto.priority === 'URGENT') {
      await this.prisma.room.update({
        where: { id: dto.roomId },
        data: { status: RoomStatus.OUT_OF_ORDER },
      });
    }

    return log;
  }

  async resolveMaintenanceLog(logId: string, propertyId: string, resolution: string, userId: string) {
    const log = await this.prisma.maintenanceLog.findFirst({ where: { id: logId, propertyId } });
    if (!log) throw new NotFoundException('Log not found');

    await this.prisma.$transaction([
      this.prisma.maintenanceLog.update({
        where: { id: logId },
        data: { status: 'COMPLETED', resolvedAt: new Date() },
      }),
      this.prisma.room.update({
        where: { id: log.roomId },
        data: { status: RoomStatus.AVAILABLE },
      }),
    ]);

    return { resolved: true };
  }

  // --- STATS ----------------------------------------------------------------

  async getStats(propertyId: string) {
    const today = new Date(); today.setHours(0,0,0,0);
    const next = new Date(today); next.setDate(today.getDate() + 1);

    const [todayTasks, avgTime, openMaintenance, roomStatuses] = await Promise.all([
      this.prisma.housekeepingTask.groupBy({
        by: ['status'],
        where: { propertyId, createdAt: { gte: today, lt: next } },
        _count: true,
      }),
      this.prisma.housekeepingTask.findMany({
        where: { propertyId, status: 'COMPLETED', startedAt: { not: null }, completedAt: { not: null } },
        select: { startedAt: true, completedAt: true },
        take: 100,
      }),
      this.prisma.maintenanceLog.count({ where: { propertyId, status: 'PENDING' } }),
      this.prisma.room.groupBy({ by: ['status'], where: { propertyId }, _count: true }),
    ]);

    const durations = avgTime
      .filter(t => t.startedAt && t.completedAt)
      .map(t => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 60000);
    const avgCleaningTime = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return {
      todayTasks: Object.fromEntries(todayTasks.map(t => [t.status, t._count])),
      avgCleaningTime,
      openMaintenanceIssues: openMaintenance,
      roomStatuses: Object.fromEntries(roomStatuses.map(r => [r.status, r._count])),
    };
  }
}
