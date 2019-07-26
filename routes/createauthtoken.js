var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var appICEConfig=require('./Config/config');

/* GET (Not Permitted). */
router.get('/', function(req, res, next) {
    // Forbidden
    res.sendStatus(403);
});

/* POST Create Token Data. */
router.post('/', function(req, res, next) {
    // Confidential Unique Details
    const user = {
        app_id: req.body.app_id, 
        api_key: req.body.api_key,
        app_key: req.body.app_key
    }
    jwt.sign({user}, appICEConfig.secretKey,appICEConfig.validity, (err, token) => {
        res.json({
        token
        });
    });
});
module.exports = router;
