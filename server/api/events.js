'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const _ = require('lodash');

Joi.objectId = require('joi-objectid')(Joi);


const Events = require('../models/event');
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
                    title: Joi.string().required(),
                    description: Joi.string().required(),
                    locationName: Joi.string().optional(),
                    location: Joi.object().keys({
                        latitude: Joi.number().required(),
                        longitude: Joi.number().required()
                    }).required(),
                    images: Joi.array().min(1).max(8).items(Joi.object().keys({
                        type: Joi.string().valid('image', 'video').required(),
                        url: Joi.string().required().uri(),
                    })).required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'events'],
            description: 'Create Event'
        },
        handler: (request, reply) => {


            let document = Object.assign({}, request.payload);

            document.location = [request.payload.location.longitude, request.payload.location.latitude];

            let _event = new Events();
            _event.create(document, (err, doc) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS), doc.toJSON());
            });

        }
    });

    server.route({
        method: 'PUT',
        path: '/{_id}',
        config: {
            validate: {
                payload: {
                    title: Joi.string().required(),
                    description: Joi.string().required(),
                    locationName: Joi.string().optional(),
                    location: Joi.object().keys({
                        latitude: Joi.number().required(),
                        longitude: Joi.number().required()
                    }).required(),
                    images: Joi.array().min(1).max(8).items(Joi.object().keys({
                        type: Joi.string().valid('image', 'video').required(),
                        url: Joi.string().required().uri(),
                    })).required()
                },
                params: { _id: Joi.objectId() }

            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'events'],
            description: 'Update Event',
            handler: (request, reply) => {

                const document = {
                    title: request.payload.title,
                    description: request.payload.description,
                    locationName: request.payload.locationName,
                    location: [request.payload.location.longitude, request.payload.location.latitude],
                    images: request.payload.images
                };

                let query = {
                    $set: document
                };

                let _event = new Events();

                _event.updateOne(request.params._id, query, {
                    multi: true
                }, (err, doc) => {
                    if (err) {
                        return reply(err);
                    }
                    return reply(new Response(Message.SUCCESS), doc.toJSON());
                });
            }
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
                scope: ['admin']
            },
            tags: ['api', 'events'],
            description: 'Get Event detail for admin'

        },
        handler: (request, reply) => {
            const eventId = request.params._id;
            let _events = new Events();
            _events.getOneById(eventId).then((doc) => {
                if (!doc) {
                    return reply(Boom.notFound(Message.CONTENT_NOT_FOUND));
                }
                return reply(new Response('', doc.toJSON()));
            }, (error) => reply(error));

        }
    });

    server.route({
        method: 'GET',
        path: '/admin/',
        config: {
            validate: {
                params: {
                    sort: Joi.string().min(3).max(50).default('updatedAt'),
                    order: Joi.number().max(1).optional().default(-1),
                    limit: Joi.number().default(20),
                    skip: Joi.number().default(0),
                    isActive: Joi.bool().optional().default(true)
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'events'],
            description: 'Event listing admin'

        },
        handler: (request, reply) => {

            let query = {
                condition: {
                    isDeleted: false,
                    isActive: request.params.isActive,
                },
                options: {
                    skip: request.params.skip,
                    limit: request.params.limit,
                    sort: request.params.sort,
                    order: request.params.order
                },
                projection: {}
            };

            let _events = new Events();
            _events.getSortedAndPaginated(query.condition, query.projection, query.options).then((result) => {
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
                scope: ['admin']
            },
            tags: ['api', 'events'],
            description: 'Delete Events'

        },
        handler: (request, reply) => {
            let _events = new Events();

            const query = {
                isDeleted: true
            };

            _events.updateOne(request.params._id, query, {}, (err, result) => {
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
                    status: Joi.bool().required(),
                    field: Joi.string().required().valid('isActive')
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'events'],
            description: 'Change Event Status'

        },
        handler: (request, reply) => {
            let _events = new Events();

            const query = {};

            query[request.payload.field] = request.payload.status;

            _events.updateOne(request.payload._id, query, {}, (err, result) => {
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
    name: 'events'
};