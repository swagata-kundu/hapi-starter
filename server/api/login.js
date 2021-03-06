'use strict';

const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const Async = require('async');
const Randomstring = require('randomstring');
const Bcrypt = require('bcrypt');

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

    server.route({
        method: 'POST',
        path: '/login/forgot',
        config: {
            validate: {
                payload: {
                    email: Joi.string().required()
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
            }]
        },
        handler: function(request, reply) {
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


    next();
};

exports.register = function(server, options, next) {
    server.dependency(['auth', 'mongoose'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'login'
};