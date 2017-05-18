'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const ObjectId = require('mongoose').Types.ObjectId;

const User = require('../models/user');
const Account = require('../models/account');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'GET',
        path: '/',
        config: {
            validate: {
                params: {
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
            },
            description: 'Lists vendors for Admin',
            tags: ['api', 'user']
        },
        handler: (request, reply) => {
            let _user = new User();

            const query = {
                condition: {
                    role: 'vendor',
                    isDeleted: false
                },
                options: {
                    skip: request.params.skip,
                    limit: request.params.limit,
                    sort: request.params.sort,
                    order: request.params.order
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
        path: '/{_id}',
        config: {
            validate: {
                params: {
                    _id: Joi.string().required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            tags: ['api', 'user'],
            description: 'Delete vendors'

        },
        handler: (request, reply) => {
            let _user = new User();

            const query = {
                isDeleted: true
            };

            _user.updateOne(request.params._id, query, {}, (err, result) => {
                if (err) {
                    return reply(Boom.badImplementation());
                }
                return reply(new Response(Message.SUCCESS));
            });
        }
    });

    server.route({
        method: 'PATCH',
        path: '/status',
        config: {
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    status: Joi.bool().required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'user'],
            description: 'Change Vendor Status'

        },
        handler: (request, reply) => {
            let _user = new User();

            const query = {
                isActive: request.payload.status
            };

            _user.updateOne(request.payload._id, query, {}, (err, result) => {
                if (err) {
                    return reply(Boom.badImplementation());
                }
                return reply(new Response(Message.SUCCESS));
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/{_id}',
        config: {
            validate: {
                params: { _id: Joi.objectId() }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'user'],
            description: 'Get User detail'

        },
        handler: (request, reply) => {
            let query = [];
            query.push({
                '$match': {
                    '_id': ObjectId(request.params._id),
                    isDeleted: false
                }
            });
            query.push({
                '$lookup': {
                    from: 'accounts',
                    localField: '_id',
                    foreignField: 'owner',
                    as: 'user_account'
                }
            });
            query.push({
                $unwind: {
                    'path': '$user_account',
                    'preserveNullAndEmptyArrays': true
                }
            });

            let user = new User();
            user.model.aggregate(query, (err, doc) => {
                if (err) {
                    return reply(err);
                }
                if (!doc || doc.length == 0) {
                    return reply(Boom.notFound());
                }
                return reply(new Response('', doc[0]));
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