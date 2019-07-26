var cacheApi = {},
	redis = require('redis'),
	appICEConfig = require('../Config/config');
(function (cacheApi) {

		var client = (appICEConfig.redisKey)? redis.createClient(appICEConfig.redisPort, appICEConfig.redisHost, {auth_pass: appICEConfig.redisKey, tls: {servername: appICEConfig.redisHost}}) : redis.createClient(appICEConfig.redisPort,appICEConfig.redisHost);
  	//Create Redis client
    client.on('connect', function() {
        console.log('Redis connected.');
    });

    cacheApi.client = client;
    cacheApi.setKey = function(key,data){
    	//console.log("Key set to cache: "+key);
    	client.set(key,data);
    }

    cacheApi.getKey = function(key,callback){
    	client.get(key,function(err,result){
    		if(!err){
    			//console.log("Key retrieved from cache: "+key);
    		}
    		callback(err,result);
    	});
    }

    cacheApi.deleteKey = function(key,callback){
    	client.del(key,function(err,result){
    		callback(err,result);
    	});
    }

    cacheApi.expire = function(key,seconds) {
        client.expire(key,seconds);
    }

    cacheApi.addToSet = function(key,value,callback){
        //console.log("Key set to cache: "+key);
        client.sadd(key,value);
        client.scard(key,function(err,data){
            callback(data);
        });
    }

    cacheApi.addToSadd = function(key,value,callback){
        //console.log("Key set to cache: "+key);
        client.sadd(key, value, function(err,data){
            callback(data);
        });
    }

    cacheApi.getMembers = function(key, callback){
        //console.log("Key set to cache: "+key);SMEMBERS
        client.smembers(key, function(err,data){
            callback(err, data);
        });
    }

    cacheApi.removeMember = function(key, member, callback){
        //console.log("Key set to cache: "+key);SREM
        client.srem(key, member, function(err,data){
            callback(data);
        });
    }
    //ttl manish
    cacheApi.checkExpireTime = function(key, callback){
        client.ttl(key, function(err,data){
            callback(data);
        });
    }
		//increment number
    cacheApi.increaseNumber = function(key, callback){
        client.incr(key, callback);
    }
}(cacheApi));

module.exports = cacheApi;
