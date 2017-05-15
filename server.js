const Glue = require('glue');

const Manifest = require('./manifest');

const options = {
    relativeTo: __dirname,
};

Glue.compose(Manifest.get('/'), options, (err, server) => {
    if (err) {
        throw err;
    }

    //Start Server

    server.start((err) => {
        if (err) {
            throw (err);
        }
        console.log('hapi days!');
    });


    //Serve static files
    server.route({
        method: 'GET',
        path: '/uploads/{file*}',
        handler: {
            directory: {
                path: 'uploads'
            }
        }
    });

});