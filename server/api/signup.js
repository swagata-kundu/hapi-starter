'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');


const User = require('../models/user');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};


internals.preware = {
    checkEmail: {
        assign: 'checkEmail',
        method: function(request, reply) {
            let _user = new User();
            let condition = { email: request.payload.email, isDeleted: false };
            _user.getOne(condition, {}, (err, users) => {
                if (err) {
                    return reply(err);
                }
                if (users) {
                    return reply(Boom.conflict('Email already in use.'));
                }
                reply(true);
            });
        }
    }
};


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/signup',
        config: {
            validate: {
                payload: {
                    firstName: Joi.string().min(3).max(10).required(),
                    lastName: Joi.string().min(3).max(10).required(),
                    email: Joi.string().email().lowercase().required(),
                    password: Joi.string().min(6).max(50).required(),
                    deviceId: Joi.string().optional().default()
                }
            },
            pre: [internals.preware.checkEmail],
            tags: ['api', 'signup'],
            description: 'Sign up as vendor'

        },
        handler: (request, reply) => {
            const mailer = request.server.plugins.mailer;
            Async.auto({
                user: (done) => {
                    let _user = new User();
                    _user.create(request.payload, done);
                },

                welcome: ['user', (results, done) => {
                    const emailOptions = {
                        subject: 'Your account',
                        to: {
                            name: request.payload.firstName,
                            address: request.payload.email
                        }
                    };
                    const template = 'welcome';
                    mailer.sendEmail(emailOptions, template, request.payload, (err) => {
                        if (err) {
                            console.warn('sending welcome email failed:', err.stack);
                        }
                    });
                    done();
                }]
            }, (err, results) => {
                if (err) {
                    return reply(err);
                }
                const user = results.user;
                const authHeader = 'Basic ' + new Buffer(user.email + ':' + user.password).toString('base64');

                reply(
                    new Response('', {
                        user: {
                            _id: user._id,
                            email: user.email,
                            role: user.role
                        },
                        authHeader
                    }));
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/profile',
        config: {
            validate: {
                payload: {
                    firstName: Joi.string().min(3).max(10).required(),
                    lastName: Joi.string().min(3).max(10).required(),
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'profile'],
            description: 'Update user profile'
        },
        handler: (request, reply) => {
            const userId = request.auth.credentials._id.toString();
            const updateDoc = {
                firstName: request.payload.firstName,
                lastName: request.payload.lastName,
                phoneNo: request.payload.phoneNo
            };
            let _user = new User();
            _user.updateOne(userId, updateDoc, {}, (err) => {
                if (err) {
                    return reply(Boom
                        .badImplementation());
                }
                return reply(new Response(Message.PROFILE_UPDATE));
            });
        }

    });


    server.route({
        method: 'POST',
        path: '/checkemail',
        config: {
            validate: {
                payload: {
                    email: Joi.string().email().lowercase().required()
                }
            },
            pre: [internals.preware.checkEmail],
            tags: ['api', 'checkemail'],
            description: 'check duplicate email registration',
        },
        handler: (request, reply) => {
            return reply(new Response());
        }
    });

    next();
};

exports.register = function(server, options, next) {
    server.dependency(['mailer', 'mongoose'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'signup'
};