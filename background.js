var refreshTime = 10000;

var validator;
var userId;

var softwareVersion = chrome.runtime.getManifest()["version"];

chrome.storage.local.get(["whiteboxId"], function(result) {
    if(result["whiteboxId"] != undefined){
        userId = result["whiteboxId"];
        chrome.storage.local.get(["validator"], function(result){
            validator = result.validator;
        });
    }
});

var notificationInterval = false;
if(!notificationInterval){
	notificationInterval = setInterval(checkForNotifications, refreshTime);
}

function checkForNotifications(){
    var http = new XMLHttpRequest();

    http.open("POST", "https://www.jblrd.com/whitebox-api/checkfornotifications", true);
    //http.open("POST", "https://www.jblrd.com/whitebox-api-development/checkfornotifications", true);

    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("software-version", softwareVersion);
    var params = "validator="+validator+"&userId="+userId;
    http.send(params)
    http.onload = function() {
    	if(http.status == 400){
			chrome.storage.local.get(["whiteboxId"], function(result) {
			    if(result["whiteboxId"] != ""){
			        userId = result["whiteboxId"];
			        chrome.storage.local.get(["validator"], function(result){
			            validator = result.validator;
			        });
			    }
			    else{
					clearInterval(notificationInterval);
					notificationInterval = false;
			    }
			});
			chrome.browserAction.setBadgeText({text: ""});
    	}
    	else{
    		if(http.responseText == 0){
				chrome.browserAction.setBadgeText({text: ""});
    		}
    		else{
				chrome.browserAction.setBadgeText({text: http.responseText});
			}
    	}
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.turnOffNotifications == 1){
		var randomKey = undefined;
		var userId = undefined;
		chrome.browserAction.setBadgeText({text: ""});
	}
	else if(request.turnOnNotifications == 1){
		if(!notificationInterval){
			notificationInterval = setInterval(checkForNotifications, refreshTime);
		}
	}
});