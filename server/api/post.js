'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const _ = require('lodash');

Joi.objectId = require('joi-objectid')(Joi);


const Post = require('../models/post');
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
                    imgUrl: Joi.string().uri().required(),
                    category: Joi.objectId().required().description('Must be a mongoose object id')
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['vendor', 'admin']
            },
            tags: ['api', 'post'],
            description: 'Create Post'
        },
        handler: (request, reply) => {


            const userId = request.auth.credentials._id.toString();

            let document = Object.assign({ creator: userId }, request.payload);

            let _post = new Post();

            _post.create(document, (err, doc) => {
                if (err) {
                    return reply(err);
                }
                return reply(new Response(Message.SUCCESS, doc.toJSON()));
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
                scope: ['vendor', 'admin']
            },
            tags: ['api', 'post'],
            description: 'Get Post detail'

        },
        handler: (request, reply) => {
            const postId = request.params._id;
            let _post = new Post();
            _post.findOneAndPopulate({ _id: postId }, [
                { path: 'creator', select: 'firstName lastName email' },
                { path: 'category', select: 'name' },
                { path: 'comments.commentBy', select: 'firstName' }

            ]).then((doc) => {
                if (!doc) {
                    return reply(Boom.notFound(Message.CONTENT_NOT_FOUND));
                }
                return reply(new Response('', doc.toJSON()));
            }).catch((error) => reply(error));

        }
    });


    server.route({
        method: 'GET',
        path: '/',
        config: {
            validate: {
                query: {
                    sort: Joi.string().min(3).max(50).default('updatedAt'),
                    order: Joi.number().max(1).optional().default(-1),
                    limit: Joi.number().default(20),
                    skip: Joi.number().default(0)
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'post'],
            description: 'Post Listing'

        },
        handler: (request, reply) => {
            const user = request.auth.credentials;

            let query = {
                condition: {
                    isDeleted: false
                },
                options: {
                    skip: request.query.skip,
                    limit: request.query.limit,
                    sort: request.query.sort,
                    order: request.query.order,
                    populate: [{
                        path: 'creator',
                        select: 'email firstName lastName'
                    }, {
                        path: 'category',
                        select: 'name'

                    }]
                },
                projection: { comments: 0 }
            };


            let _post = new Post();
            _post.getSortedAndPaginated(query.condition, query.projection, query.options).then((result) => {
                return reply(new Response('', result));
            }, (error) => { return reply(Boom.badImplementation()); });
        }
    });


    server.route({
        method: 'POST',
        path: '/comment',
        config: {
            validate: {
                payload: {
                    comment: Joi.string().required(),
                    postId: Joi.objectId().required().description('Must be a mongoose object id')
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['vendor', 'admin']
            },
            tags: ['api', 'post'],
            description: 'Submit comment'
        },
        handler: (request, reply) => {
            const userId = request.auth.credentials._id.toString();
            var postId = request.payload.postId;

            let _post = new Post();

            let comment = {
                comment: request.payload.comment,
                commentBy: userId,
                reply: ''
            };

            _post.updateOne(postId, {
                $push: { comments: comment }
            }, {}, (err) => {

                if (err) {
                    return reply(err);
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
    name: 'post'
};