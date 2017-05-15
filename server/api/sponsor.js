'use strict';

const Boom = require('boom');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const Async = require('async');


const Sponsor = require('../models/sponsors');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};

internals.applyRoutes = function(server, next) {

    server.route({
        method: 'PUT',
        path: '/',
        config: {
            validate: {
                payload: {
                    name: Joi.string().optional().default(''),
                    url: Joi.string().required().uri(),
                    sortOrder: Joi.number().max(6).positive().required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'sponsors'],
            description: 'Create Sponsor'

        },
        handler: (request, reply) => {


            let document = Object.assign({}, request.payload);


            let _sponsor = new Sponsor();

            _sponsor.create(document, (err) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS));
            });

        }
    });


    server.route({
        method: 'POST',
        path: '/admin/',
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
                scope: ['admin']
            },
            tags: ['api', 'sponsors'],
            description: 'Sponsor listing admin'

        },
        handler: (request, reply) => {
            const user = request.auth.credentials;

            let query = {
                condition: {
                    isDeleted: false
                },
                options: {
                    skip: request.payload.skip,
                    limit: request.payload.limit,
                    sort: request.payload.sort,
                    order: request.payload.order
                },
                projection: {}
            };


            let _sponsor = new Sponsor();
            _sponsor.getSortedAndPaginated(query.condition, query.projection, query.options).then((result) => {
                return reply(new Response('', result));
            }, (error) => { return reply(Boom.badImplementation()); });
        }
    });


    server.route({
        method: 'GET',
        path: '/admin/{_id}',
        config: {
            validate: {
                params: { _id: Joi.objectId() }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'sponsors'],
            description: 'Get Sponsor detail for admin'

        },
        handler: (request, reply) => {
            const sponsorId = request.params._id;
            let _sponsor = new Sponsor();
            _sponsor.getOneById(sponsorId).then((doc) => {
                if (!doc) {
                    return reply(Boom.notFound(Message.CONTENT_NOT_FOUND));
                }
                return reply(new Response('', doc.toJSON()));
            }, (error) => reply(error));

        }
    });


    server.route({
        method: 'PATCH',
        path: '/',
        config: {
            validate: {
                payload: {
                    _id: Joi.objectId(),
                    name: Joi.string().optional().default(''),
                    url: Joi.string().required().uri(),
                    sortOrder: Joi.number().max(6).positive().required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'sponsors'],
            description: 'Update Sponsor'

        },
        handler: (request, reply) => {


            let document = Object.assign({}, request.payload);

            delete document._id;



            let _sponsor = new Sponsor();

            _sponsor.updateOne(request.payload._id, document, {}, (err) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS));
            });

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
                scope: ['admin']
            },
            tags: ['api', 'sponsors'],
            description: 'Delete Sponsor'

        },
        handler: (request, reply) => {
            let _sponsor = new Sponsor();

            const query = {
                isDeleted: true
            };

            _sponsor.updateOne(request.payload._id, query, {}, (err, result) => {
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
            tags: ['api', 'sponsors'],
            description: 'Change Sponsor Status'

        },
        handler: (request, reply) => {
            let _sponsor = new Sponsor();

            const query = {
                isActive: request.payload.status
            };

            _sponsor.updateOne(request.payload._id, query, {}, (err, result) => {
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
    server.dependency(['auth', 'mongoose'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'sponsor'
};