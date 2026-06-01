/**
 * SPKI SHA-256 pins for *.supabase.co (project API + Auth).
 * Regenerate before certificate rotation: npm run ssl-pins:generate
 *
 * Captured 2026-06-01 from krasjpoxoilwtmovjuho.supabase.co chain:
 *  - leaf + intermediate + backup (keep ≥2 pins for Android pin-set rules).
 */
module.exports = {
  domains: ['supabase.co'],
  pins: [
    'p51goejPCgGH+Oog/MU2k6PObcEfTrrr73jUcuWJ7w0=',
    'kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=',
    'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=',
  ],
  /** Android pin-set expiration — update pins before this date. */
  expiration: '2027-06-01',
};
