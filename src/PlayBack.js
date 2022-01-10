import React, { Component } from 'react';
import './App.css';
//import ReactDOM from 'react-dom'

class PlayBack extends Component {
	
	constructor(props) {
		super(props);
	  
		var maxvalue = this.props.max
		if(maxvalue > 9999 ) { maxvalue = 9999; }
		this.state = { 	minSlider:0,  //minpos
						maxSlider:1, //maxpos
						offset:4,
					}
	
		this.handleSlider = this.handleSlider.bind(this);
    }
		
	shouldComponentUpdate(newProps, newState)
	{
		if( this.state.max===newProps.max
				&& this.props.value===newProps.value
				&& this.state.focused===newState.focused
				&& this.props.min===newProps.min
				&& this.props.display===newProps.display
				&& this.props.units===newProps.units)
			{  //console.log("nothing changed")
				return false  }
		else
		{  //console.log("true")
			return true   }
	}
		
	
	handleSlider(e) {
		
		var max = this.props.max
		var min = this.props.min
		if(max>9999) 
			{ max = 9999; }
		else if(!isFinite(this.props.max))
			{ min=0; max = 0; }
		
		var sliderValue = Number(e.target.value)

		var offsetMin = min + this.state.offset
		var offsetMax = max + this.state.offset
		//var offsetValue = actualValue + this.state.offset
		var scale = (Math.log(offsetMax) - Math.log(offsetMin))/(this.state.maxSlider - this.state.minSlider)
		
		
		//return Math.exp((position - this.minpos) * this.scale + this.minlval);

		var actualValue = round(Math.exp((sliderValue - this.state.minSlider) * scale + Math.log(offsetMin) ) - this.state.offset)
		
		if(actualValue > max)
		{	actualValue = max  }
		if(actualValue < min)
		{	actualValue = min  }

		if(Math.abs(actualValue - this.props.default) < (this.props.default/6))
		{  actualValue = this.props.default }

	
		this.props.updateState(actualValue, this.props.variable)
	}
	
	render() {	
		
		var max = this.props.max
		var min = this.props.min
		if(max>9999) 
			{ max = 9999; }
		else if(!isFinite(this.props.max))
			{ min=0; max = 0; }
		
		var offsetMin = min + this.state.offset
		var offsetMax = max + this.state.offset
		var offsetValue = this.props.value + this.state.offset
		var scale = (Math.log(offsetMax) - Math.log(offsetMin))/(this.state.maxSlider - this.state.minSlider)
		
		//to slider
		//return this.minpos + (Math.log(value) - this.minlval) / this.scale;
		var sliderValue = this.state.minSlider + (Math.log(offsetValue) - Math.log(offsetMin) ) / scale
		
		if(!isFinite(sliderValue)) { sliderValue = 0; }
		
		var rangemin
		var rangemax
		
		var bignumber = this.props.value.toString()
		
		rangemin=min.toString()
		
		if(max < 9999)
		{ rangemax=round(max).toString() }
		else	//if it equals 9999 then just display that.
		{ rangemax= max.toString() }

		return(
		<div id="playback">
			<span style={{padding:'2px 0px 0px 2px', color:"#098f5f"}}>Playback speed&ensp;</span>
			<span style={{color:'#f44e42', padding:'2px', backgroundColor:'#a0c4ff', borderRadius:'2px'}}>{bignumber}%</span>
			<table><tbody>
			  <tr><td style={{fontSize:'0.85em'}}>{rangemin}</td>
				  <td><input type='range' className="slider" style={{width:'100px'}} step={.01} min={0} max={1} value={sliderValue} onChange={this.handleSlider}/></td>
				  <td style={{fontSize:'0.85em',backgroundColor:'white',borderRadius:'3px'}}>{rangemax}</td>
			  </tr>
			</tbody></table>
		</div>
		  );

	}
}

/*
function exp10( x )
{	return Math.pow(10, x);   }// 10^x
*/

//rounds to three significant figures.
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




export default PlayBack;






//not used. Just an example.
/*
function LogSlider(options) {
   options = options || {};
   this.minpos = options.minpos || 0;
   this.maxpos = options.maxpos || 100;
   this.minlval = Math.log(options.minval || 1);
   this.maxlval = Math.log(options.maxval || 100000);

   this.scale = (this.maxlval - this.minlval) / (this.maxpos - this.minpos);
}

LogSlider.prototype = {
   // Calculate value from a slider position
   value: function(position) {
      return Math.exp((position - this.minpos) * this.scale + this.minlval);
   },
   // Calculate slider position from a value
   position: function(value) {
      return this.minpos + (Math.log(value) - this.minlval) / this.scale;
   }
};
*/
