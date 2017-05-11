const _ = require('lodash');

class Model {


    constructor(model) {
        this.model = model;
    }

    getOneById(_id) {
        return this.model.findById({ _id }).exec();
    }

    get(query = {}) {
        return this.model.find(Object.assign({}, query)).exec();
    }


    getSortedAndPaginated(condition, options) {

        // condition object is required
        if (!_.isPlainObject(condition)) {
            throw new Error('condition must be a plain object.');
        }

        // get skip, limit and sort data
        let skip = _.isFinite(options.skip) ? Math.max(0, options.skip) : 0;
        let limit = _.isFinite(options.limit) ? options.limit : null;
        let populate = options.populate ? options.populate : [];
        let sort = null;
        if (_.has(options, 'sort')) {
            sort = {};
            // sort on basis of user request
            sort[options.sort] = _.has(options, 'order') ? options.order : 1;
        }

        if (sort) {
            // clean sort object to have only numerical values
            _.forOwn(sort, (val, key) => {
                if (!_.isFinite(val)) {
                    delete sort[key];
                }
            });
        }

        // process query
        let query = this.model.find(condition).sort(sort).skip(skip).populate(populate);

        // check limit is sent or not
        if (limit) {
            query = query.limit(limit);
        }

        return query
            .exec()
            .then(cursor => {
                return this.model.count(condition)
                    .then(num => {

                        // result object
                        let result = {
                            skip: skip,
                            limit: limit ? limit : cursor.length,
                            total_count: num,
                            items: cursor,
                            hasPrev: skip > 0,
                            hasNext: false
                        };

                        // set item count
                        result.item_count = result.items.length;
                        result.hasNext = num > (result.item_count + skip);
                        return result;
                    });
            });
    }

    /**
     * Gets the first document if selection parameters match with optional projection fields
      @param {} condition 
      @param {} projection (optional)
     * 
     */
    getOne(condition, projection, callback) {
        let doc = this.model.findOne(condition);
        if (projection) {
            doc = doc.select(projection);
        }
        doc.exec(callback);
    }

    /**
     * Gets and populates the documents if selection parameters match
      @param {} condition (optional)
      @param {} fields (optional)
     * @returns Promise
     */
    findAndPopulate(condition = {}, fields = [], limit) {
        let query = this.model.find(condition);
        if (limit && _.isFinite(limit)) {
            query = query.limit(limit);
        }

        return query.populate(fields).exec();
    }

    /**
     * Gets and populates the first document if selection parameters match
      @param {} condition 
      @param {} fields (optional)
     * @returns Promise
     */
    findOneAndPopulate(condition, fields = []) {
        return this.model.findOne(condition).populate(fields).exec();
    }

    /**
     * Creates a new document
      @param {} data 
     * @returns Promise
     */
    create(data, callback) {
        this.model(data).save(callback);
    }


    /**
    * Creates a new document
    @param {} data 
    * @returns Promise
    */
    createMany(data) {
            return this.model.insertMany(data);
        }
        /**
         * Updates one document by '_id'
          @param {} _id 
          @param {} updates 
          @param {} options 
         * @returns Promise
         */
    updateOne(_id, updates, options = {}, callback) {
        this.model.findOneAndUpdate({ _id }, updates, Object.assign({ new: true }, options)).exec(callback);
    }

    /**
     * Updates one document by query
      @param {} query 
      @param {} updates 
      @param {} options 
     * @returns Promise
     */
    updateOneByQuery(query, updates, options = {}) {
        return this.model.findOneAndUpdate(query, updates, Object.assign({ new: true }, options)).exec();
    }

    /**
     * Deletes one document by '_id'
      @param {} _id 
      @param {} query 
     * @returns Promise
     */
    delete(_id, query) {
        if (_id) {
            return this.model.remove({ _id }).exec();
        } else if (query && Object.keys(query).length > 0) {
            return this.model.destroy(Object.assign({}, query));
        } else {
            return Promise.reject(new Error('Bad Request: Cannot delete all documents.'));
        }
    }

    /**
     * Model static function for text search. Internally uses mongoose paginate plugin method "findPaginate()".
     * If no sort is provided in options, results are sorted based on search score.
     * callback result is an object like: {skip:20, limit:10,total_count:100, items:[{},{}], item_count: 2}
     * 
     * @param {String} searchText - text search string. Example: "new cars"
     * @param {Object} conditions - query conditions. Example: { age: { $gt: 20 } }
     * @param {Object} [options] - query options. Example: {skip: 20, limit: 10, sort: { name: 1, age: -1 } }
     * @param {function(Error,Object)} callback - callback function.
     */
    search(searchText, conditions, options) {

        // serach text must be provided, else better use findPaginate()
        if (!_.isString(searchText)) {
            throw new Error('searchText must be a string.');
        }

        var orQuery = [];

        this.model.schema.statics.searchFields.forEach(function(n) {
            var field = {};
            field[n] = new RegExp(searchText, 'i');
            orQuery.push(field);
        });

        // push search or condition in and query
        conditions['$and'] = _.has(conditions, '$and') ? conditions['$and'] : [];
        conditions['$and'].push({ '$or': orQuery });

        // default sort by serach score, if no sort specified
        if (!_.has(options, 'sort')) {
            options.sort = { score: { '$meta': 'textScore' } };
        }

        // call find paginate or aggregate paginate
        return this.getSortedAndPaginated(conditions, options);
    }
}


module.exports = Model;