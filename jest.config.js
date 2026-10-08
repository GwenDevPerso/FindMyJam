// Component tests only (*.test.tsx). Unit tests (*.test.ts) run with Vitest, see vitest.config.ts.
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // The "react-native" export condition points at untranspiled .mjs; use the CommonJS build.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
