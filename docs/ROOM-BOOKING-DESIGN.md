# Room Booking System – Design Document

## Context
- Admins create rooms (conference rooms, meeting rooms, cabins).
- Employees book rooms for specific dates and times.
- No building/location hierarchy (flat list of rooms).
- System prevents double booking.

---

## 1. DATABASE SCHEMA (Prisma)

### Tables

#### `rooms`
| Field        | Type     | Constraints / Notes                    |
|-------------|----------|----------------------------------------|
| id          | UUID     | PK, default uuid()                     |
| name        | String   | Room display name                     |
| roomType    | String   | conference_room, meeting_room, cabin   |
| capacity    | Int?     | Optional capacity                      |
| amenities   | String?  | Optional (e.g. "Projector, Whiteboard")|
| isActive    | Boolean  | Default true                           |
| createdAt   | DateTime | default now()                         |
| updatedAt   | DateTime | updatedAt                             |

#### `bookings`
| Field       | Type     | Constraints / Notes                    |
|-------------|----------|----------------------------------------|
| id          | UUID     | PK, default uuid()                     |
| roomId      | UUID     | FK → rooms.id, onDelete Cascade        |
| employeeId  | String   | FK → employees.employee_code           |
| startTime   | DateTime | Start of booking                      |
| endTime     | DateTime | End of booking                         |
| title       | String?  | Optional meeting title                 |
| description | String?  | Optional notes                         |
| status      | String   | confirmed, cancelled                   |
| createdAt   | DateTime | default now()                         |
| updatedAt   | DateTime | updatedAt                             |

**Indexes (for performance / uniqueness):**
- `bookings`: index on `(roomId, startTime, endTime)` for conflict checks (application enforces no overlap).
- Optional: unique index only if you enforce non-overlap via DB (e.g. exclusion constraint in PostgreSQL); this design uses application-level validation.

---

## 2. API ENDPOINTS

### Rooms (admin-managed)

| Method | Path | Request body | Response | Access |
|--------|------|--------------|----------|--------|
| GET | `/rooms` | — | `{ success: true, data: Room[] }` | All authenticated |
| GET | `/rooms/:id` | — | `{ success: true, data: Room }` | All authenticated |
| POST | `/rooms` | `{ name, roomType, capacity?, amenities? }` | `{ success: true, data: Room, message }` | Super Admin, HR Admin |
| PUT | `/rooms/:id` | `{ name?, roomType?, capacity?, amenities?, isActive? }` | `{ success: true, data: Room, message }` | Super Admin, HR Admin |
| DELETE | `/rooms/:id` | — | `{ success: true, message }` | Super Admin, HR Admin |

**Room response shape:**
```ts
{
  id: string;
  name: string;
  roomType: string;
  capacity: number | null;
  amenities: string | null;
  isActive: boolean;
  createdAt: string;  // ISO
  updatedAt: string;
}
```

### Bookings

| Method | Path | Request body | Response | Access |
|--------|------|--------------|----------|--------|
| GET | `/bookings` | Query: `roomId?, employeeId?, from?, to?, status?` | `{ success: true, data: Booking[] }` | All authenticated (filtered by role: employee sees own, admin sees all) |
| GET | `/bookings/:id` | — | `{ success: true, data: Booking }` | All authenticated (owner or admin) |
| POST | `/bookings` | `{ roomId, startTime, endTime, title?, description? }` | `{ success: true, data: Booking, message }` | All authenticated (employee books as self) |
| PUT | `/bookings/:id` | `{ startTime?, endTime?, title?, description? }` | `{ success: true, data: Booking, message }` | Owner or Super Admin / HR Admin |
| DELETE | `/bookings/:id` | — (or body `{ reason? }`) | `{ success: true, message }` | Owner or Super Admin / HR Admin (cancel/delete) |

**Booking response shape:**
```ts
{
  id: string;
  roomId: string;
  roomName?: string;
  employeeId: string;
  employeeName?: string;
  startTime: string;  // ISO
  endTime: string;
  title: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

### Availability (optional but recommended)

| Method | Path | Query | Response | Access |
|--------|------|--------|----------|--------|
| GET | `/rooms/:id/availability` | `from=ISO date, to=ISO date` | `{ success: true, data: { roomId, slots: { start, end }[] } }` (available slots or list of existing bookings) | All authenticated |

---

## 3. FEATURE LIST

| Feature | Description | Roles |
|---------|-------------|--------|
| List rooms | View all active rooms with type, capacity, amenities | All (Super Admin, HR Admin, Manager, Employee) |
| View room details | View single room and its info | All |
| Create room | Add new room (name, type, capacity, amenities) | Super Admin, HR Admin |
| Edit room | Update room details and active flag | Super Admin, HR Admin |
| Delete room | Soft-deactivate or hard-delete room | Super Admin, HR Admin |
| List bookings | View bookings (own only for Employee/Manager; all for HR/Super Admin) | All |
| View booking | View one booking (owner or admin) | All (owner or admin) |
| Create booking | Book a room for a date/time range | All |
| Update booking | Change time, title, description (subject to rules) | Owner, Super Admin, HR Admin |
| Cancel booking | Cancel own or any booking | Owner, Super Admin, HR Admin |
| Check availability | See when a room is free in a date range | All |
| Room calendar / grid | View room-wise or date-wise bookings | All (scope by role) |

---

## 4. BUSINESS RULES

### Booking rules
- **No double booking:** No two confirmed bookings for the same room may overlap in time.
- **Start before end:** `startTime` must be strictly before `endTime`.
- **Minimum duration:** Booking duration ≥ 1 slot (e.g. 15 or 30 minutes); define a constant (e.g. 30 min).
- **No past booking:** Cannot create a booking that starts in the past (or that has already ended).
- **Future limit (optional):** Optional cap on how far in advance one can book (e.g. 90 days).
- **Same-day or advance:** Define whether same-day booking is allowed (e.g. yes, with optional “book at least X hours ahead”).

### Room availability rules
- Only **active** rooms (`isActive = true`) appear in lists and can be booked.
- Deleting/deactivating a room does not delete past bookings (or you can cascade and cancel future ones—document choice).

### Booking modification rules
- Only **confirmed** bookings can be updated (time, title, description); **cancelled** cannot be edited.
- Updating time range is subject to the same validations as create (no overlap, start < end, not in past, min duration).
- Only the **owner** (booking’s `employeeId`) or **Super Admin / HR Admin** can update or cancel; **Manager** can cancel only own.

---

## 5. FRONTEND PAGES

| Page | What it shows | Actions |
|------|----------------|--------|
| **Room list** | All active rooms (name, type, capacity, amenities). Optional: quick “Book” per room. | Navigate to room detail; (Admin) Create room, Edit, Delete/Deactivate. |
| **Room detail** | Single room info and list/calendar of its bookings. | (Admin) Edit room; (All) Book this room. |
| **My bookings** | Current user’s bookings (upcoming and past), with room name and time. | Create booking; Edit/Cancel own booking. |
| **Book a room** | Form: room (dropdown), date, start time, end time, title, description. Optional: availability preview. | Submit booking (validated: no conflict, no past, start < end). |
| **All bookings (admin)** | All bookings (optional filters: room, employee, date range, status). | View; (Admin) Cancel any booking; optional Edit. |
| **Room calendar / grid** | Calendar or grid view: rooms vs date/time with bookings. | View only or click slot to create booking (depending on UX). |

---

## 6. PERMISSION MATRIX

| Action | Super Admin | HR Admin | Manager | Employee |
|--------|-------------|----------|---------|----------|
| List rooms | ✅ | ✅ | ✅ | ✅ |
| View room | ✅ | ✅ | ✅ | ✅ |
| Create room | ✅ | ✅ | ❌ | ❌ |
| Edit room | ✅ | ✅ | ❌ | ❌ |
| Delete room | ✅ | ✅ | ❌ | ❌ |
| List all bookings | ✅ | ✅ | ❌ (own team optional) | ❌ |
| List my bookings | ✅ | ✅ | ✅ | ✅ |
| Create booking | ✅ | ✅ | ✅ | ✅ |
| View any booking | ✅ | ✅ | ❌ (own only) | ❌ (own only) |
| Update own booking | ✅ | ✅ | ✅ | ✅ |
| Update any booking | ✅ | ✅ | ❌ | ❌ |
| Cancel own booking | ✅ | ✅ | ✅ | ✅ |
| Cancel any booking | ✅ | ✅ | ❌ | ❌ |
| Check availability | ✅ | ✅ | ✅ | ✅ |

---

## 7. VALIDATION RULES (summary)

| Rule | Description |
|------|-------------|
| No double booking | For room `R`, no other **confirmed** booking has `(startTime, endTime)` overlapping the new/updated slot. Overlap: `startTime < existing.endTime && endTime > existing.startTime`. |
| Start before end | `startTime < endTime` (strict). |
| Minimum duration | `endTime - startTime >= MIN_BOOKING_MINUTES` (e.g. 30). |
| No past start | `startTime >= now()` (or `startTime` date ≥ today, depending on product rule). |
| Max advance (optional) | `startTime <= now() + MAX_ADVANCE_DAYS`. |
| Room exists and active | `roomId` must reference an existing room with `isActive = true`. |
| Valid room type | On create/update room: `roomType` ∈ { conference_room, meeting_room, cabin }. |
| Room name required | `name` non-empty, optionally max length (e.g. 100). |
| Capacity non-negative | If provided, `capacity >= 0`. |
| Update only confirmed | Allow update only when `booking.status === 'confirmed'`. |
| Cancel sets status | Delete can soft-delete or set `status = 'cancelled'` and keep record. |

---

## Implementation notes

- **Conflict check query:** When creating or updating a booking, run a query like: “find any confirmed booking for the same `roomId` where `(startTime, endTime)` overlaps the given range and `id != currentBookingId`.” If count > 0, return validation error.
- **Timezone:** Store and compare in UTC (or single application timezone) and display in user’s timezone in the UI.
- **Pagination:** For `GET /bookings` and admin “all bookings,” support `page` and `limit` (or cursor) and return `meta: { total, page, limit }`.
