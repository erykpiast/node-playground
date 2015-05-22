var fs = require('fs');
var express = require('express');


express()
    .get(/.*/, function(req, res) {
        if(req.path.match(/\.css$/)) {
            var status = req.path.match(/^\/([0-9]{3})/);
            if(status) {
                status = parseInt(status[1], 10);
            }

            if(!status) {
                status = 500;
            }

            res.status(status);

            fs.readFile(__dirname + req.path, { encoding: 'UTF-8' }, function(err, data) {
                if(err) {
                    res.send('Resource is not avaiable');
                } else {
                    res
                        .type('text/css')
                        .send(data);
                }
            });
        } else if(req.path.match(/\.json$/)) {
            var allowedDomain = req.query.restrictAccess || '*';

            res
                .set('Access-Control-Allow-Origin', allowedDomain)
                .type('application/json')
                .status(200)
                .send('{ "data": "example data" }');
        } else {
            res.sendFile('index.html', {
                root: __dirname
            });
        }
    })
    .listen(process.env.PORT);