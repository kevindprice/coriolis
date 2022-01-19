import React, { Component } from 'react';
import './App.css';

import ReactTouchEvents from "react-touch-events";
import InputField from './InputField'
import AngleInput from './AngleInput'

import leftarrow from "./img/left-arrow.png"
import rightarrow from "./img/right-arrow.png"

/*
props:

  functions:
	this.convertunits
	this.updateState
	this.updateDiameter
	this.setDefaultState
	this.closeMenus

  variables:
	this.state.units
	this.state.defaults

	this.state.diameter
	this.state.startheight
	this.state.anglefromVertical
	this.state.speed
	this.state.percentgravity
	
	this.state.expectedheight
	

  vars to calculate:
	heightexpected
	secondspeed
	
**Note, the functions that handle updating variable states
are passed down by props from App.js

*/

class LeftMenu extends Component {

	constructor() {
		super();
		
		this.state = {
			diameterCheck: false,
			speedCheck: false,
			angleCheck: false,
			heightCheck: false,
			gravityCheck: false
		}
	}

render() {
	
	//in input menu: "Height coin reaches if thrown on Earth"
	/*var heightexpected = round(this.props.vars.expectedheight)
	var checkvalue = 11100; if(this.props.vars.units==="ft") checkvalue *= 3.28084;
	if(this.props.start_v_y > checkvalue)
	{ heightexpected = "Escape Velocity"}
	else heightexpected = heightexpected.toString() + " " + this.props.vars.units.toString()*/
	
	//Input menu also shows the throw in mph to be useful.
	var secondspeed;
	if(this.props.vars.units==="ft")
	{	secondspeed = "(" + round(this.props.vars.speed * 0.681818).toString() + " mph)" }
	else
	{	secondspeed = "("+ round(this.props.vars.speed * 3.6).toString() + " km/h)" }	

	var seconddiameter; var seconddiameterunits;
	if(this.props.vars.units==="ft" && this.props.vars.diameter > 2640)
	{
		seconddiameter = round(this.props.vars.diameter/5280); seconddiameterunits=" miles across";
	}
	else if(this.props.vars.units==="m" && this.props.vars.diameter > 1000)
	{
		seconddiameter = round(this.props.vars.diameter/1000); seconddiameterunits=" km across";
	}
	
	var cursorLeft = "pointer"
	if(!this.props.showLeftCursor)
	{cursorLeft = "initial"}

	var cursorRight = "pointer"
	if(!this.props.showRightCursor)
	{cursorRight = "initial"}
	

	//The input fields that appear if the user selects their checkmark
	///////////////////Hidden by default//////////////////////////////
	
	var diameterField = (this.state.diameterCheck) ? 
		(<InputField title="Station diameter" 
			value={this.props.vars.diameter} 
			min={1} max={10000000000}  
			default={this.props.vars.defaults["diameter"]} 
			updateState={this.props.updateDiameter} 
			variable="diameter" 
			units={this.props.vars.units}>
		<span style={{width:'initial', color:'white', marginLeft:'5px', marginRight:'-20px', fontSize:'14px'}}>{seconddiameter ? seconddiameter.toString() + seconddiameterunits : null}</span>
		</InputField>)
		: null;
	
	var speedField = (this.state.speedCheck) ? 
		(<InputField title="Throw speed" 
			value={this.props.vars.speed} 
			min={0} max={5000} 
			updateState={this.props.updateState}  
			default={this.props.vars.defaults["speed"]}  
			variable="speed" units={this.props.vars.units+"/s"}>
		<span style={{width:'initial', color:'white', marginLeft:'5px', marginRight:'-20px', fontSize:'14px'}}>{secondspeed}</span>
		</InputField>
			
			)
		: null;
	
	var angleField = (this.state.angleCheck) ? 
		(<AngleInput title="Angle from vertical" 
			value={this.props.vars.anglefromVertical} 
			min="-180" max="180" 
			default={0} 
			updateState={this.props.updateState} 
			variable="anglefromVertical" 
			units="°" 
			droppedflag={(this.props.vars.speed===0)} />)
		: null;
	
	var heightField = (this.state.heightCheck) ? 
		(<InputField title="Starting height" 
			min={0} max={this.props.vars.diameter} 
			updateState={this.props.updateState} 
			value={this.props.vars.startheight} 
			default={this.props.vars.defaults["startheight"]} 
			variable="startheight" 
			units={this.props.vars.units}/>)
		: null;
	
	var gravityField = (this.state.gravityCheck) ? 
		(<InputField title="Gravity at floor" 
		min={0} max={2000} 
		updateState={this.props.updateState} 
		variable="percentgravity"  
		default={this.props.vars.defaults["percentgravity"]} 
		value={this.props.vars.percentgravity} 
		units="%"/>)
	: null;
	
  return (
	<ReactTouchEvents swipeTolerance={80} tapTolerance={70} onSwipe={ (e) => { if(e==="left") { this.props.closeMenus() } } }><div className="swipearea">

	  <div id="CenteredLeftMenu">
		
		<h3>Edit the Throw</h3>
		
		<form className="RadioBox">
			<label className="unitselector">
				<input type="radio" name="units1" value="ft" onChange={this.props.convertunits} checked={this.props.vars.units === "ft"} />
				&nbsp;Imperial (feet)
			</label>&emsp;
			
			<label className="unitselector">			
				<input type="radio" name="units2" value="m"  onChange={this.props.convertunits} checked={this.props.vars.units === "m"} />
					&nbsp;Metric (meters)
			</label>
		</form>
		
	<br/>	
		
	<p style={{textAlign:'left', fontSize:'20px', lineHeight:'0em'}}>
		Select values to edit:</p>
		
	<label className="checkcontainer">
		Station diameter: <span className="displayVar">
			{ this.props.vars.diameter}&nbsp;{this.props.vars.units}</span>
	  <input type="checkbox" checked={this.state.diameterCheck} onChange={()=>{this.setState( {diameterCheck: !this.state.diameterCheck});}}/>
	  <span className="checkmark"></span>
	</label>
	{diameterField}

	<label className="checkcontainer">
		Throw speed: <span className="displayVar">
			 { this.props.vars.speed}&nbsp;{this.props.vars.units}/s</span>
	  <input type="checkbox" checked={this.state.speedCheck} onChange={()=>{this.setState( {speedCheck: !this.state.speedCheck})}}/>
	  <span className="checkmark"></span>
	</label>
	{speedField}
	
	<label className="checkcontainer">
		Angle from vertical: <span className="displayVar">
			 { this.props.vars.anglefromVertical}°</span>
	  <input type="checkbox" checked={this.state.angleCheck} onChange={()=>{this.setState( {angleCheck: !this.state.angleCheck})}}/>
	  <span className="checkmark"></span>
	</label>
	{angleField}

	<label className="checkcontainer">
		Starting height: <span className="displayVar">
			 {this.props.vars.startheight }&nbsp;{this.props.vars.units}</span>
	  <input type="checkbox" checked={this.state.heightCheck} onChange={()=>{this.setState( {heightCheck: !this.state.heightCheck})}}/>
	  <span className="checkmark"></span>
	</label>
	{heightField}
	
	<label className="checkcontainer">
		Percent gravity: <span className="displayVar">
			 {this.props.vars.percentgravity}%</span>
	  <input type="checkbox" checked={this.state.gravityCheck} onChange={()=>{this.setState( {gravityCheck: !this.state.gravityCheck})}}/>
	  <span className="checkmark"></span>
	</label>
	{gravityField}
		
		<button className="ResetButton" onClick={ this.props.setDefaultState }>Return to<br/> defaults</button>&emsp;
		<button className="ResetButton" onClick={ this.props.closeMenus }>Apply and<br/>close menu</button>
<br/>
<br/>

<div style={{border:"3px solid black", borderRadius:"5px", paddingTop:"5px", paddingBottom:"5px"}}>
<img src={leftarrow} alt="Leftarrow" width="30" style={{verticalAlign:"middle",cursor:cursorLeft}}  onClick={ this.props.leftFunction }/>
<div style={{verticalAlign:"middle", width:"200px", display:"inline-block"}}>{this.props.galleryText}</div>
<img src={rightarrow} alt="Rightarrow" width="30" style={{verticalAlign:"middle",cursor:cursorRight}}  onClick={ this.props.rightFunction }/>
</div>



<br/>
  <div style={{lineHeight:'1.25em'}}>
	Read <a href={window.articleUrl}>the associated article</a><br/>
	<a href={window.articleUrl+'/math'}>The math</a> behind this model<br/>
	<a href={'https://www.github.com/kevindprice/coriolis'}>The code</a> behind this model<br/>
  </div>



	  </div>
	</div></ReactTouchEvents>
	  
		)
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

export default LeftMenu;


//	<a href={window.articleUrl+'/ideas'}>Interesting throws</a> for this model<br/>
//<h4 style={{marginBlockEnd:'0.7em'}}>Links</h4>
