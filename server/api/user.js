'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');


const User = require('../models/user');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/',
        config: {
            validate: {
                payload: {
                    sort: Joi.string().min(3).max(50).default('updatedAt'),
                    order: Joi.number().max(1).optional().default(-1),
                    limit: Joi.number().default(20),
                    skip: Joi.number().default(0),
                    searchText: Joi.string().max(50).default('')
                }
            },
            auth: {
                strategy: 'simple',
                scope: 'admin'
            }
        },
        handler: (request, reply) => {
            let _user = new User();

            const query = {
                condition: {
                    role: 'vendor',
                    isDeleted: false
                },
                options: {
                    skip: request.payload.skip,
                    limit: request.payload.limit,
                    sort: request.payload.sort,
                    order: request.payload.order
                },
                projection: {
                    password: false
                }
            };

            _user.getSortedAndPaginated(query.condition, query.projection, query.options).then((result) => {
                return reply(new Response('', result));
            }, (error) => { return reply(Boom.badImplementation()); });

        }
    });


    server.route({
        method: 'DELETE',
        path: '/',
        config: {
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: 'admin'
            }
        },
        handler: (request, reply) => {
            let _user = new User();

            const query = {
                isDeleted: true
            };

            _user.updateOne(request.payload._id, query, {}, (err, result) => {
                if (err) {
                    return reply(Boom.badImplementation());
                }
                return reply(new Response(Message.SUCCESS));
            });
        }
    });

    next();
};

exports.register = function(server, options, next) {
    server.dependency(['mongoose', 'auth'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'users'
};