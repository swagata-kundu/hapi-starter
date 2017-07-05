'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
Joi.objectId = require('joi-objectid')(Joi);


const Category = require('../models/category');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};

/**
 * @param  {} server
 * @param  {} next
 */

internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/',
        config: {
            validate: {
                payload: {
                    name: Joi.string().required(),
                    imgUrl: Joi.string().uri().required(),
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin']
            },
            tags: ['api', 'category'],
            description: 'Create new category'
        },
        handler: (request, reply) => {


            let document = Object.assign({}, request.payload);

            let _category = new Category();

            _category.create(document, (err, doc) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS, doc.toJSON()));
            });

        }
    });


    server.route({
        method: 'GET',
        path: '/',
        config: {
            tags: ['api', 'category'],
            description: 'Get category list'
        },
        handler: (request, reply) => {



            let _category = new Category();
            let condition = { isDeleted: false };

            _category.findAndPopulate(condition, [])
                .then((doc) => {
                    if (!doc) {
                        return reply(Boom.notFound(Message.CONTENT_NOT_FOUND));
                    }
                    return reply(new Response('', doc));
                })
                .catch((error) => reply(error));

        }
    });

    next();
};


exports.register = function(server, options, next) {
    server.dependency(['auth', 'mongoose'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'category'
};