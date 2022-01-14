/*eslint-disable eqeqeq*/

import React, { Component } from 'react';
//import ContainerDimensions from 'react-container-dimensions';
	//cannot obtain a ref from a functional component,
	//thus cannot get the context.

import './App.css';
//import ReactDOM from 'react-dom'
import imagefile from './img/silhouette.png'
import image2 from './img/silhouette2.png'

//Flow:
	//ComponentDidMount --> LoadImage --> UpdateCanvasSize --> setState --> shouldComponentUpdate --> componentDidUpdate --> setDimensions, draw the canvas, etc
//When props change, the flow begins at componentDidUpdate, which decides how much of the canvas to rerender, and rerenders it.

//*** The math that orients a point on the screen can be found in RelativePoint() ***


//If ResizeObserver isn't supported to my liking...
//then there is react-resize-observer import which could do the same thing.

var timeouts = {
	//moveinterval : null,
	movetimeout: null,
	repeattimeout : null,
	sourceready: false,
	delayrefresh: null,
}

//I created a namespace, because I don't want to post to state and then have the component refresh.
var namesp = {}
namesp.currentframe = null
namesp.relativepoints = null
namesp.canvaspoints = null
namesp.minmaxes = null
namesp.lastpoint = null
namesp.dimensions = null

//refs are global b/c the item was mysteriously disappearing and becoming null.
//This way works, and repetitively re-identifying the ref doesn't work.
var canvasParent = null;
var canvasElement = null;

class CanvasSpace extends Component {
	
	constructor() {
		super();
		
		this.state = { width: null, height: null,}
		
		this.updateCanvasSize = this.updateCanvasSize.bind(this);
		
		this.loadImage = this.loadImage.bind(this)
		this.update_canvaspoints = this.update_canvaspoints.bind(this)
		this.update_all_points = this.update_all_points.bind(this)
		this.draw_canvas_partial = this.draw_canvas_partial.bind(this)
		this.draw_canvas_full = this.draw_canvas_full.bind(this)
		this.setDimensions = this.setDimensions.bind(this)
		this.restart_interval = this.restart_interval.bind(this)
		this.sendRotation = this.sendRotation.bind(this)

		//necessary to capture the context for the canvas
		this.parentDiv = React.createRef();		
		this.spaceCanvasRef = React.createRef();
		this.resizeObserver = null;
	}
	
	observe = RO => {
		this.resizeObserver = new RO(entries => {
			const {
				width,
				height,
				//top,
				//right,
				//bottom,
				//left
			} = entries[0].contentRect;
			this.setState({ width, height })
		});
	};
	
	componentWillUnmount() {
		if(this.resizeObserver){
			this.resizeObserver.disconnect();
		}
		
		timeouts = {
			//moveinterval : null,
			movetimeout: null,
			repeattimeout : null,
			sourceready: false,
			delayrefresh: null,
		}			
	}
	
	componentDidMount()
	{
		canvasParent = this.parentDiv.current;
		canvasElement = this.spaceCanvasRef.current;
		
		if("ResizeObserver" in window)
		{ this.observe(ResizeObserver);	
		  this.resizeObserver.observe(canvasParent);
		} 
		else { window.addEventListener('resize', () => { this.updateCanvasSize(); });}
		//If no ResizeObserver, then the browser doesn't shift for the burger menu.
		//But ResizeObserver has wide support :-)
		
		//window.addEventListener('resize', () => { this.updateCanvasSize(); });

		this.loadImage() //calls updateCanvasSize when image is ready
						//(otherwise image won't render at start)
						//which then updates state, triggering draw onto canvas
						//in componentDidUpdate
	}
	
	loadImage()  //loads the person on the canvas
	{
		this.silhouette = new window.Image();
		this.silhouette2 = new window.Image();
				
		//waits for image to load. Important so it actually appears on first render.
		if((this.props.vars.startheight===4 && this.props.vars.units==="ft") || 
		  (this.props.vars.startheight===1.2 && this.props.vars.units==="m"))
		{ this.silhouette.onload = this.updateCanvasSize.bind(this) }
		else
		{ this.silhouette2.onload = this.updateCanvasSize.bind(this) }
	
		this.silhouette.src = imagefile //require('silhouette.png')
		this.silhouette2.src = image2 //require('silhouette2.png')		
	}
	
	//Runs after the image is loaded. If I don't wait for it to load like this,
	//the image won't draw at all on the first render
	/*onImageLoaded()
	{
		this.updateCanvasSize()		
	}*/		//function is unnecessary. It just calls another function.
	
	updateCanvasSize() //called by window resize event
	{
		const width = (canvasParent.clientWidth);
		const height = (canvasParent.clientHeight);
		this.setState({ width:width, height:height })
	}
	
	//set canvas dimensions to a variable
	setDimensions()
	{
		//let canvas = this.spaceCanvasRef.current
		//let canvas = ReactDOM.findDOMNode(this.spaceCanvasRef.current);
		let ctx = canvasElement.getContext('2d');
		
		var dimensions = {}
		dimensions.units = this.props.vars.units
		dimensions.width = ctx.canvas.clientWidth;
		dimensions.height = ctx.canvas.clientHeight;
		
		//Buffers used to scale the person in the middle appropriately
		dimensions.X_BUFFER = dimensions.width/10;
		dimensions.Y_BUFFER = dimensions.height/8;
		dimensions.DRAWING_WIDTH = dimensions.width - 2 * dimensions.X_BUFFER;
		dimensions.DRAWING_HEIGHT = dimensions.height - 2 * dimensions.Y_BUFFER;
		dimensions.DELAY_BETWEEN_DRAWS = 2.5;
		dimensions.menuLeftOpen = this.props.vars.menuLeftOpen;
		dimensions.menuRightOpen = this.props.vars.menuRightOpen;
		dimensions.defaultheight = this.props.defaults.startheight;
				//remember the canvas draws from top-left, so
				//these buffers are counterintuitive
				
		if(dimensions.height < 350)	   //somehow, counterintuitively,
		{ dimensions.Y_BUFFER /= 1.5 } //shrinking it improved the scalemarks (on mobile)
		else if(dimensions.height>500)
		{ dimensions.Y_BUFFER *= 1.25 }  //for laptops and larger screens

		namesp.dimensions = dimensions
		
	}
	
	shouldComponentUpdate(newProps, newState)
	{	
		//Sometimes it tries to re-render without a state or props change.
		if( this.props.vars.slope === newProps.vars.slope &&
			this.props.vars.time === newProps.vars.time &&
			this.props.vars.radius === newProps.vars.radius &&
			this.props.vars.omega === newProps.vars.omega &&
			this.props.vars.startheight === newProps.vars.startheight &&
			this.props.vars.start_v_x === newProps.vars.start_v_x &&
			this.props.vars.start_v_y === newProps.vars.start_v_y &&
			this.props.vars.units === newProps.vars.units &&
			this.props.vars.menuLeftOpen === newProps.vars.menuLeftOpen &&
			this.props.vars.menuRightOpen === newProps.vars.menuRightOpen &&
			this.props.vars.frozen === newProps.vars.frozen &&
			this.props.vars.percenttime === newProps.vars.percenttime &&
			this.state.height === newState.height &&
			this.state.width === newState.width
		)
			{ 	return false; }
		else{ 	return true; 	}
	}		
		
	
	//calculates *how much* of the canvas it needs to re-render
	//based on what variables changed.
	componentDidUpdate(prevProps, prevState)
	{					//never uses the angle!	
		 if( 	this.props.vars.startheight!==prevProps.vars.startheight ||
				this.props.vars.speed!==prevProps.vars.speed ||
				this.props.vars.radius!==prevProps.vars.radius ||
				this.props.vars.omega!==prevProps.vars.omega ||
				this.props.vars.units!==prevProps.vars.units)
		{
			this.setDimensions()
			this.update_all_points()
			this.draw_canvas_full()
		}
		else if((prevProps.vars.percenttime > 20 && this.props.vars.percenttime < 20) 
			|| (prevProps.vars.percenttime > 50 && this.props.vars.percenttime < 50))
		{
			var oldlength = namesp.canvaspoints.length;
			this.update_all_points()
			namesp.currentframe = Math.floor((namesp.currentframe / oldlength) * namesp.canvaspoints.length); //
			this.draw_canvas_partial()
		}
		/*else if(prevProps.vars.percenttime != this.props.vars.percenttime)
		{//removed b/c what if you change the percenttime as well as something else? It glitches.
			this.restart_interval()
		}*/
		else if( (this.props.vars.menuLeftOpen!==prevProps.vars.menuLeftOpen) || (this.props.vars.menuRightOpen!==prevProps.vars.menuRightOpen))
		{
			this.setDimensions()			//shape of canvas has changed.
			this.update_canvaspoints() 		//only need to update canvaspoints
			this.draw_canvas_partial()		//because the actual path stays the same
		}
		else if( ((this.state.width != prevState.width) || (this.state.height != prevState.height)) && namesp.relativepoints!=null )
		{
			this.setDimensions()
			this.update_canvaspoints() //only need to update canvaspoints
			this.draw_canvas_partial()
		}
		else
		{
			this.setDimensions()
			this.update_all_points()
			this.draw_canvas_full()
		}
		/*else if(prevProps.vars.percenttime===0 && this.props.vars.percenttime!==0)
		{
			this.draw_canvas_partial()
		}*/
		/*else if( this.props.vars.frozen!==prevProps.vars.frozen)
		{
			this.draw_canvas_partial() //don't need to update any variables.
		}*/	
		
		this.sendRotation();
		
	}
	
	//tells the parent app the center of rotation for the stars
	sendRotation() {  //sends to callbackFunction() in App.js
					
		var point = new CanvasPoint(0, this.props.vars.radius, namesp.dimensions)
		
		//duration in ms of a full rotation
		
		var duration
		if(Number(this.props.vars.omega)===0){ duration=0;}
		else{ duration = (1 / (this.props.vars.omega / (2*Math.PI) ) ) * 1000 }
			//the playback speed is dealt with in App.js
		//console.log(duration)
	
		var rotationStats = {}		//center of rotation on canvas
		rotationStats.centerX = point.x
		rotationStats.centerY = point.y
		rotationStats.duration = duration
		//console.log(duration)
				
		this.props.sendRotation(rotationStats);
		
	}

	//if the canvas size has changed, then you don't need to recalculate all points...
	//just the canvaspoints. Probably doesn't save that much cpu, but whatever.
	update_canvaspoints()
	{
			//if you don't do this first,
			//it won't adjust right when the screen resizes, etc
		namesp.minmaxes = minmax(namesp.relativepoints, namesp.dimensions)
		
		getCanvaspoints(namesp.relativepoints, this.props.vars.time, this.props.vars.percenttime);
		//namesp.canvaspoints = resources.canvaspoints
	}
	
	//Update all of the points when a variable changes
	update_all_points()
	{
		var relativepoints = getRelativePoints(this.props.vars.slope, this.props.vars.time, this.props.vars.radius, this.props.vars.omega, this.props.vars.startheight, this.props.vars.start_v_x, this.props.vars.start_v_y, this.props.vars.percenttime)
		
		//update namespace now that I have new relativepoints
		namesp.minmaxes = minmax(relativepoints, namesp.dimensions)
		namesp.relativepoints = relativepoints
		
		getCanvaspoints(relativepoints, this.props.vars.time, this.props.vars.percenttime);

		//namesp.canvaspoints = resources.canvaspoints
		//namesp.minmaxes = resources.minmaxes //the getCanvaspoints function does this
		namesp.lastpoint = relativepoints[relativepoints.length-1]
		
		//console.log("lastpoint", namesp.lastpoint.x, namesp.lastpoint.y)
	}
	
	restart_interval() //for adjustments in percent time only. Restarts the interval without resetting the canvas.
	{
		//clearInterval(timeouts.moveinterval); timeouts.moveinterval=null;
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;

		//let canvas = this.spaceCanvasRef.current
		//let canvas = ReactDOM.findDOMNode(this.spaceCanvasRef.current);
		let ctx = canvasElement.getContext('2d');

		var silhouette
		//if((this.props.vars.startheight==4 && this.props.vars.units==="ft") || (this.props.vars.startheight==1.219 && this.props.vars.units==="m"))
		if(this.props.vars.startheight===this.props.defaults.startheight)
		{	silhouette=this.silhouette		}
		else
		{ 	silhouette=this.silhouette2 	}		
		
		if(!this.props.vars.frozen) //&& this.props.vars.percenttime !== 0)
		{	draw_curve_active(ctx, this.props.vars.time, this.props.vars.percenttime, this.props.vars.radius, silhouette, this.props.vars.startheight, namesp.currentframe)	}
		/*else if(this.props.vars.percenttime===0)
		{	draw_curve_static(ctx, namesp.canvaspoints, namesp.dimensions)	}*/
	}
	
	draw_canvas_partial()
	{
		//console.log(this.props.vars.frozen)
		
		//console.log("canvas partial update")
		
		//clearInterval(timeouts.moveinterval); timeouts.moveinterval=null;
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;
		
		//let canvas = this.spaceCanvasRef.current
		//let canvas = ReactDOM.findDOMNode(this.spaceCanvasRef.current);
		let ctx = canvasElement.getContext('2d');
		
		var silhouette
		//if((this.props.vars.startheight==4 && this.props.vars.units==="ft") || (this.props.vars.startheight==1.219 && this.props.vars.units==="m"))
		if(this.props.vars.startheight===this.props.defaults.startheight)
		{	silhouette=this.silhouette		}
		else
		{ 	silhouette=this.silhouette2 	}
	
		reset_canvas(ctx, this.props.vars.radius, namesp.lastpoint, silhouette, this.props.vars.startheight);
		if(this.props.vars.frozen) // || this.props.vars.percenttime === 0)
		{
			//clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
			draw_curve_static(ctx, namesp.canvaspoints, namesp.dimensions)
		}
		else
		{
			draw_curve_static(ctx, namesp.canvaspoints.slice(0,namesp.currentframe), namesp.dimensions,"nocircle")
			draw_curve_active(ctx, this.props.vars.time, this.props.vars.percenttime, this.props.vars.radius, silhouette, this.props.vars.startheight, namesp.currentframe)
			//Passing the currentframe from the namespace signals it to refresh from that point.
		}
	}
	
	draw_canvas_full()
	{
		namesp.currentframe=1
		//console.log("canvas full update")
		
		//clearInterval(timeouts.moveinterval); timeouts.moveinterval=null;
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;		
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
		
		//let canvas = ReactDOM.findDOMNode(this.spaceCanvasRef.current);
		//let canvas = this.spaceCanvasRef.current;
		let ctx = canvasElement.getContext('2d');
		
		var silhouette
		//if((this.props.vars.startheight==4 && this.props.vars.units==="ft") || (this.props.vars.startheight==1.219 && this.props.vars.units==="m"))
		if(this.props.vars.startheight===this.props.defaults.startheight)
		{	silhouette=this.silhouette		}
		else
		{ 	silhouette=this.silhouette2 	}

		
		if(this.props.vars.frozen) // || this.props.vars.percenttime == 0)
		{
			
			reset_canvas(ctx, this.props.vars.radius, namesp.lastpoint, silhouette, this.props.vars.startheight);
			draw_curve_static(ctx, namesp.canvaspoints, namesp.dimensions)
		}
		else
		{
			draw_curve_active(ctx, this.props.vars.time, this.props.vars.percenttime, this.props.vars.radius, silhouette, this.props.vars.startheight) //also resets the canvas.
		}
	}
	

	render() {

		return (
			<div
				ref={this.parentDiv}
				className="canvasParent"
				style={{width:'100%',height:'100%', position:'absolute',}}>
					<canvas
						ref={this.spaceCanvasRef} 
						width={this.state.width}
						height={this.state.height}
					/>
			</div>
		);	
	}
}







//round to the nearest thousandth.
function round(num, places) {
    if(places==null)
	{
		places=1;
	}
	
	var multiplier = Math.pow(10, places);
    var output = Math.round(num * multiplier) / multiplier;
	
	//fix some weird output. Probably due to feet/meters conversion not being more precise.
	if(Math.abs(output - Math.round(output)) <= .0011)
	{ output = Math.round(output); }

	return output;	
}



function getRelativePoints(slope, time, radius, omega, startheight, start_v_x, start_v_y, percenttime)
{
	
	
	//get ~240 increments per second, but min 240 increments, max 3000 increments.
	//It won't SHOW that many, but if the user shows at 50% speed, then I'll want them.
	var time_increment
	if( time<1.2 )
	{ time_increment = time/130 }
	else if( time>50 )
	{ time_increment = time/6500 }
	else
	{ time_increment = .0077; }
	
	if(percenttime<10)
	{ time_increment /= 5; }
	else if(percenttime<50)
	{ time_increment /= 2; }
	
	//var time_increment = Number(time.div(150))

	//get the points
	var pointsList = []
	var point
	if(time > 0)
	{
		var t
		for(t=0; t<=Number(time); t+=time_increment)
		{
			point = new RelativePoint( t, Number(radius), Number(omega), Number(startheight), Number(start_v_x), Number(start_v_y) )
			pointsList.push(point)
		}
		
		//do it once more at t = time.
		point = new RelativePoint( Number(time), Number(radius), Number(omega), Number(startheight), Number(start_v_x), Number(start_v_y) );
		pointsList.push( point );			
	}
	else if(time==0 || !isFinite(time))
	{
		point = new RelativePoint( 0, Number(radius), 0, Number(startheight), 0, 0 )
		pointsList.push(point) //push exactly one point
	}
	
	return pointsList
}



function draw_curve_static(ctx, canvaspoints, dimensions, nocircle)
{
	//console.log(timeouts)
	
	//draw a little circle where the coin *started*.
	ctx.beginPath();
	ctx.strokeStyle="#5c6870";
	ctx.arc(canvaspoints[0].x, canvaspoints[0].y,5,0,2*Math.PI);
	ctx.stroke();
	
	//now render all of the canvaspoints for the coin's calculated path.
	ctx.beginPath();
	ctx.strokeStyle="#000000";
	ctx.moveTo(canvaspoints[0].x, canvaspoints[0].y);
	
	for(var i=1; i<canvaspoints.length; i++)
	{		
		ctx.lineTo(canvaspoints[i].x, canvaspoints[i].y)
	}
	
    ctx.stroke();
	
	//draw a little circle where the coin *ended*.
	if(typeof nocircle === 'undefined') //prevents an extra circle on window resize
	{
		ctx.beginPath();
		ctx.strokeStyle="#5c6870";
		ctx.arc(canvaspoints[canvaspoints.length-1].x, canvaspoints[canvaspoints.length-1].y,5,0,2*Math.PI);
		ctx.stroke();
		ctx.strokeStyle="#000000";
	}
}

//draws the curve using a timeout, starting this function every so many milliseconds
//based on the playback speed, showing an accurate, active coin toss
function draw_curve_active(ctx, time, percenttime, radius, silhouette, startheight, currentframe)
{
	var canvaspoints = namesp.canvaspoints
	var dimensions = namesp.dimensions
	//var minmaxes = namesp.minmaxes
	var lastpoint = namesp.lastpoint
	
//	if(timeouts.moveinterval!=null)
	if(timeouts.repeattimeout!=null)
	{	
		//clearInterval(timeouts.moveinterval); timeouts.moveinterval=null;
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
	}
	
	if(currentframe==null)
	{
		reset_canvas(ctx, radius, lastpoint, silhouette, startheight);
		namesp.currentframe=1;
		
		//draw a little circle where the coin *started*.
		ctx.beginPath();
		ctx.strokeStyle="#5c6870";
		ctx.arc(canvaspoints[0].x, canvaspoints[0].y,5,0,2*Math.PI);
		ctx.stroke();

		ctx.strokeStyle="#000000"; //reset the stroke style to black.
	}
	
	
	//output ~38fps
	const framespersecond = 38
	var pointspersecond = canvaspoints.length / ( time * (100/percenttime)  )
	var pointsperframegoal = pointspersecond / framespersecond
	var pointsperframeactual = Math.ceil(pointsperframegoal)
	var offset = pointsperframeactual / pointsperframegoal
	var time_delay_in_ms = (1/framespersecond) * offset * 1000
	
	//Timeouts are better than intervals because they can be adjusted mid-draw,
	//and they will not interfere with each other. Less buggy.
	function moveline() {
		if(namesp.currentframe>=canvaspoints.length)
		{  //clearInterval(timeouts.moveinterval); timeouts.moveinterval=null; 
			clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
			//necessary so you don't have to wait forever
			//if you adjusted the percent time mid-draw.

			timeouts.repeattimeout = setTimeout(function() {
				draw_curve_active(ctx, time, percenttime, radius, silhouette, startheight); }, dimensions.DELAY_BETWEEN_DRAWS * 1000);
			
			//draw a little circle where the coin *ended*.
			ctx.beginPath();
			ctx.strokeStyle="#5c6870";
			ctx.arc(canvaspoints[canvaspoints.length-1].x, canvaspoints[canvaspoints.length-1].y,5,0,2*Math.PI);
			ctx.stroke();
			ctx.strokeStyle="#000000";					
							
			return; 
		}

		ctx.beginPath();
		ctx.moveTo(canvaspoints[namesp.currentframe-1].x, canvaspoints[namesp.currentframe-1].y);
		
		for(var x=0; x<pointsperframeactual; x++)
		{
			if(namesp.currentframe>=canvaspoints.length)
			{  //clearInterval(timeouts.moveinterval); timeouts.moveinterval=null; 
				clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;	
				//necessary so you don't have to wait forever
				//if you adjusted the percent time mid-draw.
				ctx.stroke();

				timeouts.repeattimeout = setTimeout(function() {
					draw_curve_active(ctx, time, percenttime, radius, silhouette, startheight); }, dimensions.DELAY_BETWEEN_DRAWS * 1000);
					
				//draw a little circle where the coin *ended*.
				ctx.beginPath();
				ctx.strokeStyle="#5c6870";
				ctx.arc(canvaspoints[canvaspoints.length-1].x, canvaspoints[canvaspoints.length-1].y,5,0,2*Math.PI);
				ctx.stroke();
				ctx.strokeStyle="#000000";					
								
				return; 
			}

			ctx.lineTo(canvaspoints[namesp.currentframe].x, canvaspoints[namesp.currentframe].y)

			//draw a little circle at the coin's current spot.
			/*  //this is buggy. Too difficult with only a tiny return.
			ctx.beginPath();
			ctx.lineWidth = 6;
			ctx.strokeStyle="#ffffff"; //erase the previous drawing of the coin...
			ctx.arc(canvaspoints[namesp.currentframe-1].x, canvaspoints[namesp.currentframe-1].y,5,0,2*Math.PI);
			ctx.stroke();
			ctx.beginPath();
			ctx.lineWidth = 3;
			ctx.strokeStyle="#5c6870"; //draw the current coin
			ctx.arc(canvaspoints[namesp.currentframe].x, canvaspoints[namesp.currentframe].y,5,0,2*Math.PI);
			ctx.stroke();
			ctx.strokeStyle="#000000";
			ctx.lineWidth = 2;
			
			if(namesp.currentframe > 2) {  //redraw the line after erasing the coin
				ctx.moveTo(canvaspoints[namesp.currentframe-3].x, canvaspoints[namesp.currentframe-3].y) 
				ctx.lineTo(canvaspoints[namesp.currentframe-2].x, canvaspoints[namesp.currentframe-2].y) 	
			}
			if(namesp.currentframe > 1) { 
				ctx.moveTo(canvaspoints[namesp.currentframe-2].x, canvaspoints[namesp.currentframe-2].y) 
				ctx.lineTo(canvaspoints[namesp.currentframe-1].x, canvaspoints[namesp.currentframe-1].y) 	
			}
			if(namesp.currentframe > 0) { //extend the line forward.
				ctx.moveTo(canvaspoints[namesp.currentframe-1].x, canvaspoints[namesp.currentframe-1].y) 
				ctx.lineTo(canvaspoints[namesp.currentframe].x, canvaspoints[namesp.currentframe].y) 	
			ctx.stroke();
			} */
			
			namesp.currentframe+=1;
		}
		ctx.stroke();

		if(namesp.currentframe<=canvaspoints.length)
			{timeouts.movetimeout = setTimeout(moveline, time_delay_in_ms)}

	};

	timeouts.movetimeout = setTimeout(moveline, time_delay_in_ms);
	//timeouts.moveinterval = setInterval(moveline, time_delay_in_ms);
}




//increment the scale nicely to units of 1,2,4,5,10,20,40,50,100,...
//more intuitive for the user.
function scale_increment() {
	this.series = -1;
		
	this.run = function(value) {
		this.series+=1;
		if(this.series==4)
		{
			this.series=0;
		}
		
		if(this.series!=2)
		{
			return value*=2
		}
		else
		{
			return value+=value/4
		}
	}
}


//generate the positions for a scale mark,
//given the angle on a circle where you want to display it and a labeled "value"
function scalemark(radius, angle, minmaxes, value, dimensions)
{
	//mark size 10px, means 5px above and below station curve
	//subtract the proper number of feet-per-pixel from the radius to achieve.
	var x1 = (radius - (5 / minmaxes.pxperfoot)) * Math.cos(angle)
	var x2 = (radius + (5 / minmaxes.pxperfoot)) * Math.cos(angle)
	//var x3 = (radius + (30 / minmaxes.pxperfoot)) * Math.cos(angle)
	
	var y1 = (radius - (5 / minmaxes.pxperfoot)) * Math.sin(angle) + radius
	var y2 = (radius + (5 / minmaxes.pxperfoot)) * Math.sin(angle) + radius
	//var y3 = (radius + (20 / minmaxes.pxperfoot)) * Math.sin(angle) + radius
	
	this.start = new CanvasPoint( x1, y1)
	this.end = new CanvasPoint( x2, y2)
	
	this.angle=angle
	
	var length = value.toString().length;
	var canvasX3 = this.end.x - length*3 + length*3*Math.cos(angle) + 10*Math.cos(angle)
	var canvasY3 = this.end.y - 15*Math.sin(angle) + 3*(Math.sin(angle)+1)
				//the draw coord starts from the bottom. adjust for that.
				//the more "up" on the circle, the more it matters.
				
	this.numberspot = {x : canvasX3, y : canvasY3}
	//this.numberoffsetX = value.toString().length*5
	//this.numberoffsetY = -5 * Math.cos(angle)
	this.value = value
}



function draw_scale(ctx, radius, lastpoint)
{
	var minmaxes = namesp.minmaxes;
	var dimensions = namesp.dimensions;
	
	const scale_color = "#9dfcdb"
	
	//angle swept from person (floor) to coin's landing position.
	var half_chord_value = lastpoint.persontoCoin/(2*radius)
	if(half_chord_value > 1) { half_chord_value = 1 }  //a bugfix
	var chord_angle = 2 * Math.asin(half_chord_value)
	
	//var chord_angle = lastpoint.angle_poc //is apparently not equivalent?

	//var curve_dist = radius * chord_angle //total scale distance
											//variable never used.
	
	var start = 3*Math.PI/2  //starting scale angle, always at 3PI/2 (270D)
	
	//show the scale in both directions! 
	//If the coin goes the other way, then display the scale the other way.
	var end
	if(lastpoint.x < 0)
	{	end = start - chord_angle  } //end scale angle
	else
	{	end = start + chord_angle  }


	//Match the scale to the canvas. Calculate arc-per-foot, px-per-foot.
	//Or METERS...the math works out the same. I'm not changing variable names.
	//arcperfoot is the variable actually used to calculate tic locations.
	//Pxperfoot is used to generate a scale range that would actually be
	//human-interpretable.
	var arc_per_foot = 1 / radius
	
	//Pick a scale distance that fits with > 20 pixels between each tick.
	//Intelligently increment the scale interval to something human-interpretable.
	//Goes 1, 2, 4, 5, 10, 20, 40, 50, 100, 200, 400, 500, 1000...
	var increment=1;
	var increaseval = new scale_increment()
	
	while(minmaxes.pxperfoot*increment<25)
	{
		increment = increaseval.run(increment);
	}

	//if the numbers are long, give it extra space
	//by incrementing the interval a bit more.
	if(increment.toString().length >= 3 || (chord_angle * radius) > 1000)
	{	while(minmaxes.pxperfoot*increment<45)
		{
			increment = increaseval.run(increment);
		}
	}
	
	//generate the locations for the tic marcks, 
	//up to the end spot plus one tic.
	//coded for both a positive arc and a negative arc, depending
	//which way the coin went.
	var i=0;
	var scalemarks = [];
	var a
	if(lastpoint.x < 0)
	{
		//incrementing over an angle, so I called it a for angle.
		for(a=start; a>end-(arc_per_foot*increment); a-=(arc_per_foot*increment))
		{
			scalemarks.push(new scalemark(radius, a, minmaxes, i, dimensions) )
			i+=increment;
		}
	}
	else
	{
		for(a=start; a<end+(arc_per_foot*increment); a+=(arc_per_foot*increment))
		{
			scalemarks.push(new scalemark(radius, a, minmaxes, i, dimensions) )
			i+=increment;
		}
	}
	
	if(scalemarks.length===2)
	{
		var angle=((scalemarks[1].angle - start) * -1) + start
		scalemarks.push(new scalemark(radius, angle, minmaxes, scalemarks[1].value, dimensions) )
	}

	//draw the marks	
	ctx.font = "bold 14px Arial";
	ctx.lineWidth = 3;
	
	ctx.beginPath();
	ctx.fillStyle = scale_color;
	ctx.strokeStyle = scale_color;
	for(i=0; i<scalemarks.length; i++)
	{
		var mark = scalemarks[i]
		ctx.moveTo(mark.start.x, mark.start.y)
		ctx.lineTo(mark.end.x, mark.end.y)
		ctx.fillText(mark.value.toString(), mark.numberspot.x, mark.numberspot.y);
	}
	ctx.stroke()
	
	ctx.fillStyle="#000000"
	ctx.strokeStyle="#000000"
	ctx.lineWidth = 2;
}



//erase canvas, draw the floor, and draw the scale if applicable.
function reset_canvas(ctx, radius, lastpoint, silhouette, startheight) {
	
	var minmaxes = namesp.minmaxes;
	var dimensions = namesp.dimensions;
	
	//clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
	ctx.clearRect(0, 0, dimensions.width, dimensions.height);
	
	draw_floor(ctx, radius)	
	
	/*var handheight
	if(dimensions.units==="ft")
	{ handheight=4 }
	else
	{ handheight=1.219 }*/
	
	if(silhouette!=null)
	{ draw_silhouette(ctx, silhouette, minmaxes, dimensions, dimensions.defaultheight);  }
	
	if( startheight !== dimensions.defaultheight )
	{   canvas_arrow(ctx, startheight); 	}
	
	draw_scale(ctx, radius, lastpoint)
	
}

//draw an arrow to the coin's starting position (if the position isn't default)
function canvas_arrow(ctx, startheight) {	 //, fromx, fromy, tox, toy){
    
	//var minmaxes = namesp.minmaxes;
	var dimensions = namesp.dimensions;
	
	var origin = new CanvasPoint( 0, 0) //floor where feet are
	var start = new CanvasPoint( 0, startheight) //throw start

	var fromx = origin.x 
	var fromy = origin.y 
	var tox = start.x 
	var toy = start.y  + 7 //+7 so it's not dwarfing the coin.
	
	var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
	
	var pxheight = fromy - toy
	if(pxheight > 15)
	{
		ctx.font = "bold 14px Arial";
		ctx.beginPath()
		ctx.strokeStyle="red"
		ctx.fillStyle="red"
		ctx.lineWidth=1.5
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));

		ctx.fillText(round(startheight).toString() + " " + dimensions.units, fromx + 5, fromy - pxheight/2);
		ctx.stroke()
		
		ctx.strokeStyle="#000000";
		ctx.fillStyle="#000000";
		ctx.lineWidth=1;
	}
}

//Draw the person.
function draw_silhouette(ctx, silhouette, minmaxes, dimensions, startheight)
{
	//drawing is dimensions [323,831] (width, height).
	//Need the spot (24, 539) (from bottom) to cooincide
		//with *relative* coordinate (0,4), aligned to the canvas.

	//var footbuffer = 2
	
	var origin = new CanvasPoint( 0, 0) //feet on floor
	var px_startheight = minmaxes.pxperfoot * startheight
	var numpixtotop = (px_startheight * 830/539)
	var drawing_top = origin.y - numpixtotop
	var px_width = numpixtotop * 323/831
	var px_offset_left = px_width * 24/323
	
	var drawing_left
	if(minmaxes.directionLeft)
	{
		drawing_left = origin.x - px_offset_left	
		drawImage(ctx, silhouette, drawing_left , drawing_top , px_width, numpixtotop);
	}
	else
	{
		drawing_left = origin.x + px_offset_left
		drawImage(ctx, silhouette, drawing_left -px_width, drawing_top , px_width, numpixtotop, 0, true);
	}
}


function drawImage(ctx, img, x, y, width, height, deg, flip, flop, center)
{
	ctx.save();

	if(typeof width === "undefined") width = img.width;
	if(typeof height === "undefined") height = img.height;
	if(typeof center === "undefined") center = false;

	// Set rotation point to center of image, instead of top/left
	if(center) {
		x -= width/2;
		y -= height/2;
	}

	// Set the origin to the center of the image
	ctx.translate(x + width/2, y + height/2);

	// Rotate the canvas around the origin
	var rad = 2 * Math.PI - deg * Math.PI / 180;    
	ctx.rotate(rad);

	var flipScale
	var flopScale
	// Flip/flop the canvas
	if(flip) flipScale = -1; else flipScale = 1;
	if(flop) flopScale = -1; else flopScale = 1;
	ctx.scale(flipScale, flopScale);

	// Draw the image    
	ctx.drawImage(img, -width/2, -height/2, width, height);

	ctx.restore();
}

//only runs when the canvaspoints need to be *changed*.
//(when the model is changed, or percent speed is altered)
function getCanvaspoints(relativepoints, time, percenttime) {
	
	var canvaspoints = []
	
	var i=0;

	for(var inc=0; inc<relativepoints.length; inc+=1) //interval)
	{
		i=Math.ceil(inc)
		if(i>=relativepoints.length)
		{
			break;
		}
		
		canvaspoints.push(new CanvasPoint( relativepoints[i]))
	}
		
	//ensure the very last relativepoint gets used, to make it seamless with the floor.
	if(i!=relativepoints.length-1)
	{
		canvaspoints.push(new CanvasPoint( relativepoints[relativepoints.length-1]))
	}

	namesp.canvaspoints = canvaspoints
	
	//return { canvaspoints: canvaspoints, minmaxes: minmaxes,};  //set it in the global namespace for the draw functions.
}



//Generate a point object. 
//Calculate and store the location of the person and coin at t = time,
//given the rotation rate and coin's slope.
// Start with a coordinate system where (0,0) is the center of rotation
// and (0, -radius) is where the person started.

// Translate this to a new coordinate system where the moving person's feet
// are at (0,0) wherever the person is. 
// Find the coin's distance relative to the person's feet oriented "upward."
// The important output variables are x_rel and y_rel. The math stays oriented
// about the origin until that point.
function RelativePoint( time, radius, omega, startheight, start_v_x, start_v_y)
{
		//solve for the location of the person and the coin.


		//person's current angle on the unit circle (like most coordinate systems)
		// from 0 degrees at horizontal-right (angle horizontal-origin-person)
		//calculated by subtracting swept angle from 3PI/2 or 270 degrees (start).
	var angle_hop = (3* Math.PI / 2) - (omega * time) 

	while(angle_hop > 2*Math.PI)
	{ angle_hop -= 2*Math.PI; } //if the person circles more than once, 
								//then simplify this a little :-)
		
	
	var x_person = radius * Math.cos(angle_hop)  //x from rotation origin
	var y_person = radius * Math.sin(angle_hop)  //y from rotation origin

		//simple physics. At t=0, x=0 so this is easy.
	var x_coin = start_v_x * time  

		//Doesn't start from zero. Usually starts from point (0,-21)
	var y_coin = start_v_y * time - ( radius - startheight)	
	
		
	//now translate it to a relative point
	var x_diff = x_coin - x_person		//difference is positive if the 
	var y_diff = y_coin - y_person		//coin is up and to the right of person
	
	//distance from person's foot to coin
	var persontoCoin = Math.sqrt( Math.pow( (y_diff), 2) + Math.pow( (x_diff), 2) )
	
	
		 //angle coin-person-horizontalright (horizontal at person's feet)
		 //with coordinate system about the center of rotation
		 //and the person is still moving
	var angle_cph
	
	//angle origin-person-horizontalright  (origin = center of rotation)
	var angle_oph = Math.atan(y_person/x_person)

	var angle_cpo //angle coin-person(feet/floor)-origin
	var x_rel
	var y_rel
	
	if(y_diff>0) //if the coin is currently above the person's feet...(usually true)
	{		
				//coin-person-horizontalright
				//(subtract 90deg - angle_vertical_person_coin
			//note, the coin actually starts to the right
			//and shifts to the left of the person.
			//when it is to the left, x_diff and atan() are negative
			//(hence the subtraction from 90)
		angle_cph = (Math.PI /2) - Math.atan(x_diff / y_diff)

			//coin-person-origin
		angle_cpo = (angle_cph - angle_oph)

		//coin's distance from person's feet, tangent to the floor
		x_rel = -1 * persontoCoin * Math.sin(angle_cpo)
	}
	else{   	//the coin is below the person's feet
		
		if(x_diff>0)  //coin is below to the right 
					  //(will be true in most cases when below)
		{			  // (e.g. coin is less negative / less leftward)
			//coin-person-horizontalright. -1 b/c xdiff is pos and ydiff is neg,
			//so atan will give negative number, which we don't want.
			angle_cph = -1 * Math.atan(y_diff / x_diff)
		}
		else   //scenario where the coin is to the left of the person 
			//but "below" them (person has looped halfway around/is on top?)
		{	
				//coin-person-verticaldown + 90deg = coin-person-horiz.right
				//xdiff is neg and ydiff is neg, atan gives positive number
			angle_cph = Math.atan(x_diff / y_diff) + (Math.PI / 2)
		}   	//note, if person is on top, their angle_oph will be neg
				//because x_person is neg and y_diff is pos 
				//so the next step will be a subtraction
		
		angle_cpo = (angle_cph + angle_oph)
				//is actually a subtraction if the person is in quadrant 2
				//because oph will be negative due to atan(neg)
		
		x_rel = persontoCoin * Math.sin(angle_cpo)

	}
	
	
	//height above person relative to line from person to origin.
	y_rel = persontoCoin * Math.cos(angle_cpo)
	
	//rare case if the person traverses an entire half-arc (in quadrant 1 or 4)
	//you have to be really playing with the model to get this
	if(x_person>0)
	{
		x_rel = x_rel*-1
		y_rel = y_rel*-1
	}
		
	this.persontoCoin = persontoCoin
	this.x = x_rel
	this.y = y_rel
	this.time = time
	//this.x_diff = x_diff
	//this.y_diff = y_diff
	//this.angle_cph = angle_cph
	//this.angle_oph = angle_oph
	//this.angle_cpo = angle_cpo
}


//Generate point coordinates with respect to the canvas
//where (0,0) is the top-left of the drawing area.
//Adjust for all of my buffers/shifts and adjustments (1px does not equal 1 foot!)
function CanvasPoint( x, y) {
	//canvasPoint can accept either X and Y coordinates or a RelativePoint.
	
	var minmaxes = namesp.minmaxes;
	var dimensions = namesp.dimensions;
	
	if(!(typeof x=="number"))
	{ /*dimensions = y;*/ y = x.y; x=x.x; }
	
	//Place the smallest x value on path to be drawn all the way to the left.
	//Then divide by range, and multiply by canvas size (so adjusted to canvas)
	//Then add the X_BUFFER to buffer a bit of space from left side
	//the offsetX centers the drawing on the page when tall and skinny
	//(otherwise, despite all the buffers it will be smashed to the left)
	
	var canvasX = ((((x - minmaxes.minX) / minmaxes.range) * minmaxes.canvasSize) + minmaxes.offsetX) + dimensions.X_BUFFER
	var canvasY = dimensions.DRAWING_HEIGHT - (( y / minmaxes.range ) * minmaxes.canvasSize ) + dimensions.Y_BUFFER
	
	this.x = canvasX;
	this.y = canvasY;
}

//calculate the min and max values for the displayed canvas.
function minmax(pointlist, dimensions) {
	
	//Ensure, that if these max values are not reached, that
	//these are set to the maxes (otherwise it will find a greater value)
	var minX=pointlist[0].x  //a good starting value is the first one in the list.

	var maxX=pointlist[0].x 
	var maxY
	if(dimensions.units=="ft")
	{	if(pointlist[0].x < 1)
		{ maxX = 1 }

		maxY=6 	
	}
	else
	{	if(pointlist[0].x < 1)
		{ maxX = 0.3048 }

		maxY = 1.829  //meters 
	}



	var minY=0 //definitely need to show the original floor. Include y=0 in the range!

	//the coin toss assumes a 6-ft person :-)
	//I'd ideally like to put that person into the window.
	
	//Iterate through the given point list to find the min and max values
	//(assuming it supercedes the values I initialized above)
	for(var i=0; i<pointlist.length; i++)
	{
		if(pointlist[i].x < minX)
		{ minX = pointlist[i].x }

		if(pointlist[i].x > maxX)
		{ maxX = pointlist[i].x }

		if(pointlist[i].y < minY)
		{ minY = pointlist[i].y }

		if(pointlist[i].y > maxY)
		{ maxY = pointlist[i].y }
	}
	
	var rangeX = Math.abs(maxX - minX)
	var rangeY = Math.abs(maxY - minY)
	var range
	if(rangeX > rangeY)
	{ range = rangeX }
	else
	{ range = rangeY }
	
	//Ensures the scale stays proportional if height/width are adjusted differently.
	var canvasSize
	if(dimensions.DRAWING_WIDTH/dimensions.DRAWING_HEIGHT < rangeX/rangeY)
	{	canvasSize = dimensions.DRAWING_WIDTH 	}
	else
	{ 	canvasSize = dimensions.DRAWING_HEIGHT  }
	
	
	var offsetX = (dimensions.DRAWING_WIDTH - (rangeX / range) * canvasSize) / 2

	/*
	//(counteract the side menu somewhat)
	if(dimensions.menuRightOpen && dimensions.menuLeftOpen)
	{			} //do nothing
	else if(dimensions.menuLeftOpen && dimensions.width < 900 && rangeY/rangeX<=10)
	{		offsetX *= 2;  	}  //offsetX *= (7/4);
	else if(dimensions.menuRightOpen && dimensions.width < 900 && rangeY/rangeX<=10)
	{		offsetX = 0;  	}  //offsetX *= (1/4);
	else if(dimensions.menuLeftOpen && dimensions.width < 900 && rangeY/rangeX > 10)
	{		offsetX *= (7/4);	}
	else if(dimensions.menuRightOpen && dimensions.width < 900 && rangeY/rangeX > 10)
	{		offsetX *= (1/4);	}
	else if(dimensions.menuLeftOpen && dimensions.width >= 900)
	{		offsetX *= (3/2); 	}
	else if(dimensions.menuRightOpen && dimensions.width >= 900)
	{		offsetX *= (1/2); 	}
	*/
	
	//used to know which way the silhouette should face :-).
	//DIFFERENT than the directionleft in crunch numbers...
	var directionLeft=true; //true means silhouette is facing left
	if(pointlist.length>10) //sometimes it is only one point. Don't want it to crash.
	{ 	
		var point_difference=pointlist[10].x-pointlist[0].x
		if( point_difference > 1e-4)  //either very small or positive (to the right)
		{ directionLeft=false; }
	}
	
	var minmaxes = { minX: minX,
				 maxX: maxX,
				 minY: minY,
				 maxY: maxY,
				 range: range, //only one variable for range, to keep x proportional with y.
				 canvasSize: canvasSize,
			 	 pxperfoot: canvasSize / range,
				 directionLeft: directionLeft,
				 offsetX: offsetX,
				 rangeX: rangeX,
				 rangeY: rangeY,
	}

	return minmaxes
	

}



//Custom circle-drawing function to render the station floor.

//depending on the parameters, the station could be HUGE, or very small.
	//If it's huge, I don't want to render the entire floor. Too big!
	//If it's small, I DO want to render the entire floor.
	
//I felt that it would be easier to keep it proportional by doing this
		//together with my canvaspoint()'s,
//rather than simply using the context.arc() function.
function draw_floor(ctx, radius)
{
	var minmaxes = namesp.minmaxes;
	var dimensions = namesp.dimensions;
	
	const floor_color = "#007acc"
	const floor_width = 6
	//const space_color = "#9e9e9e"
	const station_color = "white"

	ctx.lineWidth=floor_width;
	ctx.strokeStyle=floor_color;
	ctx.fillStyle=station_color;
	
	
	var factor = 2
	if(dimensions.DRAWING_WIDTH/dimensions.DRAWING_HEIGHT > (minmaxes.rangeX/minmaxes.rangeY) / 4)
	{	factor=5  }  //if the canvas is four times wider than the proportions of the throw
	
	var toconvert = factor * minmaxes.range / radius
	var values
	
	//Double-check here that I'm using valid values for the arc-cosine.
	var floor_start
	var floor_end
	if(toconvert < 1)
	{
		floor_start = Math.acos( toconvert )
		floor_end = Math.acos( -1 * toconvert )
	}
	else{
		floor_start = 0
		floor_end = Math.PI
	}
	
	
	var arc = floor_end - floor_start

	var x
	var y
	var i
	var bottomcurve = [] //points for bottom half of circle
	
	//remember canvaspoint wants the distance from the person's feet.
	//And I'm only feeding in angles from 0 to PI, which is why the -1 on y
	for(i=floor_start; i<floor_end; i+=arc/100)
	{	
		x = radius * Math.cos(i)
		y = -1 * radius * Math.sin(i) + radius //-1, bottom arc!
		values = new CanvasPoint( x, y)
		bottomcurve.push(values)
	}

	//once more AT floor_end, so there won't be a break if I render the top.
	x = radius * Math.cos(floor_end)
	y = -1 * radius * Math.sin(floor_end) + radius //-1, bottom arc!
	values = new CanvasPoint( x, y)
	bottomcurve.push(values)


	//if the top of the station is close to actually appearing, then render it.
	x=radius*Math.cos(0)
	y=radius*Math.sin(0) + radius
	values = new CanvasPoint( x, y)
	if(values.y>-50)
	{
		//generate points for top curve
		var topcurve = []
		for(i=floor_end; i>floor_start; i-=arc/100) //the reverse direction!
		{	
			x = radius * Math.cos(i)
			y = radius * Math.sin(i) + radius //+1, top arc!
			values = new CanvasPoint( x, y)
			topcurve.push(values)
		}
		
		//START by filling outer-space around the curve!
		ctx.beginPath()

		ctx.moveTo(bottomcurve[0].x, bottomcurve[0].y)
		
		for(i=1; i<bottomcurve.length; i+=1)
		{
			ctx.lineTo(bottomcurve[i].x, bottomcurve[i].y)
		}
		
		//ctx.moveTo(topcurve[0].x, topcurve[0].y)
		
		for(i=0; i<topcurve.length; i+=1)
		{
			ctx.lineTo(topcurve[i].x, topcurve[i].y)
		}

		ctx.closePath()
		ctx.fill()
		ctx.stroke()
	}
	else //no top curve
	{
		//START by filling outer-space around the curve!
		ctx.beginPath()
		ctx.moveTo(bottomcurve[0].x, bottomcurve[0].y)
		
		for(i=1; i<bottomcurve.length; i+=1)
		{
			ctx.lineTo(bottomcurve[i].x, bottomcurve[i].y)
		}
		
		i-=1; //set i=last element to make this less tedious
		if(bottomcurve.length>0)
		{
			//create a box around the top of the screen.
			ctx.lineTo(-1 * floor_width, -1 * floor_width);
			ctx.lineTo(dimensions.width+floor_width, -1 * floor_width);
			ctx.closePath()
			ctx.fillStyle=station_color;
			ctx.fill()
		}
		
		ctx.stroke()
		
	}
	

	//reset the stroke
	ctx.lineWidth=1;	
	ctx.strokeStyle="#000000";
	ctx.fillStyle="#000000";
}


export default CanvasSpace;

