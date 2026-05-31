import React, { Component } from 'react';
import './App.css';
import imagefile from './img/silhouette.png'
import image2    from './img/silhouette2.png'

// All mutable canvas state lives on the instance now (was module-level globals).
// Two CanvasSpace instances can coexist without clobbering each other.

class CanvasSpace extends Component {

	constructor() {
		super();

		this.state = { width: null, height: null };

		this.namesp = {
			currentframe:  null,
			relativepoints: null,
			canvaspoints:  null,
			minmaxes:      null,
			lastpoint:     null,
			dimensions:    null,
		};
		this.timeouts = {
			movetimeout:   null,
			repeattimeout: null,
			sourceready:   false,
			delayrefresh:  null,
		};
		this.canvasParent  = null;   // captured in componentDidMount
		this.canvasElement = null;   // captured in componentDidMount

		this.updateCanvasSize    = this.updateCanvasSize.bind(this);
		this.loadImage           = this.loadImage.bind(this);
		this.update_canvaspoints = this.update_canvaspoints.bind(this);
		this.update_all_points   = this.update_all_points.bind(this);
		this.draw_canvas_partial = this.draw_canvas_partial.bind(this);
		this.draw_canvas_full    = this.draw_canvas_full.bind(this);
		this.setDimensions       = this.setDimensions.bind(this);
		this.restart_interval    = this.restart_interval.bind(this);
		this.sendRotation        = this.sendRotation.bind(this);

		this.parentDiv      = React.createRef();
		this.spaceCanvasRef = React.createRef();
		this.resizeObserver = null;
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────────

	observe = RO => {
		this.resizeObserver = new RO(entries => {
			const { width, height } = entries[0].contentRect;
			this.setState({ width, height });
		});
	};

	componentWillUnmount() {
		if (this.resizeObserver) { this.resizeObserver.disconnect(); }
		clearTimeout(this.timeouts.movetimeout);
		clearTimeout(this.timeouts.repeattimeout);
	}

	componentDidMount() {
		this.canvasParent  = this.parentDiv.current;
		this.canvasElement = this.spaceCanvasRef.current;

		if ("ResizeObserver" in window) {
			this.observe(ResizeObserver);
			this.resizeObserver.observe(this.canvasParent);
		} else {
			window.addEventListener('resize', () => { this.updateCanvasSize(); });
		}

		this.loadImage();
	}

	loadImage() {
		this.silhouette  = new window.Image();
		this.silhouette2 = new window.Image();

		if ((this.props.vars.startheight === 4   && this.props.vars.units === "ft") ||
		    (this.props.vars.startheight === 1.2  && this.props.vars.units === "m"))
			{ this.silhouette.onload  = this.updateCanvasSize.bind(this); }
		else
			{ this.silhouette2.onload = this.updateCanvasSize.bind(this); }

		this.silhouette.src  = imagefile;
		this.silhouette2.src = image2;
	}

	updateCanvasSize() {
		const width  = this.canvasParent.clientWidth;
		const height = this.canvasParent.clientHeight;
		this.setState({ width, height });
	}

	setDimensions() {
		const ctx = this.canvasElement.getContext('2d');

		const d = {};
		d.units         = this.props.vars.units;
		d.width         = ctx.canvas.clientWidth;
		d.height        = ctx.canvas.clientHeight;
		d.X_BUFFER      = d.width  / 10;
		d.Y_BUFFER      = d.height / 8;
		d.DRAWING_WIDTH  = d.width  - 2 * d.X_BUFFER;
		d.DRAWING_HEIGHT = d.height - 2 * d.Y_BUFFER;
		d.DELAY_BETWEEN_DRAWS = 2.5;
		d.menuLeftOpen  = this.props.vars.menuLeftOpen;
		d.menuRightOpen = this.props.vars.menuRightOpen;
		d.defaultheight = this.props.defaults.startheight;

		if      (d.height < 350) { d.Y_BUFFER /= 1.5; }
		else if (d.height > 500) { d.Y_BUFFER *= 1.25; }

		this.namesp.dimensions = d;
	}

	shouldComponentUpdate(newProps, newState) {
		if (this.props.vars.slope        === newProps.vars.slope &&
			this.props.vars.time         === newProps.vars.time &&
			this.props.vars.radius       === newProps.vars.radius &&
			this.props.vars.omega        === newProps.vars.omega &&
			this.props.vars.startheight  === newProps.vars.startheight &&
			this.props.vars.start_v_x    === newProps.vars.start_v_x &&
			this.props.vars.start_v_y    === newProps.vars.start_v_y &&
			this.props.vars.units        === newProps.vars.units &&
			this.props.vars.menuLeftOpen  === newProps.vars.menuLeftOpen &&
			this.props.vars.menuRightOpen === newProps.vars.menuRightOpen &&
			this.props.vars.frozen       === newProps.vars.frozen &&
			this.props.vars.percenttime  === newProps.vars.percenttime &&
			this.state.height            === newState.height &&
			this.state.width             === newState.width
		) { return false; }
		else { return true; }
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.props.vars.startheight !== prevProps.vars.startheight ||
		    this.props.vars.speed       !== prevProps.vars.speed ||
		    this.props.vars.radius      !== prevProps.vars.radius ||
		    this.props.vars.omega       !== prevProps.vars.omega ||
		    this.props.vars.units       !== prevProps.vars.units)
		{
			this.setDimensions();
			this.update_all_points();
			this.draw_canvas_full();
		}
		else if ((prevProps.vars.percenttime > 20 && this.props.vars.percenttime < 20) ||
		         (prevProps.vars.percenttime > 50 && this.props.vars.percenttime < 50))
		{
			const oldlength = this.namesp.canvaspoints.length;
			this.update_all_points();
			this.namesp.currentframe = Math.floor(
				(this.namesp.currentframe / oldlength) * this.namesp.canvaspoints.length);
			this.draw_canvas_partial();
		}
		else if ((this.props.vars.menuLeftOpen  !== prevProps.vars.menuLeftOpen) ||
		         (this.props.vars.menuRightOpen !== prevProps.vars.menuRightOpen))
		{
			this.setDimensions();
			this.update_canvaspoints();
			this.draw_canvas_partial();
		}
		else if (((this.state.width  !== prevState.width) ||
		          (this.state.height !== prevState.height)) &&
		         this.namesp.relativepoints !== null)
		{
			this.setDimensions();
			this.update_canvaspoints();
			this.draw_canvas_partial();
		}
		else {
			this.setDimensions();
			this.update_all_points();
			this.draw_canvas_full();
		}

		this.sendRotation();
	}

	// ── Instance methods ───────────────────────────────────────────────────────

	sendRotation() {
		const { minmaxes, dimensions } = this.namesp;
		const point = canvasPoint(0, this.props.vars.radius, minmaxes, dimensions);

		const duration = Number(this.props.vars.omega) === 0
			? 0
			: (1 / (this.props.vars.omega / (2 * Math.PI))) * 1000;

		this.props.sendRotation({ centerX: point.x, centerY: point.y, duration });
	}

	update_canvaspoints() {
		const { relativepoints, dimensions } = this.namesp;
		this.namesp.minmaxes     = minmax(relativepoints, dimensions);
		this.namesp.canvaspoints = buildCanvaspoints(
			relativepoints, this.namesp.minmaxes, dimensions);
	}

	update_all_points() {
		const v = this.props.vars;
		const relativepoints = getRelativePoints(
			v.slope, v.time, v.radius, v.omega,
			v.startheight, v.start_v_x, v.start_v_y, v.percenttime);

		this.namesp.minmaxes      = minmax(relativepoints, this.namesp.dimensions);
		this.namesp.relativepoints = relativepoints;
		this.namesp.canvaspoints  = buildCanvaspoints(
			relativepoints, this.namesp.minmaxes, this.namesp.dimensions);
		this.namesp.lastpoint     = relativepoints[relativepoints.length - 1];
	}

	_silhouette() {
		return this.props.vars.startheight === this.props.defaults.startheight
			? this.silhouette : this.silhouette2;
	}

	restart_interval() {
		clearTimeout(this.timeouts.movetimeout);   this.timeouts.movetimeout  = null;
		clearTimeout(this.timeouts.repeattimeout); this.timeouts.repeattimeout = null;

		const ctx = this.canvasElement.getContext('2d');
		if (!this.props.vars.frozen) {
			draw_curve_active(ctx,
				this.props.vars.time, this.props.vars.percenttime,
				this.props.vars.radius, this._silhouette(), this.props.vars.startheight,
				this.namesp, this.timeouts, this.namesp.currentframe);
		}
	}

	draw_canvas_partial() {
		clearTimeout(this.timeouts.movetimeout);   this.timeouts.movetimeout  = null;
		clearTimeout(this.timeouts.repeattimeout); this.timeouts.repeattimeout = null;

		const ctx = this.canvasElement.getContext('2d');
		const sil = this._silhouette();
		const { minmaxes, dimensions, canvaspoints, lastpoint, currentframe } = this.namesp;

		reset_canvas(ctx, this.props.vars.radius, lastpoint, sil,
			this.props.vars.startheight, minmaxes, dimensions);

		if (this.props.vars.frozen) {
			draw_curve_static(ctx, canvaspoints, dimensions);
		} else {
			draw_curve_static(ctx, canvaspoints.slice(0, currentframe), dimensions, "nocircle");
			draw_curve_active(ctx,
				this.props.vars.time, this.props.vars.percenttime,
				this.props.vars.radius, sil, this.props.vars.startheight,
				this.namesp, this.timeouts, currentframe);
		}
	}

	draw_canvas_full() {
		this.namesp.currentframe = 1;
		clearTimeout(this.timeouts.repeattimeout); this.timeouts.repeattimeout = null;
		clearTimeout(this.timeouts.movetimeout);   this.timeouts.movetimeout   = null;

		const ctx = this.canvasElement.getContext('2d');
		const sil = this._silhouette();

		if (this.props.vars.frozen) {
			reset_canvas(ctx, this.props.vars.radius, this.namesp.lastpoint, sil,
				this.props.vars.startheight, this.namesp.minmaxes, this.namesp.dimensions);
			draw_curve_static(ctx, this.namesp.canvaspoints, this.namesp.dimensions);
		} else {
			draw_curve_active(ctx,
				this.props.vars.time, this.props.vars.percenttime,
				this.props.vars.radius, sil, this.props.vars.startheight,
				this.namesp, this.timeouts);
		}
	}

	render() {
		return (
			<div ref={this.parentDiv} className="canvasParent"
				style={{ width: '100%', height: '100%', position: 'absolute' }}>
				<canvas ref={this.spaceCanvasRef}
					width={this.state.width} height={this.state.height} />
			</div>
		);
	}
}


// ── Pure utilities ─────────────────────────────────────────────────────────────

function round(num, places) {
	if (places === null || places === undefined) { places = 1; }
	const multiplier = Math.pow(10, places);
	let output = Math.round(num * multiplier) / multiplier;
	if (Math.abs(output - Math.round(output)) <= 0.0011) { output = Math.round(output); }
	return output;
}


// ── Point generation ───────────────────────────────────────────────────────────

function getRelativePoints(slope, time, radius, omega, startheight, start_v_x, start_v_y, percenttime) {
	let time_increment;
	if      (time < 1.2) { time_increment = time / 130; }
	else if (time > 50)  { time_increment = time / 6500; }
	else                 { time_increment = 0.0077; }

	if      (percenttime < 10) { time_increment /= 5; }
	else if (percenttime < 50) { time_increment /= 2; }

	const pointsList = [];
	let point;
	if (time > 0) {
		for (let t = 0; t <= Number(time); t += time_increment) {
			point = new RelativePoint(t, Number(radius), Number(omega),
				Number(startheight), Number(start_v_x), Number(start_v_y));
			pointsList.push(point);
		}
		point = new RelativePoint(Number(time), Number(radius), Number(omega),
			Number(startheight), Number(start_v_x), Number(start_v_y));
		pointsList.push(point);
	} else if (time === 0 || !isFinite(time)) {
		point = new RelativePoint(0, Number(radius), 0, Number(startheight), 0, 0);
		pointsList.push(point);
	}
	return pointsList;
}

function RelativePoint(time, radius, omega, startheight, start_v_x, start_v_y) {
	let angle_hop = (3 * Math.PI / 2) - (omega * time);
	while (angle_hop > 2 * Math.PI) { angle_hop -= 2 * Math.PI; }

	const x_person = radius * Math.cos(angle_hop);
	const y_person = radius * Math.sin(angle_hop);
	const x_coin   = start_v_x * time;
	const y_coin   = start_v_y * time - (radius - startheight);
	const x_diff   = x_coin - x_person;
	const y_diff   = y_coin - y_person;
	const persontoCoin = Math.sqrt(x_diff * x_diff + y_diff * y_diff);

	const angle_oph = Math.atan(y_person / x_person);
	let angle_cph, angle_cpo, x_rel;

	if (y_diff > 0) {
		angle_cph = (Math.PI / 2) - Math.atan(x_diff / y_diff);
		angle_cpo = angle_cph - angle_oph;
		x_rel     = -1 * persontoCoin * Math.sin(angle_cpo);
	} else {
		if (x_diff > 0) {
			angle_cph = -1 * Math.atan(y_diff / x_diff);
		} else {
			angle_cph = Math.atan(x_diff / y_diff) + (Math.PI / 2);
		}
		angle_cpo = angle_cph + angle_oph;
		x_rel     = persontoCoin * Math.sin(angle_cpo);
	}

	let y_rel = persontoCoin * Math.cos(angle_cpo);

	// Rare: person has traversed a full half-arc into quadrant 1 or 4
	if (x_person > 0) { x_rel = -x_rel; y_rel = -y_rel; }

	this.persontoCoin = persontoCoin;
	this.x    = x_rel;
	this.y    = y_rel;
	this.time = time;
}


// ── Canvas-coordinate helpers ──────────────────────────────────────────────────

// Convert a physics (relX, relY) coordinate — or a RelativePoint — to canvas pixels.
function canvasPoint(x, y, minmaxes, dimensions) {
	if (typeof x !== "number") { y = x.y; x = x.x; }
	return {
		x: ((((x - minmaxes.minX) / minmaxes.range) * minmaxes.canvasSize)
		    + minmaxes.offsetX) + dimensions.X_BUFFER,
		y: dimensions.DRAWING_HEIGHT
		    - ((y / minmaxes.range) * minmaxes.canvasSize)
		    + dimensions.Y_BUFFER,
	};
}

function buildCanvaspoints(relativepoints, minmaxes, dimensions) {
	const pts = [];
	let i = 0;
	for (let inc = 0; inc < relativepoints.length; inc++) {
		i = Math.ceil(inc);
		if (i >= relativepoints.length) break;
		pts.push(canvasPoint(relativepoints[i], null, minmaxes, dimensions));
	}
	if (i !== relativepoints.length - 1) {
		pts.push(canvasPoint(relativepoints[relativepoints.length - 1], null, minmaxes, dimensions));
	}
	return pts;
}

function minmax(pointlist, dimensions) {
	let minX = pointlist[0].x;
	let maxX = pointlist[0].x;
	let maxY;

	if (dimensions.units === "ft") {
		if (pointlist[0].x < 1) { maxX = 1; }
		maxY = 6;
	} else {
		if (pointlist[0].x < 1) { maxX = 0.3048; }
		maxY = 1.829;
	}
	let minY = 0;

	for (let i = 0; i < pointlist.length; i++) {
		if (pointlist[i].x < minX) minX = pointlist[i].x;
		if (pointlist[i].x > maxX) maxX = pointlist[i].x;
		if (pointlist[i].y < minY) minY = pointlist[i].y;
		if (pointlist[i].y > maxY) maxY = pointlist[i].y;
	}

	const rangeX = Math.abs(maxX - minX);
	const rangeY = Math.abs(maxY - minY);
	const range  = rangeX > rangeY ? rangeX : rangeY;

	const canvasSize = (dimensions.DRAWING_WIDTH / dimensions.DRAWING_HEIGHT < rangeX / rangeY)
		? dimensions.DRAWING_WIDTH : dimensions.DRAWING_HEIGHT;

	const offsetX = (dimensions.DRAWING_WIDTH - (rangeX / range) * canvasSize) / 2;

	let directionLeft = true;
	if (pointlist.length > 10) {
		if (pointlist[10].x - pointlist[0].x > 1e-4) { directionLeft = false; }
	}

	return { minX, maxX, minY, maxY, range, canvasSize,
		pxperfoot: canvasSize / range, directionLeft, offsetX, rangeX, rangeY };
}


// ── Drawing functions ──────────────────────────────────────────────────────────

function draw_curve_static(ctx, canvaspoints, dimensions, nocircle) {
	ctx.beginPath();
	ctx.strokeStyle = "#5c6870";
	ctx.arc(canvaspoints[0].x, canvaspoints[0].y, 5, 0, 2 * Math.PI);
	ctx.stroke();

	ctx.beginPath();
	ctx.strokeStyle = "#000000";
	ctx.moveTo(canvaspoints[0].x, canvaspoints[0].y);
	for (let i = 1; i < canvaspoints.length; i++) {
		ctx.lineTo(canvaspoints[i].x, canvaspoints[i].y);
	}
	ctx.stroke();

	if (typeof nocircle === 'undefined') {
		ctx.beginPath();
		ctx.strokeStyle = "#5c6870";
		ctx.arc(canvaspoints[canvaspoints.length - 1].x,
		        canvaspoints[canvaspoints.length - 1].y, 5, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.strokeStyle = "#000000";
	}
}

// namesp and timeouts are passed explicitly — this function is instance-safe.
// The moveline closure mutates namesp.currentframe / timeouts.movetimeout via
// object reference, so the instance sees every change.
function draw_curve_active(ctx, time, percenttime, radius, silhouette, startheight,
                           namesp, timeouts, currentframe) {
	const canvaspoints = namesp.canvaspoints;
	const dimensions   = namesp.dimensions;
	const lastpoint    = namesp.lastpoint;

	if (timeouts.repeattimeout !== null) {
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout = null;
		clearTimeout(timeouts.movetimeout);   timeouts.movetimeout   = null;
	}

	if (currentframe == null) {
		reset_canvas(ctx, radius, lastpoint, silhouette, startheight,
			namesp.minmaxes, dimensions);
		namesp.currentframe = 1;
		ctx.beginPath();
		ctx.strokeStyle = "#5c6870";
		ctx.arc(canvaspoints[0].x, canvaspoints[0].y, 5, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.strokeStyle = "#000000";
	}

	const framespersecond     = 38;
	const pointspersecond     = canvaspoints.length / (time * (100 / percenttime));
	const pointsperframegoal  = pointspersecond / framespersecond;
	const pointsperframeactual = Math.ceil(pointsperframegoal);
	const offset              = pointsperframeactual / pointsperframegoal;
	const time_delay_in_ms    = (1 / framespersecond) * offset * 1000;

	function moveline() {
		if (namesp.currentframe >= canvaspoints.length) {
			clearTimeout(timeouts.movetimeout); timeouts.movetimeout = null;
			timeouts.repeattimeout = setTimeout(function () {
				draw_curve_active(ctx, time, percenttime, radius, silhouette,
					startheight, namesp, timeouts);
			}, dimensions.DELAY_BETWEEN_DRAWS * 1000);
			ctx.beginPath();
			ctx.strokeStyle = "#5c6870";
			ctx.arc(canvaspoints[canvaspoints.length - 1].x,
			        canvaspoints[canvaspoints.length - 1].y, 5, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.strokeStyle = "#000000";
			return;
		}

		ctx.beginPath();
		ctx.moveTo(canvaspoints[namesp.currentframe - 1].x,
		           canvaspoints[namesp.currentframe - 1].y);

		for (let x = 0; x < pointsperframeactual; x++) {
			if (namesp.currentframe >= canvaspoints.length) {
				clearTimeout(timeouts.movetimeout); timeouts.movetimeout = null;
				ctx.stroke();
				timeouts.repeattimeout = setTimeout(function () {
					draw_curve_active(ctx, time, percenttime, radius, silhouette,
						startheight, namesp, timeouts);
				}, dimensions.DELAY_BETWEEN_DRAWS * 1000);
				ctx.beginPath();
				ctx.strokeStyle = "#5c6870";
				ctx.arc(canvaspoints[canvaspoints.length - 1].x,
				        canvaspoints[canvaspoints.length - 1].y, 5, 0, 2 * Math.PI);
				ctx.stroke();
				ctx.strokeStyle = "#000000";
				return;
			}
			ctx.lineTo(canvaspoints[namesp.currentframe].x,
			           canvaspoints[namesp.currentframe].y);
			namesp.currentframe += 1;
		}
		ctx.stroke();

		if (namesp.currentframe <= canvaspoints.length) {
			timeouts.movetimeout = setTimeout(moveline, time_delay_in_ms);
		}
	}

	timeouts.movetimeout = setTimeout(moveline, time_delay_in_ms);
}

function scale_increment() {
	this.series = -1;
	this.run = function (value) {
		this.series += 1;
		if (this.series === 4) { this.series = 0; }
		return this.series !== 2 ? (value *= 2) : (value += value / 4);
	};
}

function scalemark(radius, angle, minmaxes, value, dimensions) {
	const x1 = (radius - 5 / minmaxes.pxperfoot) * Math.cos(angle);
	const x2 = (radius + 5 / minmaxes.pxperfoot) * Math.cos(angle);
	const y1 = (radius - 5 / minmaxes.pxperfoot) * Math.sin(angle) + radius;
	const y2 = (radius + 5 / minmaxes.pxperfoot) * Math.sin(angle) + radius;

	this.start = canvasPoint(x1, y1, minmaxes, dimensions);
	this.end   = canvasPoint(x2, y2, minmaxes, dimensions);
	this.angle = angle;

	const len = value.toString().length;
	this.numberspot = {
		x: this.end.x - len * 3 + len * 3 * Math.cos(angle) + 10 * Math.cos(angle),
		y: this.end.y - 15 * Math.sin(angle) + 3 * (Math.sin(angle) + 1),
	};
	this.value = value;
}

function draw_scale(ctx, radius, lastpoint, minmaxes, dimensions) {
	const scale_color = "#9dfcdb";

	let half_chord_value = lastpoint.persontoCoin / (2 * radius);
	if (half_chord_value > 1) { half_chord_value = 1; }
	const chord_angle = 2 * Math.asin(half_chord_value);

	const start = 3 * Math.PI / 2;
	const end   = lastpoint.x < 0 ? start - chord_angle : start + chord_angle;
	const arc_per_foot = 1 / radius;

	let increment = 1;
	const inc_fn = new scale_increment();
	while (minmaxes.pxperfoot * increment < 25) { increment = inc_fn.run(increment); }
	if (increment.toString().length >= 3 || (chord_angle * radius) > 1000) {
		while (minmaxes.pxperfoot * increment < 45) { increment = inc_fn.run(increment); }
	}

	let i = 0;
	const marks = [];
	if (lastpoint.x < 0) {
		for (let a = start; a > end - arc_per_foot * increment; a -= arc_per_foot * increment) {
			marks.push(new scalemark(radius, a, minmaxes, i, dimensions)); i += increment;
		}
	} else {
		for (let a = start; a < end + arc_per_foot * increment; a += arc_per_foot * increment) {
			marks.push(new scalemark(radius, a, minmaxes, i, dimensions)); i += increment;
		}
	}

	if (marks.length === 2) {
		const a2 = ((marks[1].angle - start) * -1) + start;
		marks.push(new scalemark(radius, a2, minmaxes, marks[1].value, dimensions));
	}

	ctx.font      = "bold 14px Arial";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.fillStyle = ctx.strokeStyle = scale_color;
	for (i = 0; i < marks.length; i++) {
		const m = marks[i];
		ctx.moveTo(m.start.x, m.start.y);
		ctx.lineTo(m.end.x,   m.end.y);
		ctx.fillText(m.value.toString(), m.numberspot.x, m.numberspot.y);
	}
	ctx.stroke();
	ctx.fillStyle = ctx.strokeStyle = "#000000";
	ctx.lineWidth = 2;
}

function reset_canvas(ctx, radius, lastpoint, silhouette, startheight, minmaxes, dimensions) {
	ctx.clearRect(0, 0, dimensions.width, dimensions.height);
	draw_floor(ctx, radius, minmaxes, dimensions);
	if (silhouette !== null) {
		draw_silhouette(ctx, silhouette, minmaxes, dimensions, dimensions.defaultheight);
	}
	if (startheight !== dimensions.defaultheight) {
		canvas_arrow(ctx, startheight, minmaxes, dimensions);
	}
	draw_scale(ctx, radius, lastpoint, minmaxes, dimensions);
}

function canvas_arrow(ctx, startheight, minmaxes, dimensions) {
	const origin = canvasPoint(0, 0,          minmaxes, dimensions);
	const start  = canvasPoint(0, startheight, minmaxes, dimensions);

	const fromx    = origin.x;
	const fromy    = origin.y;
	const tox      = start.x;
	const toy      = start.y + 7;
	const headlen  = 10;
	const angle    = Math.atan2(toy - fromy, tox - fromx);
	const pxheight = fromy - toy;

	if (pxheight > 15) {
		ctx.font      = "bold 14px Arial";
		ctx.beginPath();
		ctx.strokeStyle = ctx.fillStyle = "red";
		ctx.lineWidth = 1.5;
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox,   toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6),
		           toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6),
		           toy - headlen * Math.sin(angle + Math.PI / 6));
		ctx.fillText(round(startheight).toString() + " " + dimensions.units,
			fromx + 5, fromy - pxheight / 2);
		ctx.stroke();
		ctx.strokeStyle = ctx.fillStyle = "#000000";
		ctx.lineWidth = 1;
	}
}

function draw_silhouette(ctx, silhouette, minmaxes, dimensions, startheight) {
	const origin         = canvasPoint(0, 0, minmaxes, dimensions);
	const px_startheight = minmaxes.pxperfoot * startheight;
	const numpixtotop    = px_startheight * 830 / 539;
	const drawing_top    = origin.y - numpixtotop;
	const px_width       = numpixtotop * 323 / 831;
	const px_offset_left = px_width * 24 / 323;

	if (minmaxes.directionLeft) {
		drawImage(ctx, silhouette, origin.x - px_offset_left, drawing_top, px_width, numpixtotop);
	} else {
		drawImage(ctx, silhouette,
			origin.x + px_offset_left - px_width, drawing_top, px_width, numpixtotop, 0, true);
	}
}

function drawImage(ctx, img, x, y, width, height, deg, flip, flop, center) {
	ctx.save();
	if (width  === undefined) width  = img.width;
	if (height === undefined) height = img.height;
	if (center === undefined) center = false;
	if (center) { x -= width / 2; y -= height / 2; }
	ctx.translate(x + width / 2, y + height / 2);
	ctx.rotate(2 * Math.PI - (deg || 0) * Math.PI / 180);
	ctx.scale(flip ? -1 : 1, flop ? -1 : 1);
	ctx.drawImage(img, -width / 2, -height / 2, width, height);
	ctx.restore();
}

function draw_floor(ctx, radius, minmaxes, dimensions) {
	const floor_color   = "#007acc";
	const floor_width   = 6;
	const station_color = "white";

	ctx.lineWidth   = floor_width;
	ctx.strokeStyle = floor_color;
	ctx.fillStyle   = station_color;

	const factor    = (dimensions.DRAWING_WIDTH / dimensions.DRAWING_HEIGHT >
	                   (minmaxes.rangeX / minmaxes.rangeY) / 4) ? 5 : 2;
	const toconvert = factor * minmaxes.range / radius;

	let floor_start, floor_end;
	if (toconvert < 1) {
		floor_start = Math.acos(toconvert);
		floor_end   = Math.acos(-toconvert);
	} else {
		floor_start = 0;
		floor_end   = Math.PI;
	}

	const arc = floor_end - floor_start;
	const bottomcurve = [];
	for (let i = floor_start; i < floor_end; i += arc / 100) {
		bottomcurve.push(canvasPoint(
			radius * Math.cos(i), -radius * Math.sin(i) + radius, minmaxes, dimensions));
	}
	bottomcurve.push(canvasPoint(
		radius * Math.cos(floor_end), -radius * Math.sin(floor_end) + radius,
		minmaxes, dimensions));

	const topCheck = canvasPoint(
		radius * Math.cos(0), radius * Math.sin(0) + radius, minmaxes, dimensions);

	if (topCheck.y > -50) {
		const topcurve = [];
		for (let i = floor_end; i > floor_start; i -= arc / 100) {
			topcurve.push(canvasPoint(
				radius * Math.cos(i), radius * Math.sin(i) + radius, minmaxes, dimensions));
		}
		ctx.beginPath();
		ctx.moveTo(bottomcurve[0].x, bottomcurve[0].y);
		for (let i = 1; i < bottomcurve.length; i++) ctx.lineTo(bottomcurve[i].x, bottomcurve[i].y);
		for (let i = 0; i < topcurve.length;   i++) ctx.lineTo(topcurve[i].x,   topcurve[i].y);
		ctx.closePath(); ctx.fill(); ctx.stroke();
	} else {
		ctx.beginPath();
		ctx.moveTo(bottomcurve[0].x, bottomcurve[0].y);
		for (let i = 1; i < bottomcurve.length; i++) ctx.lineTo(bottomcurve[i].x, bottomcurve[i].y);
		if (bottomcurve.length > 0) {
			ctx.lineTo(-floor_width, -floor_width);
			ctx.lineTo(dimensions.width + floor_width, -floor_width);
			ctx.closePath();
			ctx.fillStyle = station_color;
			ctx.fill();
		}
		ctx.stroke();
	}

	ctx.lineWidth   = 1;
	ctx.strokeStyle = ctx.fillStyle = "#000000";
}

export default CanvasSpace;
