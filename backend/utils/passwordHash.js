const bcrypt = require('bcryptjs');

/**
 * HASH PASSWORD
 * Mã hóa password trước khi lưu vào database
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
};

/**
 * COMPARE PASSWORD
 * So sánh password người dùng nhập với password đã mã hóa trong DB
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing password: ' + error.message);
  }
};

/**
 * VALIDATE PASSWORD STRENGTH
 * Kiểm tra độ mạnh của password
 */
const validatePasswordStrength = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password phải có ít nhất ${minLength} ký tự`);
  }

  // Tuỳ chọn: Bật nếu muốn password phức tạp hơn
  // if (!hasUpperCase) errors.push('Password phải có ít nhất 1 chữ HOA');
  // if (!hasLowerCase) errors.push('Password phải có ít nhất 1 chữ thường');
  // if (!hasNumbers) errors.push('Password phải có ít nhất 1 số');
  // if (!hasSpecialChar) errors.push('Password phải có ít nhất 1 ký tự đặc biệt');

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * CALCULATE PASSWORD STRENGTH
 * Tính độ mạnh của password (weak, medium, strong)
 */
const calculatePasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  calculatePasswordStrength
};
