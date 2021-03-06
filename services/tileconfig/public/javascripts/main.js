function showCard( cardID, adjustHeight ) {
    $(".j-card").hide();
    $("#" + cardID ).show();
    gadgets.window.adjustHeight(adjustHeight);
}
function doIt( host ) {

    var oauth2SuccessCallback = function(ticketID) {
        showCard("j-card-loading", 200);

        if ( !ticketID ) {
            $("#j-card-rejected .j-error").text("Unauthorized");
            showCard("j-card-rejected");

            $(".btn-cancel").click( function() {
                jive.tile.close({});
            });

            return;
        }
        var toReturn = {
            "isSFDC" : true
        };
        if ( ticketID ) {
            toReturn['ticketID'] = ticketID;
        }
        setTimeout(function(){jive.tile.close(toReturn);}, 4000);

        // var query = encodeURIComponent("SELECT Id, Name, Description, StageName, Amount FROM Opportunity");
// 
        // osapi.http.get({
            // 'href' : host + '/sfdc/salesforce/query?' +
                // 'id=' + ticketID +
                // "&ts=" + new Date().getTime() +
                // "&ticketID=" + ticketID +
                // "&query=" + query,
            // 'format' : 'json',
            // 'authz': 'signed'
        // }).execute(function( response ) {
            // if ( response.error ) {
                // $("#j-error").text(JSON.stringify(response.error, null, 4));
                // showCard("j-card-rejected");
                // return;
            // }
// 
            // showCard("j-card-configuration");
// 
            // var config = onLoadContext['config'];
            // var data = response.content;
// 
            // $.each( data.records, function() {
                // var record = $(this)[0];
                // var id = record["Id"];
                // var name = record["Name"];
                // var option = $("<option value=" + id + ">" + name + "</option>");
                // $("#select_opportunity").append(option);
            // });
// 
            // if ( config["opportunityID"] ) {
                // // set previously selected
                // $("#select_opportunity").val( config["opportunityID"] );
            // }
// 
            // $("#btn_done").click( function() {
                // var selected = $("#select_opportunity").val();
                // var toReturn = {
                    // "opportunityID" : selected,
                    // "isSFDC" : true
                // };
                // if ( ticketID ) {
                    // toReturn['ticketID'] = ticketID;
                // }
// 
                // jive.tile.close(toReturn );
            // });
        // });
    };

    var jiveAuthorizeUrlErrorCallback = function(err) {
        $("#j-error").text(JSON.stringify(err, null, 4));
        showCard("j-card-authurl-error");
    };

    var preOauth2DanceCallback = function() {
        showCard("j-card-authentication", 200);
    };

    var onLoadCallback = function( config, identifiers ) {
        onLoadContext = {
            config: config,
            identifiers : identifiers
        };
    };

    var options = {
        serviceHost : host,
        grantDOMElementID : '#oauth',
        jiveAuthorizeUrlErrorCallback : jiveAuthorizeUrlErrorCallback,
        oauth2SuccessCallback : oauth2SuccessCallback,
        preOauth2DanceCallback : preOauth2DanceCallback,
        onLoadCallback : onLoadCallback,
        authorizeUrl : host + '/sfdc/oauth/authorizeUrl'
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    $(".btn-cancel").click( function() {
        jive.tile.close({});
    });

    OAuth2ServerFlow( options ).launch();
}

function casedoIt( host ) {

    var oauth2SuccessCallback = function(ticketID) {
        showCard("j-card-loading", 200);

        if ( !ticketID ) {
            $("#j-card-rejected .j-error").text("Unauthorized");
            showCard("j-card-rejected");

            $(".btn-cancel").click( function() {
                jive.tile.close({});
            });

            return;
        }

        var query = encodeURIComponent("SELECT Id, Subject FROM Case");

        osapi.http.get({
            'href' : host + '/sfdc/salesforce/query?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID +
                "&query=" + query,
            'format' : 'json',
            'authz': 'signed'
        }).execute(function( response ) {
            if ( response.error ) {
                $("#j-error").text(JSON.stringify(response.error, null, 4));
                showCard("j-card-rejected");
                return;
            }

            showCard("j-card-configuration");

            var config = onLoadContext['config'];
            var data = response.content;

            $.each( data.records, function() {
                var record = $(this)[0];
                var id = record["Id"];
                var name = record["Subject"];
                var option = $("<option value=" + id + ">" + name + "</option>");
                $("#select_opportunity").append(option);
            });

            if ( config["opportunityID"] ) {
                // set previously selected
                $("#select_opportunity").val( config["opportunityID"] );
            }

            $("#btn_done").click( function() {
                var selected = $("#select_opportunity").val();
                var toReturn = {
                    "opportunityID" : selected,
                    "isSFDC" : true
                };
                if ( ticketID ) {
                    toReturn['ticketID'] = ticketID;
                }

                jive.tile.close(toReturn );
            });
        });
    };

    var jiveAuthorizeUrlErrorCallback = function(err) {
        $("#j-error").text(JSON.stringify(err, null, 4));
        showCard("j-card-authurl-error");
    };

    var preOauth2DanceCallback = function() {
        showCard("j-card-authentication", 200);
    };

    var onLoadCallback = function( config, identifiers ) {
        onLoadContext = {
            config: config,
            identifiers : identifiers
        };
    };

    var options = {
        serviceHost : host,
        grantDOMElementID : '#oauth',
        jiveAuthorizeUrlErrorCallback : jiveAuthorizeUrlErrorCallback,
        oauth2SuccessCallback : oauth2SuccessCallback,
        preOauth2DanceCallback : preOauth2DanceCallback,
        onLoadCallback : onLoadCallback,
        authorizeUrl : host + '/sfdc/oauth/authorizeUrl'
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    $(".btn-cancel").click( function() {
        jive.tile.close({});
    });

    OAuth2ServerFlow( options ).launch();
}


function caselistdoIt( host ) {

    var oauth2SuccessCallback = function(ticketID) {
        showCard("j-card-loading", 200);

        if ( !ticketID ) {
            $("#j-card-rejected .j-error").text("Unauthorized");
            showCard("j-card-rejected");

            $(".btn-cancel").click( function() {
                jive.tile.close({});
            });

            return;
        }

        var query = encodeURIComponent("Select MasterLabel, SortOrder from CaseStatus Order By SortOrder");

        var config = onLoadContext['config'];
        osapi.http.get({
            'href' : host + '/sfdc/salesforce/query?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID +
                "&query=" + query,
            'format' : 'json',
            'authz': 'signed'
        }).execute(function( response ) {
          if ( response.error ) {
              $("#j-error").text(JSON.stringify(response.error, null, 4));
              showCard("j-card-rejected");
              return;
          }
          var data = response.content;

          $.each( data.records, function() {
              var record = $(this)[0];
              var name = record["MasterLabel"];
              var option = $("<option value=" + name + ">" + name + "</option>");
              $("#select_status").append(option);
          });
          if ( config["select_status"] ) {
              // set previously selected
              $("#select_status").val( config["select_status"] );
          }
          showConfig();
        });

        var showConfig = function(){
          showCard("j-card-configuration");
          if ( config["select_priority"] ) {
              // set previously selected
              $("#select_priority").val( config["select_priority"] );
          }

          if ( config["select_order_by"] ) {
              // set previously selected
              $("#select_order_by").val( config["select_order_by"] );
          }

          if ( config["select_sort"] ) {
              // set previously selected
              $("#select_sort").val( config["select_sort"] );
          }

          if ( config["number_of_case"] ) {
              // set previously selected
              $("#number_of_case").val( config["number_of_case"] );
          }

          $("#btn_done").click( function() {
              var select_status = $("#select_status").val();
              var select_priority = $("#select_priority").val();
              var select_order_by = $("#select_order_by").val();
              var select_sort = $("#select_sort").val();
              var number_of_case = $("#number_of_case").val();
              var toReturn = {
                  "select_status" : select_status,
                  "select_priority" : select_priority,
                  "select_order_by" : select_order_by,
                  "select_sort" : select_sort,
                  "number_of_case" : number_of_case,
                  "isSFDC" : true
              };
              if ( ticketID ) {
                  toReturn['ticketID'] = ticketID;
              }

              jive.tile.close(toReturn );
          });
        }


    };

    var jiveAuthorizeUrlErrorCallback = function(err) {
        $("#j-error").text(JSON.stringify(err, null, 4));
        showCard("j-card-authurl-error");
    };

    var preOauth2DanceCallback = function() {
        showCard("j-card-authentication", 200);
    };

    var onLoadCallback = function( config, identifiers ) {
        onLoadContext = {
            config: config,
            identifiers : identifiers
        };
    };

    var options = {
        serviceHost : host,
        grantDOMElementID : '#oauth',
        jiveAuthorizeUrlErrorCallback : jiveAuthorizeUrlErrorCallback,
        oauth2SuccessCallback : oauth2SuccessCallback,
        preOauth2DanceCallback : preOauth2DanceCallback,
        onLoadCallback : onLoadCallback,
        authorizeUrl : host + '/sfdc/oauth/authorizeUrl'
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    $(".btn-cancel").click( function() {
        jive.tile.close({});
    });

        console.log("caselistdoIt");
    OAuth2ServerFlow( options ).launch();
}