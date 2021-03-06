'use strict';

const Config = require('./config');
const Confidence = require('confidence');

const criteria = {
    env: process.env.NODE_ENV
};

const manifest = {
    connections: [{
        port: Config.get('/port/api')
    }],
    registrations: [{
            plugin: 'hapi-auth-basic'
        },
        {
            plugin: './server/utils/auth'
        },
        {
            plugin: './server/utils/mongoose'
        },
        {
            plugin: './server/utils/mailer'
        },
        {
            plugin: './server/api/signup',
            options: {
                routes: { prefix: '/api' }
            }
        },
        {
            plugin: './server/api/login',
            options: {
                routes: { prefix: '/api' }
            }
        },
        {
            plugin: './server/api/user',
            options: {
                routes: { prefix: '/api/user' }
            }
        }
    ]
};

const store = new Confidence.Store(manifest);


exports.get = function(key) {
    return store.get(key, criteria);
};


exports.meta = function(key) {
    return store.meta(key, criteria);
};