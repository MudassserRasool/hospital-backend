# Patient Profile - Mobile App Guide

## Current Situation

### Backend Endpoints:

1. **`GET /patients/me`** ✅
   - Returns: Patient entity with medical data (allergies, bloodType, medicalRecordNumber, etc.)
   - Includes populated user data (firstName, lastName, email, phone, profilePicture)
   - **Use this for GET**

2. **`PATCH /patients/:id`** ⚠️
   - Requires: Patient ID (not user ID)
   - Updates: Patient-specific fields
   - **Problem:** Mobile is calling `PATCH /patients/me` but backend expects `PATCH /patients/:id`

3. **`GET /auth/profile`** ✅
   - Returns: Basic user data (firstName, lastName, phone, profilePicture)
   - **Does NOT include patient-specific medical data**
   - Works for all roles, but limited data for patients

---

## Recommendation for Mobile App

### ✅ **For Patients: Use `/patients/me`**

**Why:**

- `/patients/me` returns **complete patient profile** including:
  - User data (firstName, lastName, email, phone, profilePicture)
  - Patient-specific data (bloodType, allergies, medicalRecordNumber, etc.)
  - Medical history fields

**Current Mobile Code:**

```typescript
// ✅ CORRECT - Already using this for GET
const { data } = useGetMyProfileQuery(); // Calls GET /patients/me

// ❌ PROBLEM - This doesn't exist
updateMyProfile({ ...data }); // Tries to call PATCH /patients/me
```

---

## Issues to Fix

### Issue 1: PATCH Endpoint Mismatch

**Problem:**

- Mobile calls: `PATCH /patients/me`
- Backend expects: `PATCH /patients/:id`

**Solutions:**

#### Option A: Add `PATCH /patients/me` to Backend (Recommended)

```typescript
// In patients.controller.ts
@Patch('me')
@Roles('patient')
@ApiOperation({ summary: 'Update my patient profile' })
updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdatePatientDto) {
  return this.patientsService.updateByUserId(user.id, dto);
}
```

#### Option B: Use Patient ID in Mobile

```typescript
// Get patient ID from profile response
const { data: profile } = useGetMyProfileQuery();
const patientId = profile?._id || profile?.id;

// Then use it for update
updateMyProfile({ id: patientId, ...data });
```

---

### Issue 2: EditProfile Component Uses Wrong Endpoint

**Current:**

```typescript
// EditProfile.tsx uses /auth/profile (generic endpoint)
const { data } = useGetProfileQuery(); // Calls GET /auth/profile
```

**For Patients:**

- Should use `/patients/me` to get full patient data
- Should use `/patients/me` (or `/patients/:id`) for updates

**Solution:**
Make `EditProfile.tsx` role-aware:

```typescript
const { user } = useAuth();
const isPatient = user?.role === 'patient';

// Use patient-specific endpoint for patients
const { data: profileData } = isPatient
  ? useGetMyProfileQuery() // GET /patients/me
  : useGetProfileQuery(); // GET /auth/profile

const [updateProfile] = isPatient
  ? useUpdateMyProfileMutation() // PATCH /patients/me
  : useUpdateProfileMutation(); // PATCH /auth/profile
```

---

## Summary

### ✅ **What to Use for Patient Profile:**

| Action                | Endpoint              | Status                          |
| --------------------- | --------------------- | ------------------------------- |
| **GET Profile**       | `GET /patients/me`    | ✅ Works                        |
| **PATCH Profile**     | `PATCH /patients/me`  | ❌ Needs to be added to backend |
| **Alternative PATCH** | `PATCH /patients/:id` | ✅ Works (but needs patient ID) |

### 📝 **Action Items:**

1. **Backend:** Add `PATCH /patients/me` endpoint (recommended)
2. **Mobile:** Update `EditProfile.tsx` to use patient-specific endpoints for patients
3. **Mobile:** Fix `updateMyProfile` to use correct endpoint

---

## Data Comparison

### `/auth/profile` Response (Basic):

```json
{
  "id": "...",
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "phone": "...",
  "profilePicture": "...",
  "role": "patient"
}
```

### `/patients/me` Response (Complete):

```json
{
  "id": "...",
  "userId": {
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "phone": "...",
    "profilePicture": "..."
  },
  "bloodType": "A+",
  "allergies": [...],
  "chronicConditions": [...],
  "medicalRecordNumber": "...",
  "dateOfBirth": "...",
  "gender": "...",
  "emergencyContact": {...},
  "totalAppointments": 0,
  ...
}
```

**Conclusion:** Use `/patients/me` for patients to get complete profile data! ✅
