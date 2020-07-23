
# Amazon Connect recording API's demo  

This demo shows how you can leverage [Amazon Connect](https://aws.amazon.com/connect/) api's to start/stop/pause/resume call recordings when the agent is on call with the customer.  These api's come very handy, when accepting PCI/PII type of data from the customers, where agent can manually pause/resume or programatically pause/resume the recording. The sample html page demo's shows both versions.

## Usage
Ensure you are under directory "recording-lambda"
`cd recording-lambda`

Run this command to init npm
`npm init`

Run this command to install the latest version aws-sdk and nodejs modules
`npm install --save aws-sdk`

Use `sam` to build, invoke and deploy the function.

##### SAM Build:
Ensure you are in the root folder

`sam build --use-container`

##### SAM Deploy:
`sam deploy template.yaml --s3-bucket REPLACE_ME --stack-name REPLACE_ME --parameter-overrides ParameterKey=CADS3BucketForWebSite,ParameterValue=REPLACE_ME ParameterKey=instanceIdParam,ParameterValue=REPLACE_ME_WITH_AMAZON_CONNECT_INSTANCE_ID ParameterKey=instanceNameParam,ParameterValue=REPLACE_ME_WITH_INSTANCE_ALIAS --capabilities CAPABILITY_IAM`
      
##### SAM Invoke:
`sam local invoke "CADCallRecordingsControlLambdaFunction" -t template.yaml -e events/resume.json --env-vars events/env.json` 
