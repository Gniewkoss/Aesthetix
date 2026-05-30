/**
 * Unit-test config for pure logic (scoring, validation, body-fat estimation, etc.).
 *
 * Uses ts-jest in a Node environment — deliberately scoped to framework-free modules
 * so the suite is fast and avoids React Native / react-test-renderer version coupling.
 * Component/integration tests (jest-expo + Testing Library) can be added under a
 * separate project once a dev build pipeline exists.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: [
    'src/lib/validation.ts',
    'src/lib/imageValidation.ts',
    'src/scoring/**/*.ts',
  ],
};
