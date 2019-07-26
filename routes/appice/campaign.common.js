var campaignCommon = {},
    cacheApi = require('./appice.cache');

(function (campaignCommon) {
    campaignCommon.validateCampaignUser = function(appid, campid, did, callback){
        console.log("campaignuser_"+appid+""+campid, "    ", did);
        cacheApi.client.hget("campaignuser_"+appid+""+campid, did, function(err, data){
            console.log("err, data ", err, data);
            if(err){
                callback(err, false, null);
            }
            else{
                data = JSON.parse(data);
                if(data && data.st != undefined && data.st === false){
                    // update user status
                    data.st = true;
                    cacheApi.client.hset("campaignuser_"+appid+""+campid, did, JSON.stringify(data), function(err, res){
                        console.log("err, res ", err, res);
                    });
                    callback(null, true, data);
                }
                else{
                    callback(null, false, data);
                }
            }
        });
    }
}(campaignCommon));
module.exports = campaignCommon;