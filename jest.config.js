module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*-test.js'],
    globalSetup: '<rootDir>/tests/globalSetup.js',
    globalTeardown: '<rootDir>/tests/globalTeardown.js',
    collectCoverageFrom: [
        '**/*.{js,jsx}',
        '!**/coverage/**',
        '!**/node_modules/**',
        '!*.config.js',
        '!**/scripts/*.js',
        '!**/migrations/*.js',
        '!**/seeders/*.js',
        '!**/tests/*.js',
    ],
};
