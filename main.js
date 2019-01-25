/* Made By Joshua Bird
 *
 * Whitebox test
*/

var socket = io.connect('https://www.jblrd.com', {path: "/V2.0.10/whitebox-websocket/socket.io"});
//var socket = io.connect('https://www.jblrd.com', {path: "/V2/whitebox-websocket-development/socket.io"});

socket.on("connected", function() {
    login();
});

$("#backButton").on("click", goBack);
$("#sendButton").on("click", sendMessage);
$("#toggleBackgroundButton").on("click", toggleBackground);
$("#setBackgroundOffsetsButton").on("click", setBackgroundOffsets);

// Delete Account
$("#deleteAccountButton").on("click", promptDeleteAccount);
$("#confirmDeleteAccBtn").on("click", deleteAccount);

// Change Username
$("#changeUsernameButton").on("click", promptChangeUsername);
$("#confirmChangeUsernameBtn").on("click", changeUsername);

// Chat settings
$("#messagePageSettingsBtn").on("click", chatSettings);

// Logout
$("#logoutButton").on("click", logout);

// Unfriend friend
$("#promptUnfriendFriendBtn").on("click", confirmUnfriendModal);
$("#unfriendFriendBtn").on("click", unfriendFriend);

// Search users
$("#userSearchBtn").on("click", searchUsers);

// Scroll down btn
$("#scrollDownBtn").on("click", scrollDown);

$("#unfriendFriendBtn").on("click", unfriendFriend);
$("#lightThemeBtn").on("click", setLightTheme);
$("#darkThemeBtn").on("click", setDarkTheme);
$("#testThemeUpdateBtn").on("click", updateTestTheme);

var userInputElement = $("#userInput");
var usersElement = $("#users");
var aboutButtonElement = $("#aboutButton");
var backButtonElement = $("#backButton");
var messagePageElement = $("#messagePage");
var mainTabs = $("#mainTabs");

// Login
var softwareVersion = chrome.runtime.getManifest().version;
$("#aboutPageContents").append("<br>Version: "+softwareVersion);

hideEverything();
mainTabs.show();
aboutButtonElement.show();

var backgroundWidth;
var backgroundHeight;
var backgroundXOffset;
var backgroundYOffset;

var backgroundEnabled;

var xSlider = document.getElementById("xBackground");
var ySlider = document.getElementById("yBackground");
xSlider.onchange = changeBackgroundPos;
ySlider.onchange = changeBackgroundPos;

setInterval(refreshBackground, 1000);
setInterval(checkConnection, 5000);

chrome.storage.local.get(["chats"], function(result) {
    if(result.chats != undefined && result.chats.length){
        refreshChats(result.chats);
    }
});

chrome.storage.local.get(["theme"], function(result) {
    if(result.theme === "light"){
        setLightTheme();
    }
    else if(result.theme === "dark"){
        setDarkTheme();
    }
    else if(result.theme != null){
        setCustomTheme(result.theme);
    }
});

chrome.storage.local.get(["backgroundEnabled"], function(result) {
    if(result["backgroundEnabled" == ""]){
        chrome.storage.local.set({backgroundEnabled: false});
        backgroundEnabled = false;
    }
    else if(result.backgroundEnabled){
        backgroundEnabled = true;

        setLightTheme();
        chrome.storage.local.get(["backgroundXOffset"], function(result){
            backgroundXOffset = result.backgroundXOffset;
            chrome.storage.local.get(["backgroundYOffset"], function(result){
                backgroundYOffset = result.backgroundYOffset;
                chrome.tabs.captureVisibleTab(function (dataUrl){
                    document.body.style.backgroundImage = "url("+dataUrl+")";

                    var backgroundImage = new Image();
                    backgroundImage.src = dataUrl;
                    backgroundImage.onload = function() {
                        backgroundWidth = parseInt(this.width);
                        backgroundHeight = parseInt(this.height);
                        document.body.style.backgroundPosition = backgroundXOffset+"px "+backgroundYOffset+"px";
                        xSlider.value = (backgroundXOffset+backgroundWidth-100)%600;
                        ySlider.value = (backgroundYOffset+300)%600;
                    };
                });
            });
        });
    }
    else{
        backgroundEnabled = false;
        xSlider.disabled = true;
        ySlider.disabled = true;
        $("#setBackgroundOffsetsButton").toggleClass("disabled", true);
    }
});

var previousPage;
var username;
var userData;
var users;
var clickedName;
var clickedChat = {};
var randomKey = "not used"; //get rid of this
var numOfFriendRequests;
var friends;
var groups;
var userId;
var timeUntilNewHeader = 600;
var messages = [];
var messageBufferDistance = 0; // Distance in px when to start loading previous messages
var maxUsernameLength = 25;

function hideEverything(){
    userInputElement.hide();
    messagePageElement.hide();
    aboutButtonElement.show();
    backButtonElement.hide();
    mainTabs.hide();
}

function getCookies(domain, name, callback) {
    chrome.cookies.get({"url": domain, "name": name}, function(cookie) {
        if(callback) {
            callback(cookie.value);
        }
    });
}

$("#message").keyup(function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        $("#sendButton").click();
    }
});

function setLightTheme() {
    less.modifyVars({
        '@theme': 'light'
    });
    chrome.storage.local.set({theme: "light"});
}

function setDarkTheme() {
    less.modifyVars({
        '@theme': 'dark'
    });
    chrome.storage.local.set({theme: "dark"});
}

function setCustomTheme(shortCustomThemeName) {
    $("#customThemePromptModal").modal("hide");

    chrome.storage.local.get(["customThemes"], function(result) {
        var customThemeName = shortCustomThemeName+"-customTheme";

        var theme1 = result.customThemes[customThemeName].theme1;
        var theme2 = result.customThemes[customThemeName].theme2;
        var theme3 = result.customThemes[customThemeName].theme3;
        var theme4 = result.customThemes[customThemeName].theme4;
        var theme5 = result.customThemes[customThemeName].theme5;
        var theme6 = result.customThemes[customThemeName].theme6;

        less.modifyVars({
            "@theme": "custom",
            "@theme1": theme1,
            "@theme2": theme2,
            "@theme3": theme3,
            "@theme4": theme4,
            "@theme5": theme5,
            "@theme6": theme6
        });

        chrome.storage.local.set({theme: shortCustomThemeName});
    });
}

function customThemePrompt(shortCustomThemeName) {
    $("#editCustomThemeBtn").attr("data-shortCustomThemeName", shortCustomThemeName);
    $("#setCustomThemeBtn").attr("data-shortCustomThemeName", shortCustomThemeName);

    document.getElementById("editCustomThemeBtn").onclick = function() {editCustomTheme(this.getAttribute("data-shortCustomThemeName"));};
    document.getElementById("setCustomThemeBtn").onclick = function() {setCustomTheme(this.getAttribute("data-shortCustomThemeName"));};

    $("#customThemePromptModal").modal("show");
}

function editCustomTheme(shortCustomThemeName) {
    chrome.storage.local.get(["customThemes"], function(result) {
        var customThemeName = shortCustomThemeName+"-customTheme";

        var theme1 = result.customThemes[customThemeName].theme1;
        var theme2 = result.customThemes[customThemeName].theme2;
        var theme3 = result.customThemes[customThemeName].theme3;
        var theme4 = result.customThemes[customThemeName].theme4;
        var theme5 = result.customThemes[customThemeName].theme5;
        var theme6 = result.customThemes[customThemeName].theme6;

        $("#testTheme1").val(theme1);
        $("#testTheme2").val(theme2);
        $("#testTheme3").val(theme3);
        $("#testTheme4").val(theme4);
        $("#testTheme5").val(theme5);
        $("#testTheme6").val(theme6);
        $("#testThemeName").val(shortCustomThemeName);

        $("#cancelTestThemeBtn").text("Delete");
        $("#saveTestThemeBtn").text("Set");
        $("#cancelTestThemeBtn").on("click", function() {deleteCustomTheme(shortCustomThemeName);});
        $("#saveTestThemeBtn").on("click", function() {saveCustomTheme();});

        $("#customThemePromptModal").modal("hide");
        $('#customThemePromptModal').on('hidden.bs.modal', function(event) {
            $("#customThemeModal").modal("show");
        });
    });
}

function customTheme() {
    $("#cancelTestThemeBtn").text("Cancel");
    $("#saveTestThemeBtn").text("Save");
    $("#cancelTestThemeBtn").on("click", revertTheme);
    $("#saveTestThemeBtn").on("click", saveCustomTheme);

    $("#customThemeModal").modal("show");
}

function updateTestTheme() {
    var theme1 = $("#testTheme1").val();
    var theme2 = $("#testTheme2").val();
    var theme3 = $("#testTheme3").val();
    var theme4 = $("#testTheme4").val();
    var theme5 = $("#testTheme5").val();
    var theme6 = $("#testTheme6").val();

    less.modifyVars({
        "@theme": "custom",
        "@theme1": theme1,
        "@theme2": theme2,
        "@theme3": theme3,
        "@theme4": theme4,
        "@theme5": theme5,
        "@theme6": theme6
    });
}

function revertTheme() {
    chrome.storage.local.get(["theme"], function(result) {
        if(result.theme === "light"){
            setLightTheme();
        }
        else if(result.theme === "dark"){
            setDarkTheme();
        }
        else if(result.theme != null){
            setCustomTheme(result.theme);
        }
    });
}

function saveCustomTheme() {
    var themeName = $("#testThemeName").val()+"-customTheme";

    var theme1 = $("#testTheme1").val();
    var theme2 = $("#testTheme2").val();
    var theme3 = $("#testTheme3").val();
    var theme4 = $("#testTheme4").val();
    var theme5 = $("#testTheme5").val();
    var theme6 = $("#testTheme6").val();

    if(themeName==""){
        $("#customThemeModal").modal("hide");
        $("#alertMsg").text("You didnt enter a name");
        $("#alertModal").modal("show");
        return;
    }
    else if(theme1=="" || theme2=="" || theme3=="" || theme4=="" || theme5=="" || theme6==""){
        $("#customThemeModal").modal("hide");
        $("#alertMsg").text("You didnt enter a color");
        $("#alertModal").modal("show");
        return;
    }

    chrome.storage.local.get(["customThemes"], function(result) {
        var customThemes = {};
        
        if(typeof result.customThemes != "object"){
            customThemes[themeName] = {        
                                        "theme1": theme1,
                                        "theme2": theme2,
                                        "theme3": theme3,
                                        "theme4": theme4,
                                        "theme5": theme5,
                                        "theme6": theme6};

            chrome.storage.local.set({"customThemes": customThemes});
            $("#customThemeModal").modal("hide");
            $("#alertMsg").text("Theme saved successfully");
            $("#alertModal").modal("show");
        }
        else{
            customThemes = result.customThemes;
            delete customThemes[themeName];
            customThemes[themeName] = {        
                                        "theme1": theme1,
                                        "theme2": theme2,
                                        "theme3": theme3,
                                        "theme4": theme4,
                                        "theme5": theme5,
                                        "theme6": theme6};

            chrome.storage.local.set({"customThemes": customThemes});
            $("#customThemeModal").modal("hide");
            $("#alertMsg").text("Theme saved successfully");
            $("#alertModal").modal("show");
        }
        refreshSettingsPage();
        
        shortCustomThemeName = themeName.substring(0,themeName.length-12);
        setCustomTheme(shortCustomThemeName);
    });
}

function deleteCustomTheme(shortCustomThemeName) {
    chrome.storage.local.get(["customThemes"], function(result) {
        customThemes = result.customThemes;
        delete customThemes[shortCustomThemeName+"-customTheme"];

        chrome.storage.local.set({"customThemes": customThemes});

        $("#alertMsg").text("Custom theme deleted successfully");
        $("#alertModal").modal("show");

        refreshSettingsPage();
        setDarkTheme();
    });
}

$("#login-form").submit(function(event) {
    event.preventDefault();

    var loginUsername = $("#loginUsername").val();
    var loginPassword = $("#loginPassword").val();

    socket.emit("userLogin", [loginUsername, loginPassword, softwareVersion]);
});

function login() {
    chrome.storage.sync.get(["randomKey", "whiteboxId", "whiteboxUsername"], function(result) {
        if(("randomKey" in result) && result.randomKey != null){
            hideEverything();
            userInputElement.show();
            aboutButtonElement.show();

            $("#create-account-tab").tab('show');
            $("#create-account-username").val(result.whiteboxUsername);
            $("#create-account-username").attr("disabled", "disabled");

            $("#alertMsg").html("<b>Please enter email and password - friends and chats will not be lost.</b> <br><br><small>Dont worry, i cant see your passwords, they salted, hashed and sent over a secure ssl encrypted connection <br>-JB</small>");
            $("#alertModal").modal("show");
        }
    });
    chrome.storage.local.get(["whiteboxId", "whiteboxUsername", "validator"], function(result) {
        if(!("whiteboxUsername" in result) || !("whiteboxId" in result) || !("validator" in result) ||
           result.whiteboxId === null || result.whiteboxUsername === null || result.validator === null){
            hideEverything();
            userInputElement.show();
            aboutButtonElement.show();
        }
        else{
            userId = result.whiteboxId;
            username = result.whiteboxUsername;
            var validator = result.validator;

            socket.emit("autoLogin", [userId, validator, softwareVersion, username]);
        }
    });
}

socket.on("loginReply", function(reply){
    var status = reply.status;

    if(status === "ERROR: validator incorrect"){
        hideEverything();
        userInputElement.show();
        aboutButtonElement.show();
        
        $('#loginUsername').attr('style', 'border-color: red !important;');

        $("#loginPassword").val("");
        $("#loginPassword").attr("placeholder", "Credentials Incorrect");
        $('#loginPassword').attr('style', 'border-color: red !important;');
    }
    else if(status === "OK"){
        hideEverything();
        mainTabs.show();
        aboutButtonElement.show();

        userId = reply.userId;
        username = reply.username;
        var validator;
        if(reply.validator != null){
            chrome.storage.local.set({validator: reply.validator});
        }

        chrome.storage.local.set({whiteboxId: userId});
        chrome.storage.local.set({whiteboxUsername: username});
        chrome.storage.sync.set({randomKey: null});
        
        socket.emit("refreshUsers", [randomKey, userId, username]);
    }
});

function logout() {
    chrome.storage.local.get(["validator"], function(result) {
        if(result.validator != null){
            socket.emit("logout", [userId, username, result.validator]);
        }

        chrome.storage.local.clear();

        window.close();
    });
}

$("#create-account-form").submit(function(event) {
    event.preventDefault();

    var createAccountUsername = $("#create-account-username").val();
    var createAccountEmail = $("#create-account-email").val();
    var createAccountPassword = $("#create-account-password").val();
    var createAccountConfirmPassword = $("#create-account-confirm-password").val();

    if(createAccountUsername.length>maxUsernameLength){
        $("#create-account-username").val("");
        $("#create-account-username").attr("placeholder", "Username too long");
    }
    else if(createAccountUsername.length == 0){
        $("#create-account-username").val("");
        $("#create-account-username").attr("placeholder", "Enter Username");
    }
    else if(createAccountEmail.length == 0){
        $("#create-account-email").val("");
        $("#create-account-email").attr("placeholder", "Enter Email");
    }
    else if(createAccountPassword != createAccountConfirmPassword){
        $("#create-account-confirm-password").val("");
        $("#create-account-confirm-password").attr("placeholder", "Does not match");
    }
    else if(createAccountPassword.length < 8){
        $("#create-account-password").val("");
        $("#create-account-confirm-password").val("");
        $("#create-account-password").attr("placeholder", "Password too short");
    }
    else{
        chrome.storage.sync.get(["randomKey", "whiteboxId"], function(result) {
            if(("randomKey" in result) && result.randomKey != null){
                socket.emit("updateAccount", [createAccountUsername, 
                                              createAccountEmail,
                                              createAccountPassword,
                                              softwareVersion,
                                              result.randomKey,
                                              result.whiteboxId]);
            }
            else{
                socket.emit("createAccount", [createAccountUsername, 
                                              createAccountEmail,
                                              createAccountPassword,
                                              softwareVersion]);
            }
        });
    }
});

socket.on("createAccountReply", function(reply){
    if(reply.status === "OK"){
        userId = reply.userId;
        username = reply.username;
        var validator = reply.validator;

        chrome.storage.local.set({whiteboxId: userId});
        chrome.storage.local.set({whiteboxUsername: username});
        chrome.storage.local.set({validator: validator});
        chrome.storage.sync.set({randomKey: null});
        chrome.runtime.sendMessage({turnOnNotifications: 1});

        login();
    }
    else if(reply.status === "ERROR: username taken"){
        $("#create-account-username").val("");
        $("#create-account-username").attr("placeholder", "Username Taken");
        $('#create-account-username').attr('style', 'border-color: red !important;');
    }
});

$("#friends-tab").on('show.bs.tab', function(){
    socket.emit("refreshUsers", [randomKey, userId, username]);
});

$("#friend-requests-tab").on('show.bs.tab', function(){
    socket.emit("pendingFriendRequests", [userId, randomKey, username]);
});

$("#sent-friend-requests-tab").on('show.bs.tab', function(){
    socket.emit("sentFriendRequests", [userId, randomKey, username]);
});

$("#settings-tab").on('show.bs.tab', function(){
    refreshSettingsPage();
});

$("#add-friends-tab").on('show.bs.tab', function(){
    socket.emit("searchUsers", [userId, randomKey, username, ""]);
});

function refreshSettingsPage() {
    chrome.storage.local.get(["customThemes"], function(result) {
        $("#customThemeDropdown").empty();

        // + new theme dropdown item
        var dropdownA = document.createElement("a");
        dropdownA.classList.add("dropdown-item");
        dropdownA.classList.add("dropdown-text");
        dropdownA.innerHTML = "+ New Theme";
        dropdownA.onclick = function() {customTheme();};

        document.getElementById("customThemeDropdown").prepend(dropdownA);


        for (var customThemeName in result.customThemes) {
            shortCustomThemeName = customThemeName.substring(0,customThemeName.length-12);

            dropdownA = document.createElement("a");
            dropdownA.classList.add("dropdown-item");
            dropdownA.classList.add("dropdown-text");
            dropdownA.innerHTML = shortCustomThemeName;
            dropdownA.onclick = function() {customThemePrompt(this.innerHTML);};

            document.getElementById("customThemeDropdown").prepend(dropdownA);
        }
    });
}

function refreshBackground(){
    if(backgroundEnabled){
        chrome.tabs.captureVisibleTab(function (dataUrl){
            document.body.style.backgroundImage = "url("+dataUrl+")";

            var backgroundImage = new Image();
            backgroundImage.src = dataUrl;
        });
    }
    else{
        document.body.style.backgroundImage = "";
    }
}

function toggleBackground(){
    if(backgroundEnabled == true){
        chrome.storage.local.set({backgroundEnabled: false});
        backgroundEnabled = false;
        refreshBackground();
        xSlider.disabled = true;
        ySlider.disabled = true;
        $("#setBackgroundOffsetsButton").toggleClass("disabled", true);
    }
    else{
        alert("Transparent background is in development and does not work well with high resolution displays. (Until I get a high resolution screen I cant really fix this)");
        setLightTheme();
        chrome.storage.local.set({backgroundEnabled: true});
        backgroundEnabled = true;
        refreshBackground();
        xSlider.disabled = false;
        ySlider.disabled = false;
        $("#setBackgroundOffsetsButton").toggleClass("disabled", false);
        chrome.storage.local.get(["backgroundXOffset"], function(result){
            backgroundXOffset = result.backgroundXOffset;
            chrome.storage.local.get(["backgroundYOffset"], function(result){
                backgroundYOffset = result.backgroundYOffset;
                chrome.tabs.captureVisibleTab(function (dataUrl){
                    document.body.style.backgroundImage = "url("+dataUrl+")";

                    var backgroundImage = new Image();
                    backgroundImage.src = dataUrl;
                    backgroundImage.onload = function() {
                        backgroundWidth = parseInt(this.width);
                        backgroundHeight = parseInt(this.height);
                        document.body.style.backgroundPosition = backgroundXOffset+"px "+backgroundYOffset+"px";
                        xSlider.value = (backgroundXOffset+backgroundWidth-100)%600;
                        ySlider.value = (backgroundYOffset+300)%600;
                    };
                });
            });
        });
    }
}

function changeBackgroundPos(){
    backgroundXOffset = parseInt(xSlider.value)-backgroundWidth+100;
    backgroundYOffset = parseInt(ySlider.value)-300;
    document.body.style.backgroundPosition = backgroundXOffset+"px "+backgroundYOffset+"px";
}

function setBackgroundOffsets(){
    chrome.storage.local.set({backgroundXOffset: backgroundXOffset});
    chrome.storage.local.set({backgroundYOffset: backgroundYOffset});
}

function promptDeleteAccount(){
    $("#confirmDeleteAccModal").modal("show");
}

function deleteAccount(){
    hideEverything();
    socket.emit("deleteUser", [userId, randomKey, username]);
    socket.disconnect();
    aboutButtonElement.show();
    chrome.storage.local.clear();
    chrome.runtime.sendMessage({turnOffNotifications: 1});
    window.close();
}

function promptChangeUsername(){
    $("#confirmChangeUsernameModal").modal("show");
}

function changeUsername(){
    var newUsername = document.getElementById("changeUsernameInput").value;

    if(newUsername.length>maxUsernameLength) {
        document.getElementById("changeUsernameInput").value = "";
        document.getElementById("changeUsernameInput").placeholder="Username too long";
    }
    else if(newUsername) {
        socket.emit("changeUsername", [userId, randomKey, username, newUsername]);
        $("#confirmChangeUsernameModal").modal("hide");
        document.getElementById("changeUsernameInput").value = "";
    } 
    else {
        document.getElementById("changeUsernameInput").placeholder="Please enter username";
    }
}

function chatSettings(){
    if(clickedChat.type == 0){
        getDeleteMsg();
        $("#friendSettingsModal").modal("show");
    }
    else if(clickedChat.type == 1){
        getDeleteMsg();
        $("#groupSettingsModal").modal("show");
    }
}

$("#addFriendToGroupBtn").on("click", function() {

    chrome.storage.local.get(["chats"], function(result) {
        var friends = result.chats[0]; // {userId: [name, view status, last activity, last online], ...}
        var groups = result.chats[1]; // // {groupId: [name, view status, last activity, {memberId: {name: name, status: status}}], ...}
        var groupMembers = groups[clickedChat.id][3];

        var chats = [] ;// [[id, type], ...] type: 0: friend, 1: group
        for(var i = 0; i<Object.keys(friends).length; i++){
            chats.push([Object.keys(friends)[i], 0]);
        }
        for(var i = 0; i<Object.keys(groups).length; i++){
            chats.push([Object.keys(groups)[i], 1]);
        }

        var sortedChats = chats.sort(function(a,b){
            var lastActivityA;
            var lastActivityB;
            
            if(a[1] == 0){
                lastActivityA = friends[a[0]][2];
            }
            else{
                lastActivityA = groups[a[0]][2];
            }
            
            if(b[1] == 0){
                lastActivityB = friends[b[0]][2];
            }
            else{
                lastActivityB = groups[b[0]][2];
            }

            return lastActivityA - lastActivityB;
        }).reverse();

        $("#addFriendToGroupTable").empty();

        for(var i = 0; i<sortedChats.length; i++){
            if(sortedChats[i][1] == 0){ // Is friend
                var friendsId = sortedChats[i][0];
                var friendsName = friends[friendsId][0];
                var friendsViewStatus = friends[friendsId][1];
                var lastActivity = friends[friendsId][2];
                var friendsLastOnline = friends[friendsId][3];

                var lastActivityA = document.createElement("a");
                var lastActivityFormatted = calcLastOnline(lastActivity);

                var chatIcon = document.createElement("i");
                if(friendsId in groupMembers && groupMembers[friendsId].status != 0){
                    chatIcon.setAttribute("class", "fas fa-check fa-fw");
                }
                else{
                    chatIcon.setAttribute("class", "far fa-plus-square fa-fw");
                }

                var button = document.createElement("button");
                button.classList.add("textLink");
                button.classList.add("addFriendToGroupBtn");
                button.setAttribute("data-friendId", friendsId);
                button.appendChild(chatIcon);
                button.innerHTML += " "+friendsName;

                var buttonTd = document.createElement("td");
                buttonTd.appendChild(button);

                var tr = document.createElement("tr");
                tr.appendChild(buttonTd);
                tr.setAttribute("data-friendId", friendsId);

                document.getElementById("addFriendToGroupTable").appendChild(tr);
            }
        }

        $(".addFriendToGroupBtn").on("click", function() {
            var friendId = $(this).attr("data-friendId");

            if(!(friendId in groupMembers && groupMembers[friendId].status != 0)){
                socket.emit("addFriendToGroup", [userId, username, clickedChat.id, friendId]);
                $('button[data-friendId="'+friendId+'"] > i').attr("class", "fas fa-check fa-fw");
                socket.emit("refreshUsers", [randomKey, userId, username]);
            }
        });
    });

    $("#addFriendToGroupModal").modal("show");
});

$("#seeGroupMembersBtn").on("click", function() {
    var groupMembers = groups[clickedChat.id][3];

    $("#seeGroupMembersTable").empty();

    for(var i = 0; i<Object.keys(groupMembers).length; i++){
        var memberId = Object.keys(groupMembers)[i];
        var memberUsername = groupMembers[memberId].username;
        var memberStatus = groupMembers[memberId].status;

        var statusText = document.createElement("h6");
        statusText.setAttribute("class", "small-text");
        if(memberStatus == 0){
            continue; // user deleted
        }
        else if(memberStatus == 1){
            statusText.innerHTML = "";
        }
        else if(memberStatus == 2){
            statusText.innerHTML = "Creator";
        }

        var statusTextTd = document.createElement("td");
        statusTextTd.appendChild(statusText);

        var crossIcon = document.createElement("i");
        crossIcon.setAttribute("class", "far fa-times-circle");
        crossIcon.setAttribute("data-memberId", memberId);
        crossIcon.onclick = function() {removeMemberFromGroup(this.getAttribute("data-memberId"))};

        var crossIconTd = document.createElement("td");
        crossIconTd.appendChild(crossIcon);

        var button = document.createElement("button");
        button.classList.add("textLink");
        button.innerHTML += " "+memberUsername;

        var buttonTd = document.createElement("td");
        buttonTd.appendChild(button);

        var tr = document.createElement("tr");
        tr.appendChild(buttonTd);
        tr.appendChild(statusTextTd);

        if(!(memberId == userId || groupMembers[userId].status != 2)){
            tr.appendChild(crossIconTd);
            tr.setAttribute("data-memberId", memberId);
        }

        document.getElementById("seeGroupMembersTable").appendChild(tr);
    }

    $("#seeGroupMembersModal").modal("show");

    function removeMemberFromGroup(memberId){
        var memberName = groupMembers[memberId].username;
        socket.emit("removeMemberFromGroup", [userId, username, clickedChat.id, memberId, memberName]);
        socket.emit("refreshUsers", [randomKey, userId, username]);
        $("#seeGroupMembersTable>tr[data-memberId='"+ memberId +"']").remove();
    }
});

$("#leaveGroupBtn").on("click", function() {
    socket.emit("removeMemberFromGroup", [userId, username, clickedChat.id, userId]);
    socket.emit("refreshUsers", [randomKey, userId, username]);
    $("#groupSettingsModal").modal("hide");
    goBack();
});

socket.on("changeUsernameConfirm", function(reply){
    $("#alertMsg").text("Username Changed");
    $("#alertModal").modal("show");
    chrome.storage.local.set({whiteboxUsername: reply});
    username = reply;
});

function goBack(){
    clickedChat = undefined;
    hideEverything();

    if(previousPage === "userInputElement"){
        userInputElement.show();
    }
    else{
        mainTabs.show();
        socket.emit("refreshUsers", [randomKey, userId, username]);
    }

    aboutButtonElement.show();
    backButtonElement.hide();
    messages = {};
}

$("#messageScroll").on('scroll', function() {
    var scrollTop = $(this).scrollTop();

    if(messageScroll.scrollTop != (messageScroll.scrollHeight - messageScroll.offsetHeight)){ // If not scrolled to bottom
        $("#scrollDownBtn").show();
    }
    else{
        $("#scrollDownBtn").hide();
        $("#scrollDownBtn sup").hide();
    }

    if(scrollTop <= messageBufferDistance && Object.keys(messages).length != 0) {
        var numOfMessages = Object.keys(messages).length;
        var reply = [randomKey, userId, clickedChat.id, username, numOfMessages, clickedChat.type];
        socket.emit("requestMessagesMore", reply);
    }
});

function scrollDown() {
    document.getElementById("messageScroll").scrollTop = messageScroll.scrollHeight; // Scroll to bottom
}

function openMessagePage(c, type){
    function waitForConnection(){
        if(friends == null) {
            window.setTimeout(waitForConnection, 50);
        } else {
            var clickedName;

            if(type == 0){
                clickedName = friends[c][0];
            }
            else if(type == 1){ 
                clickedName = groups[c][0];
            }

            clickedChat = {id: c, type: type, name: clickedName};

            $("#messageScroll").contents().remove();
            $("#messagePageName").text(clickedChat.name);
            if(clickedChat.type == 0){ // Friend
                $("#messagePageLastOnline").text("Last Online: "+calcLastOnline(friends[clickedChat.id][3]));
            }
            else if(clickedChat.type == 1){
                $("#messagePageLastOnline").text("");
            }

            hideEverything();
            $("#scrollDownBtn").hide();
            messagePageElement.show();
            aboutButtonElement.show();
            backButtonElement.show();
            var reply = [randomKey, userId, c, username, type];
            socket.emit("requestMessages", reply);
        }
    }
    waitForConnection();
}

function searchUsers(){
    var usernameToSearch = $("#userSearchInput").val();

    socket.emit("searchUsers", [userId, randomKey, username, usernameToSearch]);
}

function sendMessage(){
    var unixTime = Math.round(+new Date()/1000);
    var messageElement = document.getElementById("message");
    var message = messageElement.value.replace("\n", "");
    messageElement.value = ""; // Clear message box

    if(message === "") return;

    message = unescape(encodeURIComponent(message));

    var reply = [username, randomKey, message, clickedChat.id, userId, clickedChat.name, clickedChat.type];

    // add to messages
    messages.push({messageId: null, senderId: userId, message: message, timeSent: unixTime, confirmed: false});
    refreshMessagePage();
    messageScroll.scrollTop = messageScroll.scrollHeight; // Scroll to bottom

    // Send message to server
    socket.emit("message", reply);
}

function friendRequest(requesteeId){
    $("#matchingUsers [data-matchinguserid = \""+requesteeId+"\"]").attr("class", "fas fa-check fa-fw");
    socket.emit("friendRequest", [userId, randomKey, requesteeId, username]);
}

function calcLastOnline(lastOnline) {
    var unixTime = Math.round(+new Date()/1000);
    var seconds = unixTime - lastOnline;

    if(seconds <= 5){
        return "now";
    }

    var days = Math.floor(seconds / (3600*24));
    seconds -= days*3600*24;
    var hrs  = Math.floor(seconds / 3600);
    seconds -= hrs*3600;
    var mnts = Math.floor(seconds / 60);
    seconds -= mnts*60;

    if(mnts == 0 && hrs == 0 && days == 0){
        return seconds+"s";
    }
    else if(hrs == 0 && days == 0){
        return mnts+"m";
    }
    else if(days == 0){
        return hrs+"h";
    }
    else if(days > 0){
        return days+"d";
    }
    else if(days > 360){
        return "&infin;";
    }
}

function findLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var exp2 =/(^|[^\/])(www\.[\S]+(\b|$))/gim;
    return text.replace(exp, '<a href="$1" target="_blank">$1</a>').replace(exp2, '$1<a href="http://$2" target="_blank">$2</a>');
}

$(document).keydown(function(e){
    if(e.which == 27 && $("#messagePage").is(":visible")){
        e.preventDefault();
        $(".modal").modal("hide");
        goBack();
    }
});

socket.on("response", function(reply){
    if(reply === "ERROR: username taken"){
        document.getElementById("username").value = "";
        document.getElementById("username").placeholder = "Username taken";
        document.getElementById('username').style.borderColor = "red";
    }
    else if(reply === "ERROR: key incorrect"){
        alert("SERVER ERROR\nERROR: key incorrect");
        hideEverything();
        aboutButtonElement.show();
        chrome.storage.local.clear();
        socket.disconnect();
        window.close();
    }
    else{
        userId = reply;
        socket.emit("refreshUsers", [randomKey, userId, username]);
        hideEverything();
        mainTabs.show();
        chrome.storage.local.set({whiteboxUsername: username});
        chrome.storage.local.set({whiteboxId: userId});
        chrome.runtime.sendMessage({turnOnNotifications: 1});
    }
});

socket.on("messages", function(reply){
    messages = reply[0].reverse();
    
    refreshMessagePage();

    document.getElementById("messageScroll").scrollTop = messageScroll.scrollHeight; // Scroll to bottom
    document.getElementsByClassName("new-msgs-div")[0].scrollIntoView(); // Scroll to new msg
});

socket.on("moreMessages", function(reply){
    messages = (reply[0].reverse()).concat(messages); // [[12, "test", timestamp], [25, "oh hi", timestamp]]

    var scrollHeight = messageScroll.scrollHeight;
    var scrollLocation = $("#messageScroll").scrollTop();

    refreshMessagePage();

    var newScrollHeight = messageScroll.scrollHeight;
    $("#messageScroll").scrollTop(newScrollHeight-scrollHeight+scrollLocation);
});

socket.on("newMessage", function(incomingMessage) {
    var message = incomingMessage[0];
    var chatId = incomingMessage[1];
    var timeSent = incomingMessage[2];
    var type = incomingMessage[3];
    var senderId = incomingMessage[4];
    var messageId = incomingMessage[5];

    if(clickedChat.id == chatId){ // If chat is open
        messages.push({messageId: messageId, senderId: senderId, message: message, timeSent: timeSent}); // add to messages
        
        if(messageScroll.scrollTop === (messageScroll.scrollHeight - messageScroll.offsetHeight)){ // If the user is scrolled to bottom
            refreshMessagePage();
            messageScroll.scrollTop = messageScroll.scrollHeight; // Scroll to bottom
        }
        else{
            refreshMessagePage();
            $("#scrollDownBtn sup").show();
        }

        // Tell server you got the message
        socket.emit("receivedMessage", [username, randomKey, userId, clickedChat.id, clickedChat.type]);
    }
});

socket.on("updatedViewStatus", function(reply) {
    var friendId = reply[0];
    var viewStatus = reply[1];

    // View status:
    // 0: received and seen
    // 1: received and not seen
    // 2: sent and seen
    // 3: sent and not seen

    var chatIcon = document.createElement("span");

    if(viewStatus == 0){
        $("#"+friendId+">span").attr("class", "far fa-comment-alt fa-fw");
    }
    else if(viewStatus == 1){
        $("#"+friendId+">span").attr("class", "fas fa-comment-alt fa-fw");
    }
    else if(viewStatus == 2){
        $("#"+friendId+">span").attr("class", "far fa-arrow-alt-circle-right fa-fw");
    }
    else if(viewStatus == 3){
        $("#"+friendId+">span").attr("class", "fas fa-arrow-alt-circle-right fa-fw");
    }
});

socket.on("messageConfirm", function(reply) {
    var senderId = userId;
    var message = reply.message;
    var timeSent = Math.round(+new Date()/1000);
    var lastMessageSenderId;
    var lastTimeStamp = 0;

    for (var i = 0; i < messages.length; i++) {
        if(messages[i].confirmed != undefined && !messages[i].confirmed && message === messages[i].message){
            messages[i].confirmed = true;
            break;
        }
    }

    refreshMessagePage();
});

socket.on("refreshedUsers", function(reply) {
    friends = reply[0]; // {userId: [name, view status, last activity, last online], ...}
    groups = reply[1]; // {groupId: [name, view status, last activity, {memberId: {name: name, status: status}}], ...}
    chrome.storage.local.set({chats: reply});
    
    refreshChats(reply);
});

function refreshMessagePage() {
    var messageScroll = document.getElementById("messageScroll");
    messageScroll.innerHTML = "";

    var displayedNewMsgsDiv = false;

    for(var i=0; i<messages.length; i++){
        var message = findLinks(escapeHtml(decodeURIComponent(escape(messages[i].message))));
        var timeSent = messages[i].timeSent;
        var senderId = messages[i].senderId;
        var messageId = messages[i].messageId;
        var confirmed = messages[i].confirmed; // If it is confirmed by server
        var newMessage = messages[i].newMessage;

        if(confirmed === undefined){
            confirmed = true;
        }

        var lastMessageSenderId;
        var lastTimeStamp = 0;

        // Calculate time stamp
        var options = {month: "short", day: "numeric"};
        var date = new Date(timeSent*1000);
        var day = date.getDay();
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var formattedTimeStamp;

        // Current day
        var todayDate = new Date();

        if(hours <= 12){
            formattedTimeStamp = hours+':'+minutes.substr(-2)+"am";
        }
        else{
            formattedTimeStamp = (hours-12)+':'+minutes.substr(-2)+"pm";
        }

        if(!(date.getFullYear() === todayDate.getFullYear() &&
           date.getMonth() === todayDate.getMonth() &&
           date.getDate() === todayDate.getDate())){
            formattedTimeStamp = date.toLocaleString("en-US", options)+", "+formattedTimeStamp;
        }

        // get last sender id
        // If first message or right after a new messages divider (if a group chat)
        if(i == 0 || (newMessage && !displayedNewMsgsDiv && clickedChat.type == 1)){
            lastMessageSenderId = null;
            lastTimeStamp = messages[0].timeSent;
        }
        else{
            lastMessageSenderId = messages[i-1].senderId; // Get name of first message
            lastTimeStamp = messages[i-1].timeSent;
        }

        // Show message
        var senderName;
        var messageDiv = document.createElement("div");
        if(senderId == 0){ // If the sender is the server
            headerText = message;
            message = "";
        }
        else if(senderId != userId){ // If the message sender is not you
            messageDiv.classList.add("replyCard");
            if(clickedChat.type == 0){
                senderName = friends[senderId][0];
            }
            else{
                senderName = groups[clickedChat.id][3][senderId].username;
            }
            headerText = senderName+" "+formattedTimeStamp;
        }
        else{
            messageDiv.classList.add("sendCard");
            senderName = username;
            headerText = formattedTimeStamp+" "+senderName;
        }

        // If the local user sends a message twice in a row
        if(lastMessageSenderId != senderId || (lastTimeStamp+timeUntilNewHeader)<timeSent || senderId == 0){ 
            var receiveName = document.createElement("h6");
            receiveName.classList.add("message-header");
            receiveName.innerHTML = headerText;
            messageDiv.appendChild(receiveName);
        }

        var messageText = document.createElement("h6");
        messageText.classList.add("message");
        messageText.innerHTML = message;

        // If not received by server 
        if(!confirmed){
            messageText.classList.add("unconfirmed");
        }

        // if the message is new, and new messages divider not displayed and it is a group chat
        if(newMessage && !displayedNewMsgsDiv && clickedChat.type == 1){ 
            var newMsgH6 = document.createElement("span");
            newMsgH6.innerHTML = "new messages";

            var newMsgDiv = document.createElement("div");
            newMsgDiv.classList.add("new-msgs-div");
            newMsgDiv.appendChild(newMsgH6);
            messageScroll.appendChild(newMsgDiv);
            displayedNewMsgsDiv = true;
        }

        messageDiv.appendChild(messageText);
        messageDiv.setAttribute("data-messageId", messageId);
        messageScroll.appendChild(messageDiv);
    }
}

function refreshChats(reply){
    var friends = reply[0]; // {userId: [name, view status, last activity, last online], ...}
    var groups = reply[1]; // {groupId: [name, view status, last activity, {memberId: {name: name, status: status}}], ...}

    var chats = []; // [[id, type], ...] type: 0: friend, 1: group
    for(var i = 0; i<Object.keys(friends).length; i++){
        chats.push([Object.keys(friends)[i], 0]);
    }
    for(var i = 0; i<Object.keys(groups).length; i++){
        chats.push([Object.keys(groups)[i], 1]);
    }

    var usersElement = document.getElementById("users");

    var sortedChats = chats.sort(function(a,b){
        var lastActivityA;
        var lastActivityB;
        
        if(a[1] == 0){
            lastActivityA = friends[a[0]][2];
        }
        else{
            lastActivityA = groups[a[0]][2];
        }
        
        if(b[1] == 0){
            lastActivityB = friends[b[0]][2];
        }
        else{
            lastActivityB = groups[b[0]][2];
        }

        return lastActivityA - lastActivityB;
    }).reverse();

    $("#users").empty();

    for(var i = 0; i<sortedChats.length; i++){
        if(sortedChats[i][1] == 0){ // Is friend
            var friendsId = sortedChats[i][0];
            var friendsName = friends[friendsId][0];
            var friendsViewStatus = friends[friendsId][1];
            var lastActivity = friends[friendsId][2];
            var friendsLastOnline = friends[friendsId][3];

            var lastActivityA = document.createElement("a");
            var lastActivityFormatted = calcLastOnline(lastActivity);

            // View status:
            // 0: received and seen
            // 1: received and not seen
            // 2: sent and seen
            // 3: sent and not seen

            var chatIcon = document.createElement("span");

            if(friendsViewStatus == 0){
                chatIcon.setAttribute("class", "far fa-comment-alt fa-fw");
                lastActivityFormatted = "Received "+lastActivityFormatted;
            }
            else if(friendsViewStatus == 1){
                chatIcon.setAttribute("class", "fas fa-comment-alt fa-fw");
                lastActivityFormatted = "New "+lastActivityFormatted;
            }
            else if(friendsViewStatus == 2){
                chatIcon.setAttribute("class", "far fa-arrow-alt-circle-right fa-fw");
                lastActivityFormatted = "Opened "+lastActivityFormatted;
            }
            else if(friendsViewStatus == 3){
                chatIcon.setAttribute("class", "fas fa-arrow-alt-circle-right fa-fw");
                lastActivityFormatted = "Sent "+lastActivityFormatted;
            }

            var button = document.createElement("button");
            button.classList.add("textLink");
            button.setAttribute("data-friendId", friendsId);
            button.onclick = function() {openMessagePage(this.getAttribute("data-friendId"), 0);}; // 0 because it is a friend
            button.appendChild(chatIcon);
            button.innerHTML += " "+friendsName;
            
            lastActivityA.classList.add("lastOnline");
            lastActivityA.innerHTML = lastActivityFormatted;

            var buttonTd = document.createElement("td");
            buttonTd.appendChild(button);

            // Dropdown
            var dropdownBtn = document.createElement("button");
            dropdownBtn.classList.add("textLink");
            dropdownBtn.setAttribute("data-toggle", "dropdown");
            dropdownBtn.innerHTML = "...";

            var dropdownDeleteMsgBtn = document.createElement("button");
            dropdownDeleteMsgBtn.classList.add("dropdown-item");
            dropdownDeleteMsgBtn.classList.add("dropdown-text");
            dropdownDeleteMsgBtn.setAttribute("data-friendId", friendsId);
            dropdownDeleteMsgBtn.onclick = function() {deleteMsgAfterModal(this.getAttribute("data-friendId"));};
            dropdownDeleteMsgBtn.innerHTML = "Delete Msg After:";

            var dropdownSeeFriendsBtn = document.createElement("button");
            dropdownSeeFriendsBtn.classList.add("dropdown-item");
            dropdownSeeFriendsBtn.classList.add("dropdown-text");
            dropdownSeeFriendsBtn.setAttribute("data-friendId", friendsId);
            dropdownSeeFriendsBtn.onclick = function() {seeFriendsModal(this.getAttribute("data-friendId"));};
            dropdownSeeFriendsBtn.innerHTML = "See Friends";

            var dropdownMenu = document.createElement("div");
            dropdownMenu.classList.add("dropdown-menu");
            dropdownMenu.append(dropdownDeleteMsgBtn);
            dropdownMenu.append(dropdownSeeFriendsBtn);
             
            var dropdownDiv = document.createElement("div");
            dropdownDiv.classList.add("dropdown");
            dropdownDiv.append(dropdownBtn);
            dropdownDiv.append(dropdownMenu);

            var dropdownTd = document.createElement("td");
            dropdownTd.append(dropdownDiv);

            var lastActivityTd = document.createElement("td");
            lastActivityTd.align = "right";
            lastActivityTd.appendChild(lastActivityA);

            var tr = document.createElement("tr");
            tr.appendChild(buttonTd);
            tr.appendChild(lastActivityTd);
            tr.setAttribute("data-friendId", friendsId);

            usersElement.appendChild(tr);
        }

        else if(sortedChats[i][1] == 1){ // Is group
            var groupId = sortedChats[i][0];
            var groupName = groups[groupId][0];
            var groupViewStatus = groups[groupId][1];
            var lastActivity = groups[groupId][2];

            var lastActivityA = document.createElement("a");
            var lastActivityFormatted = calcLastOnline(lastActivity);

            // View status:
            // 0: received and seen
            // 1: received and not seen
            // 2: sent and seen
            // 3: sent and not seen

            var chatIcon = document.createElement("span");

            if(groupViewStatus == 0){
                chatIcon.setAttribute("class", "far fa-comment-alt fa-fw");
                lastActivityFormatted = "Received "+lastActivityFormatted;
            }
            else if(groupViewStatus == 1){
                chatIcon.setAttribute("class", "fas fa-comment-alt fa-fw");
                lastActivityFormatted = "New "+lastActivityFormatted;
            }
            else if(groupViewStatus == 2){
                chatIcon.setAttribute("class", "far fa-arrow-alt-circle-right fa-fw");
                lastActivityFormatted = "Opened "+lastActivityFormatted;
            }
            else if(groupViewStatus == 3){
                chatIcon.setAttribute("class", "fas fa-arrow-alt-circle-right fa-fw");
                lastActivityFormatted = "Sent "+lastActivityFormatted;
            }

            var button = document.createElement("button");
            button.classList.add("textLink");
            button.setAttribute("data-groupId", groupId);
            button.onclick = function() {openMessagePage(this.getAttribute("data-groupId"), 1)}; // 1 because it is a friend
            button.appendChild(chatIcon);
            button.innerHTML += " "+groupName;
            
            lastActivityA.classList.add("lastOnline");
            lastActivityA.innerHTML = lastActivityFormatted;

            var buttonTd = document.createElement("td");
            buttonTd.appendChild(button);

            var lastActivityTd = document.createElement("td");
            lastActivityTd.align = "right";
            lastActivityTd.appendChild(lastActivityA);

            var tr = document.createElement("tr");
            tr.appendChild(buttonTd);
            tr.appendChild(lastActivityTd);
            tr.setAttribute("data-groupId", groupId);

            usersElement.appendChild(tr);
        }
    }
}

function getDeleteMsg(){
    socket.emit("getDeleteMsg", [userId, username, clickedChat.id, clickedChat.type]);
}

socket.on("deleteMsgReply", function(reply) {
    var selection = reply[0];
    var friendId = reply[1];

    if(clickedChat.type == 0){
        $("#deleteMsgSelectFriend").val(selection);
    }
    else if(clickedChat.type == 1){
        $("#deleteMsgSelectGroup").val(selection);
    }
});

$("#deleteMsgSelectFriend").change(function() {
    var selection = $("#deleteMsgSelectFriend").val();
    socket.emit("setDeleteMsg", [userId, randomKey, username, clickedChat.id, selection, clickedChat.type]);
});

$("#deleteMsgSelectGroup").change(function() {
    var selection = $("#deleteMsgSelectGroup").val();
    socket.emit("setDeleteMsg", [userId, randomKey, username, clickedChat.id, selection, clickedChat.type]);
});

function confirmUnfriendModal(friendId) {
    $("#friendSettingsModal").modal("hide");
    $("#confirmUnfriendMsg").text("Are you sure you want to unfriend "+clickedChat.name+"?");
    $("#confirmUnfriendModal").modal("show");
}

function unfriendFriend() {
    socket.emit("unfriendFriend", [userId, randomKey, username, clickedChat.id]);
    $("tr[data-friendId="+clickedChat.id+"]").remove();
    $("#confirmUnfriendModal").modal("hide");
    goBack();
}

function seeFriendsModal(friendId) {
    socket.emit("seeFriends", [userId, randomKey, username, friendId]);
}

socket.on("unacceptedRequests", function(unacceptedRequests) {
    if(unacceptedRequests != 0){
        $("#friend-requests-tab").html('Friend Requests'+("("+unacceptedRequests+")").toString().sup());
        $("#friend-requests-dropdown").html('<span class="fas fa-ellipsis-h"></span>'+("("+unacceptedRequests+")").toString().sup());
    }
    else{
        $("#friend-requests-tab").html('Friend Requests');
        $("#friend-requests-dropdown").html('<span class="fas fa-ellipsis-h"></span>');
    }
});

socket.on("popup", function(message) {
    $("#alertMsg").text(message);
    $("#alertModal").modal("show");
});

socket.on("friendsFriends", function(reply) {
    var friendsFriends = reply; //{userId: [name]}
    $("#friendsFriendsTable").empty();
    var usersElement = document.getElementById("friendsFriendsTable");

    for(var i = 0; i<Object.keys(friendsFriends).length; i++){
        var friendsFriendId = Object.keys(friendsFriends)[i];
        var friendsFriendName = friendsFriends[friendsFriendId];

        var button = document.createElement("button");
        button.classList.add("textLink");
        button.id = friendsFriendId;
        button.onclick = function() {friendRequest(this.id);};
        button.innerHTML = '<span class="far fa-plus-square fa-fw" data-matchingUserId="'+friendsFriendId+'""></span> '+friendsFriendName;

        var buttonTd = document.createElement("td");
        buttonTd.appendChild(button);

        var tr = document.createElement("tr");
        tr.appendChild(buttonTd);

        usersElement.appendChild(tr);
    }

    $("#friendsFriendsModal").modal("show");
});

socket.on("searchUsersReply", function(reply) {
    var matchingUsers = reply; //{userId: [name, lastOnline]}
    $("#matchingUsers").empty();

    // Sort by num of mutual friends
    var sortedUsers = Object.keys(matchingUsers).sort(function(a,b){
        return matchingUsers[b][2]-matchingUsers[a][2];
    });

    console.log(JSON.stringify(reply, null, 2))

    for(var i = 0; i<sortedUsers.length; i++){
        var matchingUserId = sortedUsers[i];
        var matchingUserName = matchingUsers[matchingUserId][0];
        var matchingUserLastOnline = matchingUsers[matchingUserId][1];
        var usersElement = document.getElementById("matchingUsers");
        console.log((friends != undefined && matchingUserId in friends))

        if((friends != undefined && matchingUserId in friends) || matchingUserId == userId){
            continue; // Already friends
        }

        var button = document.createElement("button");
        button.classList.add("textLink");
        button.id = matchingUserId;
        button.onclick = function() {friendRequest(this.id);};
        button.innerHTML = '<span class="far fa-plus-square fa-fw" data-matchingUserId="'+matchingUserId+'""></span> '+matchingUserName;

        var lastOnline = document.createElement("a");
        var lastOnlineValue = calcLastOnline(matchingUserLastOnline);
        
        lastOnline.classList.add("lastOnline");
        lastOnline.innerHTML = lastOnlineValue;

        var buttonTd = document.createElement("td");
        buttonTd.appendChild(button);

        var lastOnlineTd = document.createElement("td");
        lastOnlineTd.align = "right";
        lastOnlineTd.appendChild(lastOnline);

        var tr = document.createElement("tr");
        tr.appendChild(buttonTd);
        tr.appendChild(lastOnlineTd);

        usersElement.appendChild(tr);
    }
});

socket.on("friendRequests", function(reply) {
    var friendRequests = reply;

    $("#friendRequests").empty();

    for(var i = 0; i<friendRequests.length; i++){
        var usersElement = document.getElementById("friendRequests");

        var crossIcon = document.createElement("i");
        crossIcon.setAttribute("class", "far fa-times-circle fa-fw mr-1 textLink");
        crossIcon.setAttribute("data-requesterId", friendRequests[i][2]);
        crossIcon.onclick = function() {declineFriendRequest(this.getAttribute("data-requesterId"));};

        var checkIcon = document.createElement("i");
        checkIcon.setAttribute("class", "fas fa-check fa-fw mr-2 textLink");
        checkIcon.setAttribute("data-requesterId", friendRequests[i][2]);
        checkIcon.onclick = function() {acceptFriendRequest(this.getAttribute("data-requesterId"));};

        var text = document.createElement("a");
        text.classList.add("text");
        text.innerHTML = friendRequests[i][0];

        var lastOnline = document.createElement("a");
        var lastOnlineValue = calcLastOnline(friendRequests[i][1]);
        
        lastOnline.classList.add("lastOnline");
        lastOnline.innerHTML = lastOnlineValue;

        var divTd = document.createElement("td");
        divTd.appendChild(crossIcon);
        divTd.appendChild(checkIcon);
        divTd.appendChild(text);

        var lastOnlineTd = document.createElement("td");
        lastOnlineTd.align = "right";
        lastOnlineTd.appendChild(lastOnline);

        var tr = document.createElement("tr");
        tr.appendChild(divTd);
        tr.appendChild(lastOnlineTd);

        usersElement.appendChild(tr);
    }

    function acceptFriendRequest(requesterId){
        socket.emit("acceptFriendRequest", [userId, randomKey, requesterId, username]);
        $('i[data-requesterId="'+requesterId+'"]').closest("tr").remove();
    }

    function declineFriendRequest(requesterId){
        socket.emit("declineFriendRequest", [userId, randomKey, requesterId, username]);
        $('i[data-requesterId="'+requesterId+'"]').closest("tr").remove();
    }
});

socket.on("sentFriendRequests", function(reply) {
    var sentFriendRequests = reply;

    $("#sentFriendRequests").empty();

    for(var i = 0; i<sentFriendRequests.length; i++){
        var usersElement = document.getElementById("sentFriendRequests");

        var button = document.createElement("button");
        button.classList.add("textLink");
        button.id = sentFriendRequests[i][0];
        button.innerHTML = sentFriendRequests[i][0];

        var lastOnline = document.createElement("a");
        var lastOnlineValue = calcLastOnline(sentFriendRequests[i][1]);
        
        lastOnline.classList.add("lastOnline");
        lastOnline.innerHTML = lastOnlineValue;

        var buttonTd = document.createElement("td");
        buttonTd.appendChild(button);

        var lastOnlineTd = document.createElement("td");
        lastOnlineTd.align = "right";
        lastOnlineTd.appendChild(lastOnline);

        var tr = document.createElement("tr");
        tr.appendChild(buttonTd);
        tr.appendChild(lastOnlineTd);

        usersElement.appendChild(tr);
    }
});

socket.on("serverMessage", function(reply) {
    var messageVersion = reply[0];
    var message = reply[1];

    // Get previous received messages
    if(messageVersion===softwareVersion){
        chrome.storage.local.get(["serverMessageReceived"], function(result) {
            if(result.serverMessageReceived!=softwareVersion){
                $("#alertMsg").html(message);
                $("#alertModal").modal("show");
            }
            chrome.storage.local.set({serverMessageReceived: softwareVersion});
        });
    }
});

socket.on("friendRequestStatus", function (status, requesteeId){
    if(status === "OK"){
        $('span[data-matchinguserid="'+requesteeId+'"]').attr("class", "fas fa-check fa-fw");
    }
    else if(status === "ERROR: Already sent request"){
        $("#alertMsg").text("You have already sent a friend request to that person");
        $("#alertModal").modal("show");
        $("#friendsFriendsModal").modal("hide");
    }
    else if(status === "ERROR: Already friends"){
        $("#alertMsg").text("You are already friends with that person");
        $("#alertModal").modal("show");
        $("#matchingUsers > tr > td > #"+requesteeId).closest("tr").remove();
        $("#friendsFriendsModal").modal("hide");
    }
});

socket.on("refreshFriends", function(){
    socket.emit("refreshUsers", [randomKey, userId, username]);
});

$("#snake-tab").on('show.bs.tab', function(){
    openSnakeTab();
});

$("#2048-game-tab").on('show.bs.tab', function(){
    open2048Tab();
});

$("#tetris-tab").on('show.bs.tab', function(){
    openTetrisTab();
});

socket.on("gameHighscores", function(reply) {
    var gameName = reply[0];
    var friendScores = reply[1];

    $("#gameHighscoresTable").empty();

    var sortedFriendIds = Object.keys(friendScores).sort(function(a,b){
        return friendScores[a]-friendScores[b];
    }).reverse();

    for(var i=0; i<sortedFriendIds.length; i++){
        var friendId = sortedFriendIds[i];
        var friendName;

        if(friendId == userId){
            friendName = username;
        }
        else{
            friendName = friends[friendId][0];
        }

        var friendScore = friendScores[friendId];

        var nameTd = document.createElement("td");
        nameTd.innerHTML = friendName;

        var scoreTd = document.createElement("td");
        scoreTd.align = "right";
        scoreTd.innerHTML = friendScore;

        var tr = document.createElement("tr");
        tr.appendChild(nameTd);
        tr.appendChild(scoreTd);

        $("#gameHighscoresTable").append(tr);
    }
    $("#gameHighscoresModal").modal("show");
});

function getGameHighScores(game) {
    socket.emit("getGameHighScores", [userId, randomKey, username, game]); 
}

function gameHighScore(game, score) {
    socket.emit("gameHighScore", [userId, randomKey, username, game, score]);  
}

chrome.permissions.contains({origins: ["https://www.jblrd.com/"]}, function(result) {
    if (!result) {
        $("#enableNotificationsModal").modal("show");
    }
});

$("#enableNotificationsBtn").click(function() {
    chrome.permissions.request({origins: ['https://www.jblrd.com/']}, function(granted){
        if(granted){
            $("#enableNotificationsModal").modal("hide");
        }
    });
});

function checkConnection() {
    if(!socket.connected){
        login();
    }
}

$(".table-search").on("keyup", function() {
    var value = $(this).val().toLowerCase();
    $(this).closest("table").find("tbody > tr").filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});

$("#make-group-tab").on('show.bs.tab', function(){
    chrome.storage.local.get(["chats"], function(result) {
        var friends = result.chats[0]; // {userId: [name, view status, last activity, last online], ...}
        var groups = result.chats[1]; // {groupId: [name, view status, last activity], ...}

        var chats = []; // [[id, type], ...] type: 0: friend, 1: group
        for(var i = 0; i<Object.keys(friends).length; i++){
            chats.push([Object.keys(friends)[i], 0]);
        }
        for(var i = 0; i<Object.keys(groups).length; i++){
            chats.push([Object.keys(groups)[i], 1]);
        }

        var sortedChats = chats.sort(function(a,b){
            var lastActivityA;
            var lastActivityB;
            
            if(a[1] == 0){
                lastActivityA = friends[a[0]][2];
            }
            else{
                lastActivityA = groups[a[0]][2];
            }
            
            if(b[1] == 0){
                lastActivityB = friends[b[0]][2];
            }
            else{
                lastActivityB = groups[b[0]][2];
            }

            return lastActivityA - lastActivityB;
        }).reverse();

        $("#makeGroupTable").empty();

        for(var i = 0; i<sortedChats.length; i++){
            if(sortedChats[i][1] == 0){ // Is friend
                var friendsId = sortedChats[i][0];
                var friendsName = friends[friendsId][0];
                var friendsViewStatus = friends[friendsId][1];
                var lastActivity = friends[friendsId][2];
                var friendsLastOnline = friends[friendsId][3];

                var lastActivityA = document.createElement("a");
                var lastActivityFormatted = calcLastOnline(lastActivity);

                var chatIcon = document.createElement("i");
                chatIcon.setAttribute("class", "far fa-plus-square fa-fw");

                var button = document.createElement("button");
                button.classList.add("textLink");
                button.setAttribute("data-friendId", friendsId);
                button.onclick = function() {makeGroupNewFriend(this.getAttribute("data-friendId"));};
                button.appendChild(chatIcon);
                button.innerHTML += " "+friendsName;

                var buttonTd = document.createElement("td");
                buttonTd.appendChild(button);

                var tr = document.createElement("tr");
                tr.appendChild(buttonTd);
                tr.setAttribute("data-friendId", friendsId);

                document.getElementById("makeGroupTable").appendChild(tr);
            }
        }
    });

    var friendsInGroup = [];

    function makeGroupNewFriend(friendsId) {
        $("#makeGroupNextBtn").removeAttr("disabled");
        if(friendsInGroup.includes(friendsId)){
            $('button[data-friendId="'+friendsId+'"] > i').attr("class", "far fa-plus-square fa-fw");
            
            var friendsId = friendsInGroup.indexOf(friendsId);
            if (friendsId !== -1) friendsInGroup.splice(friendsId, 1);

            if(friendsInGroup.length == 0){
                $("#makeGroupNextBtn").attr("disabled", true);
            }
        }
        else{
            $('button[data-friendId="'+friendsId+'"] > i').attr("class", "fas fa-check fa-fw");
            friendsInGroup.push(friendsId);
        }
    }

    $("#makeGroupNextBtn").on("click", function() {
        $("#makeGroupModal").modal("show");
    });

    $("#makeGroupCreateBtn").click(function() {
        var groupName = $("#makeGroupName").val();
        if(groupName.length == 0){
            $("#makeGroupName").val("");
            $("#makeGroupName").attr("placeholder", "Cannot be left empty");
            $('#makeGroupName').attr('style', 'border-color: red !important;');
        }
        else{
            $("#makeGroupName").attr("placeholder", "Group Name");
            $('#makeGroupName').removeAttr("style");

            socket.emit("makeGroup", [userId, username, groupName, friendsInGroup]);
        }
    });

    socket.on("groupMade", function(){
        $("#makeGroupModal").modal("hide");
        $("#friends-tab").tab('show');
    });
});

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
 }