import React, { Component } from 'react';
import './App.css';
//import ReactDOM from 'react-dom'


class AngleInput extends Component {
	
	constructor(props) {
      super(props);
		
	  this.compassRef = React.createRef();
      this.state = { focused:false, compassSize: 30 }
	  this.onFocus = this.onFocus.bind(this);
	  this.onBlur = this.onBlur.bind(this);
	  this.handleOutput = this.handleOutput.bind(this);
	}
	
	onFocus() { this.setState({focused:true,})	}

	//onBlur() { this.setState({focused:false,})	}
	onBlur(e) { this.setState({focused:false,}); this.props.updateState(e)	}
	
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
	
	
	componentDidMount()
	{ this.componentDidUpdate(); }
	
	componentDidUpdate()
	{
		var compassSize = this.state.compassSize
		let canvas = this.compassRef.current;
		//let canvas = ReactDOM.findDOMNode(this.compassRef.current);
		let ctx = canvas.getContext('2d');
		
		ctx.clearRect(0, 0, compassSize, compassSize);
		
		ctx.beginPath();
		ctx.strokeStyle="#000000";	
		ctx.arc(compassSize/2, compassSize/2, compassSize/2, 0, 2 * Math.PI, false);
		
		var computedangle = (this.props.value * Math.PI / 180);
		var x = compassSize/2 * Math.sin(computedangle)
		var y = compassSize/2 * Math.cos(computedangle)
		
		ctx.moveTo(compassSize/2,compassSize/2)
		ctx.lineTo(compassSize/2-x, compassSize/2+y)
		ctx.stroke();

		ctx.lineWidth=2		
		ctx.beginPath();
		ctx.strokeStyle="#e02e0b";
		ctx.moveTo(compassSize/2,compassSize/2)
		ctx.lineTo(compassSize/2+x, compassSize/2-y)
		ctx.stroke();		
	}
	
	handleOutput(e) {
		
		var value = Number(e.target.value)

		//sticky numbers, so you can get to the defaults more easily
			//(Only do this for the slider.)
		if(e.target.type==="range" && Math.abs(value-this.props.default) < 5)
		{ value = this.props.default; }
		
		this.props.updateState(value, this.props.variable)
	}

	
	render() {
	
	var UnitsStyle
	if(this.props.units!=null)
	{	UnitsStyle={ width:"15px", }	}
	else
	{	UnitsStyle={ display:"none", }  }
	
	const compassStyle= {
		marginLeft:"0px",
		marginTop:"1px",
		backgroundColor:"white",
		borderRadius:'50%',
		padding:'1px',
	}

	var value=this.props.value;
	if(this.props.value===0 && this.state.focused)  //otherwise you are never able to backspace entirely. Frustrating.
	{  value="";  }

	
	const spanstyle={
		fontSize:'14px',
		color:'#adccff',
		//width:'155px',
		textAlign:'center',
	}
		
	var simplified=""
	var simplified2=""
	var plural="s"
		
	if(this.props.droppedflag)
	{  simplified="(dropped)" }
	else if(this.props.value===0)
	{  simplified="(thrown straight up)"	}
	else if(this.props.value===90)
	{  simplified="(thrown straight right)"
	   //simplified2="or “opposite” the station)" 
	}
	else if(this.props.value===-90)
	{  simplified="(thrown straight left)"
	   //simplified2="or “with” the station)" 
	}
	else if(Math.abs(this.props.value)===180)
	{  simplified="(thrown straight down)" }
	else if(this.props.value > 0 && this.props.value < 45)
	{  if(this.props.value===1){plural=""}
	   simplified="(thrown " + this.props.value.toString() + " degree" + plural +" to the right)" }
	else if(this.props.value < 0 && this.props.value > -45)
	{  if(this.props.value===-1){plural=""}
	   simplified="(thrown " + Math.abs(this.props.value).toString() + " degree" + plural +" to the left)" }
	else if(this.props.value > 90)
	{  if(this.props.value===91){plural=""}
	   simplified="(thrown " + (this.props.value-90).toString() + " degree" + plural +" down from horizontal)"
	   //simplified2="and to the right)"// or “opposite” the station)"
	}
	else if(this.props.value < -90)
	{  if(this.props.value===-91){plural=""}
	   simplified="(thrown " + ((-1*this.props.value)-90).toString() + " degree" + plural +" down from horizontal)"
	   //simplified2="to the left or “with” the station)"
	}
	else if(this.props.value >= 45 && this.props.value < 90)
	{  if(this.props.value===89){plural=""}
	   simplified="(thrown " + (90-this.props.value).toString() + " degree" + plural +" up from horizontal)"
	   //simplified2="to the right or “opposite” the station)" 
	}
	else if(this.props.value <= -45 && this.props.value > -90)
	{  if(this.props.value===-89){plural=""}
	   simplified="(thrown " + (90-(-1*this.props.value)).toString() + " degree" + plural +" up from horizontal)"
	   //simplified2="to the left or “with” the station)" 
	}
	/*else if(Math.abs(this.props.value) > 90)
	{ simplified="(thrown " + (Math.abs(this.props.value)-90).toString() + " degrees “down”)" }*/
	/*else if(Math.abs(this.props.value) >= 80 && Math.abs(this.props.value) < 90)
	{ simplified="(thrown " + (90-Math.abs(this.props.value)).toString() + " degrees “up”)"}*/
	
	const leftstyle = { float:'left' }
	const rightstyle = { float:'right' }
	const small = { fontSize:'0.85em' }

	return(
			<table className="InputBox" style={small}><tbody>
				<tr><td>
						<table style={{marginBottom:'-5px', marginTop:'-5px'}}><tbody><tr><td><canvas ref={this.compassRef} style={compassStyle} width={this.state.compassSize.toString()} height={this.state.compassSize.toString()} /></td>
							<td><input type='number' className="InputStyle" onFocus={this.onFocus} onBlur={this.onBlur} value={value} step="any" min={this.props.min} max={this.props.max} onChange={this.handleOutput} style={{width:'50px'}}/><div className="UnitsStyle" style={UnitsStyle}>{this.props.units}</div>
							</td></tr></tbody></table>
					</td>
					<td><input type='range' className="slider" min={this.props.min} max={this.props.max} step={1} value={this.props.value} onChange = {this.handleOutput} /></td>
				</tr>
				<tr>
					<td><div style={spanstyle}>{simplified}<br/>{simplified2}</div></td>
					<td><div className="range"><div style={leftstyle}>{this.props.min}</div><div style={rightstyle}>{this.props.max}</div></div></td>
				</tr>
			</tbody></table>
	
	  );
	}
}

export default AngleInput;




