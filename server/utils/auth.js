'use strict';
const Async = require('async');
const Boom = require('boom');


const internals = {};


internals.applyStrategy = function(server, next) {

    server.auth.strategy('simple', 'basic', {
        validateFunc: function(request, username, password, callback) {
            callback(null, true, {});
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