import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeAuthError,
  isValidRecoveryEmail,
  normalizeRecoveryEmail,
  validateRecoveryPassword,
} from './authValidation';

test('normalizes recovery emails without altering the address', () => {
  assert.equal(normalizeRecoveryEmail('  SHOP.Owner@Example.COM  '), 'shop.owner@example.com');
  assert.equal(isValidRecoveryEmail('shop.owner@example.com'), true);
  assert.equal(isValidRecoveryEmail('not-an-email'), false);
  assert.equal(isValidRecoveryEmail('two@@example.com'), false);
});

test('requires a usable password length and rejects whitespace-only passwords', () => {
  assert.equal(validateRecoveryPassword('1234567'), 'Use at least 8 characters for your password.');
  assert.equal(validateRecoveryPassword('        '), 'Your password cannot contain only spaces.');
  assert.equal(validateRecoveryPassword('12345678'), null);
  assert.equal(validateRecoveryPassword('x'.repeat(73)), 'Use a password with no more than 72 characters.');
});

test('explains common Supabase identity and email-delivery configuration failures', () => {
  assert.match(
    describeAuthError(new Error('Email address not authorized')),
    /custom SMTP/i,
  );
  assert.match(
    describeAuthError(new Error('Manual linking is disabled')),
    /Enable manual identity linking/i,
  );
  assert.match(
    describeAuthError(new Error('Invalid login credentials')),
    /email or password is incorrect/i,
  );
});
