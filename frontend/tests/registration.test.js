import test from 'node:test';
import assert from 'node:assert/strict';
import { passwordError, registrationPayload, authErrorMessage } from '../src/utils/registration.js';
import { validPhone } from '../src/utils/helpers.js';

test('signup normalizes accepted mobile phone formats before sending them', () => {
  for (const phone of ['077-123-4567', '077 123 4567', '+94 77-123-4567']) {
    assert.equal(validPhone(phone), true);
    const payload = registrationPayload({
      name: ' Test Customer ',
      email: ' CUSTOMER@example.test ',
      phone,
      password: 'Customer123!',
      confirm: 'Customer123!',
      role: 'customer',
    });
    assert.match(payload.phone, /^(?:0|\+94)7\d{8}$/);
    assert.equal(payload.name, 'Test Customer');
    assert.equal(payload.email, 'customer@example.test');
    assert.equal(payload.confirmPassword, payload.password);
    assert.equal(payload.confirm, undefined);
  }
  assert.equal(validPhone('0112345678'), false);
});

test('password feedback enforces every server requirement including byte length', () => {
  for (const password of [
    'short',
    'customer123!',
    'CUSTOMER123!',
    'Customer!!!!',
    'Customer1234',
    'Aa1!' + 'é'.repeat(35),
  ]) {
    assert.ok(passwordError(password));
  }
  assert.equal(passwordError('Customer123!'), '');
  assert.equal(passwordError('Aa1!' + 'x'.repeat(68)), '');
});

test('signup displays actionable server field errors and preserves nonvalidation errors', () => {
  assert.equal(
    authErrorMessage({
      message: 'Validation failed.',
      fields: [{ field: 'password', message: 'Include an uppercase letter.' }],
    }),
    'Password: Include an uppercase letter.',
  );
  assert.equal(
    authErrorMessage(new Error('The server could not be reached.')),
    'The server could not be reached.',
  );
});
