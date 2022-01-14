/*eslint-disable eqeqeq*/
//this at the top prevents the console from displaying pointless warnings.


//The code has been simplified somewhat in the CanvasSpace.js page
//in ways that I have not duplicated here. Some comments in that file
//may explain how it works here as well.
//This file still functions the same as that one in most ways.

//Flow:
	//ComponentDidMount --> LoadImage --> UpdateCanvasSize --> setState --> shouldComponentUpdate --> componentDidUpdate --> setDimensions, draw the canvas, etc
//When props change, the flow begins at componentDidUpdate, which decides how much of the canvas to rerender, and rerenders it.


import React, { Component } from 'react';
import './App.css';
//import ReactDOM from 'react-dom'
import imagefile from './img/silhouette.png'
import image2 from './img/silhouette2.png'

//If ResizeObserver isn't supported to my liking...
//then there is react-resize-observer import which could do the same thing.


var timeouts = {
	movetimeout: null,
	repeattimeout : null,
	sourceready: false,
	delayrefresh: null,
}

//I created a namespace, because I don't want to post to state and then have the component refresh more than necessary. So this is in lieu of changing the state.
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

class CanvasEarth extends Component {
	
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
		
		//necessary to capture the context for the canvas
		this.parentDiv = React.createRef();
		this.earthCanvasRef = React.createRef();
		
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
		canvasElement = this.earthCanvasRef.current;

		if("ResizeObserver" in window)
		{ this.observe(ResizeObserver);	
		  this.resizeObserver.observe(canvasParent);
		} 
		else { window.addEventListener('resize', () => { this.updateCanvasSize(); });}
		//If no ResizeObserver, then the browser doesn't shift for the burger menu.
		//But ResizeObserver has wide support :-)

		this.loadImage() //calls updateCanvasSize when image is ready
						//(otherwise image won't render at start)
						//which then updates state, triggering draw onto canvas
						//in componentDidUpdate
	}

	
	loadImage()
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
	
	/*onImageLoaded()
	{
		//this.setState({sourceReady:true});
		this.updateCanvasSize()		
	}*/
	
	updateCanvasSize() //called by window resize event
	{
		const width = (canvasParent.clientWidth)
		const height = (canvasParent.clientHeight)
		this.setState({ width:width, height:height })
		
	}
	

	setDimensions()
	{
		//let canvas = this.earthCanvasRef.current;
		//let canvas = ReactDOM.findDOMNode(this.earthCanvasRef.current);
		let ctx = canvasElement.getContext('2d');
		
		var dimensions = {}
		dimensions.units = this.props.vars.units
		dimensions.width = ctx.canvas.clientWidth;
		dimensions.height = ctx.canvas.clientHeight;
		
		//Buffers used to scale the person in the middle appropriately
		dimensions.X_BUFFER = dimensions.width/8;
		dimensions.Y_BUFFER = dimensions.height/10;
		dimensions.DRAWING_WIDTH = dimensions.width - 2 * dimensions.X_BUFFER;
		dimensions.DRAWING_HEIGHT = dimensions.height - 2 * dimensions.Y_BUFFER;
		dimensions.DELAY_BETWEEN_DRAWS = 2.5;
		dimensions.menuLeftOpen = this.props.vars.menuLeftOpen;
		dimensions.menuRightOpen = this.props.vars.menuRightOpen;
		dimensions.defaultheight = this.props.defaults.startheight;

		//the bounds of the filled in white box
		dimensions.leftside = dimensions.width * -.05
		dimensions.rightside = dimensions.width * 1.05
		dimensions.topside = dimensions.height * -.05
		dimensions.bottomside = dimensions.height * .77
		
		/*if the menu is open, give the drawing more space*/
		/*if(dimensions.width < 900 && (dimensions.menuLeftOpen || dimensions.menuRightOpen))
		{ dimensions.X_BUFFER /= 2; }*/
		
		if(dimensions.height < 300)	   //somehow, counterintuitively,
		{ dimensions.Y_BUFFER /= 1.5 } //shrinking it improved the scalemarks.
			
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
			{ return false; }
		else{ return true; 	}
	}		
		
	
	//calculates *how much* of the canvas it needs to re-render
	//based on what changed.
	componentDidUpdate(prevProps, prevState)
	{
		
		if(		this.props.vars.startheight!==prevProps.vars.startheight ||
				this.props.vars.speed!==prevProps.vars.speed ||
				this.props.vars.units!==prevProps.vars.units)
		{
			this.setDimensions()
			this.update_all_points()
			this.draw_canvas_full()
		}
		else if( (prevProps.vars.percenttime > 20 && this.props.vars.percenttime < 20) ||
			(prevProps.vars.percenttime > 50 && this.props.vars.percenttime < 50) )
		{
			var oldlength = namesp.canvaspoints.length;
			this.update_all_points()
			namesp.currentframe = Math.floor((namesp.currentframe / oldlength) * namesp.canvaspoints.length); //
			this.draw_canvas_partial()
		}
		/*else if(prevProps.vars.percenttime !== this.props.vars.percenttime)
		{  //removed b/c what if you change the percenttime as well as something else? It glitches.
			this.restart_interval()
		}*/
		else if( (this.props.vars.menuLeftOpen!==prevProps.vars.menuLeftOpen) || (this.props.vars.menuRightOpen!==prevProps.vars.menuRightOpen))
		{
			this.setDimensions()
			this.update_canvaspoints() //only need to update canvaspoints
			this.draw_canvas_partial()
		}
		else if( ((this.state.width !== prevState.width) || (this.state.height !== prevState.height)) && namesp.relativepoints!=null )
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
	}

	update_canvaspoints()
	{
		var resources = getCanvaspoints(namesp.relativepoints, namesp.dimensions)//, this.props.vars.time, this.props.vars.percenttime);
		namesp.canvaspoints = resources.canvaspoints
		namesp.minmaxes = resources.minmaxes
	}
	
	update_all_points()
	{
		var relativepoints = getRelativepoints(this.props.vars.expectedtime, this.props.vars.startheight, this.props.vars.percenttime, this.props.defaults.accel_earth, this.props.vars.speed, this.props.vars.anglefromVertical)
				
		var resources = getCanvaspoints(relativepoints, namesp.dimensions)//, this.props.vars.time, this.props.vars.percenttime);

		namesp.relativepoints = relativepoints
		namesp.canvaspoints = resources.canvaspoints
		namesp.minmaxes = resources.minmaxes
		namesp.lastpoint = relativepoints[relativepoints.length-1]
	}
	
	restart_interval() //for adjustments in percent time (playback speed) only. Restarts the interval without resetting the canvas.
	{
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;

		//let canvas = this.earthCanvasRef.current;
		//let canvas = ReactDOM.findDOMNode(this.earthCanvasRef.current);
		let ctx = canvasElement.getContext('2d');

		var silhouette

		if(this.props.vars.startheight===this.props.defaults.startheight)
		{	silhouette=this.silhouette		}
		else
		{ 	silhouette=this.silhouette2 	}		
		
		if(!this.props.vars.frozen)
		{	draw_curve_active(ctx, this.props.vars.expectedtime, this.props.vars.percenttime, /* this.props.vars.radius,  */silhouette, this.props.vars.startheight, namesp.currentframe)	}
	}
	
	draw_canvas_partial()
	{
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;
		
		//let canvas = this.earthCanvasRef.current;
		//let canvas = ReactDOM.findDOMNode(this.earthCanvasRef.current);
		let ctx = canvasElement.getContext('2d');
		
		var silhouette

		if(this.props.vars.startheight===this.props.defaults.startheight)
		{	silhouette=this.silhouette		}
		else
		{ 	silhouette=this.silhouette2 	}
	
		reset_canvas(ctx, /* this.props.vars.radius,  */namesp.minmaxes, namesp.dimensions, namesp.lastpoint, silhouette, this.props.vars.startheight);
		if(this.props.vars.frozen) // || this.props.vars.percenttime === 0)
		{
			draw_curve_static(ctx, namesp.canvaspoints, namesp.dimensions)
		}
		else
		{
			draw_curve_static(ctx, namesp.canvaspoints.slice(0,namesp.currentframe), namesp.dimensions, "nocircle")
			draw_curve_active(ctx, this.props.vars.expectedtime, this.props.vars.percenttime, /* this.props.vars.radius,  */silhouette, this.props.vars.startheight, namesp.currentframe)
			//Passing the currentframe from the namespace signals it to refresh from that point.
		}
	}
	
	draw_canvas_full()
	{
		namesp.currentframe=1

		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;		
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
		
		//let canvas = this.earthCanvasRef.current;
		//let canvas = ReactDOM.findDOMNode(this.earthCanvasRef.current);
		let ctx = canvasElement.getContext('2d');
		
		var silhouette

		if(this.props.vars.startheight===this.props.defaults.startheight)
		{	silhouette=this.silhouette		}
		else
		{ 	silhouette=this.silhouette2 	}

		
		if(this.props.vars.frozen)
		{
			
			reset_canvas(ctx, /* this.props.vars.radius,  */namesp.minmaxes, namesp.dimensions, namesp.lastpoint, silhouette, this.props.vars.startheight);
			draw_curve_static(ctx, namesp.canvaspoints, namesp.dimensions)
		}
		else
		{
			draw_curve_active(ctx, this.props.vars.expectedtime, this.props.vars.percenttime, /* this.props.vars.radius,  */silhouette, this.props.vars.startheight) //also resets the canvas.
		}
	}
	
	
	
	
	render() {

		return (
			<div
				ref={this.parentDiv}
				className="canvasParent"
				style={{width:'100%',height:'100%', position:'absolute', background:'#853f03'}}>
					<canvas
						ref={this.earthCanvasRef} 
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



function getRelativepoints(time, startheight, percenttime, accel_earth, speed, angle)
{
	
	var absolutepointslist = []
		
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
	
	var absolutePoint
	

	//remember, sine and cosine are backwards from what you think since it's the angle from vertical, not from horizontal
	//also, must be converted to radians
	var start_v_x = speed * Math.sin(angle * Math.PI / 180)
	var start_v_y = speed * Math.cos(angle * Math.PI / 180)
	
	var t
	for(t=0; t<=Number(time); t+=time_increment)
	{
		absolutePoint = new AbsolutePoint( t, Number(startheight), Number(start_v_x), Number(start_v_y), accel_earth)
		absolutepointslist.push(absolutePoint)
	}
	
	//do it once more at t = time.
	absolutePoint = new AbsolutePoint( Number(time), Number(startheight), Number(start_v_x), Number(start_v_y), accel_earth );
	absolutepointslist.push( absolutePoint );	
	
	return absolutepointslist
	
}



function draw_curve_static(ctx, canvaspoints, dimensions, nocircle)
{
	
	if(timeouts.repeattimeout!=null)
	{	
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
	}

	//draw a little circle where the coin *started*.
	ctx.lineWidth=2
	ctx.beginPath();
	ctx.strokeStyle="#5c6870";
	ctx.arc(canvaspoints[0].x+dimensions.X_BUFFER, canvaspoints[0].y+dimensions.Y_BUFFER,5,0,2*Math.PI);
	ctx.stroke();
	
	//now render all of the canvaspoints for the coin's calculated path.
	ctx.beginPath();
	ctx.strokeStyle="#000000";
	ctx.moveTo(canvaspoints[0].x+dimensions.X_BUFFER, canvaspoints[0].y+dimensions.Y_BUFFER);
	
	for(var i=1; i<canvaspoints.length; i++)
	{		
		ctx.lineTo(canvaspoints[i].x+dimensions.X_BUFFER, canvaspoints[i].y+dimensions.Y_BUFFER)
	}
	
    ctx.stroke();
	
	//draw a little circle where the coin *ended*.
	if(typeof nocircle === 'undefined') //prevents an extra circle on window resize
	{
		ctx.beginPath();
		ctx.strokeStyle="#5c6870";
		ctx.arc(canvaspoints[canvaspoints.length-1].x+dimensions.X_BUFFER, canvaspoints[canvaspoints.length-1].y+dimensions.Y_BUFFER,5,0,2*Math.PI);
		ctx.stroke();
		ctx.strokeStyle="#000000";
	}
}


function draw_curve_active(ctx, time, percenttime, /* radius,  */silhouette, startheight, currentframe)
{
	var canvaspoints = namesp.canvaspoints
	var dimensions = namesp.dimensions
	var minmaxes = namesp.minmaxes
	var lastpoint = namesp.lastpoint
	
	if(timeouts.repeattimeout!=null)
	{	
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout=null;
		clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
	}
		
	if(currentframe==null)
	{
		reset_canvas(ctx, /* radius,  */minmaxes, dimensions, lastpoint, silhouette, startheight);
		namesp.currentframe=1;
		
		//draw a little circle where the coin *started*.
		ctx.lineWidth=2
		ctx.beginPath();
		ctx.strokeStyle="#5c6870";
		ctx.arc(canvaspoints[0].x+dimensions.X_BUFFER, canvaspoints[0].y+dimensions.Y_BUFFER,5,0,2*Math.PI);
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
	//and they will not interfere with each other.
	function moveline() {
		if(namesp.currentframe>=canvaspoints.length)
		{  
			clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;
			//necessary so you don't have to wait forever
			//if you adjusted the percent time mid-draw.

			timeouts.repeattimeout = setTimeout(function() {
				draw_curve_active(ctx, time, percenttime, /* radius,  */silhouette, startheight); }, dimensions.DELAY_BETWEEN_DRAWS * 1000);

			//draw a little circle where the coin *ended*.
			ctx.beginPath();
			ctx.strokeStyle="#5c6870";
			ctx.lineWidth=2
			ctx.arc(canvaspoints[canvaspoints.length-1].x+dimensions.X_BUFFER, canvaspoints[canvaspoints.length-1].y+dimensions.Y_BUFFER,5,0,2*Math.PI);
			ctx.stroke();
			ctx.strokeStyle="#000000";					

			return; 
		}

		ctx.beginPath();
		ctx.moveTo(canvaspoints[namesp.currentframe-1].x+dimensions.X_BUFFER, canvaspoints[namesp.currentframe-1].y+dimensions.Y_BUFFER);
				
		for(var x=0; x<pointsperframeactual; x++)
		{
			if(namesp.currentframe>=canvaspoints.length)
			{  
				clearTimeout(timeouts.movetimeout); timeouts.movetimeout=null;	
				//necessary so you don't have to wait forever
				//if you adjusted the percent time mid-draw.
				ctx.stroke();

				timeouts.repeattimeout = setTimeout(function() {
					draw_curve_active(ctx, time, percenttime, /* radius,  */silhouette, startheight); }, dimensions.DELAY_BETWEEN_DRAWS * 1000);
					
				//draw a little circle where the coin *ended*.
				ctx.lineWidth=2
				ctx.beginPath();
				ctx.strokeStyle="#5c6870";
				ctx.arc(canvaspoints[canvaspoints.length-1].x+dimensions.X_BUFFER, canvaspoints[canvaspoints.length-1].y+dimensions.Y_BUFFER,5,0,2*Math.PI);
				ctx.stroke();
				ctx.strokeStyle="#000000";					
								
				return; 
			}

			ctx.lineTo(canvaspoints[namesp.currentframe].x+dimensions.X_BUFFER, canvaspoints[namesp.currentframe].y+dimensions.Y_BUFFER)
			
			namesp.currentframe+=1;
		}
		ctx.stroke();

		if(namesp.currentframe<=canvaspoints.length)
			{timeouts.movetimeout = setTimeout(moveline, time_delay_in_ms)}
	};

	timeouts.movetimeout = setTimeout(moveline, time_delay_in_ms);
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
function scalemark(spot, minmaxes, value, dimensions)
{
	//mark size 10px, means 5px above and below ground
	//subtract the proper number of feet-per-pixel
	var x = spot
		
	var y1 = 5 / minmaxes.pxperfoot //top 
	var y2 = -5 / minmaxes.pxperfoot //bottom
	
	this.start = new CanvasPoint(minmaxes, x, y1, dimensions)
	this.end = new CanvasPoint(minmaxes, x, y2, dimensions)
	
	this.spot=spot
	
	var length = value.toString().length;
	var canvasX3 = this.end.x - length*4
	var canvasY3 = this.end.y + 15
				//the draw coord starts from the bottom. adjust for that.
				//the more "up" on the circle, the more it matters.
				
	this.numberspot = {x : canvasX3, y : canvasY3}
	this.value = value
}



function draw_scale(ctx, minmaxes, dimensions, lastpoint)
{
	
	const scale_color = "#9dfcdb"
		
	var start = 0;
	
	//show the scale in both directions! 
	//If the coin goes the other way, then display the scale the other way.

	if(lastpoint.x < 1e-10 && lastpoint.x > -1e-10)
	{
		lastpoint.x = 0;
	}

	var end = lastpoint.x
	
	//Match the scale to the canvas. Calculate arc-per-foot, px-per-foot.
	//Or METERS...the math works out the same. I'm not changing variable names.
	//arcperfoot is the variable actually used to calculate tic locations.
	//Pxperfoot is used to generate a scale range that would actually be
	//human-interpretable.
	//var arc_per_foot = 1 / radius
	
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
	if(increment.toString().length >= 3 )
	{	while(minmaxes.pxperfoot*increment<45)
		{
			increment = increaseval.run(increment);
		}
	}

	var i=0;
	
	if(end===0)
	{
		start = -increment
		end = increment

		i -= increment		
	}

	//generate the locations for the tic marcks, 
	//up to the end spot plus one tic.
	//coded for both a positive arc and a negative arc, depending
	//which way the coin went.
	
	var scalemarks = [];
	var a
	if(lastpoint.x < 0)
	{
		//incrementing over an angle, so I called it a for angle.
		for(a=start; a>end-increment; a-=increment) //-increment to give an extra tic
		{
			scalemarks.push(new scalemark(/*radius,*/ a, minmaxes, i, dimensions) )
			i+=increment;
		}
	}
	else
	{
		for(a=start; a<end+increment; a+=increment)
		{
			scalemarks.push(new scalemark(/*radius,*/ a, minmaxes, i, dimensions) )
			i+=increment;
		}
	}
	
	if(scalemarks.length===2)
	{
		var angle=((scalemarks[1].angle - start) * -1) + start
		scalemarks.push(new scalemark(/*radius,*/ angle, minmaxes, scalemarks[1].value, dimensions) )
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
		ctx.moveTo(mark.start.x+dimensions.X_BUFFER, mark.start.y+dimensions.Y_BUFFER)
		ctx.lineTo(mark.end.x+dimensions.X_BUFFER, mark.end.y+dimensions.Y_BUFFER)
		ctx.fillText(mark.value.toString(), mark.numberspot.x+dimensions.X_BUFFER, mark.numberspot.y+dimensions.Y_BUFFER);
	}
	ctx.stroke()
	
}



//erase canvas, draw the floor, and draw the scale if applicable.
function reset_canvas(ctx, /* radius,  */minmaxes, dimensions, lastpoint, silhouette, startheight) {
	
	ctx.clearRect(0, 0, dimensions.width, dimensions.height);
	
	draw_floor(ctx, minmaxes, dimensions)	
	
	draw_scale(ctx, minmaxes, dimensions, lastpoint)

	if(silhouette!=null)
	{ draw_silhouette(ctx, silhouette, minmaxes, dimensions, dimensions.defaultheight);  }
	
	if( startheight !== dimensions.defaultheight )
	{   canvas_arrow(ctx, minmaxes, dimensions, startheight); 	}
	
	
}

function canvas_arrow(ctx, minmaxes, dimensions, startheight) {	
    
	var origin = new CanvasPoint(minmaxes, 0, 0, dimensions)
	var start = new CanvasPoint(minmaxes, 0, startheight, dimensions)

	var fromx = origin.x + dimensions.X_BUFFER
	var fromy = origin.y + dimensions.Y_BUFFER
	var tox = start.x + dimensions.X_BUFFER
	var toy = start.y + dimensions.Y_BUFFER + 7 //+7 so it's not dwarfing the coin.
	
	var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
	
	var pxheight = fromy - toy
	if(pxheight > 15)
	{
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
	}
}

function draw_silhouette(ctx, silhouette, minmaxes, dimensions, startheight)
{
	//drawing is dimensions [323,831] (width, height).
	//Need the spot (24, 539) (from bottom) to cooincide
		//with *relative* coordinate (0,4), aligned to the canvas.

	//var footbuffer = 2
	
	var origin = new CanvasPoint(minmaxes, 0, 0, dimensions)
	var px_startheight = minmaxes.pxperfoot * startheight
	var numpixtotop = (px_startheight * 830/539)
	var drawing_top = origin.y - numpixtotop
	var px_width = numpixtotop * 323/831
	var px_offset_left = px_width * 24/323
	
	var drawing_left
	if(minmaxes.directionLeft)
	{
		drawing_left = origin.x - px_offset_left	
		drawImage(ctx, silhouette, drawing_left + dimensions.X_BUFFER, drawing_top + dimensions.Y_BUFFER, px_width, numpixtotop);
	}
	else
	{
		drawing_left = origin.x + px_offset_left
		drawImage(ctx, silhouette, drawing_left + dimensions.X_BUFFER-px_width, drawing_top + dimensions.Y_BUFFER, px_width, numpixtotop, 0, true);
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
function getCanvaspoints(relativepoints, dimensions)//, time, percenttime) 
{
	
	var minmaxes = minmax(relativepoints, dimensions)
	
	var canvaspoints = []
	
	//generate HTML canvas coordinates.
	//Will select a variable number based on the "percent speed" selected.
	//(it won't use all of the relativepoint()'s)
	var i=0;
	//var interval = relativepoints.length / numpoints
	for(var inc=0; inc<relativepoints.length; inc+=1) //interval)
	{
		i=Math.ceil(inc)
		if(i>=relativepoints.length)
		{
			break;
		}
		
		canvaspoints.push(new CanvasPoint(minmaxes, relativepoints[i], dimensions))
	}
		
	//ensure the very last relativepoint gets used, to make it seamless with the floor.
	if(i!=relativepoints.length-1)
	{
		canvaspoints.push(new CanvasPoint(minmaxes, relativepoints[relativepoints.length-1], dimensions))
	}

	
	return { canvaspoints: canvaspoints, minmaxes: minmaxes,};  //set it in the global namespace for the draw functions.
}


//Calculate and store the location of the coin at t = time
function AbsolutePoint( time, startheight, start_v_x, start_v_y, accel_earth)
{

	var x_coin = start_v_x * time	
	var y_coin = startheight + (start_v_y * time) + ((-1/2) * accel_earth * time * time) //basic kinematics formula. -1/2 because accel is downward.
	this.time = time
	this.x = x_coin
	this.y = y_coin
	
}

//Generate point coordinates with respect to the canvas.
function CanvasPoint(minmaxes, x, y, dimensions) {
	//canvasPoint can accept either X and Y coordinates or a RelativePoint.
	
	//sometimes the function gets called with three variables instead of four.
	//In that case, x is a point with x and y attached, and "y" is dimensions.
	if(!(typeof x=="number"))
	{ dimensions = y; y = x.y; x=x.x; }
	
	
	var zeroY = namesp.dimensions.bottomside
	var testY = namesp.dimensions.DRAWING_HEIGHT - 0
		
	var fixBottom = zeroY - testY	
	
	var canvasX = (((x - minmaxes.minX) / minmaxes.range) * minmaxes.canvasSize) + minmaxes.offsetX
	var canvasY = dimensions.DRAWING_HEIGHT - (( y / minmaxes.range ) * minmaxes.canvasSize ) + fixBottom
	
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

	/*					//more annoying than helpful
	//(counteract the side menu somewhat)
	if(dimensions.menuRightOpen && dimensions.menuLeftOpen)
	{			}  //do nothing
	else if(dimensions.menuLeftOpen && dimensions.width < 900 && rangeY/rangeX<=10)
	{		offsetX *= 2;  	}
	else if(dimensions.menuRightOpen && dimensions.width < 900 && rangeY/rangeX<=10)
	{		offsetX = 0;   	}
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
	var directionLeft=true;
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
function draw_floor(ctx, minmaxes, dimensions)
{

	const floor_color = "#318503"
	const floor_width = 6
	const station_color = "white"

	ctx.lineWidth=floor_width;
	ctx.strokeStyle=floor_color;
	ctx.fillStyle=station_color;	
	
		
		//START by filling outer-space around the curve!
		ctx.beginPath()
				
		ctx.moveTo(dimensions.leftside,dimensions.bottomside + dimensions.Y_BUFFER)
		ctx.lineTo(dimensions.rightside,dimensions.bottomside + dimensions.Y_BUFFER)
		ctx.lineTo(dimensions.rightside,dimensions.topside)
		ctx.lineTo(dimensions.leftside, dimensions.topside)
		ctx.lineTo(dimensions.leftside,dimensions.bottomside + dimensions.Y_BUFFER)


		ctx.closePath()
		ctx.fill()
		ctx.stroke()
}


export default CanvasEarth;