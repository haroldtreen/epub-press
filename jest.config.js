module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*-test.js'],
    collectCoverageFrom: [
        '**/*.{js,jsx}',
        '!**/coverage/**',
        '!**/node_modules/**',
        '!*.config.js',
        '!**/scripts/*.js',
        '!**/migrations/*.js',
        '!**/seeders/*.js',
    ],
};
