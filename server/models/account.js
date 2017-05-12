const Mongoose = require('mongoose');

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

const accountSchema = new Mongoose.Schema({
    balance: {
        type: Number,
        default: 0
    },
    owner: { type: Mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false }
}, options);

const accountModel = Mongoose.model('Account', accountSchema);


/**
 * Balance model and methods
 * @class Balance
 * @extends {Model}
 */
class Account extends Model {

    constructor() {
        super(accountModel);
    }

    static get modelName() {
        return accountModel.modelName;
    }
}

module.exports = Account;