import { ObjectId } from 'mongodb';

// Check valid non-empty string
export const checkString = (strVal, varName = 'Input') => {
  if (strVal === undefined || strVal === null) {
    throw new Error(`You must provide a ${varName}.`);
  }
  if (typeof strVal !== 'string') {
    throw new Error(`${varName} must be a string.`);
  }
  strVal = strVal.trim();
  if (strVal.length === 0) {
    throw new Error(`${varName} cannot be an empty string or just spaces.`);
  }
  return strVal;
};

// Check valid MongoDB ObjectId string
export const checkId = (id, varName = 'ID') => {
  id = checkString(id, varName);
  if (!ObjectId.isValid(id)) {
    throw new Error(`${varName} is not a valid ObjectId format.`);
  }
  return id;
};

// Check valid email format
export const checkEmail = (email) => {
  email = checkString(email, 'Email address').toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format.');
  }
  return email;
};

// Check valid number with optional min/max bounds
export const checkNumber = (val, varName = 'Number', min, max) => {
  if (val === undefined || val === null || val === '') {
    throw new Error(`You must provide a valid ${varName}.`);
  }
  const num = Number(val);
  if (isNaN(num)) {
    throw new Error(`${varName} must be a valid number.`);
  }
  if (min !== undefined && num < min) {
    throw new Error(`${varName} must be at least ${min}.`);
  }
  if (max !== undefined && num > max) {
    throw new Error(`${varName} cannot exceed ${max}.`);
  }
  return num;
};

// Check valid date string (YYYY-MM-DD format)
export const checkDate = (dateStr, varName = 'Date') => {
  dateStr = checkString(dateStr, varName);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error(`${varName} must be in YYYY-MM-DD format.`);
  }
  const timestamp = Date.parse(dateStr);
  if (isNaN(timestamp)) {
    throw new Error(`${varName} is not a valid calendar date.`);
  }
  return dateStr;
};

// Normalize a caught validation error (data layer throws strings, helpers above throw Errors) into a message string.
export const errorMessage = (e, fallback = 'Invalid request.') =>
  typeof e === 'string' ? e : (e && e.message) || fallback;

export default {
  checkString,
  checkId,
  checkEmail,
  checkNumber,
  checkDate,
  errorMessage
};