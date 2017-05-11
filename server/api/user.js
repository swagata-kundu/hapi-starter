'use strict';

const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const Async = require('async');

const internals = {};


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/',
        config: {
            validate: {
                payload: {
                    sortBy: Joi.string().min(3).max(50).optional(),
                    sortOrder: Joi.string().length(3).optional()
                }
            },
            auth: {
                strategy: 'simple',
                scope: 'vendor'
            },

            pre: []
        },
        handler: function(request, reply) {
            reply('Hello');
        }
    });

    next();
};

exports.register = function(server, options, next) {
    server.dependency(['mongoose'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'users'
};