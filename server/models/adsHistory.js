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

const adsHistorSchema = new Mongoose.Schema({
    advertisement: { type: Mongoose.Schema.Types.ObjectId, ref: 'Ads' },
    updatedBy: { type: Mongoose.Schema.Types.ObjectId, ref: 'User' },
    changes: [
        Mongoose.Schema({
            key: {
                type: String,
                required: true
            },
            oldValue: { type: Mongoose.Schema.Types.Mixed },
            newValue: { type: Mongoose.Schema.Types.Mixed },
        }, { _id: false })
    ]

});



const adsHistoryModel = Mongoose.model('AdsHistory', adsHistorSchema);


/**
 * Ads model and methods
 * @class Ads
 * @extends {Model}
 */
class AdsHistory extends Model {

    constructor() {
        super(adsHistoryModel);
    }

    static get modelName() {
        return adsHistoryModel.modelName;
    }
}

module.exports = AdsHistory;