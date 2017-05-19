const Mongoose = require('mongoose');
const Async = require('async');
const Bcrypt = require('bcryptjs');

const Model = require('../core/model');


const options = {
    toJSON: {
        transform: (doc, obj) => {
            delete obj.__v;
            delete obj.id;
            return obj;
        },
        virtuals: false
    },
    timestamps: true
};



const userSchema = new Mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phoneNo: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deviceId: { type: String, required: false, default: '' },
    role: {
        type: String,
        enum: ['vendor', 'admin'],
        default: 'vendor'
    }
}, options);


const userModel = Mongoose.model('User', userSchema);

class User extends Model {

    constructor() {
        super(userModel);
    }

    static get modelName() {
        return userModel.modelName;
    }

    static generatePasswordHash(password, callback) {
        Async.auto({
            salt: (done) => {
                Bcrypt.genSalt(10, done);
            },
            hash: ['salt', (results, done) => {
                Bcrypt.hash(password, results.salt, done);
            }]
        }, (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, {
                password,
                hash: results.hash
            });
        });
    }

    findByCredentials(email, password, callback) {
        let self = this;
        Async.auto({
            user: function(done) {
                const query = {
                    isActive: true,
                    isDeleted: false,
                    email: email
                };
                self.getOne(query, '', done);
            },
            passwordMatch: ['user', function(results, done) {

                if (!results.user) {
                    return done(null, false);
                }
                const source = results.user.password;
                Bcrypt.compare(password, source, done);
            }]
        }, (err, results) => {
            if (err) {
                return callback(err);
            }
            if (results.passwordMatch) {
                return callback(null, results.user.toJSON());
            }
            callback();
        });
    }


    create(document, callback) {
        Async.auto({
            passwordHash: User.generatePasswordHash.bind(this, document.password),
            newUser: ['passwordHash', (results, done) => {
                const documentUpdated = {
                    isActive: true,
                    isDeleted: false,
                    password: results.passwordHash.hash,
                    firstName: document.firstName.toLowerCase(),
                    lastName: document.lastName.toLowerCase(),
                    email: document.email.toLowerCase(),
                    deviceId: document.deviceId ? document.deviceId : '',
                    phoneNo: document.phoneNo
                };
                this.model
                    .create(documentUpdated, done);
            }]
        }, (err, results) => {
            if (err) {
                return callback(err);
            }
            results.newUser._doc.password = results.passwordHash.password;
            callback(null, results.newUser.toJSON());
        });

    }


}

module.exports = User;