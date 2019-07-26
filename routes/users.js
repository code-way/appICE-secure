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
var common=require('./appice/common');

/* To Process Initialize Request  (As POST Request)*/
router.post('/', async function(req, res, next) {
  //Got POST data :
  req.body.ip=req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.body.requestType='POST';
  var reqData= JSON.stringify(req.body);
  var result=JSON.parse(reqData);
  //Set Message Queue Expiration
  var msgttl=appICEConfig.azureStorageCreds.messageTtl;
  var sasUrl=appICEConfig.azureStorageCreds.sasUrl;
  var sasToken=appICEConfig.azureStorageCreds.sasToken;
  //GetAppid ML keys from Config and Match this
  var appId=result.app_id;
  var isAppData= await common.isAppId(appId);
  var isDemoAppData= await common.isDemoAppId(appId);
  if(isAppData){     //Check AppId through Config Array List
      console.log('appId => ' + result.app_id)
      var installQueueName=appICEConfig.azureNotGenericQueue.installQueue;
  }else if(isDemoAppData){     //Check AppId through Config Array List
      console.log('Demo appId => ' + result.app_id)
      var installQueueName=appICEConfig.azureDemoAppQueue.installDemoQueue;
  }else{    
      var installQueueName=appICEConfig.azureGenericQueue.installGenericQueue;
  }
  //create Connection to Store Data into Queue
  const storeQueue = Azure.createQueueServiceWithSas(sasUrl,sasToken);
  // send message to Azure store queue
  storeQueue.createMessage(installQueueName, reqData, {messageTimeToLive: msgttl}, function(error, results, response){
    if(error){
        console.log('Initiliase Queue error => ' + error);
        res.status(500).json({"result":"error","error" : error});
    }else {
       console.log('Initiliase Queue result =>' + JSON.stringify(results));
       console.log('Initialise Queue response =>' + JSON.stringify(response));
       res.send('{"result":"Success"}');
    }
  });
});

/* To Process Initialize Request  (As GET Request)*/
router.get('/', async function(req, res, next) {
   //Got GET data :
   req.query.ip=req.headers['x-forwarded-for'] || req.connection.remoteAddress;
   req.query.requestType='GET';
   req.query.metrics=querystring.parse(req.query.metrics);
   var reqData= JSON.stringify(req.query);
   var result=JSON.parse(reqData);
   //Set Message Queue Expiration
   var msgttl=appICEConfig.azureStorageCreds.messageTtl;
   var sasUrl=appICEConfig.azureStorageCreds.sasUrl;
   var sasToken=appICEConfig.azureStorageCreds.sasToken;
   //GetAppid ML keys from Config and Match this
   var appId=result.app_id;
  var isAppData= await common.isAppId(appId);
  var isDemoAppData= await common.isDemoAppId(appId);
  if(isAppData){     //Check AppId through Config Array List
      console.log('appId => ' + result.app_id)
      var installQueueName=appICEConfig.azureNotGenericQueue.installQueue;
  }else if(isDemoAppData){     //Check AppId through Config Array List
      console.log('Demo appId => ' + result.app_id)
      var installQueueName=appICEConfig.azureDemoAppQueue.installDemoQueue;
  }else{    
      var installQueueName=appICEConfig.azureGenericQueue.installGenericQueue;
  }
   //create Connection to Store Data into Queue
   const storeQueue = Azure.createQueueServiceWithSas(sasUrl,sasToken);
   // send message to Azure store queue
   storeQueue.createMessage(installQueueName, reqData, {messageTimeToLive: msgttl}, function(error, results, response){
      if(error){
         console.log('Initiliase Queue error => ' + error);
         res.status(500).json({"result":"error","error" : error});
      }else {
         console.log('Initiliase Queue result =>' + JSON.stringify(results));
         console.log('Initialise Queue response =>' + JSON.stringify(response));
         res.send('{"result":"Success"}');
      }
   });
 });
 

module.exports = router;
