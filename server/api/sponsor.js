'use strict';

const Boom = require('boom');
const Joi = require('joi');
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
            }
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
            }
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

};