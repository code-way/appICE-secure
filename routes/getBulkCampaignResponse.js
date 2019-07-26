/*
Author : Saurabh Singh
Date : 19 May'2019
- Get data from Client in the form of Get and POST and put bulk Response into Queue
*/

var express = require('express');
var router = express.Router();
common = require('./appice/common');
var appICEConfig = require('./Config/config');

/* To Process PutAppdata Request  (As POST Request)*/
router.post('/', async function(req, res, next) {
    //Print an Object with post data
        var obj = {
          appid : req.body.app_id,
          responses: req.body.args.data,
          key : appICEConfig.azureGenericQueue.campaignQueue
        };
        req.QueueObject = obj;
          var sendEvent = false;
          if(req.body.args.data){
              req.body.args.data.forEach(function(items){
                  var obj = {context:{}}
                  items.response.forEach(function(data){
                      console.log(data)
                      if(data.qid == 100){
                          obj.key = appICEConfig.campaignkeys.receive;
                          sendEvent = true;
                      }
                      else if(data.qid == 200){
                          obj.key = appICEConfig.campaignkeys.view;
                          sendEvent = true;
                      }
                      else if(data.qid == 300){
                          obj.key = appICEConfig.campaignkeys.click;
                          sendEvent = true;
                      }
                      else if(data.qid == 400){
                          obj.key = appICEConfig.campaignkeys.ignore;
                          sendEvent = true;
                      }
                  });

                  // send campaign stats as an events
                  if(sendEvent){
                      obj.context = items.context;
                      obj.timestamp = items.timestamp;
                      obj.campid = items.campid;
                      delete req.body.args;
                      delete req.body.metrics;
                      req.body.events = [];
                      req.body.events.push(obj);
                      req.body.events = JSON.stringify(req.body.events);
                        var obj = {
                            appid : req.body.app_id,
                            did:req.body.device_id,
                            user_id: params.app_user_id,
                            events: req.body.events,
                            key :  appICEConfig.eventData.Key
                        };   
                  }
              });
            var campaignQueue=appICEConfig.azureGenericQueue.campaignQueue;
            //create Connection to Store Data into Queue
            const storeQueue = Azure.createQueueServiceWithSas(sasUrl,sasToken);
            // send message to Azure store queue
            storeQueue.createMessage(campaignQueue, obj, {messageTimeToLive: msgttl}, function(error, results, response){
                if(error){
                    res.status(500).json({"result":"error","error" : error});
                }else {
                res.send('{"result":"Success"}');
                }
            }); 
          }
});

router.get('/', async function(req, res, next) {
    res.send('{"result":"success"}');
});
module.exports = router;
