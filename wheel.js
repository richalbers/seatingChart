// ============================================================
// Wheel class
// 	To Use:
//		var wheel = new Wheel("canvasWheel"); 	//Create Wheel object and pass it ID of canvas to use:
//		wheel.draw(); 							// draw wheel on canvas
//		wheel.loadNames("Bob;Frank;Sue"); 		//loads names from ; delimited list 
//		wheel.spin(); 							// start wheel spinning (it'll spin for 1 to 3 revolutions)
//		wheel.stop(); 							// if yuu'd like to stop it early (not required).
//------------------------------------------------------

// Constructor
function Wheel(elementID) {
	//error checking
	if (!document.getElementById(elementID)) {
		alert("ERROR - ID of Canvas must be given to Wheel constructor"); 
		return;
	};
	
	// canvas context
	this.ctx = document.getElementById(elementID).getContext('2d');

	//default names and colors for wheel
	this.aNames = [	"Wheel", "of", "Misfortune", " ",
					"Wheel", "of", "Misfortune", " ",
					"Wheel", "of", "Misfortune", " ",
					"Wheel", "of", "Misfortune", " " ];
					
	this.aColors = [ "blue", "yellow", "green", "red", "orange", "fuchsia", "teal" ];
	this.lastColorNdx=this.aColors.length-1;
	this.colorNdx = 0;
	
	//canvas and wheel dimensions
	this.width=this.ctx.canvas.width;
	this.height=this.ctx.canvas.height;
	this.outerRadius = this.height/2-5;
	this.innerRadius = this.outerRadius/4;
	this.textCenter = (this.outerRadius+this.innerRadius)/2;
	this.fontSize = 20; //this.outerRadius/10; //22
	
	//data for animation (spinning)
	this.timerMS = 25; //ms between drawing calls
	this.timerID = 0;  //id of timer (obtained when set, used to stop it)
	this.degrees = 0;  //number of degrees wheel has spun
	this.speed = 0;    //current speed (max=100, 0=stopped)
}

//------------------------------------------------------
// Loads wheel with given data (a semi-colon-deliminted list of strings)
Wheel.prototype.loadNames = function(nameList) {
	//if it's spinning, stop it.
	//if (this.timerID > 0)
	//	this.stop();
	
	this.aNames = nameList.split(";");

	//make sure two adjacent wedges aren't the same color
	if ( (this.aNames.length-1) % this.aColors.length == 0)
		this.lastColorNdx = this.aColors.length-2;
	else
		this.lastColorNdx = this.aColors.length-1;

	this.draw();
}

//------------------------------------------------------
// Starts the wheel spinning (it gradually slows down)
Wheel.prototype.spin = function() {
	//if it's already spinning, stop it.
	if (this.timerID > 0)
		this.stop();
	
	//set initial speed
	this.speed=40+Math.random()*70; //numbers give 1 to 3 spins (foudn by experimentation)
	
	//call draw at regular intervals
	var mySelf=this;
	function callBack() {
		mySelf.draw();
	}
	this.timerID = setInterval(callBack, this.timerMS);
}

//------------------------------------------------------
// stops the spinning
Wheel.prototype.stop = function() {
	if (this.timerID != 0) {
		clearInterval(this.timerID);
		this.timerID = 0;
		//alert('timer stopped');
	}
}

//------------------------------------------------------
// draws everything on the canvas
Wheel.prototype.draw = function() {
	var ctx = this.ctx;
	
	ctx.clearRect(0,0,this.width,this.height); // clear canvas
	
	ctx.save();
	this.drawWheel(ctx);
	ctx.restore();
	
	ctx.save();
	this.drawPointer(ctx);
	ctx.restore();
	
	//slow the wheel down
	this.speed-=(this.speed/100); //100 was determined my experimentation
	if (this.speed<1)
		this.stop();	
	
}

//----------------------------------------------------------
// Private functions
//-----------------------------------------------------------
// Draws the wheel (it gets redrawn alot for animation)
Wheel.prototype.drawWheel = function(ctx) {

 	//set center point of rotation
 	ctx.translate(this.width/2, this.height/2);

	//rotate canvas the specified amount
	this.degrees+=this.speed/10;			//10 was determined by experimentation
	ctx.rotate(this.degrees * Math.PI / 180);

	//compute angle and outer X & Y coordinates for all wedges (no since redoing it for every wedge)
	//x and y are only used by drawWedge, but we do it here so we only need to do it once.
	var angleDeg=360/this.aNames.length;
	var angleRad = (angleDeg * Math.PI / 180);
	var x=this.outerRadius * Math.cos(angleRad / 2); 
	var y=this.outerRadius * Math.sin(angleRad / 2);
	
	//draw wheel's colored wedges and wedges
	this.colorNdx=0;
	for (ndx=0;ndx<this.aNames.length; ndx++) {
		ctx.rotate(angleRad);
		this.drawWedge(ctx, angleRad,x,y);
		this.drawText(ctx, this.aNames[ndx]);
	}
	
	//draw center circle
	ctx.fillStyle = "gray";
	ctx.strokeStyle = "black";
	ctx.beginPath();
	ctx.arc(0, 0, this.innerRadius, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.fill();	
 }
  
//------------------------------------------------------
//Draws a wedge for one wheel slice (it's more like a pie slice...)
Wheel.prototype.drawWedge = function(ctx, angleRad, x, y) {
	//note: angleRad, x, and y could be computeted here but we do
	//it beforehand so we only need to do it once per wheel drawing,
	//It's the same for all slices.

	//determine the color
	if (this.colorNdx < this.lastColorNdx)
		this.colorNdx++;
	else
		this.colorNdx = 0;
	ctx.fillStyle = this.aColors[this.colorNdx];

	//draw the wedge (all straight lines...)
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(x, y);
	ctx.lineTo(x,-y);
	ctx.closePath();
	ctx.fill();
	
	//draw the curved part on the outside
	ctx.arc(0, 0, this.outerRadius, angleRad/2, 0-(angleRad/2), true);
	ctx.fill();
}

//------------------------------------------------------
//Draws the wheel pointer
Wheel.prototype.drawPointer = function(ctx) {
	ctx.save();
	ctx.fillStyle = "gray";
 	
	ctx.translate(this.width/2, this.height/2);
	x=this.outerRadius; 
	y=0;

	ctx.beginPath();
	ctx.moveTo(x,0);
	ctx.lineTo(x+20, y-10);
	ctx.lineTo(x+20, y+10);
	ctx.closePath();
	ctx.fill();
	
	ctx.restore();
}
//------------------------------------------------------		
// Draws the Text on the one wheel slice
Wheel.prototype.drawText = function(ctx, textToDraw) {
	//https://developer.mozilla.org/en/drawing_text_using_a_canvas
	ctx.font = this.fontSize + "px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "black";
	ctx.fillText(textToDraw, this.textCenter, 0);
}
 
// =======================================================================

/*
var wheel;

//creats wheel and display is
function init() {
	 wheel = new Wheel("canvasWheel");
	 wheel.draw();
}

//spins the wheel
function start() {
	wheel.spin();
}

//loads names from textarea into wheel
function loadNames() {
	//get names from textbox and put into array
	var names = document.getElementById("names").value;
	var aNames = names.split("\n");
	
	//build a ; deliminted list of all names to be included (those that don't begin with a space)
	var nameList = "";
	var delimiter = ""; //no delimiter before the first one....
	for (x=0;x<aNames.length;x++) {
		if (aNames[x].length>0 && aNames[x].charAt(0) != " ") {
			nameList = nameList + delimiter + aNames[x];
			delimiter = ";"
		}
	}
	wheel.loadNames(nameList);
}
*/