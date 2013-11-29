var jive = require("jive-sdk");

exports.caselistconfigure = {
    'verb' : 'get',
    'path' : '/sfdc/caselist_configure',
    'route': function(req, res){
        var conf = jive.service.options;
        res.render('caselistconfiguration.html', { host: conf.clientUrl + ':' + conf.port  });
    }
};
