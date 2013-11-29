var jive = require('jive-sdk'),
    q = require('q');

function processTileInstance(instance) {
    jive.logger.info('processTileInstance:');
    var eventContext = { 'eventListener' :'sfdc', 'instance' : instance };

    //
    // 1. pull activity from SFDC and push to Jive
    jive.context.scheduler.schedule('sfdcPullActivity', eventContext );
    // .then(function () {
// 
    // //
    // // 2. pull comments from SFDC and push to Jive
        // return jive.context.scheduler.schedule('sfdcPullComments', eventContext)
    // }).then(function () {
// 
    // //
    // // 3. pull comments from Jive and push to SFDC
        // return jive.context.scheduler.schedule('sfdcPushComments', eventContext)
    // });
}

exports.task = new jive.tasks.build(
    // runnable
    function () {
            jive.logger.info('service.js exports.task:');
            //jive.logger.info(jive.extstreams.findByDefinitionName('opportunity_activity'));
        jive.extstreams.findByDefinitionName('case_activity').then(function (instances) {
            if (instances) {
                instances.forEach(function (instance) {
            jive.logger.info(instance);
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    60000
);