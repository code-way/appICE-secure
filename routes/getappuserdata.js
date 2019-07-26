/*
Author : Saurabh Singh
Date : 19 May'2019
- Get data from Client in the form of Get and POST and put into Azure Queue
*/

var express = require('express');
var router = express.Router();
common = require('./appice/common');
//Include Config Folder
var users=require('./appice/users');
var cacheApi = require('./appice/appice.cache');
var reqData;

/* To Process PutAppdata Request  (As POST Request)*/
router.post('/', async function(req, res, next) {
    reqData=req;
    let cachedData = await getCachedData(reqData);
    let data = await users.getAppAndUserData(cachedData);
    res.json(data)
});

router.get('/', async function(req, res, next) {
    res.send('{"result":"success"}');
});

//Validate Data through function

function getCachedData(reqData){
    return new Promise((resolve, reject)=>{
        cacheApi.getKey(reqData.body.api_key,function(err,result){
            if(err || result==null){
                    common.db.collection('members').findOne({'api_key':reqData.body.api_key,isapproved:true}, function (err, member) {
                        if (!member || err) {
                            resolve('User does not exist');
                        }
                        //Write this result back to Redis so that in frequent requests it is served from redis itself.
                        cacheApi.setKey(reqData.body.api_key,JSON.stringify(member));
                        reqData.member = member;
                        resolve(reqData);
                    });
                }
                else{
                    //console.log("Member served from Redis");
                    reqData.member = JSON.parse(result);
                    resolve(reqData);
                }
            });
    })
}

module.exports = router;
