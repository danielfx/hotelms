import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoomServiceService } from './room-service.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateMenuItemDto, UpdateMenuItemDto, CreateOrderDto, UpdateOrderStatusDto } from './dto';

@ApiTags('Room Service')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('room-service')
export class RoomServiceController {
  constructor(private readonly svc: RoomServiceService) {}

  // ─── MENU ─────────────────────────────────────────────────────────────────

  @Get('menu')
  @ApiOperation({ summary: 'List menu items' })
  listMenu(@PropertyId() pid: string, @Query('category') category?: string, @Query('available') available?: string) {
    return this.svc.listMenu(pid, { category, available: available === 'true' ? true : available === 'false' ? false : undefined });
  }

  @Post('menu')
  @ApiOperation({ summary: 'Create menu item' })
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'FB_MANAGER')
  createMenuItem(@PropertyId() pid: string, @Body() dto: CreateMenuItemDto) {
    return this.svc.createMenuItem(pid, dto);
  }

  @Patch('menu/:id')
  @ApiOperation({ summary: 'Update menu item' })
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'FB_MANAGER')
  updateMenuItem(@Param('id') id: string, @PropertyId() pid: string, @Body() dto: UpdateMenuItemDto) {
    return this.svc.updateMenuItem(id, pid, dto);
  }

  @Patch('menu/:id/availability')
  @ApiOperation({ summary: 'Toggle menu item availability' })
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'FB_MANAGER')
  toggleAvailability(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.toggleAvailability(id, pid);
  }

  @Delete('menu/:id')
  @ApiOperation({ summary: 'Delete menu item' })
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'FB_MANAGER')
  deleteMenuItem(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.deleteMenuItem(id, pid);
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────

  @Get('orders')
  @ApiOperation({ summary: 'List orders' })
  listOrders(@PropertyId() pid: string, @Query('status') status?: string, @Query('date') date?: string, @Query('roomId') roomId?: string) {
    return this.svc.listOrders(pid, { status, date, roomId });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details' })
  getOrder(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.getOrder(id, pid);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create room service order' })
  createOrder(@PropertyId() pid: string, @Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.svc.createOrder(pid, dto, user.id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @HttpCode(HttpStatus.OK)
  updateOrderStatus(@Param('id') id: string, @PropertyId() pid: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: any) {
    return this.svc.updateOrderStatus(id, pid, dto, user.id);
  }

  // ─── STATS ────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Room service dashboard stats' })
  getStats(@PropertyId() pid: string) {
    return this.svc.getStats(pid);
  }
}
