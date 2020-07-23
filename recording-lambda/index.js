const AWS = require('aws-sdk')
const connectInstanceId = process.env.INSTANCE_ID;
AWS.config.update({region: process.env.REGION_ID});
const connect = new AWS.Connect({ region: process.env.REGION_ID }, {apiVersion: '2017-08-08'});


exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    var body = JSON.parse(event.body);
    var status = 200;
    var message = "Success";
    var operation = body.operation;
    try{
        var resp;
        if(operation == 'START'){
            resp = await startContactRecording(connectInstanceId, body.contactId, body.initialContactId, body.voiceRecordingTrack);
        }else if(operation == 'STOP'){
            resp = await stopContactRecording(connectInstanceId, body.contactId, body.initialContactId);
        }else if(operation == 'PAUSE'){
            resp = await suspendContactRecording(connectInstanceId, body.contactId, body.initialContactId);
        }else{
            resp = await resumeContactRecording(connectInstanceId, body.contactId, body.initialContactId);
        }
        console.log(resp);
    }catch(e){
        console.log(e);
        status = 200;
        message = e.message;
    }
    const response = buildResponse(status,message, operation);
    return response;
};

function buildResponse(status, message, operation){
    const response = {
        statusCode: status,
        headers: {
             "Access-Control-Allow-Origin" : "*",
            "app": "connect"
        },        
        isBase64Encoded: false,
        body:  JSON.stringify({ message : message, operation : operation})
    };
    console.log(JSON.stringify(response));
    return response;
    
}

const startContactRecording = (instanceId, contactId, initialContactId, voiceRecordingTrack) =>{
	return new Promise((resolve,reject) =>{
	   var config = {VoiceRecordingTrack: voiceRecordingTrack};
       var params = {InstanceId : instanceId, ContactId : contactId, InitialContactId : initialContactId, VoiceRecordingConfiguration : config};       
       console.log(params);
	   connect.startContactRecording(params, function (err, res) {        
		    if (err) 
		         reject(err);
		     else 
				resolve(res);
	    });
	});
}

const stopContactRecording = (instanceId, contactId, initialContactId) =>{
	return new Promise((resolve,reject) =>{
       var params = {InstanceId : instanceId, ContactId : contactId, InitialContactId : initialContactId};       
       console.log(params);
	   connect.stopContactRecording(params, function (err, res) {        
		    if (err) 
		         reject(err);
		     else 
				resolve(res);
	    });
	});
}

const suspendContactRecording = (instanceId, contactId, initialContactId) =>{
	return new Promise((resolve,reject) =>{
       var params = {InstanceId : instanceId, ContactId : contactId, InitialContactId : initialContactId};       
       console.log(params);
	   connect.suspendContactRecording(params, function (err, res) {        
		    if (err) 
		         reject(err);
		     else 
				resolve(res);
	    });
	});
}

const resumeContactRecording = (instanceId, contactId, initialContactId) =>{
	return new Promise((resolve,reject) =>{
       var params = {InstanceId : instanceId, ContactId : contactId, InitialContactId : initialContactId};       
       console.log(params);
	   connect.resumeContactRecording(params, function (err, res) {        
		    if (err) 
		         reject(err);
		     else 
				resolve(res);
	    });
	});
}
