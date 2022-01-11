//The main page for my Coriolis model

import React, { Component } from 'react';
import './App.css';

import { slide as Menu } from 'react-burger-menu'
import CanvasEarth from './CanvasEarth'
import CanvasSpace from './CanvasSpace'
import PlayBack from './PlayBack'
import { crunchnumbers } from './crunchnumbers.js'
import { processQueryVariables } from './processQueries.js'
import OutputMenu from './OutputMenu.js'

import LeftMenu from "./LeftMenu"
import Gallery from "./gallery.json"

//If ResizeObserver isn't supported to my liking...
//then there is react-resize-observer import which could do the same thing,
//perhaps even more simply. 
//But I liked the idea of using a browser function 
//instead of installing a new component.
//Code I used to implement ResizeObserver:
//https://seesparkbox.com/foundry/using_react_custom_hook


		//article url is global so I can define it here for every part of the app.
//window.articleUrl = "http://localhost:4000"
window.articleUrl = "http://kevindprice.github.io/coriolis"

//Defaults set as namespaces. 
//Can push reset in input menu to return to these default values.
//If a query variable was used, then it will return to that instead.
//Note: these are also present in processQueries.js.
	//If you edit them here, then make sure you edit them there too!
var defaultImperial = {
	diameter:50,
	startheight:4,
	units:"ft",
	percentgravity:100,
	thrownUp:3,
	accel_earth:32.174,
	anglefromVertical:0,
	speed: 14, //13.894,
	percenttime:100,
}

var defaultMetric = {
	diameter: 15, //15.24,
	startheight: 1.2,  //1.219,
	units:"m",
	percentgravity:100,
	thrownUp: 1, //.92,
	accel_earth: 9.80665,
	anglefromVertical:0,
	speed: 4, //4.235,
	percenttime: 100,	
}

var defaultQuery = {  //constructor sets the values
	diameter: null,		//if there is a query variable present.
	startheight: null,	//Then these will be the defaults
	units:null,			//for the input menu.
	percentgravity:null,
	thrownUp: null,
	accel_earth: null,
	anglefromVertical:null,
	speed: null,
	percenttime: null,
}




					//animation has to be global so I can stop it
					//from a different function from which it was called.
var starsanimation = null; 

//capture the page object from the ref *once*. Doing multiple times is crashy.
var burgerPageObject = null;

class App extends Component {
						 //process query variables ////////////
   constructor(props) {	 		//and set variable defaults to state
		super(props);
		
		var queryValues = processQueryVariables()
		
		defaultQuery = {
			diameter: queryValues.diameter,
			startheight: queryValues.startheight,
			units: queryValues.units,
			percentgravity: queryValues.gravity,
			thrownUp: queryValues.thrownUp,
			accel_earth: queryValues.accel_earth,
			anglefromVertical: queryValues.anglefromVertical,
			speed: queryValues.speed,
			percenttime: queryValues.percenttime,
		}
	
		//duplicate updateOtherVars(), but since component is still unmounted
		//then don't do updateState(). But these variables need to be there
		//for component to render
		
		var encapsulatedCrunch={
			anglefromVertical: queryValues.anglefromVertical,
			speed: queryValues.speed,
			accel_earth: queryValues.accel_earth,
			percentgravity: queryValues.percentgravity,
			diameter: queryValues.diameter,
			startheight: queryValues.startheight,
		}

		var answers = crunchnumbers(encapsulatedCrunch)
		
		var pageShape
		if (window.innerWidth>window.innerHeight) {pageShape = "wide"}
		else {pageShape = "tall"}
		
		//does not account for burger menu this way.
		//Will be updated on first render.
		
		this.state = {
			diameter: queryValues.diameter,
			startheight: queryValues.startheight,
			units: queryValues.units,
			percentgravity: queryValues.percentgravity,
			thrownUp: queryValues.thrownUp,
			anglefromVertical: queryValues.anglefromVertical,
			speed: queryValues.speed,
			percenttime: queryValues.percenttime,
			accel_earth: queryValues.accel_earth,
						//either 32ft/s or 9.8 m/s	  
			
			sampleNum: 0,
			
			menuLeftOpen: queryValues.leftMenu,
			menuRightOpen: queryValues.rightMenu,
			frozen:queryValues.frozen,
			queryflag:queryValues.queryflag,	//used to lock the defaults if a query is used
			PopUpOpen: queryValues.PopUpOpen,

			starSpeed: 5,  //percent speed of stars
			showStarForm: true,	//show the star speed dropdown menu
			canvasStarData: null,
			defaults: queryValues.defaults,
			//burgerFlag: false, //flag for canvases to rerender when the menu opens

			//vars from number crunching
			expectedtime : answers.expectedtime,   //time on earth
			expectedheight: answers.expectedheight,
			standingvelocity: answers.standingvelocity,
			omega: answers.omega,
			maxheight: answers.maxheight,
			time: answers.time,				//time on space station
			slope: answers.slope,
			total_difference: answers.total_difference,
				//starting speed of coin with standing speed incorporated
			start_v_x: answers.start_v_x,	
			standingcoin: answers.standingcoin,
			g_oncoin: answers.g_oncoin,
			expecteddist: answers.expecteddist,	//coin's landing distance on earth
			start_speed: answers.start_speed,
			theta_traversed_person: answers.theta_traversed_person,
			theta_traversed_coin: answers.theta_traversed_coin,
			curvilinear: answers.curvilinear,
			
				//page renders differently if burger menu pushes it aside
				//and also state needs to update on resize so I know if it's 
					//tallCanvas or wideCanvas
			//width:window.innerWidth,
			//height:window.innerHeight,
			
			//actually I only need to  know if it needs to be tall or wide.
			//Prevent unnecessary re-renders by not updating state on every resize.
			pageShape: pageShape,
			shouldShiftForBurger: (window.innerWidth > 600), 
				//if the page is too skinny, like on mobile, then shrinking just looks ugly.
			
			//now calculated in the number crunching
			//standingvelocity: Math.sqrt( queryValues.accel_earth * queryValues.diameter/2),
			//omega: Math.sqrt( queryValues.accel_earth / (queryValues.diameter/2) ),
		}

		this.setDefaultState = this.setDefaultState.bind(this);
		this.updateStarSpeed = this.updateStarSpeed.bind(this);
		this.receiveStarCenter = this.receiveStarCenter.bind(this);
		this.freeze = this.freeze.bind(this);
		this.updateState = this.updateState.bind(this);
		this.convertunits = this.convertunits.bind(this);
		this.updateDiameter = this.updateDiameter.bind(this);
		this.updateOtherVars = this.updateOtherVars.bind(this);
		this.toggleLeftMenu = this.toggleLeftMenu.bind(this);
		this.toggleRightMenu = this.toggleRightMenu.bind(this);
		this.closeMenus = this.closeMenus.bind(this);
		this.togglePopUp = this.togglePopUp.bind(this);
		this.leftArrow = this.leftArrow.bind(this);
		this.rightArrow = this.rightArrow.bind(this);
		
			 //get the dimensions of the page as it is shrunk by the burger menu
			 //(not the window.innerWidth or innerHeight dimension)
		this.burgerPageRef = React.createRef();
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
			
			//this.setState({ width, height })
			if(typeof width !== 'undefined'){				
				if( width>height && this.state.pageShape === "tall") 
					{  this.setState({pageShape:"wide"}) }
				else if(width<height && this.state.pageShape === "wide")
					{  this.setState({pageShape:"tall"})}
			}
		});
	};
	
	componentWillUnmount() {
		if(this.resizeObserver){
			this.resizeObserver.disconnect();
		}
		
		starsanimation = null;
	}
	

	componentDidMount()
	{
		burgerPageObject = this.burgerPageRef.current
		
		if("ResizeObserver" in window)
		{ this.observe(ResizeObserver);	
		  this.resizeObserver.observe(burgerPageObject);
		} 
		else {  //If the browser doesn't support ResizeObserver...
		
			//...then don't shift for menu
			this.setState({shrinkPageForBurger: false})

			//...event listener for window size
			window.addEventListener('resize', () => { 	
				if( window.innerWidth>window.innerHeight && this.state.pageShape === "tall") 
					{  this.setState({pageShape:"wide"}) }
				else if(window.innerWidth<window.innerHeight && this.state.pageShape === "wide")
					{  this.setState({pageShape:"tall"})} 
			});
		}

		//if the window is less than 600 px wide, then don't squish the page for the menu.
		window.addEventListener('resize', () => {
			if(this.state.shouldShiftForBurger && window.innerWidth < 600)
			{ this.setState({shouldShiftForBurger:false}) }
			if(!this.state.shouldShiftForBurger && window.innerWidth > 600 && "ResizeObserver" in window)
			{ this.setState({shouldShiftForBurger:true}) }
		});		
		
	}

	
	
	shouldComponentUpdate(newProps, newState)
	{
		if( this.state.frozen!==newState.frozen )
		{ return true; }
	
		
		//if one of these items was updated, then
		//updateOtherVars() will trigger a re-render anyway.
		//Checking this will prevent rendering twice.
		if( (this.state.diameter !== newState.diameter ||
			this.state.startheight !== newState.startheight ||
			this.state.units !== newState.units ||
			this.state.percentgravity !== newState.percentgravity ||
			this.state.thrownUp !== newState.thrownUp ||
			this.state.anglefromVertical !== newState.anglefromVertical ||
			this.state.speed !== newState.speed ||
			this.state.percenttime !== newState.percenttime ||
			this.state.accel_earth !== newState.accel_earth ||
			
			(this.state.canvasStarData !== newState.canvasStarData &&
			this.state.showStarForm === newState.showStarForm)

			) //&&
			//this.state.displayArticle===newState.displayArticle
		)
		{ return false; }
		else
		{ return true; }
	}
	
	
	//called by pushing the reset button in input menu
	setDefaultState()
	{
	  //preserve the units, revert everything else.
	  var defaults=this.state.defaults;

      this.setState({
		  diameter: defaults.diameter,
		  startheight: defaults.startheight,
		  units: defaults.units,
		  percentgravity: defaults.percentgravity,
		  thrownUp: defaults.thrownUp,
		  anglefromVertical: defaults.anglefromVertical,
		  speed: defaults.speed,
		  percenttime: defaults.percenttime,
		  accel_earth:defaults.accel_earth,
		  standingvelocity: Math.sqrt( defaults.accel_earth * defaults.diameter/2),
		  omega: Math.sqrt( defaults.accel_earth / (defaults.diameter/2) ),

		  //droppedflag: false,
		}, ()=>{this.updateOtherVars();} )
		
	}
	
	
   //onChange={(e) => this.setState({starSpeed: e.target.value, })}
   //onChange={(e) => this.updateStarSpeed(e.target.value) }
	updateStarSpeed(value)	//called by dropdown form. "Show stars at: 5%"
	{	this.setState({ starSpeed: value });	
		this.receiveStarCenter(this.state.canvasStarData, value);
	}

	//callback function from CanvasSpace.js
	//This is where App.js receives the coordinates for the stars' center of rotation
	//And then starts / adjusts the star animation
	receiveStarCenter(childData, starSpeed)
	{
		if(typeof starSpeed==='undefined') {starSpeed=this.state.starSpeed; }
		
		//need this for if it's called by adjusting the star speed dropdown menu
		//instead of the canvas
		this.setState({canvasStarData:childData,})
		var starsobj = document.getElementById("stars");
		var frozenstars = document.getElementById("frozenstars");
				
		//get top-left coordinate of canvas
		var canvascoords = document.getElementById("spaceGround").getBoundingClientRect();
		
		//center of rotation based on pixels from the top-left of screen
		var page_x = childData.centerX + canvascoords.x
		var page_y = childData.centerY + canvascoords.y
				
		if(starsobj != null) {

			//calculate distance from rotation center to bottom-right of screen
			//to give enough room for the stars to rotate without going off the page
			var diagonal = Math.sqrt( Math.pow(window.innerHeight-page_y, 2) + Math.pow(window.innerWidth-page_x,2) )
			
			//distance from rotation center to bottom-left of screen
			var diagonal2 = Math.sqrt( Math.pow(window.innerHeight-page_y, 2) + Math.pow(0-page_x,2) )
			
			//distance from rotation center to top-right of screen
			var diagonal3 = Math.sqrt( Math.pow(page_y, 2) + Math.pow(window.innerWidth-page_x, 2))
			
			//and the top-left doesn't ever matter here.
			
			if(diagonal2>diagonal) {diagonal=diagonal2} //pick whichever is greater
			if(diagonal3>diagonal) {diagonal=diagonal3}
				
			//sets the stars size dynamically (below) up to 8 times the screen size.
			//(divides by 2, because you only need half of it to be > than diagonal)
			if(window.innerWidth*8/2 > diagonal && window.innerHeight*8/2 > diagonal)
			{
				//the exact size the stars need to be to cover the screen while spinning.
				//(don't waste resources in spinning something bigger than necessary)
				starsobj.style.width=(diagonal*2).toString() + "px"
				starsobj.style.height=(diagonal*2).toString() + "px"
				
				this.setState( {showStarForm: true,} );

				//change css of stars object to center it at center of rotation
						//canvas is 1000% of screen size, so 500% is centered.
				var leftval = page_x - starsobj.offsetWidth/2
				var topval = page_y - starsobj.offsetHeight/2
				starsobj.style.left = leftval.toString() + "px"
				starsobj.style.top  = topval.toString() + "px"
				
				var duration = childData.duration / ((this.state.percenttime/100)*(starSpeed/100));
				
				if (duration < 0 || isNaN(duration)) {duration="auto"}
				
				
				starsanimation = starsobj.animate({
					  transform: ['rotate(0)', 'rotate(-360deg)']}, 
				{
					duration: duration,
					iterations: Infinity
				});
			}
			else //if the station is huge, just move the stars horizontally
			{	
				//moves at a random angle depending on the prior transformation.
				//starsobj.style.animation = "move-stars-back 50s linear infinite";

				//Aligning the stars object to exactly the size of the picture
				//makes the animation (below) perfectly smooth with no jumps.
				//This sets the picture to the minimum size to cover the entire screen
				//(don't waste resources sliding something that's not visible)
				
				var slidestarsleft = 1280;  //pixel witdth of the star image
					//identifies where to start the image before sliding it to the
					//edge of the screen.

				var slidestarswidth = 1280+window.innerWidth;
				
				
				starsobj.style.width=slidestarswidth.toString() + "px"
				starsobj.style.height=1*window.innerHeight.toString() + "px"
				starsobj.style.left=-slidestarsleft.toString() + "px"
				starsobj.style.top=(0).toString() + "px"
												
				//This animation is good because it resets the rotation
				//and flows horizontally to the right the way I want it to.
				starsanimation = starsobj.animate({ 
				transform: ['translateX(0)', 'translateX(1280px)']}, 
				{
					duration: 10000, //50000,
					iterations: Infinity
				});
				
				this.setState( {showStarForm: false,} );
			}
		}
		else //if I can't reach the stars object on the canvas
		{
			if(starsanimation!=null) {starsanimation.pause(); starsanimation=null;}
		}
		
		if(frozenstars!=null)
		{
			//this.setState( {showStarForm: true,} );

			frozenstars.style.width=(2*window.innerWidth).toString() + "px"
			frozenstars.style.height=(2*window.innerHeight).toString() + "px"
			
			frozenstars.style.left = (-window.innerWidth/2).toString() + "px"
			frozenstars.style.top  = (-window.innerHeight/2).toString() + "px"
			
		}
	}

	freeze()
	{
		if (this.state.frozen===false) { //e.g. before it switches to true
			if(starsanimation != null) { 
				starsanimation.pause(); 
				starsanimation=null;
			}
		}
		
		this.setState( {frozen: !this.state.frozen} )  
	}
	
	
	convertunits(e)
	{	
		if(e.target.value !== this.state.units)
		{
			var startheight
			var diameter
			var thrownUp
			var speed

			var newdefaults
			if(this.state.units==="ft")
			{  newdefaults=defaultMetric }
			else
			{  newdefaults=defaultImperial }
			
			if(this.state.startheight===this.state.defaults.startheight)
			{ startheight=newdefaults.startheight; }
			else {  startheight=round(convertfeetmet(this.state.startheight, this.state.units, newdefaults.units)) }
			
			if(this.state.diameter===this.state.defaults.diameter)
			{ diameter=newdefaults.diameter; }
			else {  diameter=round(convertfeetmet(this.state.diameter, this.state.units, newdefaults.units)) }
	   
			if(this.state.thrownUp===this.state.defaults.thrownUp)
			{ thrownUp=newdefaults.thrownUp; }
			else {  thrownUp=round(convertfeetmet(this.state.thrownUp, this.state.units, newdefaults.units)) }

			if(this.state.speed===this.state.defaults.speed)
			{ speed=newdefaults.speed; }
			else {  speed=round(convertfeetmet(this.state.speed, this.state.units, newdefaults.units)) }
			
			//now that we've done the above...
			if(this.state.queryflag===true) //if there's a query variable, reset to starting condition
			{	newdefaults=defaultQuery;	}
			
			this.setState( {
				startheight : startheight,  
				diameter : diameter, 
				thrownUp : thrownUp, 
				speed : speed,
				//relative_v_x : round(convertfeetmet(this.state.relative_v_x, this.state.units, newdefaults.units)),
				//relative_v_y : round(convertfeetmet(this.state.relative_v_y, this.state.units, newdefaults.units)),
				units: e.currentTarget.value,
				accel_earth: newdefaults.accel_earth,
				//g_accel: newdefaults.accel_earth * this.state.percentgravity/100,
				defaults: newdefaults,
			}, ()=>{this.updateOtherVars();} )
		}
	}

	updateState(value, variable) //take a new input value from the sliders/input boxes and set it.
	{   	if(this.state[variable] !== value) //check that it's actually changed
		{								  //before needlessly running the logic
			this.setState({[variable]: value,
			}, ()=>{this.updateOtherVars();} )
		}
	}
	
			
	//the starting height must NEVER be greater than the diameter!
	//Thus this field gets its own handling function.
	updateDiameter(value, variable)
	{
		console.log("HI")
		if(this.state.diameter !== value)
		{
			if(value < this.state.startheight) {
				this.setState({diameter: value,
								startheight: value,
				}, ()=>{this.updateOtherVars();} )
			} 
			else if( this.state.diameter <= 10 && value > 10 && this.state.startheight < 4 && this.state.units==="ft")
			{
				this.setState({diameter: value,
								startheight: 4,
				}, ()=>{this.updateOtherVars();} )		   
			}
			else if( this.state.diameter <= 2 && value > 2 && this.state.startheight < 1 && this.state.units==="m")
			{
				this.setState({diameter: value,
								startheight: 1.2,
				}, ()=>{this.updateOtherVars();} )
			}
			else {
				this.setState({diameter: value,
				}, ()=>{this.updateOtherVars();} )		   
			}
		}
	}

	leftArrow() {
		if(this.state.sampleNum > 0)
		{
			var defaultValues 
			if(	Gallery.samples[this.state.sampleNum-1].units === "ft" )
			{
				defaultValues = defaultImperial;
			} else	{
				defaultValues = defaultMetric;
			}
			
			this.setState({
				sampleNum: this.state.sampleNum - 1,
				diameter: Gallery.samples[this.state.sampleNum-1].diameter,
				speed: Gallery.samples[this.state.sampleNum-1].speed,
				anglefromVertical: Gallery.samples[this.state.sampleNum-1].angle,
				startheight: Gallery.samples[this.state.sampleNum-1].startheight,
				percentgravity: Gallery.samples[this.state.sampleNum-1].percentgravity,
				units: Gallery.samples[this.state.sampleNum-1].units,
				percenttime: Gallery.samples[this.state.sampleNum-1].percenttime,
				
				accel_earth: defaultValues.accel_earth,
				defaults: defaultValues
 			  }, ()=>{this.updateOtherVars();} ) 	
		}	
	}

	rightArrow() {
		if(this.state.sampleNum < Gallery.samples.length - 1)
		{	
			var defaultValues 
			if(	Gallery.samples[this.state.sampleNum+1].units === "ft" )
			{
				defaultValues = defaultImperial;
			} else	{
				defaultValues = defaultMetric;
			}

			this.setState({sampleNum: this.state.sampleNum + 1,
				diameter: Gallery.samples[this.state.sampleNum+1].diameter,
				speed: Gallery.samples[this.state.sampleNum+1].speed,
				anglefromVertical: Gallery.samples[this.state.sampleNum+1].angle,
				startheight: Gallery.samples[this.state.sampleNum+1].startheight,
				percentgravity: Gallery.samples[this.state.sampleNum+1].percentgravity,
				units: Gallery.samples[this.state.sampleNum+1].units,
				percenttime: Gallery.samples[this.state.sampleNum+1].percenttime,
				
				accel_earth: defaultValues.accel_earth,
				defaults: defaultValues
			}, ()=>{this.updateOtherVars();} ) 
		}
	}
 	
	updateOtherVars()  //crunch the numbers and save answers to state
	{	
		var encapsulatedCrunch={
			anglefromVertical: this.state.anglefromVertical,
			speed: this.state.speed,
			accel_earth: this.state.accel_earth,
			percentgravity: this.state.percentgravity,
			diameter: this.state.diameter,
			startheight: this.state.startheight,
		}

		var answers = crunchnumbers(encapsulatedCrunch)

		//console.log(answers.expectedtime)
		
		this.setState({
			expectedtime : answers.expectedtime,
			expectedheight: answers.expectedheight,
			standingvelocity: answers.standingvelocity,
			omega: answers.omega,
			//g_accel: g_accel,
			maxheight: answers.maxheight,
			//x_f : answers.x_f,
			//y_f : answers.y_f,
			time: answers.time,
			slope: answers.slope,
			total_difference: answers.total_difference,
			//directionleft: answers.directionleft,
						//starting speed of coin with standing speed incorporated
			start_v_x: answers.start_v_x,	
			standingcoin: answers.standingcoin,
			g_oncoin: answers.g_oncoin,
			expecteddist: answers.expecteddist,		//coin's landing distance on earth
			start_speed: answers.start_speed,
			theta_traversed_person: answers.theta_traversed_person,
			theta_traversed_coin: answers.theta_traversed_coin,
			curvilinear: answers.curvilinear,
		})
	}
	
	toggleLeftMenu() {
		this.setState( {
			//menuLeftOpen: state.isOpen, frozen: state.isOpen,
			menuLeftOpen: !this.state.menuLeftOpen,
			frozen: !this.state.menuLeftOpen,
		} )
	}
	
	toggleRightMenu() {
		this.setState( {
			//menuRightOpen: state.isOpen, frozen: state.isOpen,
			menuRightOpen: !this.state.menuRightOpen,
			frozen: !this.state.menuRightOpen,
		} )
	}
	
	//the apply button in the left menu
	closeMenus() {
		this.setState({ menuLeftOpen: false, menuRightOpen:false, frozen: false});
	}
	
	togglePopUp() {
		this.setState( {PopUpOpen: !(this.state.PopUpOpen)} )
	}
	

	
  render() {
	//var shape	//is the window tall or wide? (based on event listener to state)
	//var bufferid	//if tall, add a little height break between canvases.
	
	/*if(this.state.width > this.state.height)// * 1.25)
	{
		shape="wideCanvas";		//add a width break between canvases.
		bufferid="widthBuffer";
	}
	else
	{  				
		shape="tallCanvas";
		bufferid="heightBuffer" //add a little height break between canvases.
	}*/
	
	
	var fullunits
	if(this.state.units==="ft")
	{ fullunits = "feet" }	else { fullunits = "meters" }  //"Scale in meters"
	
		//angle from horizontal-right
	var computedangle = (-1* this.state.anglefromVertical * Math.PI / 180) + (Math.PI / 2)
	var start_v_y = this.state.speed*Math.sin(computedangle)
	
	//prep vars for canvases
	var EncapsulatedVariables = {	
			slope : this.state.slope,
			time : this.state.time,
			radius: this.state.diameter/2,
			omega: this.state.omega,
			startheight: this.state.startheight,
			start_v_x: this.state.start_v_x,
			start_v_y: start_v_y,
			units: this.state.units,
			menuLeftOpen: this.state.menuLeftOpen,
			menuRightOpen: this.state.menuRightOpen,
			percenttime: this.state.percenttime,
			frozen: this.state.frozen,
			expectedtime: this.state.expectedtime,
			anglefromVertical: this.state.anglefromVertical,
			speed: this.state.speed,
		}
		
	//prep vars for output menu
	var EncapsulatedOutput = {	
			rotation: this.state.omega / (2 * Math.PI),
			units: this.state.units,
			standingvelocity: this.state.standingvelocity,
			centripaccel: this.state.accel_earth * this.state.percentgravity / 100,
			standingcoin: -1 * this.state.standingcoin,
			g_oncoin: this.state.g_oncoin,
			time: this.state.time,
			expectedtime: this.state.expectedtime,
			maxheight: this.state.maxheight,
			expectedheight: this.state.expectedheight,
			finalseparation: this.state.total_difference,
			expecteddist: this.state.expecteddist,
			throwspeed: this.state.start_speed,
			theta_traversed_person: this.state.theta_traversed_person,
			theta_traversed_coin: this.state.theta_traversed_coin,
			curvilinear: this.state.curvilinear,
			
			//need to know whether the coin landed to the right or left of the person.
			//relative_v_x: this.state.relative_v_x,  //actually no.
			//directionleft: this.state.directionleft,
		}

	//prep vars for input menu
	var EncapsulatedInput = {
			units: this.state.units,
			defaults: this.state.defaults,
			start_v_y: start_v_y,

			diameter:this.state.diameter,
			startheight:this.state.startheight,
			anglefromVertical:this.state.anglefromVertical,
			speed:this.state.speed,
			percentgravity:this.state.percentgravity,
						
//			total_difference: this.state.total_difference,
//			expecteddist: this.state.expecteddist,
//			time: this.state.time,
//			expectedtime: this.state.expectedtime,			
//			maxheight: this.state.maxheight,
//			expectedheight:this.state.expectedheight,
		}


	//show if the stars are not in realtime
	var showStarLabel="hide"	/* eslint-disable */
	if(!this.state.showStarForm || this.state.starSpeed != 100 || this.state.frozen)
	{ showStarLabel="starLabel" }

	 //don't display the star speed option if it's just going horizontally/not synced
	var showStarForm="starForm";
	if(!this.state.showStarForm) { showStarForm="hide"; }
	
	//canvas is frozen, then stars are frozen
	var frozenstars
	if(this.state.frozen) { frozenstars = "frozenstars"; }
	else { frozenstars = "stars";}
	
	
	//this part preps the text to display "difference" on the main screen
		var difference = Math.abs(this.state.total_difference-this.state.expecteddist);
		
		//If the person has traveled more than half a circle,
		//then don't display the "Difference from throw on Earth".
		var showDifference="diffnotice"
		if( (Math.abs(this.state.theta_traversed_person-this.state.theta_traversed_coin) > Math.PI / 2 ) || !isFinite(difference) )
			{ showDifference="hide" }
		
		var secondaryunits
		var show_diff_from_expected1=""
		var show_diff_from_expected2="hide"
		var diff_from_expected2
		//var diff_from_expected3
		if(difference < 1)
		{
			show_diff_from_expected2 = ""
			//show_diff_from_expected1 = "hide"
			if(this.state.units ==="ft")
			{  diff_from_expected2 = difference * 12; secondaryunits="in"; }  //in
			else
			{  diff_from_expected2 = difference * 100; secondaryunits="cm"; } //cm
		}
		else if(difference>5280 && this.state.units==="ft") {
			show_diff_from_expected2 = ""
			//show_diff_from_expected1 = "hide"
			diff_from_expected2 = difference / 5280;
			secondaryunits = "mi"
			showDifference="diffnoticesmall"

		}
		else if(difference>1000 && this.state.units==="m") {
			show_diff_from_expected2 = ""
			//show_diff_from_expected1 = "hide"
			diff_from_expected2 = difference / 1000;
			secondaryunits = "km"
			showDifference="diffnoticesmall"
		}

	//reshape page if left menu opens
	//react-burger-menu has an option to push, but that pushes off the page
	//it also has an option to scale, but that doesn't work, 
			//and I don't want to 'scale' everything, just reshape it.
	var burgerPageClass = ""
	var leftMenu
	var innerMenu = (<LeftMenu 
					convertunits = {this.convertunits}
					updateState = {this.updateState}
					updateDiameter = {this.updateDiameter}
					setDefaultState = {this.setDefaultState}
					closeMenus = {this.closeMenus}
					leftFunction = {this.leftArrow}
					rightFunction = {this.rightArrow}
					showLeftCursor = {(this.state.sampleNum > 0)}
					showRightCursor = {(this.state.sampleNum < Gallery.samples.length - 1)}
					
					galleryText = {Gallery.samples[this.state.sampleNum].text}
					vars = {EncapsulatedInput}
				/>)
				
	if(this.state.menuLeftOpen && this.state.shouldShiftForBurger) { 
	burgerPageClass="pageShrunkForBurger" 	
		var leftMenu = 	(
				<Menu 
				noOverlay
				isOpen={ this.state.menuLeftOpen } //second condition prevents extra render
				onStateChange={ (e) => { if(e.isOpen===false && this.state.menuLeftOpen ){ this.closeMenus() } } } 
				menuClassName={ "bm-menu-left" }>
					{innerMenu}	
				</Menu>)
		}
		else
		{
			var leftMenu = 	(
				<Menu  
				isOpen={ this.state.menuLeftOpen } //second condition prevents extra render
				onStateChange={ (e) => { if(e.isOpen===false && this.state.menuLeftOpen ){ this.closeMenus() } } } 
				menuClassName={ "bm-menu-left" }>
					{innerMenu}
			</Menu>)
		}



return (

<div id="App">
	<div id="starsparent">
		<div id={frozenstars}></div>
	</div>

	{leftMenu}

	<Menu 
		right 
		noOverlay 
		isOpen={ this.state.menuRightOpen } //second condition prevents extra render
		onStateChange={(e) => { if(e.isOpen===false && this.state.menuRightOpen ){ this.closeMenus() } } }  
		menuClassName={ "bm-menu-right" }>
			<OutputMenu 
				menuOpen={this.state.menuRightOpen} 
				closeMenus={this.closeMenus} 
				vars={EncapsulatedOutput}
			/>
	</Menu>
	

<div id="bm-page-wrap" className={burgerPageClass} ref={this.burgerPageRef}>

	<div className="navbar">A Toss on a Spinning Space Station</div>

	<div className={this.state.pageShape + "Canvas"} >
		<div className="overlaytext">On Earth</div>
		
		<PlayBack min={0} max={Math.ceil(this.state.time)*100} updateState={this.updateState} default={this.state.defaults["percenttime"]}  variable="percenttime" value={this.state.percenttime} units="%"/>
		
		<CanvasEarth vars={EncapsulatedVariables} defaults={this.state.defaults} />
		
		<div className="scale"><i>Scale in {fullunits}</i></div>
	</div>

	<div id={this.state.pageShape + "Buffer"}></div>

	<div className={this.state.pageShape + "Canvas"} id="spaceGround" >
		<div className="overlaytext">On a {this.state.diameter} {this.state.units} station</div>

		<div className={showStarForm}>Show stars at:&nbsp;
			<select id="starDropdown" value={this.state.starSpeed} onChange={(e) => this.updateStarSpeed(e.target.value) }>
				<option value={5}>Slow speed (5%)</option>
				<option value={100}>True speed (100%)</option>
			</select>
		</div>
		
		<CanvasSpace vars={EncapsulatedVariables} sendRotation={ this.receiveStarCenter } defaults={this.state.defaults} />
		
		<div className="scale"><i>Scale in {fullunits}</i></div>
		<div className={showStarLabel}>*Star motion not realtime</div>

	</div>
	
				  
	<div>
		<button className="button" id={"leftMenuButton"} onClick={this.toggleLeftMenu}>Edit the Throw</button>
		
		<div className="centered">
			<button className="button" id="FreezeButton" onClick={ this.freeze }>{this.state.frozen ? "Unfreeze" : "Freeze"}</button>
			<button id="referenceLink" className="button" onClick={this.togglePopUp}>About This Page</button>
		</div>
		<button className="button" id="rightMenuButton" onClick={this.toggleRightMenu}>&ensp;Stats&ensp;</button>
	</div>
	
	<div className={ showDifference }>
		<span style={{color:'#adbdff'}}>Difference from throw on Earth:</span>
		<span className={show_diff_from_expected1}>&nbsp;{format(difference)}</span>
		<span className={show_diff_from_expected1}>&nbsp;{this.state.units}</span>
		<span className={show_diff_from_expected2}>&nbsp;({format(diff_from_expected2)}</span>
		<span className={show_diff_from_expected2}>&nbsp;{secondaryunits})</span>
	</div>
</div>

  <PopUp display={this.state.PopUpOpen} toggle={this.togglePopUp}/>

</div>
	
	

    );
  }
}



//rounds to three significant figures. (unless given a specified num decimal places)
function round(num, places) {
	if(num===0)
	{ return 0 }
	
    if(places==null && num > 1)
	{
		var order = Math.floor(Math.log(num) / Math.LN10
                       + 0.000000001); // because float math sucks like that
		places = (order * -1) + 2
	}
	else if(places==null)
	{ places = 2 }
	
	var multiplier = Math.pow(10, places);
    var output = Math.round(num * multiplier) / multiplier;
	
	//fix some weird output. Probably due to feet/meters conversion not being more precise.
	if(Math.abs(output - Math.round(output)) <= .0011)
	{ output = Math.round(output); }

	return output;	
}


function convertfeetmet(value, fromunit, tounit)
{
	if(fromunit==="ft" && tounit==="m")
	{ return to_meters(value) }
	else
	{ return to_feet(value) }
}

function to_meters(feet) //defined exactly by the National Bureau of Standards.
{ return feet * 0.3048 } //Is the definition of a foot.
						 //I can't get more accurate than that.

function to_feet(meters)			//The inverse calculates to more decimals...
{ return meters * 3.2808333333 }



function format(num)
{
	num = round(num)
	
	if(!isFinite(num) )
	{ return "∞" }
	else
	{ if(num < 99999) return num.toString()
	  else return num.toExponential(0).replace("e+","*10^") }
	
}


/*function process_md(markdownfile) {
	var markdownCompileResult = md.render(markdownFile);
	
	return markdownCompileResult
}*/


class PopUp extends Component{
	render() {
	
	var showelement="hide";
	if(this.props.display) {showelement=""}

	return(
<div className={showelement}>
	
	<div className="popupoverlay" onClick={this.props.toggle}></div>
	
	<div id="popup">
		<div style={{textAlign:'center'}}>
			<h1>About This Page</h1>
		</div>
		<div id="popupcontent">
			<p>This page models motion on a space station that spins to produce gravity.</p>
			<p>No one has ever built a spinning space station before. Life on such a space station would be different from our experience.</p>
			<p>Objects move differently in a spinning environment due to a phenomenon called the Coriolis effect. If you were to toss something in the air, it would not land where you expect it to. This model demonstrates that toss for you.</p>
			<p>You can change the toss in the left menu. Try clicking through the gallery of throws found there to learn more.</p>
		</div>
		
		<div style={{textAlign:'center'}}>
			<button className="ResetButton" onClick={this.props.toggle}>Got it</button>
		</div>
	</div>
</div>	
	
	);
		
	}
}
//			<CrossIcon onClick={this.props.toggle} className="crossIcon"/>	




export default App;
