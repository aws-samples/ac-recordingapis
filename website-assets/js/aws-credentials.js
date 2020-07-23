function initAWS(){ 
 	AWS.config.region = 'us-east-1'; 
   } 

   
 $(document).ready(initAWS); 
    

   function getRegion(){ 
      return 'us-east-1';
   } 

   function getWebSocket(){ 
      return 'wss://k6u2wqrp9c.execute-api.us-east-1.amazonaws.com/Prod';
   } 

   function getInstanceId(){ 
      return '7c848a96-b33c-4535-896c-bf469caaa187';
   } 

   function getInstanceName(){ 
      //return 'amzndemochat';
	  // return 'amzn-connect2';
	   return 'amznwestvoicechat';
   } 

   function getBucketName(){ 
      return 'ai-powered-speech-audio-s1';
   } 

   function getSolutionId(){ 
      return 'SO0054';
   } 

   function getUUID(){ 
      return '3c57c113-2c3c-415f-98bf-8a892b0d6c85';
   } 

   function  getDashboardUsage(){ 
      return 'Yes';
   } 

   function  getGatewayAPI(){ 
	      //return 'spzvosrc6d';
	   return '4w92374aqk';
   } 
