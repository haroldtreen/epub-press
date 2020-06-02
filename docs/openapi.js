const packageJson = require('../package.json');

module.exports = {
    openapi: '3.0.0',
    info: {
        title: packageJson.title,
        description: packageJson.description,
        version: packageJson.version,
    },
    apis: ['./routes/api/version.js'],
    servers: [
        {
            url: 'http://localhost:3000/api/v1',
            description: 'local development server'
        }
    ]
};

