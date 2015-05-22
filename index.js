var express = require('express');

express()
    .get(/.*/, function(req, res) {
        res.sendFile('index.html', {
            root: __dirname
        });
    })
    .listen(process.env.PORT);