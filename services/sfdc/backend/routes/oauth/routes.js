var sfdcQueryer = require('./sfdcQueryer.js');

exports.query = {
    'verb' : 'get',
    'path' : '/sfdc/salesforce/query',
    'route' : sfdcQueryer.handleSfdcQuery
};