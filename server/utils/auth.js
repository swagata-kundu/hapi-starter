'use strict';
const Async = require('async');
const Boom = require('boom');
const User = require('../models/user');

const internals = {};


internals.applyStrategy = function(server, next) {

    server.auth.strategy('simple', 'basic', {
        validateFunc: function(request, username, password, callback) {
            let _user = new User();
            _user.findByCredentials(username, password, (err, user) => {
                if (err) {
                    return callback(err);
                }
                if (user) {
                    const credentials = Object.assign({}, user);
                    delete credentials['password'];
                    credentials['scope'] = [credentials.role];
                    return callback(null, true, credentials);
                }
                return callback(null, false);
            });
        }
    });

    next();
};


exports.register = function(server, options, next) {
    server.dependency('hapi-auth-basic', internals.applyStrategy);
    next();
};



exports.register.attributes = {
    name: 'auth'
};