var sampleOauth = require('./sampleOauth.js');

exports.authorizeUrl = {
    'verb' : 'get',
    'path' : '/sfdc/oauth/authorizeUrl',
    'route': sampleOauth.authorizeUrl.bind(sampleOauth)
};

exports.oauth2Callback = {
    'verb' : 'get',
    'path' : '/sfdc/oauth/oauth2Callback',
    'route': sampleOauth.oauth2Callback.bind(sampleOauth)
};
