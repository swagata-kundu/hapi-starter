'use strict';

const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const Async = require('async');

const internals = {};


internals.applyRoutes = function(server, next) {

    server.route({
        method: 'POST',
        path: '/signup',
        config: {
            validate: {
                payload: {
                    firstName: Joi.string().min(3).max(10).required(),
                    lastName: Joi.string().min(3).max(10).required(),
                    email: Joi.string().required(),
                    password: Joi.string().min(6).max(50).required(),
                    deviceId: Joi.string().optional()
                }
            },
            pre: [{
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
            }]
        },
        handler: function(request, reply) {
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

                reply({
                    user: {
                        _id: user._id,
                        email: user.email
                    },
                    authHeader
                });
            });
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