var express = require('express');
var router = express.Router();

/* GET Begin Session Data. */
router.get('/', function(req, res, next) {
    res.send('{"result" : "success"}');
});

/* POST End Session Data. */
router.post('/', function(req, res, next) {
    res.send('{"result" : "success"}');
  });
  
module.exports = router;
