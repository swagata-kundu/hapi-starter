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
        method: 'PUT',
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
            tags: ['api', 'ads']
        },
        handler: (request, reply) => {

            const userId = request.auth.credentials._id.toString();

            let document = Object.assign({ creator: userId }, request.payload);

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
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'ads']
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
                    searchText: Joi.string().max(50).default('')
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'ads']
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
                    order: request.payload.order,
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


    next();

};


exports.register = function(server, options, next) {
    server.dependency(['mongoose'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'ads'
};