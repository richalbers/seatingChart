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
	
	//draw "pins" between wedges (must be done after ALL wedges are drawn)
	for (ndx=0;ndx<this.aNames.length; ndx++) {
		ctx.rotate(angleRad);
		this.drawDivider(ctx, angleRad, x, y);
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
	this.colorNdx++;
	var hue=720/this.aNames.length*this.colorNdx;	//goes through color palette twice
	if (this.aNames.length<11) 						//for small wheels, just go through once
		hue=hue/2;
	ctx.fillStyle = 'hsl(' + hue + ', 100%, 80%)';  //hue,saturation, lightness

	//draw the wedge (all straight lines...)
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(x-1, y);
	ctx.lineTo(x-1,-y);
	ctx.closePath(); //completes triangle definition
	ctx.stroke();	 //draws outside line of triangle
	//ctx.fill();		//fills triangle
	
	//draw the curved part on the outside
	ctx.arc(0, 0, this.outerRadius, angleRad/2, 0-(angleRad/2), true);
	ctx.fill();
}

//-----------------------------------------------------------
//Draws "pin" between wedges
Wheel.prototype.drawDivider = function(ctx, angleRad, x, y) {
	ctx.fillStyle = "black"; //note: this color value is in drawPointer too!
	ctx.strokeStyle = "black";
	
	ctx.beginPath();
	ctx.arc(x,y, 2, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.fill();
}

//------------------------------------------------------
//Draws the wheel pointer
Wheel.prototype.drawPointer = function(ctx) {

 	var yDeflection=0;
	var pointerHeight=10;  //it's really twice that...
	var pointerLength=24; //it's really this + height
	
	//get pixel on edge of wheel where pointer will be to see if pointer needs to deflect
	var imgData=ctx.getImageData(this.width/2 + this.outerRadius-1, this.height/2 ,1,1);
	var color = imgData.data[0] + imgData.data[1] + imgData.data[2];
	if (color < 5) { //pins are black.  Or this doesn't work....
		yDeflection=3;
	}	
	
	//draw pointer
	ctx.save();
	
	ctx.translate(this.width/2, this.height/2);
	var x=this.outerRadius; 
	var y=0;
	
	ctx.fillStyle = "black";
	ctx.strokeStyle = "black";
	ctx.beginPath();
	ctx.arc(x+pointerLength,y, pointerHeight, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.fill();
	
	ctx.beginPath();
	ctx.moveTo(x-3, y+yDeflection);
	ctx.lineTo(x+pointerLength-2, y-pointerHeight);
	ctx.lineTo(x+pointerLength-2, y+pointerHeight);
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
