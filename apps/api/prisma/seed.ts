import { PrismaClient, Role, PropertyType, RoomStatus, BookingSource, ReservationStatus, MealPlan, RatePlanType, CancellationPolicy, PaymentMethod, PaymentStatus, FolioStatus, ChargeType, HousekeepingTaskType, TaskStatus, TaskPriority, MenuItemCategory, RoomServiceOrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HotelMS database...');

  // ─── PROPERTY ─────────────────────────────────────────────────────────────
  const property = await prisma.property.upsert({
    where: { slug: 'grand-plaza-miami' },
    update: {},
    create: {
      name: 'Grand Plaza Hotel Miami',
      slug: 'grand-plaza-miami',
      type: PropertyType.HOTEL,
      description: 'Luxury beachfront hotel in the heart of Miami Beach',
      email: 'info@grandplazamiami.com',
      phone: '+1-305-555-0100',
      website: 'https://grandplazamiami.com',
      address: '1234 Ocean Drive',
      city: 'Miami Beach',
      state: 'FL',
      country: 'US',
      postalCode: '33139',
      timezone: 'America/New_York',
      currency: 'USD',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      taxRate: 7.0,
      cityTaxRate: 2.0,
      resortFee: 35.0,
      amenities: ['Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Beach Access', 'Valet Parking', 'WiFi', 'Concierge'],
    },
  });
  console.log('✅ Property created:', property.name);

  // ─── USERS ────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin1234!', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@hotelms.com' },
      update: {},
      create: {
        email: 'admin@hotelms.com',
        password: hashedPassword,
        name: 'Super Admin',
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@grandplaza.com' },
      update: {},
      create: {
        email: 'manager@grandplaza.com',
        password: await bcrypt.hash('Manager123!', 12),
        name: 'Carlos Rodríguez',
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'frontdesk@grandplaza.com' },
      update: {},
      create: {
        email: 'frontdesk@grandplaza.com',
        password: await bcrypt.hash('Frontdesk123!', 12),
        name: 'María García',
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'revenue@grandplaza.com' },
      update: {},
      create: {
        email: 'revenue@grandplaza.com',
        password: await bcrypt.hash('Revenue123!', 12),
        name: 'Ana Martínez',
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'housekeeping@grandplaza.com' },
      update: {},
      create: {
        email: 'housekeeping@grandplaza.com',
        password: await bcrypt.hash('Housekeeping123!', 12),
        name: 'Jorge López',
        emailVerified: true,
      },
    }),
  ]);

  // Property user assignments
  const roleAssignments = [
    { user: users[0], role: Role.SUPER_ADMIN },
    { user: users[1], role: Role.GENERAL_MANAGER },
    { user: users[2], role: Role.FRONT_DESK },
    { user: users[3], role: Role.REVENUE_MANAGER },
    { user: users[4], role: Role.HOUSEKEEPING_MANAGER },
  ];

  for (const { user, role } of roleAssignments) {
    await prisma.propertyUser.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId: property.id } },
      update: {},
      create: { userId: user.id, propertyId: property.id, role, isDefault: true },
    });
  }
  console.log('✅ Users created:', users.length);

  // ─── ROOM TYPES ───────────────────────────────────────────────────────────
  const roomTypes = await Promise.all([
    prisma.roomType.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'STD' } },
      update: {},
      create: {
        propertyId: property.id, name: 'Standard Room', code: 'STD',
        description: 'Comfortable room with city view', capacity: 2,
        squareMeters: 28, bedType: 'Queen', basePrice: 89,
        amenities: ['WiFi', 'AC', 'TV', 'Safe', 'Hairdryer', 'Mini Fridge'],
        sortOrder: 1,
      },
    }),
    prisma.roomType.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'DLX' } },
      update: {},
      create: {
        propertyId: property.id, name: 'Deluxe Room', code: 'DLX',
        description: 'Spacious room with partial ocean view', capacity: 2,
        squareMeters: 38, bedType: 'King', basePrice: 139,
        amenities: ['WiFi', 'AC', 'TV', 'Safe', 'Mini Bar', 'Bathtub', 'Ocean View', 'Balcony'],
        sortOrder: 2,
      },
    }),
    prisma.roomType.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'PRM' } },
      update: {},
      create: {
        propertyId: property.id, name: 'Premium Room', code: 'PRM',
        description: 'Premium room with full ocean view', capacity: 3,
        squareMeters: 48, bedType: 'King', basePrice: 189,
        amenities: ['WiFi', 'AC', 'TV', 'Safe', 'Mini Bar', 'Bathtub', 'Full Ocean View', 'Balcony', 'Nespresso'],
        sortOrder: 3,
      },
    }),
    prisma.roomType.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'STE' } },
      update: {},
      create: {
        propertyId: property.id, name: 'Suite', code: 'STE',
        description: 'Luxurious suite with panoramic ocean views', capacity: 4,
        squareMeters: 80, bedType: 'King', basePrice: 289,
        amenities: ['WiFi', 'AC', 'TV', 'Safe', 'Mini Bar', 'Jacuzzi', 'Panoramic Ocean View', 'Balcony', 'Living Room', 'Nespresso', 'Butler Service'],
        sortOrder: 4,
      },
    }),
  ]);
  console.log('✅ Room types created:', roomTypes.length);

  // ─── ROOMS ────────────────────────────────────────────────────────────────
  const statuses = [RoomStatus.AVAILABLE, RoomStatus.AVAILABLE, RoomStatus.AVAILABLE, RoomStatus.OCCUPIED, RoomStatus.CLEANING];
  let roomNum = 100;
  const roomsData: any[] = [];

  for (const floor of [1, 2, 3, 4]) {
    for (let ti = 0; ti < roomTypes.length; ti++) {
      const count = ti === 3 ? 2 : 4; // fewer suites
      for (let i = 0; i < count; i++) {
        roomNum++;
        roomsData.push({
          propertyId: property.id,
          roomTypeId: roomTypes[ti].id,
          number: String(roomNum),
          floor,
          status: statuses[(roomNum + ti) % statuses.length],
        });
      }
    }
  }

  const rooms: any[] = [];
  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { propertyId_number: { propertyId: r.propertyId, number: r.number } },
      update: {},
      create: r,
    });
    rooms.push(room);
  }
  console.log('✅ Rooms created:', rooms.length);

  // ─── RATE PLANS ───────────────────────────────────────────────────────────
  const ratePlans = await Promise.all([
    prisma.ratePlan.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'BAR' } },
      update: {},
      create: {
        propertyId: property.id, name: 'Best Available Rate', code: 'BAR',
        type: RatePlanType.PUBLIC, mealPlan: MealPlan.ROOM_ONLY,
        cancellationPolicy: CancellationPolicy.MODERATE, cancellationHours: 48,
        isRefundable: true, availableOnline: true, minLOS: 1,
      },
    }),
    prisma.ratePlan.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'NRF' } },
      update: {},
      create: {
        propertyId: property.id, name: 'Non-Refundable Rate', code: 'NRF',
        type: RatePlanType.PUBLIC, mealPlan: MealPlan.ROOM_ONLY,
        cancellationPolicy: CancellationPolicy.NON_REFUNDABLE,
        isRefundable: false, availableOnline: true, discount: 15, minLOS: 1,
      },
    }),
    prisma.ratePlan.upsert({
      where: { propertyId_code: { propertyId: property.id, code: 'BB' } },
      update: {},
      create: {
        propertyId: property.id, name: 'Bed & Breakfast', code: 'BB',
        type: RatePlanType.PUBLIC, mealPlan: MealPlan.BED_BREAKFAST,
        cancellationPolicy: CancellationPolicy.MODERATE, cancellationHours: 48,
        isRefundable: true, availableOnline: true, markup: 25, minLOS: 1,
      },
    }),
  ]);
  console.log('✅ Rate plans created:', ratePlans.length);

  // ─── GUESTS ───────────────────────────────────────────────────────────────
  const guestData = [
    { firstName: 'María', lastName: 'García', email: 'maria.garcia@email.com', nationality: 'ES', phone: '+34600123456' },
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@gmail.com', nationality: 'US', phone: '+12125550101' },
    { firstName: 'Li', lastName: 'Wei', email: 'liwei@outlook.com', nationality: 'CN', phone: '+8613800138000' },
    { firstName: 'Sophie', lastName: 'Müller', email: 'sophie.mueller@web.de', nationality: 'DE', phone: '+4915112345678' },
    { firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos.r@hotmail.com', nationality: 'MX', phone: '+525512345678' },
    { firstName: 'Emma', lastName: 'Johnson', email: 'emma.j@icloud.com', nationality: 'GB', phone: '+447911123456' },
    { firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.h@yahoo.com', nationality: 'AE', phone: '+971501234567' },
    { firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki.tanaka@jp.com', nationality: 'JP', phone: '+819012345678' },
    { firstName: 'Isabella', lastName: 'Costa', email: 'isabella@email.it', nationality: 'IT', phone: '+393201234567' },
    { firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@gmail.com', nationality: 'IT', phone: '+393401234567' },
    { firstName: 'David', lastName: 'Kim', email: 'david.kim@korea.com', nationality: 'KR', phone: '+821012345678' },
    { firstName: 'Ana', lastName: 'Martínez', email: 'ana.m@correo.es', nationality: 'ES', phone: '+34700234567' },
  ];

  const guests = await Promise.all(
    guestData.map(g =>
      prisma.guest.create({
        data: { propertyId: property.id, ...g, totalStays: Math.floor(Math.random() * 5) },
      })
    )
  );
  console.log('✅ Guests created:', guests.length);

  // ─── RESERVATIONS ─────────────────────────────────────────────────────────
  const today = new Date();
  const sources = [BookingSource.DIRECT, BookingSource.BOOKING_COM, BookingSource.EXPEDIA, BookingSource.AIRBNB, BookingSource.PHONE];
  const resStatuses = [ReservationStatus.CONFIRMED, ReservationStatus.CONFIRMED, ReservationStatus.CONFIRMED, ReservationStatus.PENDING, ReservationStatus.CHECKED_IN];

  const availableRooms = rooms.filter(r => r.status === RoomStatus.AVAILABLE || r.status === RoomStatus.OCCUPIED);

  for (let i = 0; i < Math.min(18, availableRooms.length); i++) {
    const room = availableRooms[i];
    const roomType = roomTypes.find(rt => rt.id === room.roomTypeId)!;
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + (i % 14) - 4);
    const nights = [1, 2, 3, 4, 5][i % 5];
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + nights);
    const guest = guests[i % guests.length];
    const ratePlan = ratePlans[i % ratePlans.length];
    const source = sources[i % sources.length];
    const status = resStatuses[i % resStatuses.length];
    const baseRate = Number(roomType.basePrice);
    const totalRoom = baseRate * nights;
    const taxAmount = totalRoom * (property.taxRate / 100);
    const totalAmount = totalRoom + taxAmount + property.resortFee;

    const reservation = await prisma.reservation.create({
      data: {
        propertyId: property.id,
        roomId: room.id,
        guestId: guest.id,
        ratePlanId: ratePlan.id,
        source,
        status,
        checkIn,
        checkOut,
        nights,
        adults: Math.ceil(Math.random() * 2),
        baseRate,
        totalRoomCharge: totalRoom,
        totalTax: taxAmount,
        totalFees: property.resortFee,
        totalAmount,
        paidAmount: status === ReservationStatus.CHECKED_IN ? totalAmount : status === ReservationStatus.CONFIRMED ? totalAmount * 0.3 : 0,
        balanceDue: status === ReservationStatus.CHECKED_IN ? 0 : totalAmount * 0.7,
        commissionPct: source === BookingSource.BOOKING_COM ? 15 : source === BookingSource.EXPEDIA ? 18 : 0,
        commission: source === BookingSource.BOOKING_COM ? totalAmount * 0.15 : source === BookingSource.EXPEDIA ? totalAmount * 0.18 : 0,
        notes: i % 4 === 0 ? 'Late arrival after 22:00' : i % 7 === 0 ? 'Anniversary celebration - special decoration requested' : null,
        checkedInAt: status === ReservationStatus.CHECKED_IN ? new Date() : null,
      },
    });

    // Create folio for each reservation
    await prisma.folio.create({
      data: {
        reservationId: reservation.id,
        propertyId: property.id,
        totalCharges: totalAmount,
        totalPayments: Number(reservation.paidAmount),
        totalTax: taxAmount,
        balance: totalAmount - Number(reservation.paidAmount),
        charges: {
          create: [
            {
              type: ChargeType.ROOM,
              description: `Room ${room.number} - ${roomType.name} (${nights} nights)`,
              quantity: nights,
              unitPrice: baseRate,
              amount: totalRoom,
              taxRate: property.taxRate,
              taxAmount: taxAmount,
            },
            {
              type: ChargeType.RESORT_FEE,
              description: 'Resort Fee',
              quantity: 1,
              unitPrice: property.resortFee,
              amount: property.resortFee,
            },
          ],
        },
      },
    });

    // Add additional charges for some reservations (F&B, Spa, etc.)
    const folio = await prisma.folio.findFirst({ where: { reservationId: reservation.id } });
    if (folio && i % 2 === 0) {
      // F&B charges for every other reservation
      await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          type: ChargeType.FB,
          description: 'Restaurant - Dinner',
          quantity: 1,
          unitPrice: 65 + (i * 7),
          amount: 65 + (i * 7),
          taxRate: property.taxRate,
          taxAmount: (65 + (i * 7)) * (property.taxRate / 100),
        },
      });
    }
    if (folio && i % 3 === 0) {
      // Minibar charges
      await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          type: ChargeType.MINIBAR,
          description: 'Minibar consumption',
          quantity: 1,
          unitPrice: 35,
          amount: 35,
          taxRate: property.taxRate,
          taxAmount: 35 * (property.taxRate / 100),
        },
      });
    }
    if (folio && i % 4 === 0) {
      // Spa charges
      await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          type: ChargeType.SPA,
          description: 'Spa Treatment - Deep Tissue Massage',
          quantity: 1,
          unitPrice: 120,
          amount: 120,
          taxRate: property.taxRate,
          taxAmount: 120 * (property.taxRate / 100),
        },
      });
    }
    if (folio && i % 5 === 0) {
      // Parking charges
      await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          type: ChargeType.PARKING,
          description: 'Valet Parking',
          quantity: nights,
          unitPrice: 35,
          amount: 35 * nights,
          taxRate: property.taxRate,
          taxAmount: (35 * nights) * (property.taxRate / 100),
        },
      });
    }
    if (folio && i % 6 === 0) {
      // Laundry charges
      await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          type: ChargeType.LAUNDRY,
          description: 'Laundry Service',
          quantity: 1,
          unitPrice: 45,
          amount: 45,
          taxRate: property.taxRate,
          taxAmount: 45 * (property.taxRate / 100),
        },
      });
    }
    // Add TAX charges
    if (folio) {
      await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          type: ChargeType.TAX,
          description: 'Property Tax',
          quantity: 1,
          unitPrice: taxAmount,
          amount: taxAmount,
        },
      });
      await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          type: ChargeType.CITY_TAX,
          description: 'City Tourism Tax',
          quantity: 1,
          unitPrice: totalRoom * (property.cityTaxRate / 100),
          amount: totalRoom * (property.cityTaxRate / 100),
        },
      });
    }
  }
  console.log('✅ Reservations created');

  // ─── PAYMENT RECORDS ────────────────────────────────────────────────────────
  // Create payment records for confirmed and checked-in reservations
  const paidReservations = await prisma.reservation.findMany({
    where: { propertyId: property.id, status: { in: ['CONFIRMED', 'CHECKED_IN'] }, paidAmount: { gt: 0 } },
    include: { folio: true },
  });

  for (const res of paidReservations) {
    if (res.folio && Number(res.paidAmount) > 0) {
      await prisma.payment.create({
        data: {
          reservationId: res.id,
          propertyId: property.id,
          folioId: res.folio.id,
          amount: Number(res.paidAmount),
          method: ['CREDIT_CARD', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER', 'CASH'][Math.floor(Math.random() * 5)] as any,
          status: 'CAPTURED',
          reference: `PAY-${res.id.slice(-6).toUpperCase()}`,
        },
      });
    }
  }
  console.log('✅ Payment records created');

  // ─── HOUSEKEEPING TASKS ───────────────────────────────────────────────────
  const hkTypes = [HousekeepingTaskType.CHECKOUT_CLEANING, HousekeepingTaskType.STAYOVER, HousekeepingTaskType.INSPECTION, HousekeepingTaskType.DEEP_CLEAN];
  const hkStatuses = [TaskStatus.PENDING, TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.VERIFIED];
  const hkPriorities = [TaskPriority.NORMAL, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.LOW, TaskPriority.URGENT];
  const hkStaff = [users[4].id];

  for (let i = 0; i < Math.min(16, rooms.length); i++) {
    await prisma.housekeepingTask.create({
      data: {
        propertyId: property.id,
        roomId: rooms[i].id,
        type: hkTypes[i % hkTypes.length],
        status: hkStatuses[i % hkStatuses.length],
        priority: hkPriorities[i % hkPriorities.length],
        assignedTo: hkStaff[0],
        notes: i % 5 === 0 ? 'Extra towels requested by guest' : null,
      },
    });
  }
  console.log('✅ Housekeeping tasks created');

  // ─── CHANNEL CONNECTIONS ──────────────────────────────────────────────────
  await Promise.all([
    prisma.channelConnection.upsert({
      where: { propertyId_channelCode: { propertyId: property.id, channelCode: 'BOOKING_COM' } },
      update: {},
      create: {
        propertyId: property.id,
        channelCode: 'BOOKING_COM',
        channelName: 'Booking.com',
        status: 'ACTIVE',
        autoConfirm: true,
      },
    }),
    prisma.channelConnection.upsert({
      where: { propertyId_channelCode: { propertyId: property.id, channelCode: 'EXPEDIA' } },
      update: {},
      create: {
        propertyId: property.id,
        channelCode: 'EXPEDIA',
        channelName: 'Expedia',
        status: 'PENDING_SETUP',
        autoConfirm: true,
      },
    }),
    prisma.channelConnection.upsert({
      where: { propertyId_channelCode: { propertyId: property.id, channelCode: 'AIRBNB' } },
      update: {},
      create: {
        propertyId: property.id,
        channelCode: 'AIRBNB',
        channelName: 'Airbnb',
        status: 'INACTIVE',
        autoConfirm: false,
      },
    }),
  ]);
  console.log('✅ Channel connections created');

  // ─── ROOM SERVICE MENU ITEMS ──────────────────────────────────────────────
  const menuItemsData = [
    // Breakfast
    { name: 'Continental Breakfast', category: MenuItemCategory.BREAKFAST, price: 18, prepTime: 15, description: 'Assorted pastries, fresh fruit, yogurt, orange juice, and coffee', allergens: ['gluten', 'dairy'] },
    { name: 'Eggs Benedict', category: MenuItemCategory.BREAKFAST, price: 22, prepTime: 20, description: 'Poached eggs on English muffin with hollandaise sauce', allergens: ['gluten', 'dairy', 'eggs'] },
    { name: 'Pancake Stack', category: MenuItemCategory.BREAKFAST, price: 16, prepTime: 15, description: 'Fluffy buttermilk pancakes with maple syrup and fresh berries', allergens: ['gluten', 'dairy', 'eggs'] },
    { name: 'Fresh Fruit Platter', category: MenuItemCategory.BREAKFAST, price: 14, prepTime: 10, description: 'Seasonal fresh fruits beautifully arranged', allergens: [] },
    // Appetizers
    { name: 'Caesar Salad', category: MenuItemCategory.APPETIZER, price: 16, prepTime: 10, description: 'Crisp romaine, parmesan, croutons, and Caesar dressing', allergens: ['gluten', 'dairy', 'eggs'] },
    { name: 'Shrimp Cocktail', category: MenuItemCategory.APPETIZER, price: 24, prepTime: 10, description: 'Chilled jumbo shrimp with cocktail sauce and lemon', allergens: ['shellfish'] },
    { name: 'Soup of the Day', category: MenuItemCategory.APPETIZER, price: 12, prepTime: 10, description: 'Chef\'s daily selection served with artisan bread', allergens: ['gluten'] },
    // Main Course
    { name: 'Grilled Salmon', category: MenuItemCategory.MAIN_COURSE, price: 38, prepTime: 25, description: 'Atlantic salmon with asparagus and lemon butter sauce', allergens: ['fish', 'dairy'] },
    { name: 'Filet Mignon', category: MenuItemCategory.MAIN_COURSE, price: 52, prepTime: 30, description: '8oz prime beef tenderloin with truffle mashed potatoes', allergens: ['dairy'] },
    { name: 'Club Sandwich', category: MenuItemCategory.MAIN_COURSE, price: 22, prepTime: 15, description: 'Triple-decker with turkey, bacon, lettuce, and tomato', allergens: ['gluten', 'eggs'] },
    { name: 'Margherita Pizza', category: MenuItemCategory.MAIN_COURSE, price: 18, prepTime: 20, description: 'Fresh mozzarella, tomato sauce, and basil on thin crust', allergens: ['gluten', 'dairy'] },
    { name: 'Pasta Carbonara', category: MenuItemCategory.MAIN_COURSE, price: 24, prepTime: 20, description: 'Spaghetti with pancetta, egg, parmesan, and black pepper', allergens: ['gluten', 'dairy', 'eggs'] },
    // Desserts
    { name: 'Chocolate Lava Cake', category: MenuItemCategory.DESSERT, price: 14, prepTime: 15, description: 'Warm chocolate cake with molten center and vanilla ice cream', allergens: ['gluten', 'dairy', 'eggs'] },
    { name: 'Crème Brûlée', category: MenuItemCategory.DESSERT, price: 12, prepTime: 10, description: 'Classic vanilla custard with caramelized sugar top', allergens: ['dairy', 'eggs'] },
    { name: 'Ice Cream Selection', category: MenuItemCategory.DESSERT, price: 10, prepTime: 5, description: 'Three scoops of premium ice cream, choice of flavors', allergens: ['dairy'] },
    // Beverages
    { name: 'Fresh Orange Juice', category: MenuItemCategory.BEVERAGE, price: 8, prepTime: 5, description: 'Freshly squeezed orange juice', allergens: [] },
    { name: 'Cappuccino', category: MenuItemCategory.BEVERAGE, price: 6, prepTime: 5, description: 'Double espresso with steamed milk foam', allergens: ['dairy'] },
    { name: 'Bottle of Water', category: MenuItemCategory.BEVERAGE, price: 4, prepTime: 2, description: 'Still or sparkling mineral water (750ml)', allergens: [] },
  ];

  const menuItems: any[] = [];
  for (let i = 0; i < menuItemsData.length; i++) {
    const item = menuItemsData[i];
    const menuItem = await prisma.menuItem.create({
      data: {
        propertyId: property.id,
        name: item.name,
        category: item.category,
        price: item.price,
        prepTime: item.prepTime,
        description: item.description,
        allergens: item.allergens,
        sortOrder: i,
      },
    });
    menuItems.push(menuItem);
  }
  console.log('✅ Menu items created:', menuItems.length);

  // ─── ROOM SERVICE SAMPLE ORDERS ───────────────────────────────────────────
  // Find checked-in reservations
  const checkedInReservations = await prisma.reservation.findMany({
    where: { propertyId: property.id, status: 'CHECKED_IN' },
    include: { folio: true, room: true, guest: true },
    take: 5,
  });

  const orderStatuses: RoomServiceOrderStatus[] = [
    RoomServiceOrderStatus.PENDING,
    RoomServiceOrderStatus.CONFIRMED,
    RoomServiceOrderStatus.PREPARING,
    RoomServiceOrderStatus.READY,
    RoomServiceOrderStatus.DELIVERED,
  ];

  for (let i = 0; i < Math.min(5, checkedInReservations.length); i++) {
    const res = checkedInReservations[i];
    const status = orderStatuses[i];
    const orderMenuItems = [menuItems[i % menuItems.length], menuItems[(i + 5) % menuItems.length]];
    const subtotal = orderMenuItems.reduce((sum, m) => sum + Number(m.price), 0);
    const taxAmount = subtotal * (property.taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const now = new Date();
    const estimatedDelivery = new Date(now);
    estimatedDelivery.setMinutes(now.getMinutes() + 30);

    await prisma.roomServiceOrder.create({
      data: {
        propertyId: property.id,
        reservationId: res.id,
        roomId: res.roomId,
        guestId: res.guestId,
        status,
        totalAmount,
        taxAmount,
        estimatedDelivery,
        confirmedAt: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].includes(status) ? now : null,
        preparedAt: ['READY', 'DELIVERED'].includes(status) ? now : null,
        readyAt: ['READY', 'DELIVERED'].includes(status) ? now : null,
        deliveredAt: status === 'DELIVERED' ? now : null,
        specialInstructions: i === 0 ? 'No onions please' : i === 2 ? 'Extra napkins' : null,
        items: {
          create: orderMenuItems.map(m => ({
            menuItemId: m.id,
            quantity: 1,
            unitPrice: Number(m.price),
            subtotal: Number(m.price),
          })),
        },
      },
    });
  }
  console.log('✅ Room service orders created');

  // ─── DEPARTMENT EXPENSES (USALI) ───────────────────────────────────────────
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const expenseData = [
    // Rooms Department
    { department: 'ROOMS', category: 'LABOR', description: 'Front desk & housekeeping staff salaries', amount: 4200, month: currentMonth },
    { department: 'ROOMS', category: 'SUPPLIES', description: 'Guest amenities, linens, cleaning supplies', amount: 650, month: currentMonth },
    { department: 'ROOMS', category: 'CONTRACTED', description: 'Laundry service for linens', amount: 380, month: currentMonth },
    // F&B Department
    { department: 'FB', category: 'LABOR', description: 'Kitchen & restaurant staff salaries', amount: 2200, month: currentMonth },
    { department: 'FB', category: 'SUPPLIES', description: 'Food & beverage cost of goods', amount: 1100, month: currentMonth },
    { department: 'FB', category: 'CONTRACTED', description: 'Equipment maintenance', amount: 250, month: currentMonth },
    // Spa
    { department: 'SPA', category: 'LABOR', description: 'Spa therapists & reception', amount: 800, month: currentMonth },
    { department: 'SPA', category: 'SUPPLIES', description: 'Spa products & oils', amount: 200, month: currentMonth },
    // Undistributed - Admin
    { department: 'ADMIN', category: 'LABOR', description: 'Management & accounting salaries', amount: 3000, month: currentMonth },
    { department: 'ADMIN', category: 'SUPPLIES', description: 'Office supplies & software', amount: 400, month: currentMonth },
    // Undistributed - Marketing
    { department: 'MARKETING', category: 'CONTRACTED', description: 'Digital marketing & OTA commissions', amount: 800, month: currentMonth },
    // Undistributed - Maintenance
    { department: 'MAINTENANCE', category: 'LABOR', description: 'Maintenance staff salaries', amount: 1000, month: currentMonth },
    { department: 'MAINTENANCE', category: 'SUPPLIES', description: 'Repair parts & tools', amount: 500, month: currentMonth },
    // Undistributed - Energy
    { department: 'ENERGY', category: 'OTHER', description: 'Electricity, gas, water utilities', amount: 1400, month: currentMonth },
  ];

  for (const exp of expenseData) {
    await prisma.departmentExpense.create({
      data: { propertyId: property.id, ...exp },
    });
  }
  console.log('✅ Department expenses created:', expenseData.length);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('  Super Admin:  admin@hotelms.com       / Admin1234!');
  console.log('  GM:           manager@grandplaza.com  / Manager123!');
  console.log('  Front Desk:   frontdesk@grandplaza.com / Frontdesk123!');
  console.log('  Revenue Mgr:  revenue@grandplaza.com  / Revenue123!');
  console.log('  Housekeeping: housekeeping@grandplaza.com / Housekeeping123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
