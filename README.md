# WhiteBox
## Creating Your Own Games
When game is clicked, the text inside main.html is loaded into the gameArea, and main.js is also loaded. The game should start running once main.js is loaded. It is also the game developers responsibility to make sure that the game is paused when the user leaves the game area.

rules:  *all of this will probably change as this is a bad way to handle things*
1. All element ID's must begin with the game name (eg. *snake*Canvas)
2. All global functions must begin with the game name (eg. *snake*Formatter)
3. All game code should be surrounded by "(function() {" and "})();" to make all the code local

File format is as follows:
```
gameName
|
└───main.js
└───main.html
```
  
