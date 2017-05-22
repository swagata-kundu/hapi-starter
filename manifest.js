'use strict';

const Config = require('./config');
const Confidence = require('confidence');
const SwaggerOption = require('./swagger-option');

const criteria = {
    env: process.env.NODE_ENV
};
const goodOptions = {
    ops: {
        interval: 1000 * 10
    },
    reporters: {
        myConsoleReporter: [{
            module: 'good-console',
            args: [{ log: '*', response: '*' }]
        }, 'stdout']
    }
};


const manifest = {
    connections: [{
        port: Config.get('/port/api'),
        labels: Config.get('/labels/api')
    }],
    registrations: [{ plugin: 'hapi-auth-basic' },
        { plugin: 'vision' },
        { plugin: 'inert' },
        { plugin: 'blipp' },
        {
            plugin: {
                register: 'good',
                options: goodOptions
            }
        },
        {
            plugin: {
                register: 'hapi-swagger',
                options: SwaggerOption
            }
        },
        {
            plugin: './server/utils/socket'
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
        },
        {
            plugin: './server/api/ads',
            options: {
                routes: { prefix: '/api/ads' }
            }
        },
        {
            plugin: './server/api/defaultAds',
            options: {
                routes: { prefix: '/api/ads/default' }
            }
        },
        {
            plugin: './server/api/sponsor',
            options: {
                routes: { prefix: '/api/sponsor' }
            }
        },
        {
            plugin: './server/api/upload',
            options: {
                routes: { prefix: '/api/upload' }
            }
        },
        {
            plugin: './server/api/events',
            options: {
                routes: { prefix: '/api/events' }
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