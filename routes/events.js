/*
Author : Saurabh Singh
Date : 19 May'2019
- Get data from Client in the form of Get and POST and put into Azure Queue
*/

var express = require('express');
var router = express.Router();
Azure = require('azure-storage');
const querystring = require('querystring');
//Include Config Folder
var appICEConfig=require('./Config/config');
/* To Process Events Request (As POST Request) */
router.post('/', async function(req, res, next) {
  //Got POST data :
  req.body.ip=req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.body.requestType='POST';
  var reqData= JSON.stringify(req.body);
  var result=JSON.parse(reqData);
  var sasUrl=appICEConfig.azureStorageCreds.sasUrl;
  var sasToken=appICEConfig.azureStorageCreds.sasToken;
   //Set Message Queue Expiration
  var msgttl=appICEConfig.azureStorageCreds.messageTtl;
  //GetCampaign Keys from Config and Match this
  var eventKeys=result.events[0].key;
  var appId=result.app_id;
  var isAppData= await common.isAppId(appId);
  var isDemoAppData= await common.isDemoAppId(appId);
  var isCampaignKeys=await common.isCampaiagnKeys(eventKeys);
  //Check DataSets to Collect All Data (Check keys for Events) - We can send email to Admin If we want 
  if(isCampaignKeys){
    //Queue Mapping 
    var eventQueueName=appICEConfig.azureNotGenericQueue.campaignQueue;
  }else if(isAppData){     //Check AppId through Config Array List
    console.log('appId => ' + result.app_id)
    var eventQueueName=appICEConfig.azureNotGenericQueue.eventsQueue;
  }else if(isDemoAppData){     //Check AppId through Config Array List
    console.log('Demo appId => ' + result.app_id)
    var eventQueueName=appICEConfig.azureDemoAppQueue.eventsDemoQueue;
  }else{    
    var eventQueueName=appICEConfig.azureGenericQueue.eventsGenericQueue; 
  }
  //create Connection to Store Data into Queue
  const storeQueue = Azure.createQueueServiceWithSas(sasUrl,sasToken);
  // send message to Azure store queue
  storeQueue.createMessage(eventQueueName, reqData, {messageTimeToLive: msgttl}, function(error, results, response){
    if(error){
        console.log('Events Queue error => ' + error);
        res.status(500).json({"result":"error","error" : error});
    }else {
       console.log('Events Queue result =>' + JSON.stringify(results));
       console.log('Events Queue response =>' + JSON.stringify(response));
       res.send('{"result":"Success"}');
    }
  }); 
});


  /* To Process Events Request (As GET Request) */
router.get('/', async function(req, res, next) {
  //Got GET data :
  req.query.ip=req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.query.events=querystring.parse(req.query.events);
  req.query.requestType='GET';
  var reqData= JSON.stringify(req.query);
  var result=JSON.parse(reqData);
  var sasUrl=appICEConfig.azureStorageCreds.sasUrl;
  var sasToken=appICEConfig.azureStorageCreds.sasToken;
   //Set Message Queue Expiration
  var msgttl=appICEConfig.azureStorageCreds.messageTtl;
  var msgttl=appICEConfig.azureStorageCreds.messageTtl;
  //GetCampaign Keys from Config and Match this
  var eventKeys=result.events[0].key;
  var eventKeys=result.events[0].key;
  var appId=result.app_id;
  var isAppData= await common.isAppId(appId);
  var isDemoAppData= await common.isDemoAppId(appId);
  var isCampaignKeys=await common.isCampaignKeys(eventKeys);
  //Check DataSets to Collect All Data (Check keys for Events) - We can send email to Admin If we want 
  if(isCampaignKeys){
    //Queue Mapping 
    var eventQueueName=appICEConfig.azureNotGenericQueue.campaignQueue;
  }else if(isAppData){     //Check AppId through Config Array List
    console.log('appId => ' + result.app_id)
    var eventQueueName=appICEConfig.azureNotGenericQueue.eventsQueue;
  }else if(isDemoAppData){     //Check AppId through Config Array List
    console.log('Demo appId => ' + result.app_id)
    var eventQueueName=appICEConfig.azureDemoAppQueue.eventsDemoQueue;
  }else{    
    var eventQueueName=appICEConfig.azureGenericQueue.eventsGenericQueue; 
  }
  //create Connection to Store Data into Queue
  const storeQueue = Azure.createQueueServiceWithSas(sasUrl,sasToken);
  // send message to Azure store queue
  storeQueue.createMessage(eventQueueName, reqData, {messageTimeToLive: msgttl}, function(error, results, response){
    if(error){
        console.log('Events Queue error => ' + error);
        res.status(500).json({"result":"error","error" : error});
    }else {
       console.log('Events Queue result =>' + JSON.stringify(results));
       console.log('Events Queue response =>' + JSON.stringify(response));
       res.send('{"result":"Success"}');
    }
  }); 
});

module.exports = router;
