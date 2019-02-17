(function() {
var clickedGame = {};
var board;
var game;

$("#chessGameArea").hide();

// Settings button press
$("#chessGameSettings").on("click", function() {
    $("#chessGameSettingsModal").modal("show");

    $("#chessRestartGame").on("click", function() {
        socket.emit("chessGame", {request: "updateBoard", data: {pgn: "", opponentId: clickedGame.opponentId}});
        $("#chessGameSettingsModal").modal("hide");
        getGameData(clickedGame.opponentId, clickedGame.opponentName);
    });

    $("#chessDeleteGame").on("click", function() {
        socket.emit("chessGame", {request: "deleteGame", data: {opponentId: clickedGame.opponentId}});
        socket.emit("chessGame", {request: "getGames"});
        $("#chessGameSettingsModal").modal("hide");
        $("#chessGameArea").hide();
        $("#chessSelectGame").show();
    });
});

// Get games
socket.emit("chessGame", {request: "getGames"});

$("#chessNewGameBtn").on("click", function() {
    chrome.storage.local.get(["chats"], function(result) {
        var friends = result.chats[0]; // {userId: {name: name, viewStatus: viewStatus, lastActivity: lastActivity, lastOnline: lastOnline, messages: {}, ...}
        var groups = result.chats[1]; // // {groupId: {name: name, viewStatus: viewStatus, lastActivity: lastActivity, members: {memberId: {username: username, status: status}}}

        var chats = [];// [[id, type], ...] type: 0: friend, 1: group
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
                lastActivityA = friends[a[0]].lastActivity;
            }
            else{
                lastActivityA = groups[a[0]].lastActivity;
            }
            
            if(b[1] == 0){
                lastActivityB = friends[b[0]].lastActivity;
            }
            else{
                lastActivityB = groups[b[0]].lastActivity;
            }

            return lastActivityA - lastActivityB;
        }).reverse();

        $("#groupNewGameTable").empty();

        for(var i = 0; i<sortedChats.length; i++){
            if(sortedChats[i][1] == 0){ // Is friend
                var friendsId = sortedChats[i][0];
                var friendsName = friends[friendsId].name;

                var chatIcon = document.createElement("i");
                chatIcon.setAttribute("class", "far fa-plus-square fa-fw");

                var button = document.createElement("button");
                button.classList.add("textLink");
                button.classList.add("chessNewGameWithFriendBtn");
                button.setAttribute("data-friendId", friendsId);
                button.appendChild(chatIcon);
                button.innerHTML += " "+friendsName;

                var buttonTd = document.createElement("td");
                buttonTd.appendChild(button);

                var tr = document.createElement("tr");
                tr.appendChild(buttonTd);
                tr.setAttribute("data-friendId", friendsId);

                document.getElementById("groupNewGameTable").appendChild(tr);
            }
        }

        $(".chessNewGameWithFriendBtn").on("click", function() {
            var friendId = $(this).attr("data-friendId");

            socket.emit("chessGame", {request: "newGame", data: {opponentId: friendId}});
            clickedGame = {opponentId: friendId, opponentName: friends[friendId].name, pgn: "", stepPosition: 0};
            $("#groupNewGameModal").modal("hide");
        });
    });

    $("#groupNewGameModal").modal("show");
});

function goBack() {
    clickedGame = {};
    board = undefined;
    game = undefined;
    socket.emit("chessGame", {request: "getGames"});
}

$("#backButton").on("click", function() {
    goBack();
});

$("#chessStepFastForwardBtn").on("click", function() {
    // Step position is how far back from beginning of game. 
    // eg. 0 is most recient and 1 is one step back

    // Subtract one to step position
    clickedGame.stepPosition = 0;

    var stepPosition = clickedGame.stepPosition;
    var pgn = clickedGame.pgn;

    // Load pgn
    var tempChess = new Chess();
    tempChess.load_pgn(pgn);
    var history = tempChess.history();

    // Undo the required number of times
    for (var i = 0; i < stepPosition; i++) {
        tempChess.undo();
    }

    // Render board at this new position
    board.position(tempChess.fen());
});

$("#chessStepForwardBtn").on("click", function() {
    // Step position is how far back from beginning of game. 
    // eg. 0 is most recient and 1 is one step back

    // Subtract one to step position
    if(clickedGame.stepPosition > 0){
        clickedGame.stepPosition = clickedGame.stepPosition - 1;
    }

    var stepPosition = clickedGame.stepPosition;
    var pgn = clickedGame.pgn;

    // Load pgn
    var tempChess = new Chess();
    tempChess.load_pgn(pgn);
    var history = tempChess.history();

    // Undo the required number of times
    for (var i = 0; i < stepPosition; i++) {
        tempChess.undo();
    }

    // Render board at this new position
    board.position(tempChess.fen());
});

$("#chessStepBackwardBtn").on("click", function() {
    // Step position is how far back from beginning of game. 
    // eg. 0 is most recient and 1 is one step back

    // Add one to step position
    clickedGame.stepPosition = clickedGame.stepPosition + 1;

    var stepPosition = clickedGame.stepPosition;
    var pgn = clickedGame.pgn;

    // Load pgn
    var tempChess = new Chess();
    tempChess.load_pgn(pgn);
    var history = tempChess.history();

    // Undo the required number of times
    for (var i = 0; i < stepPosition; i++) {
        // If move is unsuccessful step forwards one, else just go back
        if(!tempChess.undo()){ 
            clickedGame.stepPosition = clickedGame.stepPosition - 1;
        }
    }

    // Render board at this new position
    board.position(tempChess.fen());
});

$(document).keydown(function(e){
    if(e.which == 27){
        goBack();
    }
});

function refreshGames(data){
    chrome.storage.local.get(["chats"], function(result) {
        $("#chessGamesTable tr").not(':first').remove();

        var friends = result.chats[0]; // {userId: {name: name, viewStatus: viewStatus, lastActivity: lastActivity, lastOnline: lastOnline, messages: {}, ...}

        for (var i = 0; i < data.length; i++) {
            var opponentId = data[i].opponentId;
            var lastPlayer = data[i].lastPlayer;
            var lastActivity = data[i].lastActivity;
            var opponentName = friends[opponentId].name;

            var button = document.createElement("button");
            button.classList.add("textLink");
            button.classList.add("addFriendToGroupBtn");
            button.setAttribute("data-userId", opponentId);
            button.setAttribute("data-name", opponentName);
            button.innerHTML += " "+opponentName;
            button.onclick = function() {getGameData(this.getAttribute("data-userId"), this.getAttribute("data-name"))};

            var buttonTd = document.createElement("td");
            buttonTd.appendChild(button);

            var lastActivityA = document.createElement("a");
            var lastActivityFormatted = calcLastOnline(lastActivity);

            lastActivityA.classList.add("lastOnline");
            lastActivityA.innerHTML = lastActivityFormatted;

            var lastActivityTd = document.createElement("td");
            lastActivityTd.align = "right";
            lastActivityTd.appendChild(lastActivityA);

            var tr = document.createElement("tr");
            tr.appendChild(buttonTd);
            tr.appendChild(lastActivityTd);

            document.getElementById("chessGamesTable").appendChild(tr);
        }
    });
}

function getGameData(opponentId, opponentName){
    socket.emit("chessGame", {request: "getGameData", data: {opponentId: opponentId}});
    clickedGame = {opponentId: opponentId, opponentName: opponentName, stepPosition: 0};
}

socket.on("chessGame", function(reply) {
    var response = reply.response;
    var data = reply.data;

    if(response === "gameData"){
        var playerColor = data.playerColor;
        var whiteId = data.whiteId;
        var blackId = data.blackId;
        var pgn = data.pgn;

        clickedGame.pgn = pgn;
        startGame(playerColor, whiteId, blackId, pgn);
    }
    else if(response === "games"){
        refreshGames(data);
    }
    else if(response === "newMove"){
        if(data.opponentId = clickedGame.opponentId){
            updateBoard(data);
        }
        else{
            socket.emit("chessGame", {request: "getGames"});
        }
    }
});

function startGame(playerColor, whiteId, blackId, pgn){
    $("#chessOpponentName").text(clickedGame.opponentName);

    $("#chessGameArea").show();
    $("#chessSelectGame").hide();

    game = new Chess();

    game.load_pgn(pgn);

    var opponentId = clickedGame.opponentId;

    var removeGreySquares = function() {
        $('#chessBoard .square-55d63').css('background', '');
    };

    var greySquare = function(square) {
        var squareEl = $('#chessBoard .square-' + square);

        var background = '#a9a9a9';

        if (squareEl.hasClass('black-3c85d') === true) {
            background = '#696969';
        }

        squareEl.css('background', background);
    };

    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    var onDragStart = function(source, piece, position, orientation) {
        if(playerColor === "w"){
            if (game.game_over() === true  || game.turn() === 'b' || piece.search(/^b/) !== -1) {
                return false;
            }
        }
        else if(playerColor === "b"){
            if (game.game_over() === true || game.turn() === 'w' || piece.search(/^w/) !== -1) {
                return false;
            }
        }

        // If the user is not at the most receint position
        if(clickedGame.stepPosition != 0){
            $("#chessStepFastForwardBtn").fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
            return false;
        }
    };

    var onDrop = function(source, target) {
        removeGreySquares();

        // see if the move is legal
        var move = game.move({
                from: source,
                to: target,
                promotion: 'q' // NOTE: always promote to a queen for example simplicity
            }

        );

        // illegal move
        if (move === null) return 'snapback';

        updateStatus();
        socket.emit("chessGame", {request: "updateBoard", data: {pgn: game.pgn(), opponentId: opponentId}});
    };

    var onMouseoverSquare = function(square, piece) {
        // If the user is not at the most receint position
        if(clickedGame.stepPosition != 0){
            return;
        }

        if(game.game_over() === true  || game.turn() != playerColor){
            return;
        }

        // get list of possible moves for this square
        var moves = game.moves({
                square: square,
                verbose: true
            }

        );

        // exit if there are no moves available for this square
        if (moves.length === 0) return;

        // highlight the square they moused over
        greySquare(square);

        // highlight the possible squares for this piece
        for (var i = 0; i < moves.length;

            i++) {
            greySquare(moves[i].to);
        }
    };

    var onMouseoutSquare = function(square, piece) {
        removeGreySquares();
    };

    // update the board position after the piece snap 
    // for castling, en passant, pawn promotion
    var onSnapEnd = function() {
        board.position(game.fen());
    };

    var cfg = {
        orientation: 'white',
        draggable: true,
        position: game.fen(),
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd,
        pieceTheme: "vendors/chessboardjs-0.3.0/chesspieces/wikipedia/{piece}.png",
        moveSpeed: 150,
    };
    if(playerColor === "b"){
        cfg.orientation = "black";
    }

    board = ChessBoard('chessBoard', cfg);
    updateStatus();
}

function updateBoard(data){
    game.load_pgn(data.pgn);
    board.position(game.fen(), true);
    clickedGame.pgn = data.pgn;
    updateStatus();
}

$(".table-search").on("keyup", function() {
    var value = $(this).val().toLowerCase();
    $(this).closest("table").find("tbody > tr").filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});

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

function updateStatus() {
    var statusEl = $('#chessStatus');
    var status = '';

    var moveColor = 'White';

    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    }

    // draw?
    else if (game.in_draw() === true) {
        status = 'Game over, drawn position';
    }

    // game still on
    else {
        status = moveColor + "'s Turn";

        // check?
        if (game.in_check() === true) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    statusEl.html(status);
}

})();