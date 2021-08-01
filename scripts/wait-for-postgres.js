const { Client } = require('pg');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

let attempts = 0;
const MAX_ATTEMPTS = 10;
const WAIT_INTERVAL = 1000;

function attemptToConnect() {
    const client = new Client({ user: config.username, ...config });
    client.connect((e) => {
        if (e) {
            if (attempts > MAX_ATTEMPTS) {
                console.error('Failed to connect to postgres!');
                process.exit();
            } else {
                attempts += 1;
                setTimeout(attemptToConnect, WAIT_INTERVAL);
            }
        } else {
            console.log('Connected to postgres!');
            process.exit();
        }
    });
}

if (config.dialect === 'sqlite') {
    console.log(`dialect is ${config.dialect} no connection check needed`);
} else {
    attemptToConnect();
}
