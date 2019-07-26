// config.js
const config = {
    app: {
      port: 3000
    },
    MongoUrl: {
        url : 'mongodb://13.90.100.174:27017/'
    },
    //Campaign Keys
    campaignkeys: {
        receive : 'Campaign_Received',
        view : 'Campaign_Viewed',
        click : 'Campaign_Clicked',
        ignore: 'Campaign_Deleted'
    },
    eventData:{
        Key:"events"
    },
    //Queue Map List (For All Other Apps Except ML)
    azureGenericQueue:{
        installGenericQueue: 'appice-generic-install-rawdata',
        sessionGenericQueue: 'appice-generic-session-rawdata',
        eventsGenericQueue: 'appice-generic-events-rawdata',
        putAppGenericQueue: 'appice-generic-putapp-rawdata',
        campaignQueue: 'appice-api-campaigns-raw'
    },
    //Queue Map List (For ML Apps)
    azureNotGenericQueue:{
        installQueue: 'appice-install-rawdata',
        sessionQueue: 'appice-session-rawdata',
        eventsQueue: 'appice-events-rawdata',
        putAppQueue: 'appice-putapp-rawdata',
        campaignQueue: 'appice-api-campaigns-raw'
    },
    //Queue Map List (For Demo App Queue)
    azureDemoAppQueue:{
        installDemoQueue: 'appice-demo-install-rawdata',
        sessionDemoQueue: 'appice-demo-session-rawdata',
        eventsDemoQueue: 'appice-demo-events-rawdata',
        putAppDemoQueue: 'appice-demo-putapp-rawdata',
        campaignDemoQueue: 'appice-demo-api-campaigns-raw'
    },
    // Storage creds
    azureStorageCreds:{
        sasUrl: "https://appiceprod.queue.core.windows.net/?sv=2017-11-09&ss=bfqt&srt=sco&sp=rwdlacup&se=2030-12-31T13:12:28Z&st=2018-10-30T05:12:28Z&spr=https,http&sig=%2FIYUAFaaKjsylYi5ip9Ms2hi07xmScXx%2BgGECYI%2Fdzc%3D",
        sasToken: "?sv=2017-11-09&ss=bfqt&srt=sco&sp=rwdlacup&se=2030-12-31T13:12:28Z&st=2018-10-30T05:12:28Z&spr=https,http&sig=%2FIYUAFaaKjsylYi5ip9Ms2hi07xmScXx%2BgGECYI%2Fdzc%3D",
        messageTtl: (86400*15)
    }
   };
   config.redisHost = 'appice-cache.redis.cache.windows.net';
   config.cdnUrl = 'https://cdn.appice.io/i/V1/campaignImg?campImg=';
   config.redisPort = 6380; // ssl port that required in azure vm
   config.redisKey = '8vMWgN1AToKLVoew1p8dNMIuPHHiSNifRe2RdaOSN1I=';
   config.host = "https://a.appice.io";
   config.secretKey="FA50F-3B7E6-754C2-B3F12-F279E";
   config.validity= {expiresIn :'86400s'};
   config.payloadsize='1024';
   config.atRiskAudience = "Users At Risk";
   config.campHost = "https://cdn.appice.io";
   config.appiceAppId=['5aa7b71bd0df368e46dede9e','57e8f2d84e25c0b702996cb0','583293316940eec96800559f']; //ML appId Queue
   config.demoAppId=['5cffb7e3164435ef0f29f65b']; //Demo appId (POC apps list)
   config.whitelistedIps=['localhost:3000','localhost','127.0.0.1:8080','stgweb.appice.io'] //Added Whitelisted IPs
module.exports = config;

// End of File 