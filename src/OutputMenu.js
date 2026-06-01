/*eslint-disable eqeqeq*/

import React, { Component } from 'react';
import './App.css';

class OutputMenu extends Component {

	constructor(props) {
	    super(props);
	    this.messagesEndRef = React.createRef();
	  }

	// Only re-render when the panel is visible or its visibility is changing
	shouldComponentUpdate(newProps) {
		return newProps.statsOpen || this.props.statsOpen;
	}

	// After opening the menu, scroll down 200 pixels
	componentDidUpdate() {
	    // This fires every time props or state change and the UI rerenders
	    if(this.props.statsOpen){ this.scrollToBottom(); }
	    else{ this.scrollToTop(); }
	}

	// 1. Defined as an arrow function to fix the TypeError
	  scrollToBottom = () => {
	    // 2. setTimeout delays the scroll just enough for the parent rerender to finish
	    setTimeout(() => { //messagesEndRef is triggered by a div at the bottom
	      if (this.messagesEndRef.current) {
	        this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
	      }
	    }, 0); 
	  };

	  scrollToTop = () => {
	    // 2. setTimeout delays the scroll just enough for the parent rerender to finish
	    setTimeout(() => { 
	      window.scrollTo({
		  top: 0,
		  left: 0,
		  behavior: 'smooth'
		});
	    }, 0); 
	  };

	render() {
		const vars = this.props.vars;

		// ── Rotation speed display ─────────────────────────────────────────────
		var rotation = vars.rotation;
		var time_to_rotate = 1 / rotation;
		var time_to_rotate_units = "s";

		if (rotation < 1) { rotation = rotation * 60; }
		if (rotation < 1) {
			rotation = rotation * 60;
			time_to_rotate = time_to_rotate / 60;
			time_to_rotate_units = "min";
		}
		if (rotation < 0.5) {
			rotation = rotation * 24;
			time_to_rotate = time_to_rotate / 60;
			time_to_rotate_units = "hr";
		}

		// ── Secondary units (cm / in) ──────────────────────────────────────────
		var secondaryunits = vars.units === "ft" ? "in" : "cm";
		var displaysecondary = "hide";
		var finalseparation2, expecteddist2;
		if (vars.finalseparation < 1.0) {
			finalseparation2 = vars.units === "ft"
				? vars.finalseparation * 12
				: vars.finalseparation * 100;
			expecteddist2 = vars.units === "ft"
				? vars.expecteddist * 12
				: vars.expecteddist * 100;
			displaysecondary = "";
		}

		// ── Conditional rows ───────────────────────────────────────────────────
		var showCurvy = "";
		if (format(vars.curvilinear) == format(vars.finalseparation))
			{ showCurvy = "hide"; }

		var rotationAngle = "";
		var numRotations  = "hide";
		if (vars.theta_traversed_person > Math.PI || !isFinite(vars.theta_traversed_person))
			{ numRotations = ""; rotationAngle = "hide"; }
		
		
		var floatBottom="floating-bottom"; //Tightly place the stats bar on the screen bottom, unless it's open
		if (this.props.statsOpen){floatBottom="";}
		
		return (
			<div id="stats-panel" className={floatBottom}>

				{/* ── Toggle header ──────────────────────────────────────────── */}
				<div id="stats-panel-toggle" onClick={this.props.toggleStats}>
					<span>Statistics</span>
					<span>{ this.props.children }</span>
					<span className="stats-arrow">{this.props.statsOpen ? '▲' : '▼'}</span>
				</div>

				{/* ── Panel body (only when open) ────────────────────────────── */}
				{this.props.statsOpen && (
				<div id="stats-panel-body">
					<div id="stats-panel-content">

						{/* Left column — station vs Earth comparison table */}
						<div className="stats-col">
							<div id="outeroutputtable">
							<table id="innertable"><tbody>
								<tr className="border_bottom">
									<td><h3>&emsp;</h3></td>
									<td className="redcolor">On station</td>
									<td className="bluecolor">On Earth</td>
								</tr>
								<tr>
									<td className="borderright">Time in the air</td>
									<td><div className="output1">{format(vars.time)}&nbsp;s</div></td>
									<td><div className="output1">{format(vars.expectedtime)}&nbsp;s</div></td>
								</tr>
								<tr>
									<td className="borderright">Max height reached</td>
									<td><div className="output1">{format(vars.maxheight)}&nbsp;{vars.units}</div></td>
									<td><div className="output1">{format(vars.expectedheight)}&nbsp;{vars.units}</div></td>
								</tr>
								<tr id="boldrow">
									<td className="borderright">
										<div className="redcolor">
											<div>Straight-line</div><div>distance "away"</div><div>at landing</div>
										</div>
									</td>
									<td>
										<div className="output1">{format(vars.finalseparation)}</div>
										<div className="output1">&nbsp;{vars.units}</div>
										<div className={displaysecondary}>({format(finalseparation2)}&nbsp;{secondaryunits})</div>
									</td>
									<td>
										<div className="output1">{format(vars.expecteddist)}</div>
										<div className="output1">&nbsp;{vars.units}</div>
										<div className={displaysecondary}>({format(expecteddist2)}&nbsp;{secondaryunits})</div>
									</td>
								</tr>
							</tbody></table>
							</div>
						</div>

						{/* Right column — secondary statistics */}
						<div className="stats-col">
							<table className="secondtable"><tbody>
								<tr className={showCurvy}>
									<td><div className="leftoutput">Distance "away" <i>along floor</i> at landing:</div></td>
									<td>{format(vars.curvilinear)}</td>
									<td>{vars.units}</td>
								</tr>
								<tr>
									<td><div className="leftoutput">Time to complete one rotation:</div></td>
									<td>{format(time_to_rotate)}</td>
									<td>{time_to_rotate_units}</td>
								</tr>
								<tr className={rotationAngle}>
									<td><div className="leftoutput">Angle the person rotates while the coin is midair:</div></td>
									<td>{format(vars.theta_traversed_person * 180 / Math.PI)}</td>
									<td>°</td>
								</tr>
								<tr className={numRotations}>
									<td><div className="leftoutput">Rotations the person completes while the coin is midair:</div></td>
									<td>{format(vars.theta_traversed_person / (2 * Math.PI))}</td>
									<td>rev</td>
								</tr>
								<tr>
									<td><div className="leftoutput">Object's speed before throw:</div></td>
									<td>{format(Math.abs(vars.standingcoin))}</td>
									<td>{vars.units}/s</td>
								</tr>
							</tbody></table>
						</div>

					</div>{/* stats-panel-content */}

					<div id="stats-panel-footer">
						<button
							id="back-to-top"
							onClick={() => { this.props.toggleStats(); }}>
							↑ Back to model
						</button>
					</div>

				</div>
				)}{/* stats-panel-body */}
				
			    <div ref={this.messagesEndRef} />

			</div>
		);
	}
}


function format(num) {
	num = round(num);
	if (!isFinite(num)) return "∞";
	if (num < 99999) return num.toString();
	return num.toExponential(0).replace("e+", "*10^");
}

function round(num, places) {
	if (num === 0) return 0;
	if (places == null && num > 1) {
		var order = Math.floor(Math.log(num) / Math.LN10 + 0.000000001);
		places = (order * -1) + 3;
	} else if (places == null) {
		places = 2;
	}
	var multiplier = Math.pow(10, places);
	var output = Math.round(num * multiplier) / multiplier;
	if (Math.abs(output - Math.round(output)) <= 0.0011)
		{ output = Math.round(output); }
	return output;
}

export default OutputMenu;
