'use strict';
const{
  getJobs,
  storeRecord,
  getApplicationStatus
} = require('./sheet');

const respond = fulfillmentText => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      fulfillmentText
    }),
    headers: {
      "Content-Type": "application/json"
    }
  };
}
module.exports.botworthyWebhook = async event => {
  const incoming = JSON.parse(event.body).queryResult;
  const{
    displayName
  } = incoming.intent;

  if(displayName === 'Get-Openings'){
    //Handle the intent and return response
    const data = await getJobs(0);
    const response = respond(`We have the following opening at the moment: \n\n${data}\n\nTo apply, type 'I wish to apply' `);
    return response;
  } else if (displayName === 'Apply'){
    const storeRec = await storeRecord(incoming.parameters, 1);
    if(storeRecord){
      return respond(`Thank you for your application. Your application code is ${storeRec}. To check back on the status of your applicartion, type 'I wish to know the status'`);
    }
  } else if(displayName === 'Status'){
    const data = await getApplicationStatus(incoming.parameters.candidateCode, 1);
    if(data){
      return respond(data);
    }else {
      return respond('We could not find the application code . Please check the application code .');
    }
  }
};

