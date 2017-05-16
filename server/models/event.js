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



const eventSchema = new Mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    locationName: { type: String, default: '' },
    location: {
        type: [Number],
        index: '2d'
    },
    images: [
        Mongoose.Schema({
            type: {
                type: String,
                enum: ['image', 'video'],
                default: 'video'
            },
            url: { type: String, required: true },

        }, { _id: false })
    ],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }

}, options);


const eventModel = Mongoose.model('Events', eventSchema);



/**
 * Events model and methods
 * @class Events
 * @extends {Model}
 */
class Events extends Model {

    constructor() {
        super(eventModel);
    }

    static get modelName() {
        return eventModel.modelName;
    }
}

module.exports = Events;