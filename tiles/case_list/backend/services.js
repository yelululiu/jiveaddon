var jive = require('jive-sdk');

function processCaseListTileInstance(instance) {
    if ( instance['name'] !== 'case_list') {
        return;
    }

    var eventContext = { 'eventListener' :'sfdc', 'instance' : instance };
    jive.context.scheduler.schedule('sfdcPullCaseList', eventContext ).then(function (data) {
        jive.tiles.pushData(instance, data);
    }).catch(function (err) {
        jive.logger.error('Error pushing salesforce data to Jive', err);
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( 'case_list' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    processCaseListTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    20000
);

exports.eventHandlers = [
    {
        'event' : jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : processCaseListTileInstance
    },

    {
        'event' : jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : processCaseListTileInstance
    }
];
