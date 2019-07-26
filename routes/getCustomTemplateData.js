/*
Author : Saurabh Singh
Date : 19 May'2019
- Get Custom data from template in the form of Get from the cache/Mongo
*/

var express = require('express');
var router = express.Router();
common = require('./appice/common');
var url = require('url');
//Include Config Folder
var users=require('./appice/users');
var cacheApi = require('./appice/appice.cache');


/* To Process GetTemplate Request  (As POST Request)*/
router.post('/', async function(req, res, next) {
    if(req.body.tid){
         //transactional
        if(req.body.ct && req.body.ct =='trans'){
            cacheApi.getKey('trans_campaigns_template_'+ req.body.app_id + req.body.tid, function(error, data){
                if(error || data == null){
                    console.log(req.body.tid);
                    common.db.collection("transaction_camp_"+req.body.app_id).findOne({"_id":req.body.tid},function (err,tool) {
                        if(!err && tool){
                            res.send(tool.payload.cdata);
                        }
                        else{
                            res.send({});
                        }
                    });
                }
                else {
                    data = decodeURIComponent(data);
                    res.send(data);
                }
            });

        }
         //Non-transactional
        else{
            cacheApi.getKey('campaigns_template_'+ req.body.app_id + req.body.tid, function(error, data){
                if(error || data == null){
                    common.db.collection('templates_'+ req.body.app_id).find({"_id": common.O_id(req.body.tid)}).toArray(function (err, tool) {
                        if(!err && tool){
                            res.send(tool[0].template.cdata);
                        }
                        else{
                            res.send({});
                        }
                    });
                }
                else {
                    data = decodeURIComponent(data);
                    res.send(tool.template.cdata);
                }
            });
        }

    } else {
        res.send({});
    }
});


/* To Process GetTemplate Request(Get Support) */

router.get('/', async function(req, res, next) {
    if(req.query.tid){
         //transactional
        if(req.query.ct && req.query.ct =='trans'){
            cacheApi.getKey('trans_campaigns_template_'+ req.query.app_id + req.query.tid, function(error, data){
                if(error || data == null){
                    console.log(req.query.tid);
                    common.db.collection("transaction_camp_"+req.query.app_id).find({"_id":common.O_id(req.query.tid)}).toArray(function (err,tool) {
                        if(!err && tool){
                            res.send(tool[0].payload.cdata);
                        }
                        else{
                            res.send({});
                        }
                    });
                }
                else {
                    resData=JSON.parse(data);
                    res.send(resData);
                }
            });
        }
        //Non-transactional
        else{
            cacheApi.getKey('campaigns_template_'+ req.query.app_id + req.query.tid, function(error, data){
                if(error || data == null){
                    common.db.collection('templates_'+ req.query.app_id).find({"_id": common.O_id(req.query.tid)}).toArray(function (err, tool) {
                        if(!err && tool){
                            res.send(tool[0].template.cdata);
                        }
                        else{
                            res.send({});
                        }
                    });
                }
                else {
                    resData=JSON.parse(data);
                    res.send(resData);
                }
            });
        }

    } else {
        res.send({});
    }

});

module.exports = router;
