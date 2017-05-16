'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
Joi.objectId = require('joi-objectid')(Joi);


const Ads = require('../models/defaultAds');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};

/**
 * @param  {} server
 * @param  {} next
 */


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'PUT',
        path: '/',
        config: {
            validate: {
                payload: {
                    type: Joi.string().valid('image', 'video').required(),
                    url: Joi.string().required().uri(),
                    duration: Joi.number().max(30).positive(0).required(),
                    locationName: Joi.string().optional(),
                    radius: Joi.number().positive().optional(),
                    location: Joi.object().keys({
                        latitude: Joi.number().required(),
                        longitude: Joi.number().required()
                    }).required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'ads', 'default'],
            description: 'Create Default Advertisement'
        },
        handler: (request, reply) => {


            let document = Object.assign({}, request.payload);

            document.location = [request.payload.location.longitude, request.payload.location.latitude];

            let _ads = new Ads();
            _ads.create(document, (err) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS));
            });

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
            tags: ['api', 'ads', 'default'],
            description: 'Get Default Advertisement detail for admin'

        },
        handler: (request, reply) => {
            const adId = request.params._id;
            let ads = new Ads();
            ads.getOneById(adId).then((doc) => {
                if (!doc) {
                    return reply(Boom.notFound(Message.CONTENT_NOT_FOUND));
                }
                return reply(new Response('', doc.toJSON()));
            }, (error) => reply(error));

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
                    isActive: Joi.bool().optional().default(true)
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'ads', 'default'],
            description: 'Default Advertisement listing admin'

        },
        handler: (request, reply) => {

            let query = {
                condition: {
                    isDeleted: false,
                    isActive: request.payload.isActive,
                },
                options: {
                    skip: request.payload.skip,
                    limit: request.payload.limit,
                    sort: request.payload.sort,
                    order: request.payload.order
                },
                projection: {}
            };

            let _ads = new Ads();
            _ads.getSortedAndPaginated(query.condition, query.projection, query.options).then((result) => {
                return reply(new Response('', result));
            }, (error) => { return reply(Boom.badImplementation()); });
        }
    });


    server.route({
        method: 'PATCH',
        path: '/',
        config: {
            validate: {
                payload: {
                    _id: Joi.objectId(),
                    type: Joi.string().valid('image', 'video').required(),
                    url: Joi.string().required().uri(),
                    duration: Joi.number().max(30).positive(0).required(),
                    locationName: Joi.string().optional(),
                    radius: Joi.number().positive().optional(),
                    location: Joi.object().keys({
                        latitude: Joi.number().required(),
                        longitude: Joi.number().required()
                    }).required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'ads', 'default'],
            description: 'Update default Advertisement'

        },
        handler: (request, reply) => {


            let document = Object.assign({}, request.payload);

            delete document._id;

            document.location = [request.payload.location.longitude, request.payload.location.latitude];

            let _ads = new Ads();
            _ads.updateOne(request.payload._id, document, {}, (err) => {
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
            tags: ['api', 'ads', 'default'],
            description: 'Delete default Advertisement'

        },
        handler: (request, reply) => {
            let _ad = new Ads();

            const query = {
                isDeleted: true
            };

            _ad.updateOne(request.payload._id, query, {}, (err, result) => {
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
            tags: ['api', 'ads', 'default'],
            description: 'Change default Advertisement Status'

        },
        handler: (request, reply) => {
            let _ad = new Ads();

            const query = {};

            query[request.payload.field] = request.payload.status;

            _ad.updateOne(request.payload._id, query, {}, (err, result) => {
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
    name: 'default ads'
};