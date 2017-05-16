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
    locationName: { type: String, default: '' },
    location: {
        type: [Number],
        index: '2d'
    },
    radius: {
        type: Number,
        default: 1
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }

}, options);


const defaultAdsModel = Mongoose.model('DefaultAds', adsSchema);


/**
 * Ads model and methods
 * @class Ads
 * @extends {Model}
 */
class DefaultAds extends Model {

    constructor() {
        super(defaultAdsModel);
    }

    static get modelName() {
        return defaultAdsModel.modelName;
    }
}

module.exports = DefaultAds;