var express = require('express');
var appICEConfig = require('./routes/Config/config');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser=require('body-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var eventsRouter = require('./routes/events');
var putappRouter = require('./routes/putappdata');
var getClientIP = require('./routes/getip');
var beginAppRouter = require('./routes/beginsession');
var EndAppRouter = require('./routes/endsession');
var getAppUserData=require('./routes/getappuserdata');
var getCustomData=require('./routes/getCustomTemplateData');
var bulkResponse=require('./routes/getBulkCampaignResponse');
var appICEConfig = require("./routes/Config/config");
var createToken=require('./routes/createauthtoken');

var app = express();
app.set('trust proxy', true);
// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));
//Handling whitelisted Ips through config array
app.use(function(req, res, next){
  var whitelisted=appICEConfig.whitelistedIps;
  //Get origin from Request
  var host = req.get('origin');
  whitelisted.forEach(function(val, key){
    if (host.indexOf(val) > -1){
      res.header("Access-Control-Allow-Origin", host);
    }
  })
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/i/v1/initialize', usersRouter);
app.use('/i/v1/events', eventsRouter);
app.use('/i/V1/putAppAndUserData', putappRouter);  
app.use('/i/getClientIp', getClientIP); 
app.use('/i/V1/beginsession', beginAppRouter); 
app.use('/i/V1/endsession', EndAppRouter); 
app.use('/i/V1/campaigns/bulkResponse',bulkResponse);
app.use('/o/appusers/getAppAndUserData', getAppUserData); 
app.use('/o/templates/getCustomData',getCustomData);
app.use('/i/createToken',createToken);
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
