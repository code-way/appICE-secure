var express = require('express');
var router = express.Router();

/* GET IP Location Data. */
router.get('/', function(req, res, next) {
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.json({"result" : ipAddress});
});

/* POST IP Location Data. */
router.post('/', function(req, res, next) {
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.json({"result" : ipAddress});
  });
  
module.exports = router;
