'use strict';

const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const Async = require('async');

const internals = {};


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/login',
        config: {
            validate: {
                payload: {
                    email: Joi.string().required(),
                    password: Joi.string().min(6).max(50).required()
                }
            },
            pre: [{
                assign: 'user',
                method: function(request, reply) {
                    let _user = new User();
                    _user.findByCredentials(request.payload.email, request.payload.password, (err, user) => {
                        if (err) {
                            return reply(err);
                        }
                        if (user) {
                            return reply(user);
                        }
                        return reply(Boom.unauthorized('Incorrect email or password'));
                    });
                }
            }]
        },
        handler: function(request, reply) {
            const user = request.pre.user;
            const authHeader = 'Basic ' + new Buffer(user.email + ':' + request.payload.password).toString('base64');

            reply({
                user: {
                    _id: user._id,
                    email: user.email
                },
                authHeader
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
    name: 'login'
};