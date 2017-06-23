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

const postSchema = new Mongoose.Schema({
    title: { type: String, required: true },
    imgUrl: { type: String, required: true },
    category: { type: Mongoose.Schema.Types.ObjectId, ref: 'Category' },
    creator: { type: Mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [
        Mongoose.Schema({
            comment: { type: String, require: true },
            commentBy: { type: Mongoose.Schema.Types.ObjectId, ref: 'User' },
            reply: { type: String, default: '', required: false }

        }, { timestamps: true })
    ],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }

}, options);


const postModel = Mongoose.model('Post', postSchema);



/**
 * Ads model and methods
 * @class Ads
 * @extends {Model}
 */
class Post extends Model {

    constructor() {
        super(postModel);
    }

    static get modelName() {
        return postModel.modelName;
    }
}

module.exports = Post;