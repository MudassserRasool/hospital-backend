# Profile APIs Explanation

## Overview

There are multiple profile APIs in the backend, which can be confusing. This document clarifies the structure and purpose of each.

## Profile API Structure

### 1. **Main Auth Profile API** (Universal - All Roles)

**Location:** `backend/src/modules/auth/auth.controller.ts`

**Endpoints:**

- `GET /auth/profile` - Get current user profile
- `PATCH /auth/profile` - Update current user profile

**Access:** All authenticated users (any role)

**What it does:**

- Returns basic **User entity** data (email, firstName, lastName, phone, profilePicture, role, hospitalId)
- Updates basic user fields in the User model
- Uses `sanitizeUser()` to remove sensitive data (password, refreshTokens)

**Service:** `AuthService.getProfile()` and `AuthService.updateProfile()`

---

### 2. **Role-Specific Profile APIs**

#### A. **Owners Profile API**

**Location:** `backend/src/modules/owners/owners.controller.ts`

**Endpoints:**

- `GET /owners/me` - Get owner profile

**Access:** Only users with `owner` role

**What it does:**

- Returns **User entity** data (same as auth profile)
- Populates hospital information
- Essentially the same as `/auth/profile` but role-restricted

**Service:** `OwnersService.getOwnerProfile()`

**Note:** This is **redundant** with `/auth/profile` - both return the same User entity data.

---

#### B. **Staff Profile API**

**Location:** `backend/src/modules/staff/staff.controller.ts`

**Endpoints:**

- `GET /staff/me` - Get my staff profile
- `PATCH /staff/me` - Update my profile

**Access:** Users with roles: `doctor`, `nurse`, `staff`, `receptionist`

**What it does:**

- Returns **User entity** data (same as auth profile)
- Populates hospital information
- Essentially the same as `/auth/profile` but role-restricted

**Service:** `StaffService.getStaffProfile()` and `StaffService.updateStaffProfile()`

**Note:** This is **redundant** with `/auth/profile` - both return the same User entity data.

---

#### C. **Patients Profile API**

**Location:** `backend/src/modules/patients/patients.controller.ts`

**Endpoints:**

- `GET /patients/me` - Get current patient profile
- `PATCH /patients/:id` - Update patient profile

**Access:** Users with `patient` role

**What it does:**

- Returns **Patient entity** data (NOT just User entity)
- Patient entity has additional fields like:
  - Medical history
  - Allergies
  - Emergency contacts
  - Wallet balance
  - Appointment statistics
  - etc.
- Populates related User data (firstName, lastName, email, phone, profilePicture)

**Service:** `PatientsService.findByUserId()` and `PatientsService.update()`

**Note:** This is **different** from `/auth/profile` - it returns Patient-specific data, not just User data.

---

## Update Endpoints Analysis

### Update Endpoints Status

| API             | GET Endpoint           | UPDATE Endpoint          | Update Fields                              | Status                     |
| --------------- | ---------------------- | ------------------------ | ------------------------------------------ | -------------------------- |
| `/auth/profile` | ✅ `GET /auth/profile` | ✅ `PATCH /auth/profile` | firstName, lastName, phone, profilePicture | ✅ **Complete**            |
| `/owners/me`    | ✅ `GET /owners/me`    | ❌ **MISSING**           | N/A                                        | ⚠️ **Incomplete**          |
| `/staff/me`     | ✅ `GET /staff/me`     | ✅ `PATCH /staff/me`     | Uses `any` type (no DTO validation)        | ⚠️ **Poor Implementation** |
| `/patients/:id` | ✅ `GET /patients/me`  | ✅ `PATCH /patients/:id` | Patient-specific fields                    | ✅ **Complete**            |

### Update Endpoint Details

#### 1. **Auth Profile Update** (`PATCH /auth/profile`)

**DTO:** `UpdateProfileDto`

- ✅ Proper DTO with validation
- ✅ Fields: `firstName`, `lastName`, `phone`, `profilePicture`
- ✅ Updates User entity
- ✅ Returns sanitized user

**Implementation:**

```typescript
async updateProfile(userId: string, dto: UpdateProfileDto) {
  const user = await this.userModel.findByIdAndUpdate(userId, dto, { new: true });
  return this.sanitizeUser(user);
}
```

---

#### 2. **Owners Profile Update** (`PATCH /owners/me`)

**Status:** ❌ **MISSING ENDPOINT**

**Problem:** Owners cannot update their own profile through the owners API. They would need to use `/auth/profile` instead.

**Recommendation:** Add `PATCH /owners/me` endpoint or document that owners should use `/auth/profile`.

---

#### 3. **Staff Profile Update** (`PATCH /staff/me`)

**DTO:** `any` (no proper DTO)

- ⚠️ Uses `any` type instead of proper DTO
- ⚠️ No validation
- ✅ Updates User entity (same as auth)
- ⚠️ Returns unsanitized user (includes password field, though it's excluded in select)

**Implementation:**

```typescript
async updateStaffProfile(staffId: string, updateData: any) {
  const staff = await this.userModel
    .findByIdAndUpdate(staffId, updateData, { new: true })
    .select('-password -refreshTokens')
    .populate('hospitalId', 'name logo')
    .exec();
  return staff;
}
```

**Problems:**

1. No DTO validation (accepts `any`)
2. Redundant with `/auth/profile` (does the same thing)
3. Less secure (no input validation)

---

#### 4. **Patients Profile Update** (`PATCH /patients/:id`)

**DTO:** `UpdatePatientDto` (extends `CreatePatientDto`)

- ✅ Proper DTO with validation
- ✅ Updates **Patient entity** (not User entity)
- ✅ Patient-specific fields:
  - `dateOfBirth`, `gender`, `bloodType`
  - `allergies`, `chronicConditions`
  - `emergencyContact`
  - `medicalRecordNumber`
  - `insuranceProvider`, `insurancePolicyNumber`
  - `phone`

**Implementation:**

```typescript
async update(id: string, updatePatientDto: UpdatePatientDto) {
  const patient = await this.patientModel
    .findByIdAndUpdate(id, updatePatientDto, { new: true })
    .populate('userId', 'firstName lastName email phone profilePicture')
    .exec();
  return patient;
}
```

**Note:** This is **different** from auth update - it updates Patient-specific data, not User data.

---

## Key Differences

| API             | Returns        | Purpose                         | Redundant?              | Update Status          |
| --------------- | -------------- | ------------------------------- | ----------------------- | ---------------------- |
| `/auth/profile` | User entity    | Universal profile for all roles | No                      | ✅ Complete            |
| `/owners/me`    | User entity    | Owner-specific endpoint         | **Yes** - same as auth  | ❌ Missing update      |
| `/staff/me`     | User entity    | Staff-specific endpoint         | **Yes** - same as auth  | ⚠️ Poor implementation |
| `/patients/me`  | Patient entity | Patient-specific data           | **No** - different data | ✅ Complete            |

## The Problems

1. **Redundancy:** `/owners/me` and `/staff/me` return the exact same data as `/auth/profile`
2. **Inconsistency:** Patients have a different structure (Patient entity vs User entity)
3. **Confusion:** Multiple endpoints doing the same thing for different roles
4. **Missing Update Endpoint:** Owners don't have a dedicated update endpoint
5. **Poor Implementation:** Staff update uses `any` type instead of proper DTO
6. **Inconsistent Update Patterns:**
   - Auth uses proper DTO ✅
   - Staff uses `any` type ⚠️
   - Patients uses proper DTO ✅
   - Owners has no update endpoint ❌

## Recommendations

### Option 1: Consolidate to Auth API (Recommended)

- Keep `/auth/profile` as the main profile API for all roles (GET & PATCH)
- Remove `/owners/me` and `/staff/me` (they're redundant)
- Keep `/patients/me` separate (it returns different data structure)
- **Benefits:** Single source of truth, less code to maintain, consistent behavior

### Option 2: Keep Role-Specific APIs (Fix Issues)

- **Fix Owners:** Add `PATCH /owners/me` endpoint with proper DTO
- **Fix Staff:** Replace `any` with proper `UpdateProfileDto` or create `UpdateStaffDto`
- **Enhance All:** Make them return role-specific data (add more fields/relations)
- Document clearly what each returns

### Option 3: Hybrid Approach (Best of Both Worlds)

- Use `/auth/profile` for basic user info updates (all roles)
- Use role-specific endpoints for role-specific data:
  - `/owners/me` - GET: owner + hospital management data, PATCH: owner-specific fields
  - `/staff/me` - GET: staff + work hours, schedules, PATCH: staff-specific fields (license, specialization, etc.)
  - `/patients/me` - GET & PATCH: already handles patient-specific data ✅

## Update Endpoints Recommendations

### Immediate Fixes Needed:

1. **Add Owners Update Endpoint:**

   ```typescript
   @Patch('me')
   @ApiOperation({ summary: 'Update owner profile' })
   updateOwnerProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
     return this.ownersService.updateOwnerProfile(user.id, dto);
   }
   ```

2. **Fix Staff Update Endpoint:**

   ```typescript
   // Replace 'any' with proper DTO
   updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
     return this.staffService.updateStaffProfile(user.id, dto);
   }
   ```

3. **Consider Patient Update Endpoint:**
   - Current: `PATCH /patients/:id` (requires patient ID)
   - Better: `PATCH /patients/me` (uses current user)
   - Or: Keep both (me for self, :id for admin updates)

## Current Implementation Details

### Auth Profile (`/auth/profile`)

```typescript
// Returns sanitized User entity
{
  (id,
    email,
    firstName,
    lastName,
    phone,
    profilePicture,
    role,
    hospitalId,
    isActive,
    isBlocked,
    createdAt,
    updatedAt);
}
```

### Owners Profile (`/owners/me`)

```typescript
// Returns User entity (same as auth)
{
  (id,
    email,
    firstName,
    lastName,
    phone,
    profilePicture,
    role,
    hospitalId,
    isActive,
    isBlocked,
    createdAt,
    updatedAt);
}
```

### Staff Profile (`/staff/me`)

```typescript
// Returns User entity (same as auth)
{
  (id,
    email,
    firstName,
    lastName,
    phone,
    profilePicture,
    role,
    hospitalId,
    isActive,
    isBlocked,
    createdAt,
    updatedAt);
}
```

### Patients Profile (`/patients/me`)

```typescript
// Returns Patient entity with populated User
{
  id, userId: { firstName, lastName, email, phone, profilePicture },
  medicalHistory, allergies, emergencyContacts,
  walletBalance, appointmentStats, createdAt, updatedAt
}
```
