export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  RECEPTIONIST = 'receptionist',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  STAFF = 'staff',
  PATIENT = 'patient',
}

const ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.OWNER,
  UserRole.RECEPTIONIST,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.STAFF,
  UserRole.PATIENT,
];

export const ROLES_KEY = 'roles';

export default ROLES;
