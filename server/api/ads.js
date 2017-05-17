'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
Joi.objectId = require('joi-objectid')(Joi);


const Ads = require('../models/ads');
const Account = require('../models/account');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};

/**
 * @param  {} server
 * @param  {} next
 */


internals.preWare = {
    validateBalance: {
        assign: 'checkBalance',
        method: function(request, reply) {
            let user = request.auth.credentials;
            if (user.role === 'admin') {
                return reply();
            } else {
                let _account = new Account();
                _account.getOne({ owner: user._id, isDeleted: false }, 'balance', (err, balance) => {
                    if (err) {
                        return reply(err);
                    }
                    if (!balance) {
                        return reply(Boom.notAcceptable(Message.INSUFFICIENT));
                    }
                    let accountInformation = balance.toJSON();
                    if (accountInformation.balance && accountInformation.balance >= request.payload.dalyBudget) {
                        return reply(accountInformation);
                    }
                    return reply(Boom.notAcceptable(Message.INSUFFICIENT));
                });
            }
        }
    }
};

internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/',
        config: {
            validate: {
                payload: {
                    type: Joi.string().valid('image', 'video').required(),
                    url: Joi.string().required().uri(),
                    duration: Joi.number().max(30).positive(0).required(),
                    biddingAmount: Joi.number().positive().required(),
                    dalyBudget: Joi.number().positive().required(),
                    monthlyBudget: Joi.number().positive().required(),
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
                scope: ['admin', 'vendor']
            },
            pre: [internals.preWare.validateBalance],
            tags: ['api', 'ads'],
            description: 'Create Advertisement'
        },
        handler: (request, reply) => {

            const userId = request.auth.credentials._id.toString();

            let document = Object.assign({ creator: userId }, request.payload);

            document.location = [request.payload.location.longitude, request.payload.location.latitude];

            let _ads = new Ads();
            _ads.create(document, (err, docs) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS, docs.toJSON()));
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
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'ads'],
            description: 'Get Advertisement detail for admin'

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
        method: 'GET',
        path: '/admin/',
        config: {
            validate: {
                query: {
                    sort: Joi.string().min(3).max(50).default('updatedAt'),
                    order: Joi.number().max(1).optional().default(-1),
                    limit: Joi.number().default(20),
                    skip: Joi.number().default(0),
                    isApproved: Joi.bool().optional().default(true),
                    isRejected: Joi.bool().optional().default(false),
                    isActive: Joi.bool().optional().default(true)
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'ads'],
            description: 'Advertisement listing admin'

        },
        handler: (request, reply) => {
            const user = request.auth.credentials;

            let query = {
                condition: {
                    isDeleted: false,
                    isApproved: request.query.isApproved,
                    isRejected: request.query.isRejected,
                    isActive: request.query.isActive,
                },
                options: {
                    skip: request.query.skip,
                    limit: request.query.limit,
                    sort: request.query.sort,
                    order: request.query.order,
                    populate: [{
                        path: 'creator',
                        select: 'email firstName lastName'
                    }]
                },
                projection: {}
            };

            if (user.role !== 'admin') {
                query.condition.creator = user._id.toString();
            }

            let _ads = new Ads();
            _ads.getSortedAndPaginated(query.condition, query.projection, query.options).then((result) => {
                return reply(new Response('', result));
            }, (error) => { return reply(Boom.badImplementation()); });
        }
    });


    server.route({
        method: 'PUT',
        path: '/{_id}',
        config: {
            validate: {
                payload: {
                    type: Joi.string().valid('image', 'video').required(),
                    url: Joi.string().required().uri(),
                    duration: Joi.number().max(30).positive(0).required(),
                    biddingAmount: Joi.number().positive().required(),
                    dalyBudget: Joi.number().positive().required(),
                    monthlyBudget: Joi.number().positive().required(),
                    locationName: Joi.string().optional(),
                    radius: Joi.number().positive().optional(),
                    location: Joi.object().keys({
                        latitude: Joi.number().required(),
                        longitude: Joi.number().required()
                    }).required()
                },
                params: { _id: Joi.objectId() }

            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            pre: [internals.preWare.validateBalance],
            tags: ['api', 'ads'],
            description: 'Update Advertisement'

        },
        handler: (request, reply) => {


            let document = Object.assign({}, request.payload);


            document.location = [request.payload.location.longitude, request.payload.location.latitude];

            let _ads = new Ads();
            _ads.updateOne(request.params._id, document, {}, (err, doc) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS, doc.toJSON()));
            });

        }
    });


    server.route({
        method: 'DELETE',
        path: '/{_id}',
        config: {
            validate: {
                params: { _id: Joi.objectId() }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'ads'],
            description: 'Delete Advertisement'

        },
        handler: (request, reply) => {
            let _ad = new Ads();

            const query = {
                isDeleted: true
            };

            _ad.updateOne(request.params._id, query, {}, (err, result) => {
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
                    field: Joi.string().required().valid('isRejected', 'isActive', 'isApproved')
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'ads'],
            description: 'Change Advertisement Status'

        },
        handler: (request, reply) => {
            let _ad = new Ads();

            const query = {};

            query[request.payload.field] = request.payload.status;

            _ad.updateOne(request.payload._id, query, {}, (err, doc) => {
                if (err) {
                    return reply(Boom.badImplementation());
                }
                return reply(new Response(Message.SUCCESS, doc.toJSON()));
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
    name: 'ads'
};