var jive = require('jive-sdk');

function processTileInstance(instance) {
    if ( instance['name'] !== 'opportunity_detail') {
        return;
    }

    var eventContext = { 'eventListener' :'sfdc', 'instance' : instance };
    jive.context.scheduler.schedule('sfdcPullOpportunity', eventContext ).then(function (data) {
        jive.tiles.pushData(instance, data);
    }).catch(function (err) {
        jive.logger.error('Error pushing salesforce data to Jive', err);
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( 'opportunity_detail' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    10000
);

exports.eventHandlers = [
    {
        'event' : jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : processTileInstance
    },

    {
        'event' : jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : processTileInstance
    }
];
