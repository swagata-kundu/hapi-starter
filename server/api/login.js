'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const Randomstring = require('randomstring');
const Bcrypt = require('bcryptjs');

const User = require('../models/user');
const Response = require('../core/responseModel');
const Message = require('../assets/messages');



const internals = {};


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/login',
        config: {
            validate: {
                payload: {
                    email: Joi.string().email().lowercase().required(),
                    password: Joi.string().min(6).max(50).required(),
                    deviceId: Joi.string().optional()
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
            }, {
                assign: 'updateDevice',
                method: function(request, reply) {
                    if (request.payload.deviceId) {
                        const user = request.pre.user;
                        let _user = new User();
                        _user.updateOne(user._id, { deviceId: request.payload.deviceId }, (err) => { return reply(err); });
                    }
                    return reply();
                }
            }],
            tags: ['api', 'login'],
            description: 'User login'
        },
        handler: (request, reply) => {
            const user = request.pre.user;
            const authHeader = 'Basic ' + new Buffer(user.email + ':' + request.payload.password).toString('base64');

            reply(
                new Response('', {
                    user: {
                        _id: user._id,
                        email: user.email,
                        role: user.role
                    },
                    authHeader
                }));
        }
    });

    server.route({
        method: 'POST',
        path: '/login/forgot',
        config: {
            validate: {
                payload: {
                    email: Joi.string().email().lowercase().required()
                }
            },
            pre: [{
                assign: 'user',
                method: function(request, reply) {
                    let _user = new User();
                    let query = {
                        email: request.payload.email,
                        isActive: true,
                        isDeleted: false
                    };
                    _user.getOne(query, 'email firstName lastName', (err, user) => {
                        if (err) {
                            return reply(err);
                        }
                        if (user) {
                            return reply(user.toJSON());
                        }
                        return reply(Boom.notFound('User not registered'));
                    });
                }
            }],
            tags: ['api', 'login']
        },
        handler: (request, reply) => {
            const userId = request.pre.user._id.toString();
            const mailer = request.server.plugins.mailer;

            Async.auto({
                newPassword: (done) => {
                    let newPassword = Randomstring.generate(7);
                    done(null, newPassword);
                },
                salt: (done) => {
                    Bcrypt.genSalt(10, done);
                },
                hash: ['newPassword', 'salt', (results, done) => {
                    let newPassword = results.newPassword;
                    Bcrypt.hash(newPassword, results.salt, done);
                }],
                updateUser: ['hash', (results, done) => {
                    let hash = results.hash;
                    let _user = new User();
                    _user.updateOne(userId, { password: hash }, {}, done);
                }],
                notify: ['updateUser', (results, done) => {
                    const password = results.newPassword;
                    const name = request.pre.user.firstName + ' ' + request.pre.user.lastName;
                    const email = request.payload.email;

                    const emailOptions = {
                        subject: 'Reset Password',
                        to: {
                            name: name,
                            address: email
                        }
                    };

                    const mailPayLoad = {
                        password: password,
                        email: email,
                        name: name
                    };

                    const template = 'forget';

                    mailer.sendEmail(emailOptions, template, mailPayLoad, done);
                }]

            }, (err, results) => {
                if (err) {
                    return reply(err);
                }
                return reply('success');
            });
        }
    });


    server.route({
        method: 'PATCH',
        path: '/login/changepassword',
        config: {
            validate: {
                payload: {
                    password: Joi.string().min(6).max(50).required()
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'login'],
            description: 'Change user password'
        },
        handler: (request, reply) => {
            const userId = request.auth.credentials._id.toString();
            Async.auto({
                encrypt: (done) => {
                    User.generatePasswordHash(request.payload.password, done);
                },
                updateUser: ['encrypt', (results, done) => {
                    let hash = results.encrypt.hash;
                    let _user = new User();
                    _user.updateOne(userId, { password: hash }, {}, done);
                }]
            }, (err) => {
                if (err) {
                    return reply(Boom.badImplementation());
                }
                const authHeader = 'Basic ' + new Buffer(request.auth.credentials.email + ':' + request.payload.password).toString('base64');
                return reply(new Response(Message.SUCCESS, { authHeader: authHeader }));
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