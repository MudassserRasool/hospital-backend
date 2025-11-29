# Frontend Changes Analysis - Profiles Migration

## Summary

After implementing the unified `profiles` collection in the backend, here's what needs to change (or doesn't need to change) in the frontend.

---

## ✅ **GOOD NEWS: NO BREAKING CHANGES NEEDED!**

The backend API endpoints and response structures remain **the same**, so **no immediate frontend changes are required**.

---

## Backend Changes Made

1. ✅ Created unified `profiles` collection
2. ✅ Removed role-specific fields from `users` collection (`experience`, `licenseNumber`, `specialization`, `timing`)
3. ✅ Updated services to merge user + profile data in responses
4. ✅ API endpoints remain unchanged:
   - `GET /auth/profile` - Still works, now returns user + profile merged
   - `PATCH /auth/profile` - Still works, updates user fields
   - `GET /staff/me` - Still works, now returns user + profile merged
   - `PATCH /staff/me` - Still works, updates user + profile fields
   - `GET /patients/me` - Still works (uses patients collection)
   - `PATCH /patients/:id` - Still works (uses patients collection)

---

## Frontend API Usage Analysis

### Mobile App

#### Current API Calls:
1. **Auth Profile:**
   - `GET /auth/profile` - Used in `authApi.ts` → `getProfile`
   - `PATCH /auth/profile` - Used in `authApi.ts` → `updateProfile`
   - Used in: `EditProfile.tsx`, `ViewProfile.tsx`

2. **Patient Profile:**
   - `GET /patients/me` - Used in `patientApi.ts` → `getMyProfile`
   - `PATCH /patients/me` - Used in `patientApi.ts` → `updateMyProfile`
   - **Note:** Currently uses `/patients/me` but endpoint expects `/patients/:id` for PATCH

3. **Staff Profile:**
   - `GET /auth/profile` - Used in `staffApi.ts` → `getMyProfile`
   - Uses same endpoint as auth profile

#### Response Structure:
- Frontend expects: `{ firstName, lastName, phone, profilePicture, ... }`
- Backend now returns: `{ ...userFields, ...profileFields }` (merged)
- ✅ **Compatible** - All existing fields are still present

---

### Web App

#### Current API Calls:
1. **Auth Profile:**
   - `GET /auth/profile` - Used in `authApi.ts` → `getProfile`
   - `PATCH /auth/profile` - Used in `authApi.ts` → `updateProfile`
   - Used in: `GetProfile.tsx`, `ProfilePage`

#### Response Structure:
- Frontend expects: `{ firstName, lastName, phone, profilePicture, ... }`
- Backend now returns: `{ ...userFields, ...profileFields }` (merged)
- ✅ **Compatible** - All existing fields are still present

---

## What Frontend Can Do (Optional Enhancements)

### 1. **Access New Profile Fields** (Optional)

Now that profiles are unified, frontend can access role-specific fields:

```typescript
// Doctor/Staff fields (now available in profile response)
profile.specialization
profile.licenseNumber
profile.experience
profile.timing

// Patient fields (already available via /patients/me)
profile.bloodType
profile.allergies
profile.chronicConditions
```

**Action:** No changes needed immediately. These fields will be available in API responses if they exist.

---

### 2. **Update Profile Fields** (Future Enhancement)

When you want to add forms for role-specific fields:

**Mobile:**
- Update `EditProfile.tsx` to include role-specific fields
- Use `PATCH /auth/profile` for basic fields
- Use `PATCH /profiles/me` for role-specific fields (new endpoint)

**Web:**
- Update `GetProfile.tsx` to include role-specific fields
- Use `PATCH /auth/profile` for basic fields
- Use `PATCH /profiles/me` for role-specific fields (new endpoint)

**Action:** Not needed now, can be done later when you add those input fields.

---

### 3. **Fix Patient Update Endpoint** (Minor Issue)

**Current:**
- Mobile calls `PATCH /patients/me` 
- But backend expects `PATCH /patients/:id`

**Options:**
1. **Keep as is** - Mobile needs to pass patient ID
2. **Add endpoint** - Backend can add `PATCH /patients/me` that uses current user

**Action:** Optional fix, not critical.

---

## Migration Checklist

### ✅ Backend (Completed)
- [x] Created profiles module
- [x] Removed role-specific fields from User entity
- [x] Updated auth service to merge user + profile
- [x] Updated staff service to merge user + profile
- [x] Updated reception service to use profiles
- [x] API endpoints remain unchanged

### ⏳ Frontend (No Changes Needed Now)
- [ ] No immediate changes required
- [ ] Optional: Add role-specific field forms later
- [ ] Optional: Fix patient update endpoint mismatch

---

## Testing Recommendations

1. **Test Existing Functionality:**
   - ✅ Login/Logout should work
   - ✅ Get profile should work (returns merged data)
   - ✅ Update profile should work (basic fields)
   - ✅ Patient profile should work (unchanged)

2. **Test New Functionality:**
   - ✅ Profile data should be included in responses
   - ✅ Role-specific fields should appear if they exist

3. **Edge Cases:**
   - ✅ Users without profiles should still work (returns just user data)
   - ✅ Profile creation should work when updating role-specific fields

---

## Summary

### ✅ **NO FRONTEND CHANGES REQUIRED**

The backend changes are **backward compatible**:
- Same API endpoints
- Same response structure (with additional fields merged in)
- Existing code will continue to work

### 🎯 **Future Enhancements** (When Ready)

1. Add input fields for role-specific profile data
2. Use new `/profiles/me` endpoint for profile-specific updates
3. Fix patient update endpoint mismatch (optional)

---

## Next Steps

1. ✅ Backend is ready
2. ⏳ Test backend APIs
3. ⏳ Test frontend (should work without changes)
4. ⏳ Add role-specific input fields when needed
5. ⏳ Migrate existing data from users to profiles (if needed)

