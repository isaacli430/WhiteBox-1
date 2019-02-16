(function() {
var game = "2048";

var theme1 = "#36393F";
var theme2 = "#DCDDDE";
var theme3 = "#72767E";
var theme4 = "#303136";
var theme5 = "#303136";
var theme6 = "#3B97E0";

var gameCanvas = document.getElementById("2048Canvas");
var ctx = gameCanvas.getContext("2d");

var squareSide = 80;
var padding = 5;
var topPadding = 20;

var popupLength = 100;
var moves = [];

var score = 0;

var numbers = [[, , , ],
			   [, , , ],
			   [, , , ],
			   [, , , ]];

var gameInProgress = false;
var moving = false;
var creatingNewTile = false;

// On games tab close
$('#games-tab').on('hide.bs.tab', function (e) {
	document.removeEventListener("keydown", keyPress);
    document.removeEventListener("keydown", restart2048);
});

// On game start
document.addEventListener("keydown", restart2048);
if(!gameInProgress){
    chrome.storage.local.get(["theme"], function(result) {
        if(result["theme"] === "light"){
            theme1 = "#FFFFFF";
            theme2 = "#000000";
            theme3 = "#495057";
            theme4 = "#CED4DA";
            theme5 = "#CED4DA";
            theme6 = "#3B97E0";

	        ctx.fillStyle = theme1;
	        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
	        start2048();
        }
        else if(result["theme"] === "dark"){
            theme1 = "#36393F";
            theme2 = "#DCDDDE";
            theme3 = "#72767E";
            theme4 = "#303136";
            theme5 = "#303136";
            theme6 = "#3B97E0";

	        ctx.fillStyle = theme1;
	        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
	        start2048();
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

                ctx.fillStyle = theme1;
                ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
	        	start2048();
            });
        }
        else{
	        ctx.fillStyle = theme1;
	        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
	        start2048();
	    }
    });
}

function start2048(){
	moves = [];

    chrome.storage.local.get(["2048GameNumbers"], function(result) {
        if(result["2048GameNumbers"] != null){
            numbers = result["2048GameNumbers"][0];
            score = result["2048GameNumbers"][1];
        }
        else{
			score = 0;
			numbers = [[, , , ],
					   [, , , ],
					   [, , , ],
					   [, , , ]];
			addNumber();
			addNumber();
		}
		drawBaseFrame();
		drawAllNumbers();
	    document.addEventListener("keydown", keyPress);
	    gameInProgress = true;
    });
}

function restart2048(event){
    if(event.keyCode==82){
    	chrome.storage.local.set({'2048GameNumbers': null}, function() {
        	start2048();
    	});
    }

    if(event.code==="Enter"){
        getGameHighScores(game);
    }
}

function drawBaseFrame(){
    ctx.fillStyle = theme1;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
	ctx.fillStyle = theme2;
	ctx.font="Bold 15px Verdana";
	ctx.textAlign = "right";
	ctx.textBaseline="bottom"; 
	ctx.fillText("Score: "+score,350,15); 
}

function keyPress(event){
	if(moving){};
	if(creatingNewTile){};

    var LEFT_KEY = 37;
    var RIGHT_KEY = 39;
    var UP_KEY = 38;
    var DOWN_KEY = 40;
	var keyPressed = event.keyCode;
	var previousNumbers = JSON.stringify(numbers);
    moves = [];

	if(keyPressed === LEFT_KEY){
		for (var row = 0; row < 4; row++) { // For each row
			for (var col = 0; col < 4; col++) {
				var number = numbers[row][col];
				if(number == null){
					continue;
				}

				if(col==0){
					var move = {};
					move.startRow = row;
					move.startCol = col;
					move.startNum = number;
					move.horizontal = true;
					move.distance = 0;
					moves.push(move);
					continue;
				}
				var adjNumCoords = nextNumber([col, row], "left");
				var adjNumCol = adjNumCoords[0];
				var adjNumRow = adjNumCoords[1];
				var adjNum = numbers[adjNumRow][adjNumCol];

				var move = {};
				move.startRow = row;
				move.startCol = col;
				move.startNum = number;
				move.horizontal = true;

				numbers[row][col] = null;

				if(adjNum == number){
					move.distance = col-adjNumCol;
					numbers[adjNumRow][adjNumCol] = number*2;
					score += number*2;
				}
				else if(adjNum == null){
					move.distance = col-adjNumCol;
					numbers[adjNumRow][adjNumCol] = number;
				}
				else{
					move.distance = col-adjNumCol-1;
					numbers[adjNumRow][adjNumCol+1] = number;
				}
				
				moves.push(move);
			}
		}
	}
	else if(keyPressed === RIGHT_KEY){
		for (var row = 0; row < 4; row++) { // For each row

			for (var col = 3; col >= 0; col--) {
				var number = numbers[row][col];
				if(number == null){
					continue;
				}

				if(col==3){
					var move = {};
					move.startRow = row;
					move.startCol = col;
					move.startNum = number;
					move.horizontal = true;
					move.distance = 0;
					moves.push(move);
					continue;
				}
				var adjNumCoords = nextNumber([col, row], "right");
				var adjNumCol = adjNumCoords[0];
				var adjNumRow = adjNumCoords[1];
				var adjNum = numbers[adjNumRow][adjNumCol];

				var move = {};
				move.startRow = row;
				move.startCol = col;
				move.startNum = number;
				move.horizontal = true;

				numbers[row][col] = null;

				if(adjNum == number){
					move.distance = col-adjNumCol;
					numbers[adjNumRow][adjNumCol] = number*2;
					score += number*2;
				}
				else if(adjNum == null){
					move.distance = col-adjNumCol;
					numbers[adjNumRow][adjNumCol] = number;
				}
				else{
					move.distance = col-adjNumCol+1;
					numbers[adjNumRow][adjNumCol-1] = number;
				}
				
				moves.push(move);
			}
		}
	}
	else if(keyPressed === UP_KEY){
		for (var col = 0; col < 4; col++) { // For each row

			for (var row = 0; row < 4; row++) {
				var number = numbers[row][col];
				if(number == null){
					continue;
				}

				if(row==0){
					var move = {};
					move.startRow = row;
					move.startCol = col;
					move.startNum = number;
					move.horizontal = true;
					move.distance = 0;
					moves.push(move);
					continue;
				}
				var adjNumCoords = nextNumber([col, row], "up");
				var adjNumCol = adjNumCoords[0];
				var adjNumRow = adjNumCoords[1];
				var adjNum = numbers[adjNumRow][adjNumCol];

				var move = {};
				move.startRow = row;
				move.startCol = col;
				move.startNum = number;
				move.horizontal = false;

				numbers[row][col] = null;

				if(adjNum == number){
					move.distance = row-adjNumRow;
					numbers[adjNumRow][adjNumCol] = number*2;
					score += number*2;
				}
				else if(adjNum == null){
					move.distance = row-adjNumRow;
					numbers[adjNumRow][adjNumCol] = number;
				}
				else{
					move.distance = row-adjNumRow-1;
					numbers[adjNumRow+1][adjNumCol] = number;
				}
				
				moves.push(move);
			}
		}
	}
	else if(keyPressed === DOWN_KEY){
		for (var col = 0; col < 4; col++) { // For each row

			for (var row = 3; row >= 0; row--) {
				var number = numbers[row][col];
				if(number == null){
					continue;
				}

				if(row==3){
					var move = {};
					move.startRow = row;
					move.startCol = col;
					move.startNum = number;
					move.horizontal = true;
					move.distance = 0;
					moves.push(move);
					continue;
				}
				var adjNumCoords = nextNumber([col, row], "down");
				var adjNumCol = adjNumCoords[0];
				var adjNumRow = adjNumCoords[1];
				var adjNum = numbers[adjNumRow][adjNumCol];

				var move = {};
				move.startRow = row;
				move.startCol = col;
				move.startNum = number;
				move.horizontal = false;

				numbers[row][col] = null;

				if(adjNum == number){
					move.distance = row-adjNumRow;
					numbers[adjNumRow][adjNumCol] = number*2;
					score += number*2;
				}
				else if(adjNum == null){
					move.distance = row-adjNumRow;
					numbers[adjNumRow][adjNumCol] = number;
				}
				else{
					move.distance = row-adjNumRow+1;
					numbers[adjNumRow-1][adjNumCol] = number;
				}
				
				moves.push(move);
			}
		}
	}

	if(previousNumbers != JSON.stringify(numbers)){
		moveSquares();
	}
}

function addNumber(){
	if(moving) return;
	var freeCoords = []

	// Get free blocks
	for (var x = 0; x < 4; x++) {
		for (var y = 0; y < 4; y++) {
			if(numbers[y][x] == null){
				freeCoords.push([x,y]);
			}
		}
	}

	if(freeCoords.length != 0){
		var freeCoord = freeCoords[Math.floor(Math.random() * freeCoords.length)];
		var number = getRandomInt(1, 2)*2; // Either 2 or 4

		numbers[freeCoord[1]][freeCoord[0]] = number;
		drawNewNumber(number, freeCoord[1], freeCoord[0]);
	}
    
    chrome.storage.local.set({'2048GameNumbers': [numbers, score]});
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}

function getNumLength(num) {
	return Math.log(num) * Math.LOG10E + 1 | 0;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextNumber(coord, dir) { //coord is [col,row]
	var col = coord[0];
	var row = coord[1];

	if(dir === "left"){
		for(var i=col-1; i>=0; i--){
			if(numbers[row][i] != null){
				return [i, row];
			}
		}
		return [0, row];
	}

	if(dir === "right"){
		for(var i=col+1; i < 4; i++){
			if(numbers[row][i] != null){
				return [i, row];
			}
		}
		return [3, row];
	}

	if(dir === "up"){
		for(var i=row-1; i>=0; i--){
			if(numbers[i][col] != null){
				return [col, i];
			}
		}
		return [col, 0];
	}

	if(dir === "down"){
		for(var i=row+1; i < 4; i++){
			if(numbers[i][col] != null){
				return [col, i];
			}
		}
		return [col, 3];
	}
}

function drawNewNumber(num, row, col) {
	creatingNewTile = true
	if(!gameInProgress) return;

	var squareX = (padding*col*2)+(col*squareSide);
	var squareY = (padding*row*2)+(row*squareSide)+topPadding;

	var numLength = getNumLength(num);

    var multiplier = 0;
    var popupInterval = setInterval(tick, 5);
    function tick() {
        multiplier += 0.1; 
        if (multiplier > 1) {
			creatingNewTile = false;
            clearInterval(popupInterval);
			checkGameOver();
        }
        else{
			ctx.fillStyle = setColor(num);
			ctx.roundRect(squareX+((squareSide/2)*Math.abs(multiplier-1)), squareY+((squareSide/2)*Math.abs(multiplier-1)), squareSide*multiplier, squareSide*multiplier, 3).fill();
			
			ctx.font="Bold "+40*multiplier+"px Verdana"; 
			ctx.fillStyle = theme2;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle"; 
			ctx.fillText(num,squareX+(squareSide/2),squareY+(squareSide/2));
		}
    }
}

function moveSquares() {
    var multiplier = 0;
    moving = true;

    var moveInterval = setInterval(tick, 5);
    function tick() {
        multiplier += 0.1; 
		drawBaseFrame();
        if (multiplier >= 0.99) {
        	moving = false;
            clearInterval(moveInterval);
            drawAllNumbers();
			addNumber();
        }
        else{
			for (var i = 0; i < moves.length; i++) {
	    		var squareX;
	    		var squareY;
	    		var movedDistance = moves[i].distance*multiplier;

	    		if(moves[i].horizontal){
	    			squareX = (padding*(moves[i].startCol-movedDistance)*2)+((moves[i].startCol-movedDistance)*squareSide);
	    			squareY = (padding*moves[i].startRow*2)+(moves[i].startRow*squareSide)+topPadding;
	    		}
	    		else{
	    			squareX = (padding*moves[i].startCol*2)+(moves[i].startCol*squareSide);
	    			squareY = (padding*(moves[i].startRow-movedDistance)*2)+((moves[i].startRow-movedDistance)*squareSide)+topPadding;
	    		}

	    		var number = moves[i].startNum;
				var numLength = getNumLength(number);

				if(numLength<=2){
					ctx.font="Bold 40px Verdana"; 
				}
				else if(numLength<=4){
					ctx.font="Bold 25px Verdana";
				}
				else if(numLength<=6){
					ctx.font="Bold 15px Verdana";
				}
				else{
					ctx.font="Bold 12px Verdana";
				}

				ctx.fillStyle = setColor(number);
				ctx.roundRect(squareX, squareY, squareSide, squareSide, 3).fill();

	    		ctx.fillStyle = theme2;
				ctx.textAlign = "center";
				ctx.textBaseline="middle"; 
				ctx.fillText(number,squareX+(squareSide/2),squareY+(squareSide/2)); 
			}
		}
    }
}

function drawAllNumbers() {
	drawBaseFrame();
	for (var x = 0; x < 4; x++) {
    	for (var y = 0; y < 4; y++) {
    		var squareX = (padding*x*2)+(x*squareSide);
    		var squareY = (padding*y*2)+(y*squareSide)+topPadding;

			var number = numbers[y][x];
			if(number == null || number == undefined){
				continue;
			}
			var numLength = getNumLength(number);

			if(numLength<=2){
				ctx.font="Bold 40px Verdana"; 
			}
			else if(numLength<=4){
				ctx.font="Bold 25px Verdana";
			}
			else if(numLength<=6){
				ctx.font="Bold 15px Verdana";
			}
			else{
				ctx.font="Bold 12px Verdana";
			}

    		ctx.fillStyle = setColor(number);
			ctx.roundRect(squareX, squareY, squareSide, squareSide, 3).fill();

    		ctx.fillStyle = theme2;
			ctx.textAlign = "center";
			ctx.textBaseline="middle"; 
			ctx.fillText(number,squareX+(squareSide/2),squareY+(squareSide/2)); 
    	}
    }
}

function gameEnded() {
	gameInProgress = false;
    document.removeEventListener("keydown", keyPress);
    chrome.storage.local.set({'2048GameNumbers': null});
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = theme1;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
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

function checkGameOver() {
	if(!gameInProgress) return;
	var freeCoords = []

	// Get free blocks
	for (var x = 0; x < 4; x++) {
		for (var y = 0; y < 4; y++) {
			if(numbers[y][x] == null){
				freeCoords.push([x,y]);
			}
		}
	}

	if(freeCoords.length == 0){
		var canMove = false;
		for (var row = 0; row < 4; row++) {
			for (var col = 1; col < 4; col++) {
				if(numbers[row][col] == numbers[row][col-1]){
					canMove = true;
				}
			}
		}
		for (var col = 0; col < 4; col++) {
			for (var row = 1; row < 4; row++) {
				if(numbers[row][col] == numbers[row-1][col]){
					canMove = true;
				}
			}
		}
		if(!canMove){
			gameEnded();
			return true
		}
		else{
			return false
		}
	}
}

function setColor(number){
	var count = 0;
	while(number != 2){
		number /= 2;
		count++;
		if(count>1000) break;
	}
	percent = count/15+0.6;
	if(percent > 1){
		percent = 1;
	}
	return shadeColor(theme2, percent);
}

function shadeColor(c0, p) {  
	c1 = theme4;
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
}
})();