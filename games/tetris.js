(function() {
var game = "tetris";

var theme1 = "#36393F";
var theme2 = "#DCDDDE";
var theme3 = "#72767E";
var theme4 = "#303136";
var theme5 = "#303136";
var theme6 = "#3B97E0";

var COLS = 14, ROWS = 20;
var board = [];
var lose = true;
var interval;
var intervalRender;
var current; // current moving shape
var currentX, currentY; // position of current shape
var freezed; // is current shape settled on the board?
var shapes = [
    [0,0,0,0,
     1,1,1,1,
     0,0,0,0,
     0,0,0,0],

    [0,0,0,0,
     0,1,1,1,
     0,1,0,0,
     0,0,0,0],

    [0,0,0,0,
     0,1,0,0,
     0,1,1,1,
     0,0,0,0],

    [0,0,0,0,
     0,1,1,0,
     0,1,1,0,
     0,0,0,0],

    [0,0,0,0,
     0,1,1,0,
     0,0,1,1,
     0,0,0,0],

    [0,0,0,0,
     0,1,1,0,
     1,1,0,0,
     0,0,0,0],

    [0,0,0,0,
     0,0,1,0,
     0,1,1,1,
     0,0,0,0]
];
var score = 0;

var renderInterval = 30
var tickInterval = 1000;

window.openTetrisTab = function(){
    chrome.storage.local.get(["theme"], function(result) {
        if(result["theme"] === "light"){
            theme1 = "#FFFFFF";
            theme2 = "#000000";
            theme3 = "#495057";
            theme4 = "#CED4DA";
            theme5 = "#CED4DA";
            theme6 = "#3B97E0";
        }
        else if(result["theme"] === "dark"){
            theme1 = "#36393F";
            theme2 = "#DCDDDE";
            theme3 = "#72767E";
            theme4 = "#303136";
            theme5 = "#303136";
            theme6 = "#3B97E0";
        }
        else if(result["theme"] != null){
            var shortThemeName = result["theme"];
            chrome.storage.local.get(["customThemes"], function(result) {
                var themeName = shortThemeName+"-customTheme";

                theme1 = result["customThemes"][themeName]["theme1"];
                theme2 = result["customThemes"][themeName]["theme2"];
                theme3 = result["customThemes"][themeName]["theme3"];
                theme4 = result["customThemes"][themeName]["theme4"];
                theme5 = result["customThemes"][themeName]["theme5"];
                theme6 = result["customThemes"][themeName]["theme6"];
            });
        }
        if(lose){
            chrome.storage.local.get(["tetrisGameBoard"], function(result) {
                if(Object.keys(result).length != null){
                    board = result["tetrisGameBoard"][0];
                    score = result["tetrisGameBoard"][1];
                }
            });
            newGame();
            document.addEventListener("keydown", restartTetris);
        }
    });
}

// create a new 4x4 shape in global variable 'current'
// 4x4 so as to cover the size when the shape is rotated
function newShape() {
    var id = Math.floor( Math.random() * shapes.length );
    var shape = shapes[id]; // maintain id for color filling

    current = [];
    for ( var y = 0; y < 4; ++y ) {
        current[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            var i = 4 * y + x;
            if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
                current[ y ][ x ] = id + 1;
            }
            else {
                current[ y ][ x ] = 0;
            }
        }
    }
    
    // new shape starts to move
    freezed = false;
    // position where the shape will evolve
    currentX = 5;
    currentY = 0;
}

// clears the board
function init() {
    for ( var y = 0; y < ROWS; ++y ) {
        board[ y ] = [];
        for ( var x = 0; x < COLS; ++x ) {
            board[ y ][ x ] = 0;
        }
    }
}

// keep the element moving down, creating new shapes and clearing lines
function tick() {
    if($('a[data-toggle="tab"].active').attr("href")!="#tetris"){
        return
    }

    if ( valid( 0, 1 ) ) {
        ++currentY;
    }
    // if the element settled
    else {
        freeze();
        valid(0, 1);
        clearLines();
        if (lose) {
            chrome.storage.local.set({tetrisGameBoard: undefined});
            gameEnded();
            return false;
        }
        newShape();
        chrome.storage.local.set({tetrisGameBoard: [board, score]});
    }
}

// stop shape at its position and fix it to board
function freeze() {
    for (var y = 0; y < 4; ++y) {
        for (var x = 0; x < 4; ++x) {
            if (current[y][x]) {
                board[y + currentY][x + currentX] = current[y][x];
            }
        }
    }
    freezed = true;
}

// returns rotates the rotated shape 'current' perpendicularly anticlockwise
function rotate( current ) {
    var newCurrent = [];
    for ( var y = 0; y < 4; ++y ) {
        newCurrent[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            newCurrent[ y ][ x ] = current[ 3 - x ][ y ];
        }
    }

    return newCurrent;
}

// check if any lines are filled and clear them
function clearLines() {
    var rowsCleared = 0;
    for ( var y = ROWS - 1; y >= 0; --y ) {
        var rowFilled = true;
        for ( var x = 0; x < COLS; ++x ) {
            if ( board[ y ][ x ] == 0 ) {
                rowFilled = false;
                break;
            }
        }
        if ( rowFilled ) {
            rowsCleared++;
            for ( var yy = y; yy > 0; --yy ) {
                for ( var x = 0; x < COLS; ++x ) {
                    board[ yy ][ x ] = board[ yy - 1 ][ x ];
                }
            }
            ++y;
        }
    }
    if(rowsCleared==0){
        return
    }
    else if(rowsCleared==1){
        score += 30;
    }
    else if(rowsCleared==2){
        score += 100;
    }
    else if(rowsCleared==3){
        score += 300;
    }
    else if(rowsCleared==4){
        score += 1200;
    }
}

function keyPress( key ) {
    switch ( key ) {
        case 'left':
            if ( valid( -1 ) ) {
                --currentX;
            }
            break;
        case 'right':
            if ( valid( 1 ) ) {
                ++currentX;
            }
            break;
        case 'down':
            if ( valid( 0, 1 ) ) {
                ++currentY;
            }
            break;
        case 'rotate':
            var rotated = rotate( current );
            if ( valid( 0, 0, rotated ) ) {
                current = rotated;
            }
            break;
        case 'drop':
            while( valid(0, 1) ) {
                ++currentY;
            }
            tick();
            break;
    }
}

// checks if the resulting position of current shape will be feasible
function valid( offsetX, offsetY, newCurrent ) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    offsetX = currentX + offsetX;
    offsetY = currentY + offsetY;
    newCurrent = newCurrent || current;

    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( newCurrent[ y ][ x ] ) {
                if ( typeof board[ y + offsetY ] == 'undefined'
                  || typeof board[ y + offsetY ][ x + offsetX ] == 'undefined'
                  || board[ y + offsetY ][ x + offsetX ]
                  || x + offsetX < 0
                  || y + offsetY >= ROWS
                  || x + offsetX >= COLS ) {
                    if (offsetY == 1 && freezed) {
                        lose = true; // lose if the current shape is settled at the top most row
                    }
                    return false;
                }
            }
        }
    }
    return true;
}

function newGame() {
    score = 0;
    document.addEventListener("keydown", keydownFunction);
    clearAllIntervals();
    intervalRender = setInterval(render, renderInterval);
    init();
    newShape();
    lose = false;
    interval = setInterval( tick, tickInterval);
}

function clearAllIntervals(){
    clearInterval(interval);
    clearInterval(intervalRender);
}

function refreshIntervals(){
    clearInterval(interval);
    clearInterval(intervalRender);
    interval = setInterval( tick, tickInterval);
    intervalRender = setInterval(render, renderInterval);
}


function keydownFunction(e) {
    if($('a[data-toggle="tab"].active').attr("href")!="#tetris"){
        document.removeEventListener("keydown", keydownFunction);
        document.removeEventListener("keydown", restartTetris);
        return
    }

    var keys = {
        37: 'left',
        39: 'right',
        40: 'down',
        38: 'rotate',
        32: 'drop'
    };
    if (typeof keys[ e.keyCode ] != 'undefined') {
        keyPress( keys[ e.keyCode ] );
        render();
    }
};


var canvas = document.getElementById("tetrisCanvas");
var ctx = canvas.getContext('2d');
var W = 350, H = 500;
var BLOCK_W = W / COLS, BLOCK_H = H / ROWS;

// draw a single square at (x, y)
function drawBlock(x, y, top, right, bot, left) { // if there is a connecting block on each side
    ctx.fillRect( BLOCK_W * x, BLOCK_H * y, BLOCK_W, BLOCK_H);
    ctx.strokeRect( BLOCK_W * x, BLOCK_H * y, BLOCK_W, BLOCK_H);
}

// draws the board and the moving shape
function render() {
    ctx.clearRect( 0, 0, W, H );

    ctx.strokeStyle = theme1;
    for ( var x = 0; x < COLS; ++x ) {
        for ( var y = 0; y < ROWS; ++y ) {
            if ( board[ y ][ x ] ) {
                ctx.fillStyle = setColor(board[y][x] - 1);
                drawBlock(x, y);
            }
        }
    }

    ctx.strokeStyle = theme1;
    ctx.lineWidth=2;
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                ctx.fillStyle = setColor(current[y][x] - 1);
                drawBlock(currentX + x, currentY + y);
            }
        }
    }
    ctx.fillStyle = theme2;
    ctx.font="Bold 15px Verdana";
    ctx.textAlign = "right";
    ctx.textBaseline="bottom"; 
    ctx.fillText("Score: "+score,350,15); 
}

function gameEnded() {
    clearAllIntervals();
    board = [];
    document.removeEventListener("keydown", keydownFunction);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = theme1;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    chrome.storage.local.get(["gameHighScore"], function(result) {
        ctx.fillStyle = theme2;
        ctx.textAlign="center";

        if(Object.keys(result).length === 0){
            chrome.storage.local.set({gameHighScore: {"2048": score}});
            ctx.font="20px Verdana";
            ctx.fillText("Score: "+score,175,130);
            gameHighScore(game, score);
        }
        else if(!result["gameHighScore"].hasOwnProperty(game)){
            var gameHighscore = result["gameHighScore"];
            gameHighscore[game] = score;
            chrome.storage.local.set({gameHighScore: gameHighscore});
            ctx.font="20px Verdana";
            ctx.fillText("Score: "+score,175,130);
            gameHighScore(game, score);

        }
        else if(result["gameHighScore"][game] < score){
            var gameHighScores = result["gameHighScore"];  
            gameHighScores[game] = score;
            chrome.storage.local.set({gameHighScore: gameHighScores});
            gameHighScore(game, score);
            ctx.font="20px Verdana";
            ctx.fillText("New High Score!: "+score,175,130);
        }
        else{
            var gameHighscore = result["gameHighScore"][game];
            ctx.font="20px Verdana";
            ctx.fillText("Score: "+score,175,130);
            ctx.font="14px Verdana";
            ctx.fillText("Highscore: "+gameHighscore,175,152);
            gameHighScore(game, gameHighscore);
        }
        ctx.font="14px Verdana";
        ctx.fillText("Press R To Restart",175,190);
        ctx.fillText("Press Enter To View Leaderboard",175,206);
    });
}

function restartTetris(event){
    if($('a[data-toggle="tab"].active').attr("href")!="#tetris"){
        document.removeEventListener("keydown", restartTetris);
        return
    }

    if(event.keyCode==82){
        newGame();
    }

    if(event.code==="Enter"){
        getGameHighScores(game);
    }
}

function setColor(number){
    return shadeColor(theme2, number/12);
}

function shadeColor(c0, p) {  
    c1 = theme4;
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);}
}
)();