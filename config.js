'use strict';
const Confidence = require('confidence');
const Dotenv = require('dotenv');


Dotenv.config({ silent: true });

const criteria = {
    env: process.env.NODE_ENV
};


const config = {
    $meta: 'This file configures the plot device.',
    projectName: 'Adclad',
    port: {
        api: {
            $filter: 'env',
            test: 9090,
            production: process.env.PORT,
            $default: 9000
        }
    },
    labels: {
        api: {
            $filter: 'env',
            test: ['api'],
            production: ['api'],
            $default: ['api']
        }
    },
    hapiMongoModels: {
        mongodb: {
            uri: {
                $filter: 'env',
                production: process.env.MONGODB_URI,
                test: 'mongodb://localhost:27017/adclad-test',
                $default: 'mongodb://localhost:27017/react_training'
            }
        },
        autoIndex: true
    },
    nodemailer: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'testermundu',
            pass: 'Swagata45'
        },
        tls: {
            'rejectUnauthorized': false
        }
    },
    system: {
        fromAddress: {
            name: 'AD-Test',
            address: 'testermundu@gmail.com'
        },
        toAddress: {
            name: 'AD-Test',
            address: 'testermundu@gmail.com'
        }
    }
};


const store = new Confidence.Store(config);


exports.get = function(key) {

    return store.get(key, criteria);
};


exports.meta = function(key) {

    return store.meta(key, criteria);
};