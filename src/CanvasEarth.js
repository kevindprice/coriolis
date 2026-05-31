// See CanvasSpace.js for fuller comments on the shared patterns.
// Flow: componentDidMount → loadImage → updateCanvasSize → setState
//       → shouldComponentUpdate → componentDidUpdate → setDimensions, draw

import React, { Component } from 'react';
import './App.css';
import imagefile from './img/silhouette.png'
import image2    from './img/silhouette2.png'

// All mutable canvas state lives on the instance (was module-level globals).

class CanvasEarth extends Component {

	constructor() {
		super();

		this.state = { width: null, height: null };

		this.namesp = {
			currentframe:   null,
			relativepoints: null,
			canvaspoints:   null,
			minmaxes:       null,
			lastpoint:      null,
			dimensions:     null,
		};
		this.timeouts = {
			movetimeout:   null,
			repeattimeout: null,
			sourceready:   false,
			delayrefresh:  null,
		};
		this.canvasParent  = null;
		this.canvasElement = null;

		this.updateCanvasSize    = this.updateCanvasSize.bind(this);
		this.loadImage           = this.loadImage.bind(this);
		this.update_canvaspoints = this.update_canvaspoints.bind(this);
		this.update_all_points   = this.update_all_points.bind(this);
		this.draw_canvas_partial = this.draw_canvas_partial.bind(this);
		this.draw_canvas_full    = this.draw_canvas_full.bind(this);
		this.setDimensions       = this.setDimensions.bind(this);
		this.restart_interval    = this.restart_interval.bind(this);

		this.parentDiv      = React.createRef();
		this.earthCanvasRef = React.createRef();
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
		this.canvasElement = this.earthCanvasRef.current;

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
		d.X_BUFFER      = d.width  / 8;
		d.Y_BUFFER      = d.height / 10;
		d.DRAWING_WIDTH  = d.width  - 2 * d.X_BUFFER;
		d.DRAWING_HEIGHT = d.height - 2 * d.Y_BUFFER;
		d.DELAY_BETWEEN_DRAWS = 2.5;
		d.menuLeftOpen  = this.props.vars.menuLeftOpen;
		d.menuRightOpen = this.props.vars.menuRightOpen;
		d.defaultheight = this.props.defaults.startheight;
		d.leftside      = d.width  * -0.05;
		d.rightside     = d.width  *  1.05;
		d.topside       = d.height * -0.05;
		d.bottomside    = d.height *  0.77;

		if (d.height < 300) { d.Y_BUFFER /= 1.5; }

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
	}

	// ── Instance methods ───────────────────────────────────────────────────────

	update_canvaspoints() {
		const result = getCanvaspoints(
			this.namesp.relativepoints, this.namesp.dimensions);
		this.namesp.canvaspoints = result.canvaspoints;
		this.namesp.minmaxes     = result.minmaxes;
	}

	update_all_points() {
		const relativepoints = getRelativepoints(
			this.props.vars.expectedtime, this.props.vars.startheight,
			this.props.vars.percenttime,  this.props.defaults.accel_earth,
			this.props.vars.speed,        this.props.vars.anglefromVertical);

		const result = getCanvaspoints(relativepoints, this.namesp.dimensions);

		this.namesp.relativepoints = relativepoints;
		this.namesp.canvaspoints   = result.canvaspoints;
		this.namesp.minmaxes       = result.minmaxes;
		this.namesp.lastpoint      = relativepoints[relativepoints.length - 1];
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
				this.props.vars.expectedtime, this.props.vars.percenttime,
				this._silhouette(), this.props.vars.startheight,
				this.namesp, this.timeouts, this.namesp.currentframe);
		}
	}

	draw_canvas_partial() {
		clearTimeout(this.timeouts.movetimeout);   this.timeouts.movetimeout  = null;
		clearTimeout(this.timeouts.repeattimeout); this.timeouts.repeattimeout = null;

		const ctx = this.canvasElement.getContext('2d');
		const sil = this._silhouette();
		const { minmaxes, dimensions, canvaspoints, lastpoint, currentframe } = this.namesp;

		reset_canvas(ctx, minmaxes, dimensions, lastpoint, sil, this.props.vars.startheight);

		if (this.props.vars.frozen) {
			draw_curve_static(ctx, canvaspoints, dimensions, this.timeouts);
		} else {
			draw_curve_static(ctx, canvaspoints.slice(0, currentframe), dimensions,
				this.timeouts, "nocircle");
			draw_curve_active(ctx,
				this.props.vars.expectedtime, this.props.vars.percenttime,
				sil, this.props.vars.startheight,
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
			reset_canvas(ctx, this.namesp.minmaxes, this.namesp.dimensions,
				this.namesp.lastpoint, sil, this.props.vars.startheight);
			draw_curve_static(ctx, this.namesp.canvaspoints,
				this.namesp.dimensions, this.timeouts);
		} else {
			draw_curve_active(ctx,
				this.props.vars.expectedtime, this.props.vars.percenttime,
				sil, this.props.vars.startheight,
				this.namesp, this.timeouts);
		}
	}

	render() {
		return (
			<div ref={this.parentDiv} className="canvasParent"
				style={{ width: '100%', height: '100%', position: 'absolute',
				         background: '#853f03' }}>
				<canvas ref={this.earthCanvasRef}
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

function getRelativepoints(time, startheight, percenttime, accel_earth, speed, angle) {
	let time_increment;
	if      (time < 1.2) { time_increment = time / 130; }
	else if (time > 50)  { time_increment = time / 6500; }
	else                 { time_increment = 0.0077; }

	if      (percenttime < 10) { time_increment /= 5; }
	else if (percenttime < 50) { time_increment /= 2; }

	const start_v_x = speed * Math.sin(angle * Math.PI / 180);
	const start_v_y = speed * Math.cos(angle * Math.PI / 180);

	const pts = [];
	for (let t = 0; t <= Number(time); t += time_increment) {
		pts.push(new AbsolutePoint(t, Number(startheight), Number(start_v_x),
			Number(start_v_y), accel_earth));
	}
	pts.push(new AbsolutePoint(Number(time), Number(startheight),
		Number(start_v_x), Number(start_v_y), accel_earth));
	return pts;
}

function AbsolutePoint(time, startheight, start_v_x, start_v_y, accel_earth) {
	this.time = time;
	this.x    = start_v_x * time;
	this.y    = startheight + start_v_y * time - 0.5 * accel_earth * time * time;
}


// ── Canvas-coordinate helpers ──────────────────────────────────────────────────

// Convert a physics (x, y) or AbsolutePoint to canvas pixels.
// minmaxes is passed first so the 3-arg form (minmaxes, point, dimensions)
// still works correctly when x is an AbsolutePoint.
function canvasPoint(minmaxes, x, y, dimensions) {
	if (typeof x !== "number") { dimensions = y; y = x.y; x = x.x; }

	const zeroY     = dimensions.bottomside;
	const testY     = dimensions.DRAWING_HEIGHT;
	const fixBottom = zeroY - testY;

	return {
		x: ((x - minmaxes.minX) / minmaxes.range) * minmaxes.canvasSize + minmaxes.offsetX,
		y: dimensions.DRAWING_HEIGHT - (y / minmaxes.range) * minmaxes.canvasSize + fixBottom,
	};
}

function getCanvaspoints(relativepoints, dimensions) {
	const mm  = minmax(relativepoints, dimensions);
	const pts = [];
	let i = 0;
	for (let inc = 0; inc < relativepoints.length; inc++) {
		i = Math.ceil(inc);
		if (i >= relativepoints.length) break;
		pts.push(canvasPoint(mm, relativepoints[i], dimensions));
	}
	if (i !== relativepoints.length - 1) {
		pts.push(canvasPoint(mm, relativepoints[relativepoints.length - 1], dimensions));
	}
	return { canvaspoints: pts, minmaxes: mm };
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

// timeouts passed explicitly so this function is instance-safe.
function draw_curve_static(ctx, canvaspoints, dimensions, timeouts, nocircle) {
	if (timeouts.repeattimeout !== null) {
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout = null;
		clearTimeout(timeouts.movetimeout);   timeouts.movetimeout   = null;
	}

	const X = dimensions.X_BUFFER;
	const Y = dimensions.Y_BUFFER;

	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.strokeStyle = "#5c6870";
	ctx.arc(canvaspoints[0].x + X, canvaspoints[0].y + Y, 5, 0, 2 * Math.PI);
	ctx.stroke();

	ctx.beginPath();
	ctx.strokeStyle = "#000000";
	ctx.moveTo(canvaspoints[0].x + X, canvaspoints[0].y + Y);
	for (let i = 1; i < canvaspoints.length; i++) {
		ctx.lineTo(canvaspoints[i].x + X, canvaspoints[i].y + Y);
	}
	ctx.stroke();

	if (typeof nocircle === 'undefined') {
		ctx.beginPath();
		ctx.strokeStyle = "#5c6870";
		ctx.arc(canvaspoints[canvaspoints.length - 1].x + X,
		        canvaspoints[canvaspoints.length - 1].y + Y, 5, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.strokeStyle = "#000000";
	}
}

// namesp and timeouts passed explicitly — instance-safe.
function draw_curve_active(ctx, time, percenttime, silhouette, startheight,
                           namesp, timeouts, currentframe) {
	const canvaspoints = namesp.canvaspoints;
	const dimensions   = namesp.dimensions;
	const minmaxes     = namesp.minmaxes;
	const lastpoint    = namesp.lastpoint;
	const X = dimensions.X_BUFFER;
	const Y = dimensions.Y_BUFFER;

	if (timeouts.repeattimeout !== null) {
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout = null;
		clearTimeout(timeouts.movetimeout);   timeouts.movetimeout   = null;
	}

	if (currentframe == null) {
		reset_canvas(ctx, minmaxes, dimensions, lastpoint, silhouette, startheight);
		namesp.currentframe = 1;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.strokeStyle = "#5c6870";
		ctx.arc(canvaspoints[0].x + X, canvaspoints[0].y + Y, 5, 0, 2 * Math.PI);
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
				draw_curve_active(ctx, time, percenttime, silhouette, startheight,
					namesp, timeouts);
			}, dimensions.DELAY_BETWEEN_DRAWS * 1000);
			ctx.beginPath();
			ctx.strokeStyle = "#5c6870";
			ctx.lineWidth = 2;
			ctx.arc(canvaspoints[canvaspoints.length - 1].x + X,
			        canvaspoints[canvaspoints.length - 1].y + Y, 5, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.strokeStyle = "#000000";
			return;
		}

		ctx.beginPath();
		ctx.moveTo(canvaspoints[namesp.currentframe - 1].x + X,
		           canvaspoints[namesp.currentframe - 1].y + Y);

		for (let x = 0; x < pointsperframeactual; x++) {
			if (namesp.currentframe >= canvaspoints.length) {
				clearTimeout(timeouts.movetimeout); timeouts.movetimeout = null;
				ctx.stroke();
				timeouts.repeattimeout = setTimeout(function () {
					draw_curve_active(ctx, time, percenttime, silhouette, startheight,
						namesp, timeouts);
				}, dimensions.DELAY_BETWEEN_DRAWS * 1000);
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.strokeStyle = "#5c6870";
				ctx.arc(canvaspoints[canvaspoints.length - 1].x + X,
				        canvaspoints[canvaspoints.length - 1].y + Y, 5, 0, 2 * Math.PI);
				ctx.stroke();
				ctx.strokeStyle = "#000000";
				return;
			}
			ctx.lineTo(canvaspoints[namesp.currentframe].x + X,
			           canvaspoints[namesp.currentframe].y + Y);
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

function scalemark(spot, minmaxes, value, dimensions) {
	const x   = spot;
	const y1  =  5 / minmaxes.pxperfoot;
	const y2  = -5 / minmaxes.pxperfoot;

	this.start      = canvasPoint(minmaxes, x, y1, dimensions);
	this.end        = canvasPoint(minmaxes, x, y2, dimensions);
	this.spot       = spot;
	this.numberspot = { x: this.end.x - value.toString().length * 4,
	                    y: this.end.y + 15 };
	this.value      = value;
}

function draw_scale(ctx, minmaxes, dimensions, lastpoint) {
	const scale_color = "#9dfcdb";
	const X = dimensions.X_BUFFER;
	const Y = dimensions.Y_BUFFER;

	let start = 0;
	let lx = lastpoint.x;
	if (lx < 1e-10 && lx > -1e-10) { lx = 0; }
	let end = lx;

	let increment = 1;
	const inc_fn = new scale_increment();
	while (minmaxes.pxperfoot * increment < 25) { increment = inc_fn.run(increment); }
	if (increment.toString().length >= 3) {
		while (minmaxes.pxperfoot * increment < 45) { increment = inc_fn.run(increment); }
	}

	let i = 0;
	if (end === 0) { start = -increment; end = increment; i -= increment; }

	const marks = [];
	if (lastpoint.x < 0) {
		for (let a = start; a > end - increment; a -= increment) {
			marks.push(new scalemark(a, minmaxes, i, dimensions)); i += increment;
		}
	} else {
		for (let a = start; a < end + increment; a += increment) {
			marks.push(new scalemark(a, minmaxes, i, dimensions)); i += increment;
		}
	}

	if (marks.length === 2) {
		const a2 = ((marks[1].spot - start) * -1) + start;
		marks.push(new scalemark(a2, minmaxes, marks[1].value, dimensions));
	}

	ctx.font      = "bold 14px Arial";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.fillStyle = ctx.strokeStyle = scale_color;
	for (i = 0; i < marks.length; i++) {
		const m = marks[i];
		ctx.moveTo(m.start.x + X, m.start.y + Y);
		ctx.lineTo(m.end.x   + X, m.end.y   + Y);
		ctx.fillText(m.value.toString(), m.numberspot.x + X, m.numberspot.y + Y);
	}
	ctx.stroke();
}

function reset_canvas(ctx, minmaxes, dimensions, lastpoint, silhouette, startheight) {
	ctx.clearRect(0, 0, dimensions.width, dimensions.height);
	draw_floor(ctx, minmaxes, dimensions);
	draw_scale(ctx, minmaxes, dimensions, lastpoint);
	if (silhouette !== null) {
		draw_silhouette(ctx, silhouette, minmaxes, dimensions, dimensions.defaultheight);
	}
	if (startheight !== dimensions.defaultheight) {
		canvas_arrow(ctx, minmaxes, dimensions, startheight);
	}
}

function canvas_arrow(ctx, minmaxes, dimensions, startheight) {
	const origin = canvasPoint(minmaxes, 0, 0,          dimensions);
	const start  = canvasPoint(minmaxes, 0, startheight, dimensions);
	const X = dimensions.X_BUFFER;
	const Y = dimensions.Y_BUFFER;

	const fromx    = origin.x + X;
	const fromy    = origin.y + Y;
	const tox      = start.x  + X;
	const toy      = start.y  + Y + 7;
	const headlen  = 10;
	const angle    = Math.atan2(toy - fromy, tox - fromx);
	const pxheight = fromy - toy;

	if (pxheight > 15) {
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
	}
}

function draw_silhouette(ctx, silhouette, minmaxes, dimensions, startheight) {
	const origin         = canvasPoint(minmaxes, 0, 0, dimensions);
	const px_startheight = minmaxes.pxperfoot * startheight;
	const numpixtotop    = px_startheight * 830 / 539;
	const drawing_top    = origin.y - numpixtotop;
	const px_width       = numpixtotop * 323 / 831;
	const px_offset_left = px_width * 24 / 323;
	const X = dimensions.X_BUFFER;
	const Y = dimensions.Y_BUFFER;

	if (minmaxes.directionLeft) {
		drawImage(ctx, silhouette,
			origin.x - px_offset_left + X, drawing_top + Y, px_width, numpixtotop);
	} else {
		drawImage(ctx, silhouette,
			origin.x + px_offset_left - px_width + X, drawing_top + Y,
			px_width, numpixtotop, 0, true);
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

function draw_floor(ctx, minmaxes, dimensions) {
	const floor_color   = "#318503";
	const floor_width   = 6;
	const station_color = "white";
	const X = dimensions.X_BUFFER;
	const Y = dimensions.Y_BUFFER;

	ctx.lineWidth   = floor_width;
	ctx.strokeStyle = floor_color;
	ctx.fillStyle   = station_color;

	ctx.beginPath();
	ctx.moveTo(dimensions.leftside,  dimensions.bottomside + Y);
	ctx.lineTo(dimensions.rightside, dimensions.bottomside + Y);
	ctx.lineTo(dimensions.rightside, dimensions.topside);
	ctx.lineTo(dimensions.leftside,  dimensions.topside);
	ctx.lineTo(dimensions.leftside,  dimensions.bottomside + Y);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

export default CanvasEarth;
