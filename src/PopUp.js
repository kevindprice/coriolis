import React, { Component } from 'react';
import './App.css';


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

export default PopUp;
