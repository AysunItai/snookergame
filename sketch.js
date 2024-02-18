
//Global variables
let engine;
let world;
var rBalls = [];
var rBallsRdm = [];
var aBallsRdm = [];
const TABLE_WIDTH = 920;
const TABLE_HEIGHT = 440;
const POCKET_DIAMETER = 20;
const BALL_DIAMETER = 13;
const MODE_STARTING_POSITIONS = 1;
const MODE_RANDOM_ALL = 2;
const MODE_RANDOM_RED = 3;
let cueBall;
let cueBallAdded = false;
let cueAngle = 0;
let cuePower = 5;
let cueBallSelected = false;
let currentMode = MODE_STARTING_POSITIONS;
let lastMode = null;
let showInstructionsFlag = false; 


// Declare boundary variables globally
let boundaryTop, boundaryBottom, boundaryLeft, boundaryRight;

// Function to create boundaries with adjusted positions and dimensions
function createBoundary(x, y, width, height) {
    let options = {
        isStatic: true,
        restitution: 0.9,
        friction: 0.01
    };
    // Increase thickness to prevent balls from escaping
    height = (height === 10) ? 30 : height + 20;
    width = (width === 10) ? 30 : width + 20;
    return Matter.Bodies.rectangle(x, y, width, height, options);
}

// Function to create balls with label for collision detection
function createBall(x, y, diameter,  isStatic=true) {
    let options = {
        restitution: 0.9, // High restitution for elastic collision
        friction: 0.02,
        density: 0.005,
        isStatic: isStatic,
        label: 'ball'
    };
    let ball = Matter.Bodies.circle(x, y, diameter / 2, options);
    Matter.World.add(world, ball);
    return ball;
}


function initializeGameState() {
    // Set the game to its starting mode, if any specific setup is required
    // For MODE_STARTING_POSITIONS, ensure all balls including the cue ball are placed correctly
    currentMode = MODE_STARTING_POSITIONS; // Explicitly set if not already set
    lastMode = null; // Ensure mode change logic will trigger

    // Setup initial balls' positions based on the current mode
    // For simplicity, this example will just reiterate setting up the cue ball
    // and applying any mode-specific setups that are normally done when a mode is switched to
    if (!cueBall) {
        // Add the cue ball if it's not already present (it should be, but this is just in case)
        cueBall = createBall(330, 400, BALL_DIAMETER, false); // Set to dynamic for interaction
    } else {
        // If the cue ball exists, ensure it's set to a dynamic state for interaction
        Matter.Body.setStatic(cueBall, false);
    }

    // Reset selection states to ensure consistent behavior
    cueBallSelected = false;
    cueBallAdded = true; // Assume the cue ball is added to prevent re-adding it in modes 2 and 3

    // Additional initialization for other balls or game elements can be done here
    // For instance, placing red and colored balls according to the starting mode
    switch (currentMode) {
        case MODE_STARTING_POSITIONS:
            redBalls(); // Place red balls in starting positions
            placeColoredBalls(false); // Place colored balls in starting positions
            break;
        case MODE_RANDOM_ALL:
            allBallsRdm(); // Place all balls in random positions
            break;
        case MODE_RANDOM_RED:
            redBallsRdm(); // Place only red balls in random positions
            placeColoredBalls(false); // Place colored balls in starting positions
            break;
    }
    
    // Call any functions needed to refresh or update the game display based on the initial state
    // For example, if you have a function that updates the display or UI elements based on the current mode
    updateGameDisplay(); // This is a placeholder for any actual function you might have
}

// Remember to call initializeGameState at the end of your setup function
function setup() {
    createCanvas(1200, 800);
    rectMode(CENTER);
  
    engine = Matter.Engine.create();
    world = engine.world;
    engine.world.gravity.y = 0; 
    engine.world.gravity.x = 0; 
    
    // Create table boundaries
    createTableBoundaries();
    addCornerBoundaries();

    // Listen for collision events
    Matter.Events.on(engine, 'collisionStart', function(event) {
        var pairs = event.pairs;
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            handleCollision(pair.bodyA, pair.bodyB);
        }
    });
 
    // Initialize the game state
    initializeGameState();
    showInstructionsFlag = true;

    noLoop();
}
function toggleInstructions() {
    showInstructionsFlag = !showInstructionsFlag; // Toggle visibility
}

function drawInstructionsOverlay() {
    if (showInstructionsFlag) {
        fill(0, 0, 0, 150); // Semi-transparent overlay
        rectMode(CORNER); // Set rectMode to CORNER for overlay
        rect(0, 0, width, height); // Cover the entire canvas

        fill(255); // White text
        textSize(20); // Adjust text size as needed for better visibility
        textAlign(CENTER, CENTER); // Align text to center both horizontally and vertically

        // Ensure the text is placed in the center of the canvas
        text("How to Play:\n- Use mouse to aim and click to hit the cue ball.\n- Press 1, 2, or 3 to select the game mode and start the game.\n- Try to pocket all balls!\nPress 'H' to hide these instructions.", width / 2, height / 2);
        
        rectMode(CENTER); // Reset rectMode back to CENTER after drawing the overlay
    }
}


function updateGameDisplay() {
    
    fill(0); 
    noStroke();
    rect(10, 10, 300, 30); 

    
    fill(255); // Set text color to white
    textSize(20);
    textAlign(LEFT, TOP);

    
    let modeText = "Current Mode: ";
    switch (currentMode) {
        case MODE_STARTING_POSITIONS:
            modeText += "Starting Positions (PRESS 1)";
            break;
        case MODE_RANDOM_ALL:
            modeText += "Random All (PRESS 2)";
            break;
        case MODE_RANDOM_RED:
            modeText += "Random Red (PRESS 3)";
            break;
        default:
            modeText += "Unknown";
            break;
    }

    
    text(modeText, 20, 20);
}

function createTableBoundaries() {
    let boundaryThickness = 20; 
    let cushionOptions = {
        isStatic: true,
        restitution: 0.9,
        friction: 0.01
    };

   // Assign boundaries to the global variables
    boundaryTop = Matter.Bodies.rectangle(600, 160 - boundaryThickness/2, TABLE_WIDTH, boundaryThickness, cushionOptions);
    boundaryBottom = Matter.Bodies.rectangle(600, 640 + boundaryThickness/2, TABLE_WIDTH, boundaryThickness, cushionOptions);
    boundaryLeft = Matter.Bodies.rectangle(120 - boundaryThickness/2, 400, boundaryThickness, TABLE_HEIGHT, cushionOptions);
    boundaryRight = Matter.Bodies.rectangle(1080 + boundaryThickness/2, 400, boundaryThickness, TABLE_HEIGHT, cushionOptions);

    Matter.World.add(world, [boundaryTop, boundaryBottom, boundaryLeft, boundaryRight]);
}




function draw() {
    Matter.Engine.update(engine);
    background(200);
    noStroke();
    drawTable();
    drawPockets();

    if (currentMode !== lastMode) {
         rBalls = [];
        aBallsRdm = [];
        cueBall=null;
       switch (currentMode) {
            case MODE_STARTING_POSITIONS:
                redBalls(); // Red balls in starting positions
                placeColoredBalls(false); // Colored balls in starting positions
                // Create the cue ball in starting positions mode
                if (!cueBall) {
                    cueBall = createBall(330, 400, BALL_DIAMETER, true); // Static cue ball
                }
                break;
            case MODE_RANDOM_ALL:
                 cueBall = null;
                allBallsRdm(2) // Both red and colored balls in random positions
                break;
            case MODE_RANDOM_RED:
                redBallsRdm(); // Only red balls in random positions
                placeColoredBalls(false); // Colored balls in starting positions
                 cueBall = null;
                break;
        }
        lastMode = currentMode;
    }
    

    // Render balls based on current mode
    switch (currentMode) {
        case MODE_STARTING_POSITIONS:
            drawBalls(rBalls);
            drawBalls(aBallsRdm,true);
            break;
        case MODE_RANDOM_ALL:
            drawBalls(rBalls);1
            drawBalls(aBallsRdm,true);
            break;
        case MODE_RANDOM_RED:
            drawBalls(rBallsRdm);
            drawBalls(aBallsRdm, true); // Render colored balls in starting positions
            break;
    }
    if (cueBallSelected && cueBall) {
        drawCue(); 2
    }

   

    displayText();
    if (cueBall) {
        fill(255); // White color for cue ball
        circle(cueBall.position.x, cueBall.position.y, BALL_DIAMETER);
        if (cueBallSelected) {
            drawCue();
        }
    }
    // Check each ball if it is in a pocket
   rBalls.forEach((ball, index) => {
        if (isBallInPocket(ball)) {
            console.log('Ball in pocket', ball);
            // Remove the ball or handle scoring
            Matter.World.remove(world, ball);
            rBalls.splice(index, 1);
            console.log('red ball is in teh pocket')
        }
        
    });
      aBallsRdm.forEach((ball, index) => {
        if (isBallInPocket(ball)) {
            console.log('Colored ball in pocket', ball);
            // Remove the ball
            Matter.World.remove(world, ball);
            // Reset the colored balls to initial positions
            resetColoredBalls();
        }
    });
    if (cueBall && isBallInPocket(cueBall)) {
        Matter.World.remove(world, cueBall);
        cueBall = null;
        cueBallAdded = false;
        console.log('Cue ball pocketed');
    }
    // Render red balls
    drawBalls(rBalls);
    if (showInstructionsFlag) {
        drawInstructionsOverlay();
    }

}



function placeCueBall() {
    if (!cueBall) {
        cueBall = createBall(330, 400, BALL_DIAMETER, false);
        cueBallAdded = true;
    }
}

function resetColoredBalls() {
    aBallsRdm = []; // Clear the array for colored balls
    placeColoredBalls(false); // Place colored balls in starting positions
}


function displayText(){
    fill(54,69,79);
    textSize(20);
    textAlign(LEFT,TOP);
    let modeText="Current Mode: ";
    switch (currentMode) {
        case MODE_STARTING_POSITIONS:
            modeText+="Starting Positions(PRESS 1)";
            break;
        case MODE_RANDOM_ALL:
            modeText+="Random All (PRESS 2)";
            break;
        case MODE_RANDOM_RED:
            modeText+="Random Red (PRESS 3)";
            break;
        default:
            break;
    }
    text(modeText, 10, 10);
    text("1 - All balls in starting positions", 100, 90);
    text("2 - Red in random positions", 100, 110);
    text("3 - All balls in random positions", 100, 130);
    
}
function drawTable(){
   //the table
    fill(99, 70, 49);
    rect(600, 400, 960, 480, 15);
    fill(0, 100, 0);
    rect(600, 400, 940, 460, 15);
    fill(0, 130, 0);
    rect(600, 400, 920, 440, 15);
}
function drawPockets(){
    //the pockets
    fill(0);
    circle(138, 178, POCKET_DIAMETER);
    circle(138, 623, POCKET_DIAMETER);
    circle(1062, 178, POCKET_DIAMETER);
    circle(1062, 623, POCKET_DIAMETER);
    circle(600, 178, POCKET_DIAMETER);
    circle(600, 623, POCKET_DIAMETER);
    stroke(255);
    line(370, 180, 370, 620);
    noFill();
    arc(370, 400, 150, 150, PI/2, PI*3/2);

}
function drawColoredBalls(){
    if(currentMode !==MODE_RANDOM_ALL){
        placeColoredBalls();
    }

}
function draw_cueball(x,y) {
fill(255);
cueball = createBall(x, y, BALL_DIAMETER);


}
function drawCue() {
   if (!cueBall) return; // Check if cueBall is not null

    push();
    translate(cueBall.position.x, cueBall.position.y);
    rotate(cueAngle);
    stroke(128);
    strokeWeight(4);
    line(0, 0, 100, 0); // Length of the cue
    pop();
}
function drawBalls(ballsArray) {
    for (let i = 0; i < ballsArray.length; i++) {
        let ball = ballsArray[i];
      
        // If the balls are colored, use their specific color
        if (ball.color) {
            fill(ball.color[0], ball.color[1], ball.color[2]); // Use the color property of the ball
        } else {
            fill(255, 0, 0); // Red color for red balls
        }

        circle(ball.position.x, ball.position.y, BALL_DIAMETER);
    }
}

function placeColoredBalls(randomize) {
    // Clear the array for colored balls if not already cleared
    if (!randomize) aBallsRdm = [];

    let positions = [[370, 475], [370, 325], [370, 400], [600, 400], [830, 400], [945, 400]]; // Positions for colored balls
    let colors = [
        [255, 255, 0],   // Yellow
        [0, 255, 0],     // Green
        [131, 67, 51],   // Brown
        [0, 0, 128],     // Blue
        [255, 105, 180], // Pink
        [0, 0, 0]        // Black
    ];

    for (let i = 0; i < positions.length; i++) {
        let x = randomize ? round(random(138, 1062)) : positions[i][0];
        let y = randomize ? round(random(178, 623)) : positions[i][1];
        
        let ball = createBall(x, y, BALL_DIAMETER, !randomize);
        ball.color = colors[i]; // Assign the color to the ball
        aBallsRdm.push(ball);
    }
}


//red balls in starting positions
// Red balls in starting positions
function redBalls() {
    rBalls = []; // Clear the previous red balls
    var startPos = createVector(width * 0.692, height * 0.482);
    for (var i = 0; i < 6; i++) {
        var ballXStart = startPos.x + i * (BALL_DIAMETER + 2);
        for (var j = 0; j <= i; j++) {
            var ballYStart = (startPos.y - ((BALL_DIAMETER + 2) * j));
            ballYStart += (i / 2 * (BALL_DIAMETER + 2)) + (BALL_DIAMETER / 2);
            // Set the balls as static in starting positions
            rBalls.push(createBall(ballXStart, ballYStart, BALL_DIAMETER));
        }
    }
}


//red balls in random positions
function redBallsRdm() {
    rBallsRdm = []; // Clear the previous random red balls
    for (var i = 0; i < 15; i++) {
        let x = round(random(138, 1062));
        let y = round(random(178, 623));
        rBallsRdm.push(createBall(x, y, BALL_DIAMETER, true)); // Dynamic balls
    }
}

//red and coloured balls in random positions
// Red and colored balls in random positions
function allBallsRdm() {
    rBalls = []; // Clear previous red balls
    aBallsRdm = []; // Clear previous colored balls

    // Add 15 red balls in random positions
    for (var i = 0; i < 15; i++) {
        let x = round(random(138, 1062));
        let y = round(random(178, 623));
        rBalls.push(createBall(x, y, BALL_DIAMETER, true));
    }

    // Add colored balls in random positions
    let colors = [
        [255, 255, 0],   // Yellow
        [0, 255, 0],     // Green
        [131, 67, 51],   // Brown
        [0, 0, 128],     // Blue
        [255, 105, 180], // Pink
        [0, 0, 0]        // Black
    ];

    for (let i = 0; i < colors.length; i++) {
        let x = round(random(138, 1062));
        let y = round(random(178, 623));
        let ball = createBall(x, y, BALL_DIAMETER, true);
        ball.color = colors[i]; // Assign the color to the ball
        aBallsRdm.push(ball);
    }
}


// Function to add corner boundaries

function addCornerBoundaries() {
    let cornerRadius = 15; // Reduced radius to prevent overlap with pockets
    let cornerOptions = {
        isStatic: true,
        restitution: 0.9
    };

    // Define the positions for corner boundaries (these are just examples)
    let corners = [
        { x: 130, y: 170 },
        { x: 1070, y: 170 },
        { x: 130, y: 630 },
        { x: 1070, y: 630 }
    ];

    corners.forEach(corner => {
        let cornerBoundary = Matter.Bodies.circle(corner.x, corner.y, cornerRadius, cornerOptions);
        Matter.World.add(world, cornerBoundary);
    });
}


// Function to check if a ball is in a pocket
function isBallInPocket(ball) {
    let pockets = [
        { x: 138, y: 178, radius: POCKET_DIAMETER / 2 },
        { x: 138, y: 623, radius: POCKET_DIAMETER / 2 },
        // Add other pockets here
    ];

    for (let pocket of pockets) {
        let distance = dist(ball.position.x, ball.position.y, pocket.x, pocket.y);
        if (distance < pocket.radius + BALL_DIAMETER / 2) {
            return true; // Ball is in the pocket
        }
    }
    return false;
}


function createVector(x, y) {
    return { x: x, y: y };
}
// Handle collision between two bodies
function handleCollision(bodyA, bodyB) {
    // Handle ball-to-boundary collision
    if ((bodyA === cueBall && bodyB.label === 'boundary') || (bodyB === cueBall && bodyA.label === 'boundary')) {
        console.log('Cue ball collided with a boundary');
    }

    // Handle ball-to-ball collision
    if (bodyA.label === 'ball' && bodyB.label === 'ball') {
        if (isColliding(bodyA, bodyB)) {
            console.log('Two balls collided');
            applyCollisionForce(bodyA, bodyB);
        }
    }
    // Handle cue ball collision with other balls
    if ((bodyA === cueBall && bodyB.label === 'ball') || (bodyB === cueBall && bodyA.label === 'ball')) {
        let otherBall = (bodyA === cueBall) ? bodyB : bodyA;
        if (isColliding(cueBall, otherBall)) {
            console.log('Cue ball physically collided with another ball');
            makeDynamic(otherBall);
        }
    }

   
}
function isColliding(ball1, ball2) {
    let distance = Matter.Vector.magnitude(Matter.Vector.sub(ball1.position, ball2.position));
    return distance <= BALL_DIAMETER;
}

function makeDynamic(ball) {
    if (ball.isStatic) {
        Matter.Body.setStatic(ball, false);
        // Optional: Apply a small force to move the ball
        let forceMagnitude = 0.0005;
        let force = Matter.Vector.create(forceMagnitude, forceMagnitude);
        Matter.Body.applyForce(ball, ball.position, force);
    }
}
// Apply force on collision
function applyCollisionForce(ball1, ball2) {
    let forceDirection = Matter.Vector.normalise(Matter.Vector.sub(ball2.position, ball1.position));
    let forceMagnitude = calculateForceMagnitude(ball1, ball2);
    let force = Matter.Vector.mult(forceDirection, forceMagnitude);

    Matter.Body.applyForce(ball2, ball2.position, force);
}

// Calculate the force magnitude based on the speed of the cue ball
function calculateForceMagnitude(ball1, ball2) {
    let relativeVelocity = Matter.Vector.sub(ball1.velocity, ball2.velocity);
    let speed = Matter.Vector.magnitude(relativeVelocity);
    return speed * 0.05; // Adjust this factor as needed
}
//event listener 
function mouseMoved() {
    if (cueBall && cueBallSelected) {
        // Calculate the cue angle based on mouse position relative to the cue ball
        cueAngle = atan2(mouseY - cueBall.position.y, mouseX - cueBall.position.x);
       
    }
}

function getCueEndPosition() {
    if (!cueBall) {
        return createVector(0, 0); // Return a default vector if cueBall is not defined
    }
    let cueLength = 100; // Length of the cue stick
    let cueEndX = cueBall.position.x + cueLength * cos(cueAngle);
    let cueEndY = cueBall.position.y + cueLength * sin(cueAngle);
    return createVector(cueEndX, cueEndY);
}






function mouseClicked() {
    // Check if the click is on the cue ball for any mode
    if (cueBall && dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y) < BALL_DIAMETER / 2) {
        if (cueBallSelected) {
            // Cue ball was already selected, apply force to move it
            // Ensure the cue ball is dynamic
            Matter.Body.setStatic(cueBall, false);

            // Calculate the direction and magnitude of the force to apply
            let forceMagnitude = cuePower * 0.01; // Adjust the force magnitude as necessary
            let dx = cos(cueAngle);
            let dy = sin(cueAngle);
            let force = Matter.Vector.create(dx * forceMagnitude, dy * forceMagnitude);

            // Apply the force to the cue ball
            Matter.Body.applyForce(cueBall, cueBall.position, force);

            // Deselect the cue ball after applying force
            cueBallSelected = false;
        } else {
            // Cue ball was not already selected, select it for aiming
            cueBallSelected = true;
        }
        return false; // Prevent default behavior and stop further processing
    }

    // Mode-specific logic for adding a cue ball in modes 2 and 3
    if ((currentMode === MODE_RANDOM_ALL || currentMode === MODE_RANDOM_RED) && !cueBallAdded && !cueBallSelected) {
        cueBallAdded = true;
        cueBall = createBall(mouseX, mouseY, BALL_DIAMETER, false); // Add the cue ball dynamically
        // No need to toggle cueBallSelected here as we're adding a new cue ball
    }

    return false; // Prevent default behavior
}



function keyPressed() {
    
    
    if (key === 'H' || key === 'h') {
        toggleInstructions();
        redraw();
        return false;
    }

    cueBallAdded = false;
    if (key == '1') {
        currentMode = MODE_STARTING_POSITIONS;
    } else if (key == '2') {
        currentMode = MODE_RANDOM_ALL;
    } else if (key == '3') {
        currentMode = MODE_RANDOM_RED;
    }
    loop()
    return false;
}
