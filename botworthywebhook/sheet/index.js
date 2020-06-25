const ssmStore = require('aws-param-store');
const GoogleSpreadsheet = require('google-spreadsheet');
const randomatic = require('randomatic');
const getKeys = ssmStore.getParametersSync(
    [
        '/botworthy/privateKey',
        '/botworthy/clientEmail',
        '/botworthy/sheetId'
    ],{
        region: 'us-west-2'
    }
);

const config ={
    client_email : getKeys.Parameters[0].Value,
    private_key: getKeys.Parameters[1].Value
}

const sheets = new GoogleSpreadsheet(getKeys.Parameters[2].Value);
const gsService = fn =>{
    return new Promise((resolve,reject)=>{
        sheets.useServiceAccountAuth(config, () =>{
            sheets.getInfo((err, info)=>{
                if(err) return reject(err);

                fn(info,resolve,reject);
            });
        });
    });
}

module.exports.getJobs = index =>{
    return gsService((info,resolve,reject)=>{
        info.worksheets[index].getRows({}, (err, rows)=>{
            if(err) return reject(err);
            const result = rows.map(item=> `${item.id} - ${item.title}`).join('\n');
            return resolve(result);
        });
    });
}


module.exports.storeRecord = (obj, index) => {
    return gsService((info, resolve, reject) => {
       const candidateCode = randomatic('0',6);
       info.worksheets[index].addRow({
           workEx: obj.workEx,
           jobCode: obj.jobCode,
           isAdult: obj.isAdult,
           compScience: obj.compScience,
           relocate: obj.relocate,
           date: new Date().toDateString(),
           candidateCode,
           status: 'Pending'
       }, err => {
           if (err) return reject(err);
           return resolve(candidateCode);
       });
    });
}
  
module.exports.getApplicationStatus = (code, index) =>{
    return gsService((info, resolve, reject) => {
        info.worksheets[index].getRows({
            query: `candidatecode=${code}`
        }, (err, rows) => {
            if (err) return reject(err);

            if(rows.length !== 0){
                switch (rows[0].status){
                    case 'Pending':
                        return resolve("We are still wating for the result for your application . Please check again at later time");
                        break;
                    case 'Shortlisted':
                        return resolve('Congratulations. You have been shortlisted for the next step');
                        break;
                    case 'Rejected':
                        return resolve('We are sorry to inform you that your application has ben rejected.');
                        break;
                    default:{
                        return resolve("Sorry ,we are unable to get your application status");
                    }
                }
            } else{
                return resolve(false);
            }
        });
    });
}