# Profile APIs - Complete List with Database Collections

## Summary

This document lists all profile-related APIs in the backend and identifies which MongoDB collections they use to save and retrieve data.

---

## MongoDB Collections Used

1. **`users`** - Stores all user accounts (all roles: owner, doctor, nurse, staff, receptionist, patient, super_admin)
2. **`patients`** - Stores patient-specific medical information (references `users` collection via `userId`)

---

## Profile APIs List

### 1. **Auth Profile API** (Universal - All Roles)

**Controller:** `backend/src/modules/auth/auth.controller.ts`  
**Service:** `backend/src/modules/auth/auth.service.ts`

#### Endpoints:

| Method  | Endpoint        | Description                 | Access                  |
| ------- | --------------- | --------------------------- | ----------------------- |
| `GET`   | `/auth/profile` | Get current user profile    | All authenticated users |
| `PATCH` | `/auth/profile` | Update current user profile | All authenticated users |

#### Database Collection:

- **Collection:** `users`
- **Model:** `User` (from `backend/src/modules/users/entities/user.entity.ts`)
- **Operations:**
  - **GET:** Reads from `users` collection
  - **PATCH:** Updates `users` collection

#### Service Methods:

- `AuthService.getProfile(userId)` - Queries `users` collection by `_id`
- `AuthService.updateProfile(userId, dto)` - Updates `users` collection by `_id`

#### Data Returned:

- User entity fields: `id`, `email`, `firstName`, `lastName`, `phone`, `profilePicture`, `role`, `hospitalId`, `isActive`, `isBlocked`, `createdAt`, `updatedAt`
- Populates `hospitalId` with hospital name and logo
- Sanitized (removes `password` and `refreshTokens`)

---

### 2. **Patients Profile API**

**Controller:** `backend/src/modules/patients/patients.controller.ts`  
**Service:** `backend/src/modules/patients/patients.service.ts`

#### Endpoints:

| Method  | Endpoint        | Description                 | Access                                   |
| ------- | --------------- | --------------------------- | ---------------------------------------- |
| `GET`   | `/patients/me`  | Get current patient profile | `patient` role                           |
| `PATCH` | `/patients/:id` | Update patient profile      | `patient`, `receptionist`, `owner` roles |

#### Database Collections:

- **Primary Collection:** `patients`
- **Related Collection:** `users` (populated via `userId` reference)
- **Model:** `Patient` (from `backend/src/modules/patients/entities/patient.entity.ts`)

#### Service Methods:

- `PatientsService.findByUserId(userId)` - Queries `patients` collection by `userId`, populates `users`
- `PatientsService.update(id, dto)` - Updates `patients` collection by `_id`, populates `users`

#### Data Returned:

- Patient entity fields:
  - `id`, `userId` (populated with: `firstName`, `lastName`, `email`, `phone`, `profilePicture`)
  - `dateOfBirth`, `gender`, `bloodType`
  - `allergies[]`, `chronicConditions[]`
  - `emergencyContact` (name, phone, relation)
  - `medicalRecordNumber`, `insuranceProvider`, `insurancePolicyNumber`
  - `phone`, `hospitalId`
  - `totalAppointments`, `completedAppointments`, `cancelledAppointments`, `noShowAppointments`
  - `isBlocked`, `blockReason`, `blockHistory[]`
  - `createdAt`, `updatedAt`

---

### 3. **Staff Profile API**

**Controller:** `backend/src/modules/staff/staff.controller.ts`  
**Service:** `backend/src/modules/staff/staff.service.ts`

#### Endpoints:

| Method  | Endpoint    | Description          | Access                                           |
| ------- | ----------- | -------------------- | ------------------------------------------------ |
| `GET`   | `/staff/me` | Get my staff profile | `doctor`, `nurse`, `staff`, `receptionist` roles |
| `PATCH` | `/staff/me` | Update my profile    | `doctor`, `nurse`, `staff`, `receptionist` roles |

#### Database Collection:

- **Collection:** `users`
- **Model:** `User` (from `backend/src/modules/users/entities/user.entity.ts`)
- **Operations:**
  - **GET:** Reads from `users` collection
  - **PATCH:** Updates `users` collection

#### Service Methods:

- `StaffService.getStaffProfile(staffId)` - Queries `users` collection by `_id`
- `StaffService.updateStaffProfile(staffId, updateData)` - Updates `users` collection by `_id`

#### Data Returned:

- User entity fields (same as `/auth/profile`)
- Populates `hospitalId` with hospital name and logo
- Excludes `password` and `refreshTokens` fields

**Note:** This API is **redundant** with `/auth/profile` - both return the same User entity data.

---

### 4. **Owners Profile API**

**Controller:** `backend/src/modules/owners/owners.controller.ts`  
**Service:** `backend/src/modules/owners/owners.service.ts`

#### Endpoints:

| Method | Endpoint           | Description             | Access       |
| ------ | ------------------ | ----------------------- | ------------ |
| `GET`  | `/owners/me`       | Get owner profile       | `owner` role |
| `PUT`  | `/owners/hospital` | Update hospital profile | `owner` role |

#### Database Collections:

- **Collection:** `users` (for owner profile)
- **Collection:** `hospitals` (for hospital profile update)
- **Model:** `User` (from `backend/src/modules/users/entities/user.entity.ts`)
- **Model:** `Hospital` (from `backend/src/modules/hospitals/entities/hospital.entity.ts`)

#### Service Methods:

- `OwnersService.getOwnerProfile(userId)` - Queries `users` collection by `_id`
- `OwnersService.updateHospital(hospitalId, updateData)` - Updates `hospitals` collection by `_id`

#### Data Returned:

- User entity fields (same as `/auth/profile`)
- Populates `hospitalId` with hospital name and logo

**Note:**

- This API is **redundant** with `/auth/profile` - both return the same User entity data.
- **Missing:** `PATCH /owners/me` endpoint to update owner profile (owners must use `/auth/profile` instead)

---

## Database Collections Summary

### Collection: `users`

**Used by:**

- ✅ `GET /auth/profile` - Read
- ✅ `PATCH /auth/profile` - Update
- ✅ `GET /staff/me` - Read
- ✅ `PATCH /staff/me` - Update
- ✅ `GET /owners/me` - Read

**Schema Fields:**

- `_id`, `email`, `password`, `googleId`
- `firstName`, `lastName`, `phone`, `profilePicture`
- `role`, `gender`, `avatar`
- `hospitalId` (ObjectId reference to `hospitals`)
- `isActive`, `isVerified`, `isBlocked`
- `blockedReason`, `blockedAt`, `blockedBy`
- `refreshTokens[]`, `deviceTokens[]`
- `experience`, `licenseNumber`, `specialization`, `timing[]`
- `lastLoginAt`, `otp`
- `createdAt`, `updatedAt`

### Collection: `patients`

**Used by:**

- ✅ `GET /patients/me` - Read
- ✅ `PATCH /patients/:id` - Update

**Schema Fields:**

- `_id`, `userId` (ObjectId reference to `users`)
- `dateOfBirth`, `gender`, `bloodType`
- `allergies[]`, `chronicConditions[]`
- `emergencyContact` (object)
- `medicalRecordNumber`, `insuranceProvider`, `insurancePolicyNumber`
- `phone`, `hospitalId` (ObjectId reference to `hospitals`)
- `totalAppointments`, `completedAppointments`, `cancelledAppointments`, `noShowAppointments`
- `isBlocked`, `blockReason`, `blockHistory[]`
- `createdAt`, `updatedAt`

### Collection: `hospitals`

**Used by:**

- ✅ `PUT /owners/hospital` - Update

**Note:** This is for hospital profile update, not user profile.

---

## Quick Reference Table

| API Endpoint       | Method | Collection(s)                    | Model    | Returns                       |
| ------------------ | ------ | -------------------------------- | -------- | ----------------------------- |
| `/auth/profile`    | GET    | `users`                          | User     | User entity (sanitized)       |
| `/auth/profile`    | PATCH  | `users`                          | User     | Updated User entity           |
| `/patients/me`     | GET    | `patients` + `users` (populated) | Patient  | Patient entity with User data |
| `/patients/:id`    | PATCH  | `patients` + `users` (populated) | Patient  | Updated Patient entity        |
| `/staff/me`        | GET    | `users`                          | User     | User entity                   |
| `/staff/me`        | PATCH  | `users`                          | User     | Updated User entity           |
| `/owners/me`       | GET    | `users`                          | User     | User entity                   |
| `/owners/hospital` | PUT    | `hospitals`                      | Hospital | Updated Hospital entity       |

---

## Key Points

1. **Most profile APIs use `users` collection** - Auth, Staff, and Owners all read/write to the same `users` collection
2. **Patients use separate `patients` collection** - This stores patient-specific medical data and references `users` via `userId`
3. **Redundancy exists** - `/staff/me` and `/owners/me` return the same data as `/auth/profile`
4. **Missing endpoint** - Owners don't have `PATCH /owners/me` (must use `/auth/profile`)

---

## Recommendations

1. **Consolidate redundant APIs** - Consider removing `/staff/me` and `/owners/me` GET endpoints since they duplicate `/auth/profile`
2. **Add missing endpoint** - Add `PATCH /owners/me` for consistency
3. **Standardize DTOs** - Replace `any` type in staff update with proper DTO
4. **Consider adding `PATCH /patients/me`** - Currently only `PATCH /patients/:id` exists
