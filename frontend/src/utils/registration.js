export const normalizePhone = (value) => String(value).replace(/[\s-]/g, '');

export function passwordError(password) {
  if (password.length < 10) return 'Use at least 10 characters for your password.';
  if (password.length > 72 || new TextEncoder().encode(password).length > 72)
    return 'Password must fit within 72 UTF-8 bytes. Try a shorter password.';
  if (!/[a-z]/.test(password)) return 'Include a lowercase letter in your password.';
  if (!/[A-Z]/.test(password)) return 'Include an uppercase letter in your password.';
  if (!/\d/.test(password)) return 'Include a number in your password.';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Include a symbol in your password.';
  return '';
}

export function registrationPayload(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: normalizePhone(form.phone),
    password: form.password,
    confirmPassword: form.confirm,
    role: form.role,
  };
}

export function authErrorMessage(error) {
  const labels = {
    name: 'Full name',
    email: 'Email address',
    phone: 'Phone number',
    password: 'Password',
    confirmPassword: 'Confirm password',
    role: 'Account type',
  };
  const messages = (error.fields || [])
    .filter((issue) => typeof issue.message === 'string')
    .map((issue) => `${labels[issue.field] || issue.field}: ${issue.message}`);
  return messages.length ? [...new Set(messages)].join(' ') : error.message;
}
