var common = {},
    moment = require('moment'),
    appICEConfig = require('../Config/config');
var MongoClient = require('mongodb').MongoClient;
var Promise = require('bluebird');
var mongo = require('mongodb'); 

(function (common) {
    common.campaignStatsKyes = ["Campaign_Received", "Campaign_Viewed", "Campaign_Clicked", "Campaign_Deleted"];
    common.campaignStats = {
        received:"Campaign_Received",
        receivedId: 100,
        viewed: "Campaign_Viewed",
        viewedId: 200,
        clicked:"Campaign_Clicked",
        clickedId:300,
        deleted:"Campaign_Deleted",
        deletedId:400
    }
    common.calculateDataSize = function (data){
        var bytes = 0;
    	  var keys = Object.keys(data);
        keys.forEach(function(key){
            bytes += key.length * 2;
            bytes += data[key].length * 2;
        });
        return bytes;
    }

    //getCurrent Date(We can Reuse This)

    common.getCurrentDate= function(){
        var m_names = new Array("January", "February", "March","April", "May", "June", "July", "August", "September","October", "November", "December");
        var d = new Date();
        var curr_date = d.getDate();
        var curr_month = d.getMonth();
        var curr_year = d.getFullYear();
        return (curr_date + "-" + m_names[curr_month]+ "-" + curr_year);
    }
    
    //Get Current Epoch time  (We can Reuse This)

    common.getCurrentEpochTime = function(){
        var d = new Date();
        d = moment.utc(d);
        return parseInt(d.valueOf()/1000);
    }

    //Get Future Epoch time  (We can Reuse This)

    common.getFutureEpochTime = function(m){
        var d = new Date();
        d = moment.utc(d).add(m,'months');
        return d.valueOf();
    }

    //Get date from EPOCH  (We can Reuse This)

    common.getEpochToDate = function(epochDate)
    {
        epochDate = parseInt(epochDate);
        var m = moment(epochDate);
        var s = m.format();
        return s;
    }

    //Get datetime from EPOCH  (We can Reuse This)

    common.getEpochToDateWithTime = function(epochDate, isMilliseconds, format){
        epochDate = (isMilliseconds)? epochDate : parseInt(epochDate*1000);
        var timeFotmat = (format)? format : 'YYYY-MM-DD HH:mm:ss';
        var m = moment(epochDate);
        var s = m.format(timeFotmat);
        return s;
    }

    //Campaign Stats Code (old)

    common.campaignStatsOld = {
        received:"received",
        receivedId: 100,
        viewed: "viewed",
        viewedId: 200,
        clicked:"clicked",
        clickedId:300,
        deleted:"deleted",
        deletedId:400
    }

    common.dbMap = {
        'events': 'e',
        'total': 't',
        'new': 'n',
        'unique': 'u',
        'duration': 'd',
        'durations': 'ds',
        'frequency': 'f',
        'loyalty': 'l',
        'sum': 's',
        'count': 'c'
    };

    common.dbUserMap = {
        'device_id': 'did',
        'first_seen': 'fs',
        'last_seen': 'ls',
        'session_duration': 'sd',
        'total_session_duration': 'tsd',
        'session_count': 'sc',
        'device': 'd',
        'carrier': 'c',
        'gender': 'g',
        'city': 'cty',
        'country_code': 'cc',
        'platform': 'p',
        'platform_version': 'pv',
        'app_version': 'av',
        'app_code':'ac',
        'installer':'ins',
        'last_begin_session_timestamp': 'lbst',
        'last_end_session_timestamp': 'lest',
        'has_ongoing_session': 'hos',
        'alias':'alias',
        'sdk_version':'sdkv',
        'resolution':'res',
        'locale':'l',
        'time_zone':'tz'
    };

    //Mongo Connection

    MongoClient.connect(appICEConfig.MongoUrl.url, function(err, db) {
        if (err) throw err;
        common.db = db.db("aiproddb");
        console.log("Mongo DB connected")
      });

    common.O_id= function(id){
        return new mongo.ObjectID(id)
    };

    //Get Queue through appID
    common.isAppId= function(appId){
        return new Promise(function(resolve, reject) {
            let appData=appICEConfig.appiceAppId.some(function(v){
                if(v == appId){
                    return v;
                }
            })
            resolve(appData)
        });
    };
    //Get Queue through Demo appID
    common.isDemoAppId= function(appId){
        return new Promise(function(resolve, reject) {
            let demoData = appICEConfig.demoAppId.some(function(v){
                if(v == appId){
                    return v;
                }
            })
            resolve(demoData)
        });
    };
    //Get Queue through Campaign Event Keys
    common.isCampaiagnKeys= function(eventKeys){
        return new Promise(function(resolve, reject) {
            let campignkeys = Object.values(appICEConfig.campaignkeys).some(function(v){
                if(v == eventKeys){
                    return v;
                }
            })
            resolve(campignkeys)
        });
    };

}(common));

module.exports = common;
