const Glue = require('glue');
const Manifest = require('./manifest');

const options = {
    relativeTo: __dirname
};

Glue.compose(Manifest.get('/'), options, (err, server) => {
    if (err) {
        throw err;
    }
    server.start((err) => {
        if (err) {
            throw (err);
        }
        console.log('hapi days!');
    });
});