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

  // ─── RESERVATIONS (Realistic February Peak Season) ────────────────────────
  // Miami Beach luxury hotel in February: ~78% occupancy, peak season rates
  const today = new Date();
  const feb1 = new Date(today.getFullYear(), today.getMonth(), 1);
  const sources = [BookingSource.DIRECT, BookingSource.DIRECT, BookingSource.BOOKING_COM, BookingSource.BOOKING_COM, BookingSource.EXPEDIA, BookingSource.AIRBNB, BookingSource.PHONE];
  const stayLengths = [2, 2, 3, 3, 3, 4, 4, 5, 5, 7]; // weighted 3-4 nights average
  const seasonMultiplier = 1.5; // February peak season markup
  const fbDescriptions = ['Restaurant - Dinner', 'Restaurant - Breakfast & Lunch', 'Poolside Bar Tab', 'In-Room Dining', 'Restaurant - Seafood Night'];
  const spaDescriptions = ['Relaxation Massage 60min', 'Deep Tissue Massage 90min', 'Couples Spa Package', 'Facial Treatment', 'Hot Stone Therapy'];
  const noteOptions = ['Late arrival after 22:00', 'Anniversary celebration', 'Honeymoon - champagne requested', 'Business traveler - early checkout', 'Repeat guest - VIP', 'Airport transfer arranged', null, null, null, null];
  let reservationCount = 0;

  // Deterministic seed for reproducibility
  let rngSeed = 42;
  function seededRandom() {
    rngSeed = (rngSeed * 16807) % 2147483647;
    return (rngSeed - 1) / 2147483646;
  }

  for (const room of rooms) {
    const roomType = roomTypes.find(rt => rt.id === room.roomTypeId)!;
    let cursor = new Date(feb1);

    // Stagger arrivals: random offset 0-3 days
    cursor.setDate(cursor.getDate() + Math.floor(seededRandom() * 4));

    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of Feb
    while (cursor <= monthEnd) {
      // ~8% chance to skip a slot (creates gaps → ~78% occupancy)
      if (seededRandom() < 0.08) {
        cursor.setDate(cursor.getDate() + 1 + Math.floor(seededRandom() * 2));
        continue;
      }

      const nights = stayLengths[Math.floor(seededRandom() * stayLengths.length)];
      const checkIn = new Date(cursor);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + nights);

      if (checkIn > monthEnd) break;

      const baseRate = Math.round(Number(roomType.basePrice) * seasonMultiplier);
      const totalRoom = baseRate * nights;
      const taxAmount = Math.round(totalRoom * (property.taxRate / 100) * 100) / 100;
      const totalAmount = totalRoom + taxAmount + property.resortFee;

      const guest = guests[Math.floor(seededRandom() * guests.length)];
      const ratePlan = ratePlans[Math.floor(seededRandom() * ratePlans.length)];
      const source = sources[Math.floor(seededRandom() * sources.length)];

      // Status based on dates relative to today
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      let status: ReservationStatus;
      if (checkOut <= todayMidnight) {
        status = ReservationStatus.CHECKED_OUT;
      } else if (checkIn <= todayMidnight) {
        status = ReservationStatus.CHECKED_IN;
      } else {
        status = ReservationStatus.CONFIRMED;
      }

      const isPaid = status === ReservationStatus.CHECKED_OUT || status === ReservationStatus.CHECKED_IN;
      const paidAmount = isPaid ? totalAmount : status === ReservationStatus.CONFIRMED ? totalAmount * 0.3 : 0;

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
          adults: 1 + Math.floor(seededRandom() * 2),
          baseRate,
          totalRoomCharge: totalRoom,
          totalTax: taxAmount,
          totalFees: property.resortFee,
          totalAmount,
          paidAmount,
          balanceDue: totalAmount - paidAmount,
          commissionPct: source === BookingSource.BOOKING_COM ? 15 : source === BookingSource.EXPEDIA ? 18 : 0,
          commission: source === BookingSource.BOOKING_COM ? totalAmount * 0.15 : source === BookingSource.EXPEDIA ? totalAmount * 0.18 : 0,
          notes: noteOptions[Math.floor(seededRandom() * noteOptions.length)],
          checkedInAt: (status === ReservationStatus.CHECKED_IN || status === ReservationStatus.CHECKED_OUT) ? checkIn : null,
        },
      });

      // Create folio with core charges
      const folio = await prisma.folio.create({
        data: {
          reservationId: reservation.id,
          propertyId: property.id,
          totalCharges: totalAmount,
          totalPayments: paidAmount,
          totalTax: taxAmount,
          balance: totalAmount - paidAmount,
          status: status === ReservationStatus.CHECKED_OUT ? FolioStatus.CLOSED : FolioStatus.OPEN,
          charges: {
            create: [
              { type: ChargeType.ROOM, description: `Room ${room.number} - ${roomType.name} (${nights} nights)`, quantity: nights, unitPrice: baseRate, amount: totalRoom, taxRate: property.taxRate, taxAmount },
              { type: ChargeType.RESORT_FEE, description: 'Daily Resort Fee', quantity: nights, unitPrice: property.resortFee / nights, amount: property.resortFee },
              { type: ChargeType.TAX, description: 'State Tax 7%', quantity: 1, unitPrice: taxAmount, amount: taxAmount },
              { type: ChargeType.CITY_TAX, description: 'Miami Beach Tourism Tax 2%', quantity: 1, unitPrice: Math.round(totalRoom * (property.cityTaxRate / 100) * 100) / 100, amount: Math.round(totalRoom * (property.cityTaxRate / 100) * 100) / 100 },
            ],
          },
        },
      });

      // Ancillary charges (for checked-in, checked-out, and confirmed guests)
      if (isPaid || status === ReservationStatus.CONFIRMED) {
        // F&B (78% of stays) — $65-220 per charge, multiple charges for longer stays
        if (seededRandom() < 0.78) {
          const fbAmt = 65 + Math.floor(seededRandom() * 155);
          await prisma.folioCharge.create({ data: { folioId: folio.id, type: ChargeType.FB, description: fbDescriptions[Math.floor(seededRandom() * fbDescriptions.length)], quantity: 1, unitPrice: fbAmt, amount: fbAmt, taxRate: property.taxRate, taxAmount: Math.round(fbAmt * property.taxRate) / 100 } });
          // Second F&B charge for stays >= 3 nights (65% chance)
          if (nights >= 3 && seededRandom() < 0.65) {
            const fb2 = 45 + Math.floor(seededRandom() * 120);
            await prisma.folioCharge.create({ data: { folioId: folio.id, type: ChargeType.FB, description: fbDescriptions[Math.floor(seededRandom() * fbDescriptions.length)], quantity: 1, unitPrice: fb2, amount: fb2, taxRate: property.taxRate, taxAmount: Math.round(fb2 * property.taxRate) / 100 } });
          }
          // Third F&B charge for stays >= 5 nights (50% chance)
          if (nights >= 5 && seededRandom() < 0.50) {
            const fb3 = 40 + Math.floor(seededRandom() * 100);
            await prisma.folioCharge.create({ data: { folioId: folio.id, type: ChargeType.FB, description: fbDescriptions[Math.floor(seededRandom() * fbDescriptions.length)], quantity: 1, unitPrice: fb3, amount: fb3, taxRate: property.taxRate, taxAmount: Math.round(fb3 * property.taxRate) / 100 } });
          }
        }
        // Minibar (45%)
        if (seededRandom() < 0.45) {
          const mbAmt = 18 + Math.floor(seededRandom() * 55);
          await prisma.folioCharge.create({ data: { folioId: folio.id, type: ChargeType.MINIBAR, description: 'Minibar Consumption', quantity: 1, unitPrice: mbAmt, amount: mbAmt, taxRate: property.taxRate, taxAmount: Math.round(mbAmt * property.taxRate) / 100 } });
        }
        // Spa (28%)
        if (seededRandom() < 0.28) {
          const spaAmt = [95, 120, 150, 180, 220][Math.floor(seededRandom() * 5)];
          await prisma.folioCharge.create({ data: { folioId: folio.id, type: ChargeType.SPA, description: spaDescriptions[Math.floor(seededRandom() * spaDescriptions.length)], quantity: 1, unitPrice: spaAmt, amount: spaAmt, taxRate: property.taxRate, taxAmount: Math.round(spaAmt * property.taxRate) / 100 } });
        }
        // Parking (38%)
        if (seededRandom() < 0.38) {
          const pkAmt = 45 * nights;
          await prisma.folioCharge.create({ data: { folioId: folio.id, type: ChargeType.PARKING, description: 'Valet Parking Service', quantity: nights, unitPrice: 45, amount: pkAmt, taxRate: property.taxRate, taxAmount: Math.round(pkAmt * property.taxRate) / 100 } });
        }
        // Laundry (18%)
        if (seededRandom() < 0.18) {
          const lndAmt = 35 + Math.floor(seededRandom() * 50);
          await prisma.folioCharge.create({ data: { folioId: folio.id, type: ChargeType.LAUNDRY, description: 'Laundry & Dry Cleaning', quantity: 1, unitPrice: lndAmt, amount: lndAmt, taxRate: property.taxRate, taxAmount: Math.round(lndAmt * property.taxRate) / 100 } });
        }
      }

      // Payment record
      if (paidAmount > 0) {
        await prisma.payment.create({
          data: {
            reservationId: reservation.id,
            propertyId: property.id,
            amount: paidAmount,
            method: (['CREDIT_CARD', 'CREDIT_CARD', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER'] as any)[Math.floor(seededRandom() * 5)],
            status: 'CAPTURED',
            reference: `PAY-${reservation.id.slice(-6).toUpperCase()}`,
          },
        });
      }

      reservationCount++;
      // Next check-in: checkout + 0-1 day turnover (same-day turnover 60% of the time)
      cursor = new Date(checkOut);
      if (seededRandom() > 0.60) cursor.setDate(cursor.getDate() + 1);
    }
  }
  console.log(`✅ Reservations created: ${reservationCount}`);

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

  // Expenses calibrated for 56-room luxury hotel with ~$300K+ monthly revenue
  // Industry benchmarks: Rooms dept ~27%, F&B ~68%, Spa ~58%, Undistributed ~20% of total rev
  const expenseData = [
    // Rooms Department (~27% of ~$280K rooms revenue = ~$76K)
    { department: 'ROOMS', category: 'LABOR', description: 'Front desk staff salaries (8 FTEs)', amount: 38000, month: currentMonth },
    { department: 'ROOMS', category: 'LABOR', description: 'Housekeeping staff salaries (12 FTEs)', amount: 24000, month: currentMonth },
    { department: 'ROOMS', category: 'SUPPLIES', description: 'Guest amenities & bathroom products', amount: 4200, month: currentMonth },
    { department: 'ROOMS', category: 'SUPPLIES', description: 'Linens, towels & bedding replacement', amount: 3800, month: currentMonth },
    { department: 'ROOMS', category: 'CONTRACTED', description: 'Commercial laundry service', amount: 5500, month: currentMonth },
    { department: 'ROOMS', category: 'OTHER', description: 'Guest transportation & concierge', amount: 1800, month: currentMonth },
    // F&B Department (~65% of F&B revenue)
    { department: 'FB', category: 'LABOR', description: 'Kitchen staff & chefs (6 FTEs)', amount: 15500, month: currentMonth },
    { department: 'FB', category: 'LABOR', description: 'Restaurant & bar servers (8 FTEs)', amount: 10500, month: currentMonth },
    { department: 'FB', category: 'SUPPLIES', description: 'Food cost of goods (proteins, produce)', amount: 9800, month: currentMonth },
    { department: 'FB', category: 'SUPPLIES', description: 'Beverage & wine inventory', amount: 3500, month: currentMonth },
    { department: 'FB', category: 'CONTRACTED', description: 'Kitchen equipment maintenance', amount: 1500, month: currentMonth },
    // Spa (~58% of ~$18K spa revenue = ~$10.4K)
    { department: 'SPA', category: 'LABOR', description: 'Spa therapists & reception (4 FTEs)', amount: 7200, month: currentMonth },
    { department: 'SPA', category: 'SUPPLIES', description: 'Spa products, oils & treatment supplies', amount: 2400, month: currentMonth },
    { department: 'SPA', category: 'CONTRACTED', description: 'Equipment maintenance', amount: 800, month: currentMonth },
    // Undistributed - Admin & General
    { department: 'ADMIN', category: 'LABOR', description: 'GM, accounting & HR salaries', amount: 22000, month: currentMonth },
    { department: 'ADMIN', category: 'SUPPLIES', description: 'Office supplies, software licenses', amount: 3200, month: currentMonth },
    { department: 'ADMIN', category: 'CONTRACTED', description: 'Legal, audit & consulting fees', amount: 4500, month: currentMonth },
    { department: 'ADMIN', category: 'OTHER', description: 'Insurance premiums', amount: 6800, month: currentMonth },
    // Undistributed - Sales & Marketing
    { department: 'MARKETING', category: 'LABOR', description: 'Sales & marketing team (3 FTEs)', amount: 9500, month: currentMonth },
    { department: 'MARKETING', category: 'CONTRACTED', description: 'OTA commissions & digital ads', amount: 8500, month: currentMonth },
    { department: 'MARKETING', category: 'SUPPLIES', description: 'Collateral, photography & content', amount: 2200, month: currentMonth },
    // Undistributed - Property Maintenance
    { department: 'MAINTENANCE', category: 'LABOR', description: 'Maintenance & engineering (3 FTEs)', amount: 8500, month: currentMonth },
    { department: 'MAINTENANCE', category: 'SUPPLIES', description: 'Repair parts, tools & materials', amount: 3200, month: currentMonth },
    { department: 'MAINTENANCE', category: 'CONTRACTED', description: 'Elevator, HVAC & pool service', amount: 4800, month: currentMonth },
    // Undistributed - Energy & Utilities
    { department: 'ENERGY', category: 'OTHER', description: 'Electricity (HVAC, lighting)', amount: 9500, month: currentMonth },
    { department: 'ENERGY', category: 'OTHER', description: 'Water, gas & sewage', amount: 4200, month: currentMonth },
    { department: 'ENERGY', category: 'OTHER', description: 'Telecom & internet infrastructure', amount: 2800, month: currentMonth },
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
