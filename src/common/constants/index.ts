// Global constants
const APP_NAME = 'Hospital Management System';
const API_VERSION = 'v1';
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const GENDER_TYPES = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

const GENDER_TYPES_ARRAY = [
  GENDER_TYPES.MALE,
  GENDER_TYPES.FEMALE,
  GENDER_TYPES.OTHER,
];

const AVATAR_UTL = (NUMBER: number) =>
  `https://i.pravatar.cc/150?img=${NUMBER}`;

export {
  API_VERSION,
  APP_NAME,
  AVATAR_UTL,
  DEFAULT_PAGE_SIZE,
  GENDER_TYPES,
  GENDER_TYPES_ARRAY,
  MAX_PAGE_SIZE,
};
