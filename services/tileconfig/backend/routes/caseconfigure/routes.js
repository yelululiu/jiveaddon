var jive = require("jive-sdk");

exports.caseconfigure = {
    'verb' : 'get',
    'path' : '/sfdc/caseconfigure',
    'route': function(req, res){
        var conf = jive.service.options;
        res.render('caseconfiguration.html', { host: conf.clientUrl + ':' + conf.port  });
    }
};
