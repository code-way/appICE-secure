var usersApi = {},
    campaignCommon=require('../appice/campaign.common')
    common = require('./common'),
    moment = require('moment'),
    cacheApi = require('./appice.cache'),
    Promise = require('bluebird'),
		async = require('async'),
		appICEConfig = require('../Config/config');

(function (usersApi) {
    var appAndUserInf={};
    usersApi.getAppAndUserData = function(reqData){
			return new Promise(async (resolve,reject)=>{
				appAndUserInf={};
    		if(!reqData.body.device_id || reqData.body.device_id == undefined){
    			common.returnMessage(reqData, 400, 'Device id is missing');
    			return false;
				}
				//Collect all the data through Promise 
				reqData.body.did = reqData.body.device_id;
					let userData = await getUserProfiles(reqData);
					let competitingData = await getCompetingApps(reqData);
					let activeTransactionalCampaigns = await getActiveTransactionalCampaigns(reqData);
					let activeDataCampaigns=await getActiveCampaigns(reqData);
					appAndUserInf = {
						'userProfile' : userData,
						'competingApps' : competitingData,
						'activeTransCampaigns' : activeTransactionalCampaigns,
						'activeCampaigns' : activeDataCampaigns
					}
					resolve(appAndUserInf);
			})
    		

    }

  // get app Active Modules
  // get User profile
  function getUserProfiles (reqData){
	   return new Promise((resolve, reject) =>{

    		if(reqData.body.userProfile && reqData.body.userProfile != 'false'){
					var userProfile = [];

					common.db.collection('app_users' + reqData.body.app_id).findOne({'did':reqData.body.did},function(err,deviceDetail){
						if(deviceDetail){
							var deviceProfile={};
							//deviceProfile.lastupdated = userProfile.lastupdated;
							deviceProfile.did = deviceDetail.did;
							deviceProfile.gender = (deviceDetail.gender)?deviceDetail.gender:"";
							deviceProfile.Interests = (deviceDetail.Interests)?deviceDetail.Interests:[];
							deviceProfile.wifihulls = (deviceDetail.wifihulls)?deviceDetail.wifihulls:[];
							deviceProfile.locationhull = (deviceDetail.locationhull)?deviceDetail.locationhull:[];
							deviceProfile.geo = {
								cty:(deviceDetail.cty)?deviceDetail.cty:"",
								cc:(deviceDetail.cc)?deviceDetail.cc:""
							};
							deviceProfile.sc = (deviceDetail.sc)?deviceDetail.sc:0;
							deviceProfile.tsd = (deviceDetail.tsd)?deviceDetail.tsd:0;
							deviceProfile.fs = (deviceDetail.fs)?deviceDetail.fs:0;
							deviceProfile.ls = (deviceDetail.ls)?deviceDetail.ls:0;
							deviceProfile.pushInterval = 1;
							if(deviceDetail.history && deviceDetail.history[deviceDetail.history.length-1]){
								if(deviceDetail.history[deviceDetail.history.length-1].refname){
									deviceProfile.refname = deviceDetail.history[deviceDetail.history.length-1].refname;
								}
							}
							else{
								deviceProfile.refname = '';
							}
								 userProfile.push(deviceProfile);
						}
						resolve(userProfile);
					});
    		}
    		else {
    			return resolve([])
    		}
	});
}

  // get competing apps
  function getCompetingApps (reqData){
	return new Promise((resolve, reject) =>{
		if(reqData.body.competingApps && reqData.body.competingApps != 'false' ){

			cacheApi.getKey("otherapp_"+reqData.body.app_id,function(err,cacheResult){
				if(err || cacheResult==null || cacheResult ==''){
					common.db.collection('otherapp_groups').find({appid:reqData.body.app_id, deleted : false}).toArray(function(err,data){
						if(err){
							console.log(" otherapp_groups err =>"+JSON.stringify(err))
							resolve([]);
						}
						else{
              var appList = [];
							if(data && data.length > 0){
								data.forEach(function(alist){
									alist.list.forEach(function(app){
										appList.push(app)
									});
								});

								cacheApi.setKey("otherapp_"+reqData.body.app_id,JSON.stringify(appList));
    
							}
              resolve(appList);
						}
					});
				}
				else{
					var appList = JSON.parse(cacheResult);
        	resolve(appList);
				}
			});
		}
		else {
      if('56d054799338912a4238f797' == reqData.body.app_id){
          console.log(`return blank getCompetingApps`)
      }
			return resolve([]);
		}
	})
}

// get app Active Campaigns
function getActiveCampaigns (req){
	return new Promise((resolve, reject) =>{
		if(req.body.activeCampaigns && req.body.activeCampaigns != 'false'  ){
			// check campaign into cache
			cacheApi.getKey('campaigns_'+ req.body.app_id,function(err,result){
				if(err || result==null){
					var commands=[];
					var retVal=[];
					var retValAll=[];
					var feedBackCampaignExists = false;
					var audId="";
					var cid=null;
					var atRiskCommand = false;

					//Build match criteria.
					var match = {};
					var unwind = {};
					if(req.body.lastPullTime){
						match.ud = {$gt:parseInt(req.body.lastPullTime)};
					}

					if(req.body.command){
						commands = JSON.parse(req.body.command);
						//When there is request for a particular campaign don not send default feedback campaign.
						if(commands.length>0){
							cid = commands[0].cid;
							match._id=common.O_id(cid);
							feedBackCampaignExists = true;
							if(commands[0].action=="atrisk"){
								atRiskCommand = true;
							}
						}
					}

					if(req.body.childAppId && req.body.childAppId!==""){
						//If ud is not set then it is the first call to get active campaigns.
						if(!match.ud){
							match.st = "ACTIVE";
							match['childIds.approved'] = true;
							match['childIds.deleted'] = false;
						}
						match['childIds.id'] = req.body.childAppId;
						unwind = {$unwind:"$childIds"};
					}

					else{
						if(!match.ud){
							match.st = "ACTIVE";
						}
						//This is to avoid unwind error
						unwind = {"$match":match};
					}

					match.t = {$nin:['SMS', 'Email']};
					common.db.collection('campaigns_'+ req.body.app_id).aggregate([
						unwind,
						{$match:match},
						{$sort:{ud: -1,_id:1}}

					],function(err,campaigns){
						//console.log(campaigns);
						if(err){
							console.log(err);
							return resolve([]);
						}
						//console.log(campaigns);
						async.forEach(campaigns, function(item, callback){
							var addCampaign = true; // This flag is used to control atrisk campaigns.
							var childApproved,childDeleted,sdkDeletedFlag;
							if(item.childIds && item.childIds.length>0){
								if(item.childIds.approved==true){
									childApproved = true;
								}
								else{
									childApproved = false;
								}
								if(item.childIds.deleted==true){
									childDeleted = true;
								}
								else{
									childDeleted = false;
								}

								sdkDeletedFlag = (item.st == "ACTIVE" && childApproved && !childDeleted)?false:true;
							}
							else{
								sdkDeletedFlag = (item.st == "ACTIVE")?false:true;
							}
							var obj={};
							obj._id=item._id;
							obj.tid=item.tid;
							obj.t=item.t;
							obj.sd=item.sd;
							obj.ed=item.ed;
							obj.ud = item.ud;
							obj.d = sdkDeletedFlag;
							obj.delays = (item.delays)? item.delays : 0;
							obj.delayi = (item.delayi)? item.delayi : 0;
							obj.delayu = (item.delayu)? item.delayu : 'Minutes';
							obj.fre = {};
							if(item.c_event){
								obj.c_event = item.c_event;
								obj.c_period = item.c_period;
							}
							obj.fre.dp = 0;
							if(item.d==false){
								obj.fre=item.fre;
								obj.fre.dp = 0;
								if(item.daySelector=="ALLWEEK"){
									obj.allweek=true;
									obj.days=[];
								}
								else{
									obj.allweek=false;
									obj.days=item.days;
								}
								if(item.timeSelector=="ALLDAY"){
									obj.allday=true;
								}
								else{
									obj.allday=false;
									if(item.time && item.time.length>0){
										obj.time={start:item.time[0],end:item.time[1]};
									}
									else{
										obj.time={start:8,end:20};
									}

								}
							}
							if(item.t!=="FEEDBACK"){
								//async Call (parallel)
								async.parallel(
								[
									function(callback){
										if(obj.tid){
											//console.log("checking for template data");
											common.db.collection('templates_'+ req.body.app_id).findOne({"isTemplateDeleted":"false","_id": common.O_id(obj.tid)},function (err, tool) {
												//console.log(tool);
												if(err){
													callback(err);
												}
												else{
													if(tool && item.d==false){
														obj.data={};
														var data={};
														switch(obj.t){
															case "PUSH":
															tool.template._id = tool._id;
															populatePushObject(tool.template,data,req);
															obj.data = data;
															break;
															case "IN-APP":
															populateInAppObject(tool.template,data);
															obj.data = data;
															break;
															case "RATING":
															populateRatingObject(tool.template,data);
															obj.data = data;
															break;
															case "SURVEY":
															var q = [];
															populateSurveyObject(tool.template,q);
															obj.data.q = q;
															break;
														}
													}
													callback();
												}
											});
										}
										else{
											callback()
										}
									},
									function(callback){
										if(item.aud==undefined || item.aud=="" ){
											audId = common.O_id();
										}
										else{
											audId = common.O_id(item.aud);
										}
										common.db.collection('audiencesegment_'+ req.body.app_id).findOne({"_id": audId, "$or": [{'isDeleted':false},{'isDeleted':null}]},function(err,audience){
											if(err){
												callback(err);
											}
											else{
												if(audience && item.d==false){
													obj.aud = audience.segmentinfo;
													if(obj.aud.who && obj.aud.who.length > 0){
														obj.aud.who.forEach(function(who){
															if(who.operand == 'did' && who.operator == 'in' && who.value.indexOf(';') >= 0){
																who.value = who.value.split(';');
															}
															// validate custom var and send array if select in operator
															if ( who.operand.indexOf('_custom') >= 0 && who.operator == 'in' && who.value.indexOf(',') >= 0) {
																who.value = who.value.split(',');
															}
															else if (who.operand.indexOf('_custom') >= 0 && who.operator == 'in'){
																who.value = [who.value];
															}
														})
													}

													//Do not send atrisk active campaigns when devices pulls active campaigns.
													if(audience.name == semusiConfig.atRiskAudience && !atRiskCommand){
														addCampaign = false;
													}
													if(isStaticAudience(obj.aud)){
														if(obj.t=="PUSH"){
															obj.fre.dp=1;
														}
													}
												}
												else{
													//Add a key to indicate this campaign is sent via direct push, and handle its frequency by doing -1.
													if(obj.t=="PUSH"){
														obj.fre.dp=1;
													}
												}
												callback();
											}
										});

									}
								],function(err){
									if(err){
										callback(err);
									}
									else{
										// dump all valid campaigns that will store in cache below of code
										if(addCampaign){
											obj.st = parseInt(obj.ud)+1; //This is used on the client side to manage fetching of active campaigns and ignore device time if it is wrong. Add 1 milisecond if user query on database like $gt.
											retValAll.push(obj);
										}

										// validate campaign now or delayed
										if(obj.delays && obj.aud && obj.aud.what && (obj.aud.what.length == 1 || obj.aud.what.length == 0) ){
											validateDelayedCampaign(obj, req, function(error, campData, status){
													if(!error && campData){
														// prepare live event property
														prepareLiveEvents(campData.e, obj, true);
														retVal.push(obj);
													}
													else if(status){
														retVal.push(obj);
													}
													callback();
											});
										}
										else{
											// validate live event and check user is able or not for this campaign
											if(obj.aud && obj.aud.what && obj.aud.what.length > 0){
												campaignCommon.validateCampaignUser(req.body.app_id, item._id, req.body.device_id, function(error, isValidate, uData){
													// allow campaign if user is valid for this campaign
													if(isValidate){
														if(addCampaign){
															if(uData.e){
																// prepare live event property
																prepareLiveEvents(uData.e, obj, true);
															}
															retVal.push(obj);
														}
													}
													else if(isValidate === false && uData == null){
														// prepare live event property
														prepareLiveEvents(obj.aud.what, obj, false);
														retVal.push(obj);
													}
													// allow campaign if not exists in cache
													else if(error){
														if(addCampaign){
															retVal.push(obj);
														}
													}
													callback();
												});
											}
											else{ // non live event campaign
												if(addCampaign){
													retVal.push(obj);
												}
												callback();
											}
										}
									}
								});
							}
							else{
								feedBackCampaignExists = true;
								retValAll.push(obj);
								retVal.push(obj);
								callback();
							}
						},function(error){
								if (error){
									//Do something on error
									return resolve(retVal);
								}else{
									//Return final data.
									if(!feedBackCampaignExists){
										if(req.defaultuninstallcampaign == true || req.defaultuninstallcampaign==undefined && !atRiskCommand){
											retVal.push(returnDefaultFeedbackCampaign(req.appCreatedOn));
											retValAll.push(returnDefaultFeedbackCampaign(req.appCreatedOn));
										}
									}
									cacheApi.setKey('campaigns_'+ req.body.app_id,JSON.stringify(retValAll));
									return resolve(retVal);
								}
						});
					});
				}
				else
				{
					var data = '';
					var lastPullTimeCamp = [];
					data = JSON.parse(result);
					if(req.body.lastPullTime){
						async.forEach(data, function(item, callback){
							if(item.delays && item.aud && item.aud.what && ( item.aud.what.length == 1 || item.aud.what.length == 0) ){
								validateDelayedCampaign(item, req, function(error, campData, status){
									if(!error && campData){
										// prepare live event property
										prepareLiveEvents(campData.e, item, true);
										lastPullTimeCamp.push(item);
									}
									else if(status){
									lastPullTimeCamp.push(item);
								}
									callback();
								});
							}
							else{
								if(parseInt(item.ud) > parseInt(req.body.lastPullTime)){
									// validate live event and check user is able or not for this campaign
									if(item.aud && item.aud.what && item.aud.what.length > 0){
										campaignCommon.validateCampaignUser(req.body.app_id, item._id, req.body.device_id, function(error, isValidate, uData){
											// allow campaign if user is valid for this campaign
											if(isValidate){
												if(uData.e){
													// prepare live event property
													prepareLiveEvents(uData.e, item, true);
												}
												lastPullTimeCamp.push(item);
											}
											else if(isValidate === false && uData == null){
												// prepare live event property
												prepareLiveEvents(item.aud.what, item, false);
												lastPullTimeCamp.push(item);
											}
											// allow campaign if not exists in cache
											else if(error){
												lastPullTimeCamp.push(item);
											}
											callback();
										});
									}
									else{ // non live event campaign
										lastPullTimeCamp.push(item);
										callback();
									}
								}
								else{
									callback();
								}
							}

						}, function(err){
							if(lastPullTimeCamp.length == 0 ){
								if(!feedBackCampaignExists){
									if(req.defaultuninstallcampaign == true || req.defaultuninstallcampaign==undefined && !atRiskCommand){
										lastPullTimeCamp.push(returnDefaultFeedbackCampaign(req.appCreatedOn));
										return resolve(lastPullTimeCamp);
									}
								}
							}else{
								return resolve(lastPullTimeCamp);
							}
						});
					} else {
							//console.log('not pull time')
							var camps = [];
							//data.forEach(function(item){
							async.forEach(data, function(item, callback){
								// check delayed unit into campaign
								if(item.delays && item.aud && item.aud.what && ( item.aud.what.length == 1 || item.aud.what.length == 0 ) ){
									validateDelayedCampaign(item, req, function(error, campData, status){
										if(!error && campData){
											// prepare live event property
											prepareLiveEvents(campData.e, item, true);
											camps.push(item);
										}
										else if(status){
											camps.push(item);
										}

										callback();
									});
								}
								else{
									if(parseInt(item.ed) > (common.getCurrentEpochTime()*1000)){
										// validate live event and check user is able or not for this campaign
										if(item.aud && item.aud.what && item.aud.what.length > 0){
											campaignCommon.validateCampaignUser(req.body.app_id, item._id, req.body.device_id, function(error, isValidate, uData){
												// allow campaign if user is valid for this campaign
												if(isValidate){
													if(uData.e){
														// prepare live event property
														prepareLiveEvents(uData.e, item, true);
													}
													camps.push(item);
												}
												else if(isValidate === false && uData == null){
													// prepare live event property
													prepareLiveEvents(item.aud.what, item, false);
													camps.push(item);
												}
												// allow campaign if not exists in cache
												else if(error){
													camps.push(item);
												}
												callback();
											});
										}
										else{ // non live event campaign
											camps.push(item);
											callback();
										}
									}
									else{
										callback();
									}
								}
							}, function(err){
								return resolve(camps);
							});
						}
				}
			});
		}
		else {
			return resolve([]);
		}
	})
}

//isStatic Audience Segment Info 

isStaticAudience = function(segmentinfo){
	var retVal = true;
	if(segmentinfo){
			if(segmentinfo.where){
					for(var i=0; i<segmentinfo.where.length; i++){
							var item = segmentinfo.where[i];
							if(item.category=="Geo"){
									retVal = true;
									break;
							}
							else{
									retVal = false;
							}
					}
			}
			if(segmentinfo.what && segmentinfo.what.length>0){
					retVal = false;
			}
			if(segmentinfo.when && segmentinfo.when.length>0){
					retVal = false;
			}
	}
	return retVal;

}

// 'Notification - Type ' - Push 

function populatePushObject(template,data,req){
	data.nh=template.notificationHeader;
	data.nd=template.notificationDescription;
	data.ni=template.notificationImage;
	data.end=template.expandedNotificationDescription;
	data.eni=template.expandedNotificationImage;
	data.eurl=template.externalUrl;
	data.et = template.notificationType;
	data.actions = template.actions;
	data.sound = template.sound;
	data.vibrate = template.vibrate;
	data.badge = template.badge;
	if(template.cdata){
			if(common.calculateDataSize(template.cdata)  > appICEConfig.payloadsize ){
					data.cdata = appICEConfig.campHost+"/o/templates/getCustomData?app_id="+req.body.app_id+"&api_key="+req.body.api_key+"&tid="+template._id;
			}
			else{
					data.cdata = template.cdata;
			}
	}
}

// 'Notification - Type ' - In-APP 


function populateInAppObject(template,data){
	data.mode=template.view_mode;
	data.nh=template.notificationHeader;
	data.nd=template.notificationDescription;
	data.ni= (template.notificationImage && template.notificationImage != '')? encodeURI(appICEConfig.cdnUrl+template.notificationImage) : template.notificationImage;
	data.ii=template.iconImage;
	data.aurl=template.actionUrl;
	data.at=template.actionTitle;
	data.sa=template.showAction;
}

// 'Notification - Type ' - Rating 

function populateRatingObject(template,data){
	data.q=template.question;
	data.ai=template.activeImage;
	data.di=template.disabledImage;
	data.m=template.message;
	data.at=template.title;
}

// 'Notification - Type ' - Survey 

function populateSurveyObject(template,q){
	//console.log(template.q);
	if(template && template.q){
		template.q.forEach(function(item){
			var question={};
			var options =[];
			question.id=item.id;
			question.qt=item.questionText;
			question.t=item.questionType;
			question.st=item.sampleText;
			question.oo=item.otherOption;
			item.questionOptions.forEach(function(opt){
				var option={};
				option.ot= opt.optionText;
				options.push(option);
			});
			question.qo=options;
			q.push(question);
		});
	}
}


  // get Active Transactional Campaign
  function getActiveTransactionalCampaigns (reqData){
	  return new Promise((resolve, reject) =>{
  		if(reqData.body.activeTransactional){
  			cacheApi.getKey('trans_campaigns_'+ reqData.body.app_id,function(err,result){
  				if(err || result==null || result ==''){
  					var retVal=[];
  					var retAllVal=[];
            var match = (reqData.body.lastTPullTime)? reqData.body.lastTPullTime : reqData.body.currentTime;
  					common.db.collection('transaction_camp_'+ reqData.body.app_id).find({createdAt:{$gte:match}}).toArray(function(err,campaigns){
  						if(err){
                console.log(`getActiveTransactionalCampaigns err => ${err}`)
  							return resolve([])
  						}
  						else{
  							async.each(campaigns, function(camp, callback){
  								if(camp.payload){
  									camp.payload.camp_id = camp._id;
  									camp.payload.cmd = "#transactional";

                    // validate st key in campaign
                    if(camp.payload.st){
                        camp.payload.st = camp.createdAt
                    }

  									// validate cdata if it's more than 2kb send url to get form db
  									if(camp.payload && camp.payload.cdata){
  										if(common.calculateDataSize(camp.payload.cdata)  > appICEConfig.payloadsize){
  											camp.payload.cdata = appICEConfig.host+"/o/templates/getCustomData?app_id="+reqData.body.app_id+"&api_key="+reqData.body.api_key+"&tid="+camp._id+"&ct=trans";
  										}
  									}
  									retAllVal.push(camp.payload);
  								}

  								// validate Transactional Campaign
  								validateTransactionCampaign(reqData, camp.payload, retVal, function(){
  									callback();
  								});
  							}, function(error, res){
  								// set active campaign into cache
  								if(retAllVal.length > 0){
  									cacheApi.setKey('trans_campaigns_'+ reqData.body.app_id,JSON.stringify(retAllVal));
  								}
                  console.log(`db retVal = >${JSON.stringify(retVal)}`)
  								return resolve(retVal);
  							});
  						}
  					});
  				}
  				else {
  					let data = JSON.parse(result);
  					let retVal = [];

  					async.each(data, function(camp, callback){
    						// validate Transactional Campaign
    						validateTransactionCampaign(reqData, camp, retVal, function(){
    							callback();
    						});
  					}, function(error, res){
              //console.log(`cache retVal = >${JSON.stringify(retVal)}`)
  						return resolve(retVal);
  					});
  				}
  			});
  		}
  		else {
  			return resolve([]);
  		}
	})
}

  // validate Transactional campaigns
  var validateTransactionCampaign = function(reqData, camp, retVal, callback){
      try{
          //console.log(`'transaction_key'+camp._id+reqData.body.app_id => ${'transaction_key'+camp.camp_id+reqData.body.app_id}`)
          cacheApi.getKey('transaction_key'+camp.camp_id+reqData.body.app_id, function(error, dids){
            //console.log(`dids => ${dids}`)
            if(error){
                 callback();
            }
            else if(dids){
              // if dids contain plain string
              try{
                  dids = JSON.parse(dids);
              } catch(e){
                  console.log('inside else json parser ::'+e.message);
              }

              dids = (Array.isArray(dids))? dids : [dids];
              if(dids.indexOf(reqData.body.did) >= 0){

                // validate lastTPullTime key that is exists or not in request
                if(reqData.body.lastTPullTime){

                  // compare lastTPullTime and campaign start time to get lasted campaign
                  if(reqData.body.lastTPullTime < camp.st){
                    retVal.push(camp);
                  }
                }
                else{
                  retVal.push(camp);
                }
              }
            }
            callback();
          });
      }
      catch(e){
          console.log(e.message)
          callback();
      }
  }


    returnDefaultFeedbackCampaign = function(startDate){
        if(startDate==undefined || startDate==null){
            startDate = common.getCurrentEpochTime()*1000;
        }
        var obj = {};
        obj._id = "xxxxx";
        obj.tid = "xxxxx";
        obj.t = "FEEDBACK";
        obj.sd = startDate*1000;
        obj.ed = common.getFutureEpochTime(1);
        obj.st = moment().valueOf()-180000; //This is used on the client side to manage fetching of active campaigns and ignore device time if it is wrong.
        return obj;
    }

    var prepareLiveEvents = function (obj, item, isExists){
    	if(isExists){
    		obj.forEach(function(what, key){
    			if(item.aud.what[key].operand == 'install'){
    				item.aud.what[key].process = false; // false mean it will not process on client side
    				item.aud.what[key].state = true; // found event on server
    			}
    			else{
    				item.aud.what[key].process = what.p; // false mean it will not process on client side
    				if(typeof what.s === "boolean"){
    					item.aud.what[key].state = what.s; // found event on server
    					//item.aud.what[key].value = what.s;
    				}
    				else{
    					item.aud.what[key].state = true; // found event on server
    					//item.aud.what[key].value = true;
    				}
    			}

    			// check event segment information
    			if(item.aud.what[key].attr && item.aud.what[key].attr != ''){
    				item.aud.what[key].segment={check:{}}
    				//item.aud.what[key].segment.check[item.aud.what[key].operand] = {op:item.aud.what[key].operator,v:item.aud.what[key].state}
    				item.aud.what[key].segment.check[item.aud.what[key].operand] = {op:item.aud.what[key].operator,v:what.s}
    				//item.aud.what[key].value = true; //item.aud.what[key].value;
    				item.aud.what[key].state = true; //item.aud.what[key].value;
    			}

    			if(item.aud.what[key].attr){
    				delete item.aud.what[key].attr;
    			}``
    		});
    	}
    	else{
    		obj.forEach(function(what){
    			if(what.operand == 'install'){
    				what.process = false; // false mean it will not process on client side
    				what.state = true; // found event on server
    			}
    			else{
    				what.process = true; // false mean it will not process on client side
    				what.state = false; // found event on server
    			}

    			// check event segment information
    			if(what.attr && what.attr != ''){
    				what.segment={check:{}}
    				what.segment.check[what.operand] = {op:what.operator,v:what.value}
    				//   what.value = what.state;
    				//what.value = true; // For Shine.com Fix
    			}

    			if(what.attr){
    				delete what.attr;
    			}
    		});
    	}
    }

}(usersApi));

module.exports = usersApi;

