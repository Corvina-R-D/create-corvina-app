module.exports = {
  verbose: true,
  coverageDirectory: './coverage',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.(spec|test)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/*.ts', '!<rootDir>/src/controllers/*.ts', '!<rootDir>/src/routes/**/*'],
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 100,
      functions: 70,
      lines: 70,
    },
  },
};
