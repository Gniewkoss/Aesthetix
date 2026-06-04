/**
 * One-off: generates Apple OAuth client secret (JWT) for Supabase.
 * Usage (from repo root):
 *   node scripts/generate-apple-jwt.js /path/to/AuthKey_XXX.p8
 *
 * Do not commit .p8 files. Add output only to Supabase Dashboard.
 */
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const TEAM_ID = 'ZN62ZGRCKQ';
const KEY_ID = 'ZR8LPU5T3J';
const SERVICES_ID = 'ai.aesthetix.auth';

const keyPath =
  process.argv[2] || path.join(process.env.HOME || '', 'Downloads', 'AuthKey_ZR8LPU5T3J.p8');

const privateKey = fs.readFileSync(keyPath, 'utf8');
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: TEAM_ID,
  subject: SERVICES_ID,
  keyid: KEY_ID,
});

console.log(token);
