'use strict';

const Boom = require('boom');
const Fs = require('fs');


const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};


internals.applyRoutes = function(server, next) {
    server.route({
        method: 'POST',
        path: '/',
        config: {
            payload: {
                output: 'file',
                parse: true,
                allow: 'multipart/form-data'
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
        },
        handler: (request, reply) => {
            var data = request.payload;
            return reply('success');
        }
    });

    next();
};


exports.register = function(server, options, next) {
    server.dependency(['mongoose', 'auth'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'uploads'
};