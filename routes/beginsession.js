var express = require('express');
var router = express.Router();

/* GET IP Location Data. */
router.get('/', function(req, res, next) {
    res.send('{"result" : "success"}');
});

/* POST IP Location Data. */
router.post('/', function(req, res, next) {
    res.send('{"result" : "success"}');
  });
  
module.exports = router;
