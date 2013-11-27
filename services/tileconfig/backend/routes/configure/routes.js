var jive = require("jive-sdk");

exports.configure = {
    'verb' : 'get',
    'path' : '/sfdc/configure',
    'route': function(req, res){
        var conf = jive.service.options;
        res.render('configuration.html', { host: conf.clientUrl + ':' + conf.port  });
    }
};
