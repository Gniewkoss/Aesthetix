import { validateEmail, validatePassword, validateName, PASSWORD_MIN_LENGTH } from '../validation';

describe('validateEmail', () => {
  it('accepts a normal address', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
  });
  it('trims surrounding whitespace', () => {
    expect(validateEmail('  user@example.com  ').valid).toBe(true);
  });
  it.each(['', 'no-at', 'a@b', 'a@b.', '@example.com', 'user@.com'])(
    'rejects malformed address %p',
    (bad) => {
      expect(validateEmail(bad).valid).toBe(false);
    },
  );
  it('rejects an absurdly long address', () => {
    expect(validateEmail('a'.repeat(250) + '@example.com').valid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts a compliant password', () => {
    expect(validatePassword('abcd1234').valid).toBe(true);
  });
  it(`rejects passwords shorter than ${PASSWORD_MIN_LENGTH}`, () => {
    expect(validatePassword('ab1').valid).toBe(false);
  });
  it('requires both a letter and a number', () => {
    expect(validatePassword('12345678').valid).toBe(false);
    expect(validatePassword('abcdefgh').valid).toBe(false);
  });
  it('rejects passwords longer than 72 bytes (bcrypt limit)', () => {
    expect(validatePassword('a1'.repeat(40)).valid).toBe(false);
  });
});

describe('validateName', () => {
  it('accepts letters, spaces, hyphens and apostrophes', () => {
    expect(validateName("Anne-Marie O'Neil").valid).toBe(true);
  });
  it('rejects empty and single-character names', () => {
    expect(validateName('').valid).toBe(false);
    expect(validateName('A').valid).toBe(false);
  });
  it('rejects names with injection-y characters', () => {
    expect(validateName('Robert<script>').valid).toBe(false);
    expect(validateName("'; DROP TABLE users;--").valid).toBe(false);
  });
});
