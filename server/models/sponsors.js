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

const sponsorSchema = new Mongoose.Schema({
    name: { type: String, default: '' },
    url: { type: String, required: true },
    sortOrder: { type: Number, default: 0, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, options);

const sponsorModel = Mongoose.model('Sponsor', sponsorSchema);


/**
 * Sponsor model and methods
 * @class Balance
 * @extends {Model}
 */
class Sponsor extends Model {

    constructor() {
        super(sponsorModel);
    }

    static get modelName() {
        return sponsorModel.modelName;
    }
}

module.exports = Sponsor;