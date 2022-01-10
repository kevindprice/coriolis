/*eslint-disable eqeqeq*/

import React, { Component } from 'react';
import './App.css';

import ReactTouchEvents from "react-touch-events";

class OutputMenu extends Component {
	
	//don't update the menu if it's closed!
	shouldComponentUpdate(newProps, newState)
	{
		if(newProps.menuOpen || this.props.menuOpen)
		{ return true;}
		else {return false;}
	}
		
	
	render() {
		
		//Pick the right units for rotation speed
		var rotation = this.props.vars.rotation;
		//var rotation_units = "rev/s" //not likely. But I validate below.
		var time_to_rotate = (1/rotation)
		var time_to_rotate_units = "s"

		if(rotation < 1)
		{	//rotation_units = "rpm"
			rotation = rotation * 60; }
			
		if(rotation < 1)
		{	//rotation_units = "rev/h"
			rotation = rotation * 60;
			
			time_to_rotate = time_to_rotate /60;
			time_to_rotate_units = "min"
		}
			
		if(rotation < 0.5)
		{	//rotation_units = "rev/d"
			rotation = rotation * 24;
			
			time_to_rotate = time_to_rotate /60;
			time_to_rotate_units = "hr"
		}
		
		/*var units2
		if(this.props.vars.units==="ft")
		{ units2="mph" }
		else if(this.props.vars.units==="m")
		{ units2="km/h" }
		
		var speedunits = this.state.units
		//var standingvelocity = this.props.vars.standingvelocity
		var standingcoin = Math.abs(this.props.vars.standingcoin)
		//var throwspeed = this.props.vars.throwspeed
		
		//other speed formats
		if(speedunits==="mph")
		{ standingvelocity *= 0.681818; standingcoin *= 0.681818; throwspeed *= 0.681818; }
		if(speedunits==="km/h")
		{ standingvelocity *= 3.6; standingcoin *= 3.6; throwspeed *= 0.681818; }*/

		var secondaryunits
		if(this.props.vars.units==="ft") secondaryunits="in"
		else secondaryunits="cm"
	
		//decide to display cm/inches
		var displaysecondary = "hide"; var finalseparation2;  var expecteddist2;
		if(this.props.vars.finalseparation < 1.0)
		{	
			if(this.props.vars.units=="ft") //in
			{
				finalseparation2 = this.props.vars.finalseparation * 12;
				expecteddist2 = this.props.vars.expecteddist * 12;
			}
			
			if(this.props.vars.units=="m")  //cm
			{
				finalseparation2 = this.props.vars.finalseparation * 100
				expecteddist2 = this.props.vars.expecteddist * 100
			}
			displaysecondary = ""
		}

		//hide the Curvilinear answer if it's the same as the straight-line answer
		var showCurvy=""
		//console.log(format(this.props.vars.curvilinear), format(this.props.vars.finalseparation))
		if(format(this.props.vars.curvilinear)==format(this.props.vars.finalseparation))
		{showCurvy="hide"}
	
		//If the person has traveled more than half a circle,
		//display the number of rotations and display a warning. 
		//nevermind don't. Just don't display the "difference from expected."
		var rotationAngle = "";  var numRotations = "hide";
		if(this.props.vars.theta_traversed_person > Math.PI || !isFinite(this.props.vars.theta_traversed_person) )
			{   numRotations="";  rotationAngle="hide"; }

		return( 

<ReactTouchEvents swipeTolerance={80} tapTolerance={70} onSwipe={ (e) => { if(e==="right") { this.props.closeMenus() } } }><div className="swipearea">

		
<div id="outputbox"><h3>Statistics</h3>
<div id="outeroutputtable">
<table id="innertable"><tbody>
	<tr className="border_bottom"><td><h3>&emsp;</h3></td>
		<td className="redcolor">On station</td>
		<td className="bluecolor">On Earth</td>
	</tr>
		<tr>
			<td className="borderright">Time in the air</td>
			<td><div className="output1">{format(this.props.vars.time)}&nbsp;s</div></td>
			<td><div className="output1">{format(this.props.vars.expectedtime)}&nbsp;s</div></td>
		</tr>
		<tr>
			<td className="borderright">Max height reached</td>
			<td><div className="output1">{format(this.props.vars.maxheight)}&nbsp;{this.props.vars.units}</div></td>
			<td><div className="output1">{format(this.props.vars.expectedheight)}&nbsp;{this.props.vars.units}</div></td>
		</tr>
		<tr id="boldrow">
			<td className="borderright"><div className="redcolor"><div>Straight-line dist</div> “away” at landing</div></td>
			<td>
				<div className="output1">{format(this.props.vars.finalseparation)}</div>
					<div className="output1">&nbsp;{this.props.vars.units}</div>
				<div className={displaysecondary}>({format(finalseparation2)}&nbsp;{secondaryunits})</div>
				</td>
			<td>
				<div className="output1">{format(this.props.vars.expecteddist)}</div>
					<div className="output1">&nbsp;{this.props.vars.units}</div>
				<div className={displaysecondary}>({format(expecteddist2)}&nbsp;{secondaryunits})</div>
				</td>
		</tr>
</tbody></table></div>

<div className="conditionalBreak1">&nbsp;</div>
<div className="conditionalBreak">&nbsp;</div>

<table className="secondtable"><tbody>

<tr className={ showCurvy }><td><div className="leftoutput">Distance “away” <i>along floor</i> at landing:</div></td>
	<td>{format(this.props.vars.curvilinear)}</td>
	<td>{this.props.vars.units}</td>
</tr>

<tr><td><div className="leftoutput">Time to complete one rotation:</div></td>
	<td>{format(time_to_rotate)}</td>
	<td>{time_to_rotate_units}</td>
</tr>

<tr className={rotationAngle}><td><div className="leftoutput">Angle the person rotates while the coin is midair:</div></td>
	<td>{format(this.props.vars.theta_traversed_person * 180 / Math.PI)}</td>
	<td>°</td>
</tr>

<tr className={numRotations}><td><div className="leftoutput">Rotations the person completes while the coin is midair:</div></td>
	<td>{format(this.props.vars.theta_traversed_person / (2 * Math.PI))}</td>
	<td>rev</td>
</tr>

<tr><td><div className="leftoutput">Object's speed before throw:</div></td>
	<td>{format(Math.abs(this.props.vars.standingcoin))}</td>
	<td>{this.props.vars.units}/s</td>
</tr>

</tbody></table>


  <div className="conditionalBreak1">&nbsp;</div>
	<button type="submit" className="ResetButton" style={{width:'200px', marginTop:'7px'}} onClick={ this.props.closeMenus }>Close menu</button>
</div>


</div></ReactTouchEvents>

		);

		
	}
}



function format(num)
{
	num = round(num)
	
	if(!isFinite(num) )
	{ return "∞" }
	else
	{ if(num < 99999) return num.toString()
	  else return num.toExponential(0).replace("e+","*10^") }
	
}

//rounds to four significant figures.
function round(num, places) {
	if(num===0)
	{ return 0 }
	
    if(places==null && num > 1)
	{
		var order = Math.floor(Math.log(num) / Math.LN10
                       + 0.000000001); // because float math sucks like that
		places = (order * -1) + 3
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


export default OutputMenu;

