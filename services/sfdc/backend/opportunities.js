var jive = require("jive-sdk");
var url = require('url');
var util = require('util');
var sfdc_helpers = require('./sfdc_helpers');
var q = require('q');

var metadataCollection = "sfdcActivityMetadata";
var metadataStore = jive.service.persistence();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

/**
 * Pulls chatter activity from SFDC since the last time it was pulled, for the opportunity encoded in the
 * passed in external stream instance object. The 'ticketID' in the instance object is used to
 * look up the SFDC access token that will be used to query SFDC for the activity.
 * @param extstreamInstance
 * @return array of activity objects
 */
exports.pullActivity = function(extstreamInstance) {

  jive.logger.info('pullActivity:');
  var instance_url = "https://www.salesforce.com/";
  var tokenStore = jive.service.persistence();
  var ticketID = extstreamInstance.config.ticketID;
  return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
    if ( found ) {
      jive.logger.info('louie added pullActivity instance_url: ' + found[0]['accessToken']['instance_url']);
      instance_url = found[0]['accessToken']['instance_url'] + "/";
    }
    return exports.getLastTimePulled(extstreamInstance, 'activity').then(function (lastTimePulled) {
        // var queryTextPosts = util.format("Select Id ,CreatedBy.Name, CreatedDate, Subject, Description FROM Case " +  " WHERE  CreatedDate > %s ORDER BY CreatedDate ASC",        getDateString(lastTimePulled));
        var queryTextPosts = util.format("Select Case.Id, Case.Subject, CreatedBy.Name, CreatedBy.Email, CreatedDate, Id, Field, IsDeleted, NewValue, OldValue from casehistory     " +  " WHERE  CreatedDate > %s ORDER BY CreatedDate DESC",        getDateString(lastTimePulled));
        var uri1 = util.format("/query?q=%s", encodeURIComponent(queryTextPosts));

        return sfdc_helpers.querySalesforceV27(ticketID, uri1).then(function (response) {
            var entity = response['entity'];
            jive.logger.info('salesforce response:'+response);
            jive.logger.info('case results: '+entity);
            return convertToActivities(entity, lastTimePulled, extstreamInstance, instance_url);
        });

    }).catch(function (err) {
        jive.logger.error('Error querying salesforce', err);
    });
  });
};

/**
 * Pulls chatter comments from SFDC since the last time it was pulled, for the opportunity encoded in the
 * passed in external stream instance object. he 'ticketID' in the instance object is used to
 * look up the SFDC access token that will be used to query SFDC for the activity.
 * @param extstreamInstance
 * @return array of comment objects
 */
exports.pullComments = function(extstreamInstance) {
    return exports.getLastTimePulled(extstreamInstance, 'comment').then(function (lastTimePulled) {
        var opportunityID = extstreamInstance.config.opportunityID;
        var query = util.format("SELECT Id, CommentType, CreatedDate, CreatedBy.Name, CreatedBy.Email, FeedItemId, IsDeleted, CommentBody" +
            " FROM FeedComment WHERE ParentId = '%s' AND CreatedDate > %s ORDER BY CreatedDate ASC",
            opportunityID,
            getDateString(lastTimePulled));

        var uri = util.format("/query?q=%s", encodeURIComponent(query));
        var ticketID = extstreamInstance.config.ticketID;

        return sfdc_helpers.querySalesforceV27(ticketID, uri).then(function (response) {
            var entity = response['entity'];
            return convertToComments(entity, lastTimePulled, extstreamInstance);
        }, function (err) {
            jive.logger.error('Error converting comments', err);
        });
    });
};

/**
 * Returns the timestamp of the last time the tile instance was pulled, for a particular pull type (eg. comment, activity)
 * from SFDC, allowing us to avoid unnecessarily query SFDC for records spanning all time.
 * @param instance
 * @param type
 * @return long timestamp
 */
exports.getLastTimePulled = function(instance, type) {
    return getMetadataByInstance(instance).then(function (metadata) {
        var lastTimePulled = metadata && metadata.lastTimePulled && metadata.lastTimePulled[type];
        if (!lastTimePulled) {
            lastTimePulled = 1; //start date as 1 ms after the epoch, so that instance pulls all existing data for an opportunity
            return exports.updateLastTimePulled(instance, lastTimePulled, type).thenResolve(lastTimePulled);
        }
        return lastTimePulled;
    });
};

/**
 * Updates the pull timestamp for the instance and pull type (activity, comment)
 * @param instance
 * @param lastTimePulled
 * @param type
 * @return instance pull metadata record (JSON)
 */
exports.updateLastTimePulled = function(instance, lastTimePulled, type) {
    return getMetadataByInstance(instance).then(function (metadata) {
        var changed = false;
        if (!metadata) {
            metadata = { "instanceID": instance['id'] };
        }
        if (!metadata.lastTimePulled) {
            metadata.lastTimePulled = {};
        }
        if (!metadata.lastTimePulled[type]) {
            metadata.lastTimePulled[type] = lastTimePulled;
            changed = true;
        }
        else {
            if (metadata.lastTimePulled[type] < lastTimePulled) {
                changed = true;
                metadata.lastTimePulled[type] = lastTimePulled;
            }
        }
        if (changed) {
            return metadataStore.save(metadataCollection, instance['id'], metadata);
        }
        return metadata;
    });
};

exports.recordSyncFromJive = function(instance, sfCommentID) {
    return getMetadataByInstance(instance).then(function (metadata) {
        if (!metadata) {
            metadata = {"instanceID": instance['id'], "syncs": []};
        }
        if (!metadata.syncs) {
            metadata.syncs = [];
        }
        var changed = false;
        if (metadata.syncs.indexOf(sfCommentID) < 0) {
            metadata.syncs.push(sfCommentID);
            changed = true;
        }
        if (changed) {
            return metadataStore.save(metadataCollection, instance['id'], metadata);
        }
        return metadata;
    });
};

exports.pullOpportunity = function(tileInstance){
    //case id
    var opportunityID = tileInstance.config.opportunityID;
    // var uri = util.format("/sobjects/Opportunity/%s", opportunityID);
    var queryTextPosts = util.format("Select Id, CaseNumber, Subject, Account.Name, Contact.Name, Description, Status, Priority from case where id='%s'", opportunityID);
    var uri = util.format("/query?q=%s", encodeURIComponent(queryTextPosts));
    var ticketID = tileInstance.config.ticketID;

    return sfdc_helpers.querySalesforceV27(ticketID, uri).then(function(response) {
        var opportunity = response['entity']['records'][0];
        // jive.logger.info('louie added pullOpportunity response entity:' + opportunity['Id']);
        // for (prop in opportunity) {
            // if (!opportunity.hasOwnProperty(prop)) {
                // //The current property is not a direct property of p
                // continue;
            // }
            // //Do your logic with the property here
            // jive.logger.info('louie added pullOpportunity response entity contain key: ' + prop);
        // }
        return convertToListTileData(opportunity, ticketID);
    }).catch(function(err){
            jive.logger.error('Error querying salesforce', err);
        });
};

exports.pullCaseList = function(instance){
  
    jive.logger.info('louie added pullCaseList:');
    var ticketID = instance.config.ticketID;
    var select_status = instance.config.select_status;
    var select_priority = instance.config.select_priority;
    var select_order_by = instance.config.select_order_by;
    var select_sort = instance.config.select_sort;
    var number_of_case = instance.config.number_of_case;

    var status_query = select_status == 'All'?'':"and Status='" + select_status + "'";
    var priority_query = select_priority == 'All'?'':"and Priority='" + select_priority + "'";
    var queryTextPosts = util.format("Select CaseNumber, Id, Status, Subject from case where Case.Id>'' %s %s ORDER BY %s %s limit %s", status_query, priority_query, select_order_by, select_sort, number_of_case);
    var uri1 = util.format("/query?q=%s", encodeURIComponent(queryTextPosts));

    return sfdc_helpers.querySalesforceV27(ticketID, uri1).then(function (response) {
        var entity = response['entity'];
        jive.logger.info('salesforce response:'+response);
        jive.logger.info('case results: '+entity);
        return convertToCaseListTileData(entity, ticketID);
    }).catch(function (err) {
        jive.logger.error('Error querying salesforce', err);
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

function convertToCaseListTileData(entity, ticketID) {
  var cases = entity['records'];
  var instance_url = "https://www.salesforce.com/";
  var tokenStore = jive.service.persistence();
  var case_tile_data = {
    data: {
      "title": 'Case List',
      "contents": [],
      "config": {
                "listStyle": "contentList"
      }
    }
  }
  
  return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
    if ( found ) {
          jive.logger.info('louie added convertToListTileData instance_url: ' + found[0]['accessToken']['instance_url']);
      instance_url = found[0]['accessToken']['instance_url'] + "/";
    }
    
    cases.forEach(function(case_item){
      jive.logger.info('louie added convertToCaseListTileData case_item: ' + case_item);
      var case_id = case_item['Id'];
      var case_content = case_item['CaseNumber'] + " [" + case_item['Status'] + "] " + case_item['Subject'];
      case_tile_data['data']['contents'].push({
        "text": case_content.slice(0, 40),
        "icon": "http://www.sfdcstatic.com/common/assets/img/logo-company.png",
        "linkDescription": case_item['Subject'].slice(0, 40),
        "action": {
            "url": instance_url + case_id.slice(0, case_id.length - 3)
        }
      });
    });
    return case_tile_data;
  })
}
function convertToListTileData(opportunity, ticketID) {
    var instance_url = "https://www.salesforce.com/";
    var case_id = opportunity['Id'];
    var tokenStore = jive.service.persistence();
    jive.logger.info('louie added convertToListTileData ticketID: ' + ticketID);

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
      if ( found ) {
            jive.logger.info('louie added convertToListTileData instance_url: ' + found[0]['accessToken']['instance_url']);
        instance_url = found[0]['accessToken']['instance_url'] + "/";
      }
    }).then( function(){
      jive.logger.info('louie added convertToListTileData outside then instance_url: ' + instance_url);
      return {
          data: {
              "title": "Case Details",
              "contents": [
  
                  {
                      "name": 'Case Number',
                      "value": opportunity['CaseNumber'],
                      'url': instance_url  + case_id.slice(0, case_id.length - 3),
                  },
                  {
                      "name": 'Subject',
                      "value": opportunity['Subject'].slice(0, 40)
                  },
                  {
                      "name": 'Account',
                      "value": opportunity.Account.Name.slice(0, 40)
                  },
                  {
                      "name": 'Contact',
                      "value": opportunity.Contact.Name.slice(0, 40)
                  },
                  {
                      "name": 'Description',
                      "value": opportunity["Description"] == null? '':opportunity["Description"].slice(0, 40)
                  },
                  {
                      "name": 'Status',
                      "value": opportunity['Status']
                  },
                  {
                      "name": 'Priority',
                      "value": opportunity['Priority']
                  }
                  // {
                      // "name": 'Pull Time',
                      // "value": new Date().toString().slice(0, 30)
                      // // "text": new Date().toString().slice(0, 40)
                  // },
              ]
          }
      };
    });
}

function convertToActivities(entity, lastTimePulled, instance, instance_url) {
    var records = entity['records'];
    var activities = records.map(function (record) {
        var json = getActivityJSON(record, instance, instance_url);
        jive.logger.info("louie added convertToActivities json:" + json);
        if (!isNaN(json['sfdcCreatedDate'])) {
            lastTimePulled = Math.max(lastTimePulled, json['sfdcCreatedDate']);
        }
        return json;
    });

    return exports.updateLastTimePulled(instance, lastTimePulled, 'activity').thenResolve(activities);
}

function convertToComments(entity, lastTimePulled, instance) {
    var records = entity['records'];
    var comments = [];
    var promise = q.resolve(null);

    records.forEach(function (record) {
        var sfCommentID = record['Id'];
        promise = promise.thenResolve(
            wasSynced(instance, sfCommentID).then(function (wasItSynced) {
                if (wasItSynced) {
                    return;
                }

                var json = getCommentJSON(record);
                if (!isNaN(json['sfdcCreatedDate'])) {
                    lastTimePulled = Math.max(lastTimePulled, json['sfdcCreatedDate']);
                }
                comments.push(json);
            })
        );
    });

    return promise.then(function() {
        return exports.updateLastTimePulled(instance, lastTimePulled, 'comment').thenResolve(comments);
    });
}

function getActivityJSON(record, instance, instance_url) {
    var actor = record.CreatedBy && record.CreatedBy.Name || 'Anonymous';
    var oppName = record.Case && record.Case.Subject || 'Some Subject';
    var externalID = record.Id;
    var tokenStore = jive.service.persistence();
    var ticketID = instance.config.ticketID;
    var case_id = record.Case.Id;
    var createdDate = new Date(record.CreatedDate).getTime();
    var field = record.Field;
    var oldValue = record.OldValue || ' ';
    var newValue = record.NewValue || ' ';
    var email = record.CreatedBy && record.CreatedBy.Email || 'Anonymous@Anonymous.com';
    
    var body = null;
    if(field == 'created'){
      body = "Create New Case: " + oppName;
    } else {
      body = "Change " + field + " from " + oldValue + " to " + newValue;
    }

    body = body || 'Empty post';
    
    // return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
      // if ( found ) {
        // jive.logger.info('louie added convertToListTileData instance_url: ' + found[0]['accessToken']['instance_url']);
        // instance_url = found[0]['accessToken']['instance_url'] + "/";
      // }

      return {
          "sfdcCreatedDate": createdDate,
          "activity": {
              "action": {
                  "name": "posted",
                  "description": body
              },
              "actor": {
                  "name": actor,
                  "email": email
              },
              "object": {
                  "type": "website",
                  "url": instance_url + case_id.slice(0, case_id.length - 3),
                  "image": "http://www.sfdcstatic.com/common/assets/img/logo-company.png",
                  "title": oppName,
                  "description": body 
              },
              "externalID": externalID
          }
      };
    // });
}

function getCommentJSON(record) {
    var actor = record.CreatedBy && record.CreatedBy.Name || 'Anonymous';
    var firstLast = actor.split(' ');
    var first = firstLast[0], last = '';
    if (firstLast.length >= 2) {
        last = firstLast[1];
    }
    var email = record.CreatedBy && record.CreatedBy.Email || 'anonymous@example.com';
    var body = record.CommentBody || 'Empty comment';
    var externalID = record.Id;
    var createdDate = new Date(record.CreatedDate).getTime();

    return {
        "sfdcCreatedDate": createdDate,
        "author": {
            "name": {
                "givenName": first,
                "familyName": last
            },
            "email": email
        },
        "content": {"type": "text/html", "text": "<p>" + body + "</p>"},
        "type": "comment",
        "externalID": externalID,
        "externalActivityID": record.FeedItemId //Need this to use /extstreams/{id}/extactivities/{externalActivityID}/comments endpoint
    }
}

function getDateString(time) {
    return new Date(time).toISOString().replace(/Z$/, '+0000');
}

function getMetadataByInstance(instance) {
    return metadataStore.find(metadataCollection, {'instanceID': instance['id']}).then(function (results) {
        if (results.length <= 0) {
            return null;
        }
        return results[0];
    });
}

function wasSynced(instance, sfCommentID) {
    return getMetadataByInstance(instance).then(function (metadata) {
        return metadata && metadata.syncs && metadata.syncs.indexOf(sfCommentID) >= 0;
    });
}




