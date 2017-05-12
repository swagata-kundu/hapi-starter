const Mongoose = require('mongoose');

const Model = require('../core/model');


const options = {
    toJSON: {
        transform: (doc, obj) => {
            delete obj.__v;
            delete obj.id;

            let location = obj.location;
            obj.location = {
                longitude: location && location.length > 1 ? location[0] : null,
                latitude: location && location.length > 1 ? location[1] : null
            };
            return obj;
        },
        virtuals: false
    },
    timestamps: true
};



const adsSchema = new Mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video'],
        default: 'video'
    },
    url: { type: String, required: true },
    duration: { type: Number, default: 0 },
    biddingAmount: {
        type: Number,
        default: 0,
        required: true
    },
    dalyBudget: {
        type: Number,
        default: 0,
        required: true
    },
    monthlyBudget: {
        type: Number,
        default: 0,
        required: true
    },
    locationName: { type: String, default: '' },
    location: {
        type: [Number],
        index: '2d'
    },
    radius: {
        type: Number,
        default: 1
    },
    creator: { type: Mongoose.Schema.Types.ObjectId, ref: 'User' },
    isApproved: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }

}, options);


const adsModel = Mongoose.model('Ads', adsSchema);


/**
 * Ads model and methods
 * @class Ads
 * @extends {Model}
 */
class Ads extends Model {

    constructor() {
        super(adsModel);
    }

    static get modelName() {
        return adsModel.modelName;
    }
}

module.exports = Ads;