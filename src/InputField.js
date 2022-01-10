import React, { Component } from 'react';
import './App.css';
//import ReactDOM from 'react-dom'

//This class organizes an input field (that appears conditionally in LeftMenu)
//with a logarithmic slider


class InputField extends Component {
	
	constructor(props) {
      super(props);
	
      this.state = { focused:false,
					 minSlider:0,  //minpos
					 maxSlider:1, //maxpos
					 offset:4,
					}
	  this.onFocus = this.onFocus.bind(this);
	  this.onBlur = this.onBlur.bind(this);
	  this.handleSlider = this.handleSlider.bind(this);
	  this.handleOutput = this.handleOutput.bind(this);
	  //this.checkKeyPressed = this.handleOutput.bind(this); //for Edge browser. Boo.
    }
	
	/*componentDidMount() {
		document.addEventListener("keydown", this.checkKeyPressed, false);
   }

	checkKeyPressed(e) {
		if(this.state.focused===true)
		{
			var x = e.which || e.keyCode;
			if(x===38 || x===40)
			{
				ReactDOM.findDOMNode(this.props.variable).onchange()   //ref={this.props.variable} 
				//this.fireEvent("onchange");				
			}
		}
		else {}
	}*/
	
	onFocus() { this.setState({focused:true,})	}
	
												//for the sake of Edge browser
	onBlur(e) { this.setState({focused:false,}); this.handleOutput(e)	}
	
	shouldComponentUpdate(newProps, newState)
	{
		//If the only change was focusing the field, no point in updating unless the value is zero.
		//(blanks the line)
		if( (newState.focused===true && this.state.focused===false && this.props.value !==0) ||
			(newState.focused===false && this.state.focused===true && this.props.value !==0) )
			{  //console.log("false")
				return false  }
		else if( this.props.value===newProps.value
				&& this.state.focused===newState.focused
				&& this.props.min===newProps.min
				&& this.props.max===newProps.max
				&& this.props.display===newProps.display
				&& this.props.units===newProps.units)
			{  //console.log("nothing changed")
				return false  }
		else
		{  //console.log("true")
			return true   }
	}
	
	handleOutput(e) {	//this function handles the number input
	
		var actualValue = Number(e.target.value)
		this.props.updateState(actualValue, this.props.variable)
	}
	
	handleSlider(e) {
		
		var sliderValue = Number(e.target.value)

		var offsetMin = this.props.min + this.state.offset
		var offsetMax = this.props.max + this.state.offset
		//var offsetValue = actualValue + this.state.offset
		var scale = (Math.log(offsetMax) - Math.log(offsetMin))/(this.state.maxSlider - this.state.minSlider)
		
		
		//return Math.exp((position - this.minpos) * this.scale + this.minlval);

		var actualValue = round(Math.exp((sliderValue - this.state.minSlider) * scale + Math.log(offsetMin) ) - this.state.offset)
		
		if(actualValue > this.props.max)
		{	actualValue = this.props.max  }
		if(actualValue < this.props.min)
		{	actualValue = this.props.min  }

		//sticky numbers, so you can get to defaults more easily
		//if it's less than 1/25 the slider range away from the default, 
		//then make it the default
		var offsetDefault = this.props.default + this.state.offset	
		var sliderDefault = this.state.minSlider + (Math.log(offsetDefault) - Math.log(offsetMin) ) / scale

		//slider range is 0 to 1
		if(Math.abs(sliderValue - sliderDefault) < 1/25)
		{  actualValue = this.props.default }
		
		//old behavior just detects if you're 1/6 away from the default actual value
		//then the slider's stickiness depends on where it is on the logarithm
		//if(Math.abs(actualValue - this.props.default) < (this.props.default/6)
		//{  actualValue = this.props.default }

	
		this.props.updateState(actualValue, this.props.variable)
	}
	
  render() {
	
	var className
	if(this.props.display===false)
	{
		className="hide";
	}
	else
	{
		className="InputBox";
	}
	
	var UnitsStyle
	if(this.props.units!=null)
	{
		UnitsStyle={}
	}
	else
	{
		UnitsStyle={
			display:"none",
		}
	}
	
	
	var offsetMin = this.props.min + this.state.offset
	var offsetMax = this.props.max + this.state.offset
	var offsetValue = this.props.value + this.state.offset
	var scale = (Math.log(offsetMax) - Math.log(offsetMin))/(this.state.maxSlider - this.state.minSlider)
	
	//to slider
	//return this.minpos + (Math.log(value) - this.minlval) / this.scale;
	var sliderValue = this.state.minSlider + (Math.log(offsetValue) - Math.log(offsetMin) ) / scale

	
	var value=this.props.value; //round(this.props.value, 3);
	
	if(this.props.value===0 && this.state.focused)  //otherwise you are never able to backspace entirely. Frustrating.
	{  value="";  }
	
	var sliderclass
	var rangeclass
	var rangemin
	var rangemax
	const leftstyle = { float:'left' }
	const rightstyle = { float:'right' }
	const midstyle = { paddingLeft:'10px', color:'#ffadad', display:'inline-block', }
	
	var bignumber = ""
	if(this.props.value > 9999)
	{ bignumber = this.props.value.toExponential(0).replace("e+","x10^") }	
	
	if(Number(this.props.min)>=0 && Number(this.props.max) > 1)
	{ sliderclass="slider"
	  rangeclass="range"
	  rangemin=this.props.min.toString()
	  
	  if(this.props.max > 9999)
	  { 
		rangemax=this.props.max.toExponential(1)
		rangemax = rangemax.replace("e+"," x 10^")	}
	  else
	  { rangemax=round(this.props.max).toString() }
	}
	else
	{ sliderclass="hide" 
	  rangeclass="hide" }
	
	return(
		<table className={className}><tbody>
		  <tr><td>
				<input type='number' onFocus={this.onFocus} onBlur={this.onBlur} className="InputStyle" value={value} step="any" min={this.props.min} max={this.props.max} onChange={this.handleOutput} id={this.props.variable}/><div className="UnitsStyle" style={UnitsStyle}>{this.props.units}</div>
			</td>
			<td><input type='range' step={.01} className={sliderclass} min={0} max={1} value={sliderValue} onChange={this.handleSlider}/>
			</td>
		  </tr>
		  <tr>
			<td>{this.props.children}</td>
		    <td><div className={rangeclass}><div style={leftstyle}>{rangemin}</div><div style={midstyle}>{bignumber}</div><div style={rightstyle}>{rangemax}</div></div></td>
		  </tr>
		</tbody></table>
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




export default InputField;






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
