'use strict';
const Mongoose = require('mongoose');
const Config = require('../../config');


const internals = {};
internals.connect = (cb) => {
    Mongoose.connect(Config.get('/hapiMongoModels/mongodb/uri'), cb);
};


exports.register = function(server, options, next) {
    internals.connect((err) => {
        next(err);
    });
};

exports.register.attributes = {
    name: 'mongoose'
};