/*********************************************************************************************************************
 *  Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solutions Builder
 */

'use strict';

let AWS = require('aws-sdk');
let s3 = new AWS.S3();
const fs = require('fs');
//var _downloadKey = 'agentextensions/latest/web-site-manifest.json';
var _downloadKey = '';
const _downloadLocation = './web-site-manifest.json';

/**
 * Helper function to interact with s3 hosted website for cfn custom resource.
 *
 * @class websiteHelper
 */
let websiteHelper = (function() {

    /**
     * @class websiteHelper
     * @constructor
     */
    let websiteHelper = function() {};

    websiteHelper.prototype.copyWebSiteAssets = function(resourceProperties, cb) {
		var destS3Bucket = resourceProperties.destS3Bucket;
		var destS3KeyPrefix = resourceProperties.destS3KeyPrefix;
		var region = resourceProperties.Region;
		var instanceID = resourceProperties.instanceID;
		var instanceName = resourceProperties.instanceName;
		var gatewayAPI = resourceProperties.gatewayAPI;
		var lambdaARN = resourceProperties.lambdaARN;
		_downloadKey = resourceProperties.manifestLocation
		
        console.log("Copying UI web site");
        console.log(['destination bucket:', destS3Bucket].join(' '));
        console.log(['destination s3 key prefix:', destS3KeyPrefix].join(' '));
        console.log(['region:', region].join(' '));
        console.log(['instanceID:', instanceID].join(' '));
        console.log(['instanceName:', instanceName].join(' '));
        console.log(['gatewayAPI:', gatewayAPI].join(' '));
        console.log(['lambdaARN:', lambdaARN].join(' '));

        fs.readFile(_downloadLocation, 'utf8', function(err, data) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            console.log(data);
            let _manifest = validateJSON(data);

            if (!_manifest) {
                return cb('Unable to validate downloaded manifest file JSON', null);
            } else {
                uploadToS3(_manifest.files, 0, destS3Bucket, destS3KeyPrefix, 
                    function(err, result) {
                        if (err) {
                            return cb(err, null);
                        }
                        console.log(result);
                        createAWSCredentials(destS3Bucket, destS3KeyPrefix, gatewayAPI, region,  instanceID, instanceName, 
                            function(err, createResult) {
                                if (err) {
                                    return cb(err, null);
                                }
                            createContactFlow(destS3Bucket, destS3KeyPrefix, lambdaARN, 
                                function(err, createResult) {
                                    if (err) {
                                        return cb(err, null);
                                    }
                                    //return cb(null, createResult);
                                    removePublicAccess(destS3Bucket, 
                                    function(err, createResult) {
                                        if (err) {
                                            return cb(err, null);
                                        }
                                        return cb(null, createResult);
                                    });
                                });
                            });
                    });
            }

        });

    };
    

    /**
     * Helper function to validate the JSON structure of contents of an import manifest file.
     * @param {string} body -  JSON object stringify-ed.
     * @returns {JSON} - The JSON parsed string or null if string parsing failed
     */
    let validateJSON = function(body) {
        try {
            let data = JSON.parse(body);
            console.log(data);
            return data;
        } catch (e) {
            // failed to parse
            console.log('Manifest file contains invalid JSON.');
            return null;
        }
    };
    
    async function uploadToS3(filelist, index, destS3Bucket, destS3KeyPrefix, cb) {
      if (filelist.length > index) {
          const response = fs.readFileSync(filelist[index], 'utf8');
          var fileDetails = filelist[index];
          fileDetails = fileDetails.substring(2, fileDetails.length);
          let params2 = {
              Bucket: destS3Bucket,
              Key: destS3KeyPrefix + '/' + fileDetails,
              Body: response
          };
            if (filelist[index].endsWith('.htm') || filelist[index].endsWith('.html')) {
                params2.ContentType = "text/html";
            } else if (filelist[index].endsWith('.css')) {
                params2.ContentType = "text/css";
            } else if (filelist[index].endsWith('.js')) {
                params2.ContentType = "application/javascript";
            } else if (filelist[index].endsWith('.png')) {
                params2.ContentType = "image/png";
            } else if (filelist[index].endsWith('.jpg') || filelist[index].endsWith('.jpeg')) {
                params2.ContentType = "image/jpeg";
              } else if (filelist[index].endsWith('.pdf')) {
                  params2.ContentType = "application/pdf";
            } else if (filelist[index].endsWith('.gif')) {
                params2.ContentType = "image/gif";
            } else if (filelist[index].endsWith('.svg')) {
                params2.ContentType = "image/svg+xml";
            };

          s3.putObject(params2, function(err, data) {
                if (err) {
                    console.log(err);
                    return cb(['error copying ', [filelist[index]].join('/'), '\n', err]
                        .join(
                            ''),
                        null);
                }

                console.log([
                    [filelist[index]].join('/'), 'uploaded successfully'
                ].join(' '));
                let _next = index + 1;
                uploadToS3(filelist, _next, destS3Bucket, destS3KeyPrefix, function(err, resp) {
                    if (err) {
                        return cb(err, null);
                    }

                    cb(null, resp);
                });
            });
        } else {
            cb(null, [index, 'files copied'].join(' '));
        }
    }

    /**
     * Helper function to download the website manifest to local storage for processing.
     * @param {string} s3_bucket -  Amazon S3 bucket of the website manifest to download.
     * @param {string} s3_key - Amazon S3 key of the website manifest to download.
     * @param {string} downloadLocation - Local storage location to download the Amazon S3 object.
     * @param {downloadManifest~requestCallback} cb - The callback that handles the response.
     */

    let createAWSCredentials = function(destS3Bucket, destS3KeyPrefix, gatewayAPI, region, instanceId, instanceName, cb) {
        let str = "function initAWS(){ \n";
        str+= " 	AWS.config.region = '" + region  +"'; \n";
        str+= "   } \n\n";
        str+= "   \n $(document).ready(initAWS); \n ";
        str+= "   \n\n";
        str+= "   function getRegion(){ \n";
        str+= "      return '" + region + "';\n";
        str+= "   } \n\n";
        str+= "   function getGatewayAPI(){ \n";
        str+= "      return '" + gatewayAPI + "';\n";
        str+= "   } \n\n";
        str+= "   function getInstanceId(){ \n";
        str+= "      return '" + instanceId + "';\n";
        str+= "   } \n\n";
        str+= "   function getInstanceName(){ \n";
        str+= "      return '" + instanceName + "';\n";
        str+= "   } \n\n";		
        //console.log(str);
        let params = {
            Bucket: destS3Bucket,
            Key: destS3KeyPrefix + '/js/aws-credentials.js',
            ContentType : "application/javascript",
            Body: str
        };

        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err);
                return cb('error creating ' +destS3Bucket+ ' ' + destS3KeyPrefix +  '/js/aws-credentials.js file for website UI', null);
            }
            console.log('Completed uploading aws-credentials.js')
            console.log(data);
            return cb(null, data);
        });
    };

    let createContactFlow = function(destS3Bucket, destS3KeyPrefix, lambdaARN, cb) {
        var str = 
        `{"modules":[{"id":"2519e05a-2da9-4e60-92e8-778fff6ee1af","type":"Disconnect","branches":[],"parameters":[],"metadata":{"position":{"x":1484.9999898274739,"y":32}}},{"id":"b24b6bc3-829e-45b1-b44f-78f994aef777","type":"Transfer","branches":[{"condition":"AtCapacity","transition":"2519e05a-2da9-4e60-92e8-778fff6ee1af"},{"condition":"Error","transition":"2519e05a-2da9-4e60-92e8-778fff6ee1af"}],"parameters":[],"metadata":{"position":{"x":1231.9999898274739,"y":32},"useDynamic":false,"queue":null},"target":"Queue"},{"id":"a28a2db8-c8a5-4f87-9194-34c8bb28d4da","type":"SetAttributes","branches":[{"condition":"Success","transition":"e57aa249-fc79-4a9c-a9f2-d8ce4609176b"},{"condition":"Error","transition":"e57aa249-fc79-4a9c-a9f2-d8ce4609176b"}],"parameters":[{"name":"Attribute","value":"true","key":"recording","namespace":null}],"metadata":{"position":{"x":718.9999898274739,"y":35.99999491373697}}},{"id":"26b88ca5-7cb0-473c-b7dd-56314770cf39","type":"SetRecordingBehavior","branches":[{"condition":"Success","transition":"a28a2db8-c8a5-4f87-9194-34c8bb28d4da"}],"parameters":[{"name":"RecordingBehaviorOption","value":"Enable"},{"name":"RecordingParticipantOption","value":"Both"}],"metadata":{"position":{"x":445.99998982747394,"y":105.99999491373697}}},{"id":"e57aa249-fc79-4a9c-a9f2-d8ce4609176b","type":"SetQueue","branches":[{"condition":"Success","transition":"b24b6bc3-829e-45b1-b44f-78f994aef777"},{"condition":"Error","transition":"b24b6bc3-829e-45b1-b44f-78f994aef777"}],"parameters":[{"name":"Queue","value":"arn:aws:connect:us-west-2:609992989386:instance/7864071c-acb8-4287-b84e-0b340400bd11/queue/23954e19-a542-4afd-9ef7-11180529362c","namespace":null,"resourceName":"BasicQueue"}],"metadata":{"position":{"x":965.9999898274739,"y":37.99999491373697},"useDynamic":false,"queue":{"id":"arn:aws:connect:us-west-2:609992989386:instance/7864071c-acb8-4287-b84e-0b340400bd11/queue/23954e19-a542-4afd-9ef7-11180529362c","text":"BasicQueue"}}},{"id":"6073d2cf-2f3d-4441-8707-795e46004cee","type":"GetUserInput","branches":[{"condition":"Evaluate","conditionType":"Equals","conditionValue":"1","transition":"26b88ca5-7cb0-473c-b7dd-56314770cf39"},{"condition":"Evaluate","conditionType":"Equals","conditionValue":"2","transition":"5ff6d3b3-f157-4b84-a11d-8d97398b8a39"},{"condition":"Timeout","transition":"5ff6d3b3-f157-4b84-a11d-8d97398b8a39"},{"condition":"NoMatch","transition":"5ff6d3b3-f157-4b84-a11d-8d97398b8a39"},{"condition":"Error","transition":"5ff6d3b3-f157-4b84-a11d-8d97398b8a39"}],"parameters":[{"name":"Text","value":"Press 1 to start recording, Press 2 to not record the call.","namespace":null},{"name":"TextToSpeechType","value":"text"},{"name":"Timeout","value":"5"},{"name":"MaxDigits","value":"1"}],"metadata":{"position":{"x":172.99998982747394,"y":134.99999491373697},"conditionMetadata":[{"id":"5d2fcac2-c007-4ede-9141-c88be4aba37e","value":"1"},{"id":"688a8308-6b25-412e-88c0-a897f34e2049","value":"2"}],"useDynamic":false},"target":"Digits"},{"id":"5ff6d3b3-f157-4b84-a11d-8d97398b8a39","type":"SetAttributes","branches":[{"condition":"Success","transition":"e57aa249-fc79-4a9c-a9f2-d8ce4609176b"},{"condition":"Error","transition":"e57aa249-fc79-4a9c-a9f2-d8ce4609176b"}],"parameters":[{"name":"Attribute","value":"false","key":"isrecording","namespace":null}],"metadata":{"position":{"x":713,"y":287}}}],"version":"1","type":"contactFlow","start":"6073d2cf-2f3d-4441-8707-795e46004cee","metadata":{"entryPointPosition":{"x":14.99998982747394,"y":14.99998982747394},"snapToGrid":false,"name":"Recording flow","description":null,"type":"contactFlow","status":"published","hash":"ba9aadf6effb2a670fe8df0b786dcdfbfd8d4bf20e66b8888e49d5c0ec03ca4c"}}`;
        let params = {
            Bucket: destS3Bucket,
            Key: 'Blog_Recording_APIs.json',
            ContentType: 'application/json',
            Body: str
        };

        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err);
                return cb('error creating Blog_Recording_APIs.json', null);
            }
            console.log('Completed uploading Blog_Recording_APIs contact flow')
            console.log(data);
            return cb(null, data);
        });
        
    };
    
    let removePublicAccess = function (bucketName, cb){
        var params = {
          Bucket: bucketName,
          PublicAccessBlockConfiguration: { /* required */
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true
          }
        };
        s3.putPublicAccessBlock(params, function(err, data) {
          if (err) {
              console.log(err, err.stack); // an error occurred
              cb(err, null);
          }
          else{
              console.log('Successfully removed public access');
              console.log(data);           // successful response
              cb(null, data);
          }     
          
        })    
    }
    
    return websiteHelper;

})();

module.exports = websiteHelper;