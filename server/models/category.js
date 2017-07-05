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



const categorySchema = new Mongoose.Schema({
    name: { type: String, required: true },
    imgUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, options);


const categoryModel = Mongoose.model('Category', categorySchema);


/**
 * Ads model and methods
 * @class Ads
 * @extends {Model}
 */
class Category extends Model {

    constructor() {
        super(categoryModel);
    }

    static get modelName() {
        return categoryModel.modelName;
    }
}

module.exports = Category;