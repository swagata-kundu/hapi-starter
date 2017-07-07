'use strict';

const Boom = require('boom');
const Fs = require('fs');
const Joi = require('joi');
const _ = require('lodash');
const Path = require('path');
const Moment = require('moment');

const Response = require('../core/responseModel');
const Message = require('../assets/messages');

const internals = {};


internals.applyRoutes = function(server, next) {
    server.route({
        method: 'POST',
        path: '/',
        config: {
            payload: {
                output: 'file',
                parse: true,
                allow: 'multipart/form-data'
            },
            validate: {
                payload: {
                    file: Joi.any().meta({
                        swaggerType: 'file'
                    }).description('file').required()
                }
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                }
            },
            auth: {
                strategy: 'simple',
                scope: ['admin', 'vendor']
            },
            tags: ['api', 'upload'],

        },
        handler: (request, reply) => {
            const file = request.payload.file,
                fileName = Moment.now().toString() + '_' + file.filename;

            if (_.isObject(file)) {
                const filePath = Path.resolve('./uploads/' + fileName);
                Fs.readFile(file.path, (err, content) => {
                    if (err) {
                        return reply(Boom.badImplementation());
                    }
                    Fs.writeFile(filePath, content, (err) => {
                        if (err) {
                            return reply(Boom.badImplementation());
                        }
                        const host = request.info.host;
                        const result = {
                            url: 'http://' + host + '/uploads/' + fileName
                        };
                        return reply(new Response(Message.SUCCESS, result));
                    });
                });
            } else {
                return reply(Boom.badData());
            }
        }
    });

    next();
};


exports.register = function(server, options, next) {
    server.dependency(['mongoose', 'auth'], internals.applyRoutes);
    next();
};

exports.register.attributes = {
    name: 'uploads'
};