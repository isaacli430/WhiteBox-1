(function() {
// Snake Game
var game = "snake";

var theme1 = "#36393F";
var theme2 = "#DCDDDE";
var theme3 = "#72767E";
var theme4 = "#303136";
var theme5 = "#303136";
var theme6 = "#3B97E0";

var snakeInterval = false;

var GAME_SPEED = 100;
var BLOCK_SIZE = 14;
var ADD_LENGTH = 4;

var snake;

var score = 0;
var changingDirection = false;
var ateFoodTickLeft = 0;
var foodX;
var foodY;
var dx = BLOCK_SIZE;
var dy = 0;

var gameCanvas = document.getElementById("snakeCanvas");
var ctx = gameCanvas.getContext("2d");

// On games tab close
$('#games-tab').on('hide.bs.tab', function (e) {
    clearInterval(snakeInterval);
    document.removeEventListener("keydown", startSnake);
    document.removeEventListener("keydown", restartSnake);
});

// Start game
if(snakeInterval){
    clearInterval(snakeInterval);
    snakeInterval = false;
}
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

            document.addEventListener("keydown", startSnake);
            ctx.fillStyle = theme1;
            ctx.strokeStyle = theme3;
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            ctx.strokeRect(0, 0, gameCanvas.width, gameCanvas.height);
            ctx.fillStyle = theme2;
            ctx.textAlign="center"; 
            ctx.font="20px Verdana";
            ctx.fillText("Press Any Key To Start",175,130);
            ctx.font="15px Verdana";
            ctx.fillText("Use arrow keys to move around",175,190);
        });
    }

    document.addEventListener("keydown", startSnake);
    ctx.fillStyle = theme1;
    ctx.strokeStyle = theme3;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.strokeRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.fillStyle = theme2;
    ctx.textAlign="center"; 
    ctx.font="20px Verdana";
    ctx.fillText("Press Any Key To Start",175,130);
    ctx.font="15px Verdana";
    ctx.fillText("Use arrow keys to move around",175,190);
});

function startSnake(){
    snake = [
        {x: 168, y: 140},
        {x: 154, y: 140},
        {x: 140, y: 140},
        {x: 126, y: 140},
        {x: 112, y: 140}
    ];

    dx = BLOCK_SIZE;
    dy = 0;

    score = 0;

    createFood();
    runSnake();
    if(!snakeInterval){
        snakeInterval = setInterval(runSnake, GAME_SPEED);
    }
    document.removeEventListener("keydown", startSnake);
    document.addEventListener("keydown", changeDirection);
}

function restartSnake(){
    if(event.code==="ShiftRight"){
        startSnake();
    }

    if(event.code==="Enter"){
        getGameHighScores(game);
    }
}

/**
 * Main function of the game
 * called repeatedly to advance the game
 */
function runSnake() {
    // If the game ended return early to stop game
    if (didGameEnd()){
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = theme1;
        ctx.strokeStyle = theme3;
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.strokeRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.globalAlpha = 1;
        chrome.storage.local.get(["gameHighScore"], function(result) {
            ctx.fillStyle = theme2;
            ctx.textAlign="center";

            if(Object.keys(result).length === 0){
                chrome.storage.local.set({gameHighScore: {"snake": score}});
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
            ctx.fillText("Press Right Shift To Restart",175,190);
            ctx.fillText("Press Enter To View Leaderboard",175,206);
            document.addEventListener("keydown", restartSnake);
        });
        document.removeEventListener("keydown", changeDirection);
        clearInterval(snakeInterval);
        snakeInterval = false;
        return
    };
    changingDirection = false;
    clearCanvas();
    drawFood();
    advanceSnake();
    drawSnake();
}
/**
 * Change the background colour of the canvas to theme1 and
 * draw a border around it
 */
function clearCanvas() {
    // Select the colour to fill the drawing
    ctx.fillStyle = theme1;
    // Select the colour for the border of the canvas
    ctx.strokeStyle = theme3;
    // Draw a "filled" rectangle to cover the entire canvas
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    // Draw a "border" around the entire canvas
    ctx.strokeRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.fillStyle = theme2;
    ctx.font="15px Verdana";
    ctx.fillText(score,320,15);
}
/**
 * Draw the food on the canvas
 */
function drawFood() {
    ctx.fillStyle = theme6;
    ctx.strokeStyle = theme1;
    ctx.fillRect(foodX, foodY, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeRect(foodX, foodY, BLOCK_SIZE, BLOCK_SIZE);
}
/**
 * Advances the snake by changing the x-coordinates of its parts
 * according to the horizontal velocity and the y-coordinates of its parts
 * according to the vertical veolocity
 */
function advanceSnake() {
    // Create the new Snake's head
    var head = {x: snake[0].x + dx, y: snake[0].y + dy};
    // Add the new head to the beginning of snake body
    snake.unshift(head);

    for (var i = 0; i < snake.length; i++) {
        if(snake[i].x < 0){
            snake[i].x += gameCanvas.width;
        }
        if(snake[i].x > gameCanvas.width - BLOCK_SIZE){
            snake[i].x -= gameCanvas.width;
        }
        if(snake[i].y < 0){
            snake[i].y += gameCanvas.height;
        }
        if(snake[i].y > gameCanvas.height - BLOCK_SIZE){
            snake[i].y -= gameCanvas.height;
        }
    }

    var didEatFood = snake[0].x === foodX && snake[0].y === foodY;
    if (didEatFood) {
        // Increase score
        score += 1;
        // Generate new food location
        createFood();
        ateFoodTickLeft+=ADD_LENGTH;
    }
    else if(ateFoodTickLeft==0){
        snake.pop();
    }
    else{
        ateFoodTickLeft-=1;
    }
}
/**
 * Returns true if the head of the snake touched another part of the game
 * or any of the walls
 */
function didGameEnd() {
    for (var i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true
    }
    return false
}
/**
 * Generates a random number that is a multiple of BLOCK_SIZE given a minumum
 * and a maximum number
 * @param { number } min - The minimum number the random number can be
 * @param { number } max - The maximum number the random number can be
 */
function randomTen(min, max) {
    return Math.ceil((Math.random() * (max-min) + min) / BLOCK_SIZE) * BLOCK_SIZE;
}
/**
 * Creates random set of coordinates for the snake food.
 */
function createFood() {
    // Generate a random number the food x-coordinate
    foodX = randomTen(0, gameCanvas.width - BLOCK_SIZE);
    // Generate a random number for the food y-coordinate
    foodY = randomTen(0, gameCanvas.height - BLOCK_SIZE);
    // if the new food location is where the snake currently is, generate a new food location
    snake.forEach(function isFoodOnSnake(part) {
        var foodIsoNsnake = part.x == foodX && part.y == foodY;
        if (foodIsoNsnake) createFood();
    });
}
/**
 * Draws the snake on the canvas
 */
function drawSnake() {
    // loop through the snake parts drawing each part on the canvas
    snake.forEach(drawSnakePart)
}
/**
 * Draws a part of the snake on the canvas
 * @param { object } snakePart - The coordinates where the part should be drawn
 */
function drawSnakePart(snakePart) {
    // Set the colour of the snake part
    ctx.fillStyle = theme2;
    // Set the border colour of the snake part
    ctx.strokeStyle = theme1;
    ctx.lineWidth=2;
    // Draw a "filled" rectangle to represent the snake part at the coordinates
    // the part is located
    ctx.fillRect(snakePart.x, snakePart.y, BLOCK_SIZE, BLOCK_SIZE);
    // Draw a border around the snake part
    ctx.strokeRect(snakePart.x, snakePart.y, BLOCK_SIZE, BLOCK_SIZE);
}
/**
 * Changes the vertical and horizontal velocity of the snake according to the
 * key that was pressed.
 * The direction cannot be switched to the opposite direction, to prevent the snake
 * from reversing
 * For example if the the direction is 'right' it cannot become 'left'
 * @param { object } event - The keydown event
 */
function changeDirection(event) {
    var LEFT_KEY = 37;
    var RIGHT_KEY = 39;
    var UP_KEY = 38;
    var DOWN_KEY = 40;
    /**
     * Prevent the snake from reversing
     * Example scenario:
     * Snake is moving to the right. User presses down and immediately left
     * and the snake immediately changes direction without taking a step down first
     */
    if (changingDirection) return;
    changingDirection = true;
    
    var keyPressed = event.keyCode;
    var goingUp = dy === -BLOCK_SIZE;
    var goingDown = dy === BLOCK_SIZE;
    var goingRight = dx === BLOCK_SIZE;
    var goingLeft = dx === -BLOCK_SIZE;
    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -BLOCK_SIZE;
        dy = 0;
    }
    
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -BLOCK_SIZE;
    }
    
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = BLOCK_SIZE;
        dy = 0;
    }
    
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = BLOCK_SIZE;
    }
}
})();