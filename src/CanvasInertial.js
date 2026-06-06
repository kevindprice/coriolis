// Inertial reference frame view.
// The station ring spins; the coin travels in a straight line (no real forces).
// Person rides the rim in a circle. Stars are stationary (this canvas has its own
// dark background and does not depend on StarCanvas).
//
// Physics coordinates: origin at station centre, +x right, +y up.
// Canvas coordinates:  origin at top-left, +x right, +y DOWN.
// Conversion: canvas_x = cx + phys_x * scale
//             canvas_y = cy - phys_y * scale

import React, { Component } from 'react';
import './App.css';

class CanvasInertial extends Component {

	constructor() {
		super();

		this.state = { width: null, height: null };

		this.namesp = {
			currentframe: null,
			points:       null,   // array of InertialPoints
			transform:    null,   // { scale, cx, cy }
			dimensions:   null,
		};
		this.timeouts = {
			movetimeout:   null,
			repeattimeout: null,
		};
		this.canvasParent  = null;
		this.canvasElement = null;

		this.updateCanvasSize  = this.updateCanvasSize.bind(this);
		this.setDimensions     = this.setDimensions.bind(this);
		this.update_all_points = this.update_all_points.bind(this);
		this.draw_canvas_full  = this.draw_canvas_full.bind(this);
		this.draw_canvas_partial = this.draw_canvas_partial.bind(this);

		this.parentDiv         = React.createRef();
		this.inertialCanvasRef = React.createRef();
		this.resizeObserver    = null;
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────────

	observe = RO => {
		this.resizeObserver = new RO(entries => {
			const { width, height } = entries[0].contentRect;
			this.setState({ width, height });
		});
	};

	componentWillUnmount() {
		if (this.resizeObserver) this.resizeObserver.disconnect();
		clearTimeout(this.timeouts.movetimeout);
		clearTimeout(this.timeouts.repeattimeout);
	}

	componentDidMount() {
		this.canvasParent  = this.parentDiv.current;
		this.canvasElement = this.inertialCanvasRef.current;

		if ('ResizeObserver' in window) {
			this.observe(ResizeObserver);
			this.resizeObserver.observe(this.canvasParent);
		} else {
			window.addEventListener('resize', () => this.updateCanvasSize());
		}

		this.updateCanvasSize();
	}

	updateCanvasSize() {
		this.setState({
			width:  this.canvasParent.clientWidth,
			height: this.canvasParent.clientHeight,
		});
	}

	setDimensions() {
		const ctx = this.canvasElement.getContext('2d');
		const d   = {};
		d.units          = this.props.vars.units;
		d.width          = ctx.canvas.clientWidth;
		d.height         = ctx.canvas.clientHeight;
		d.X_BUFFER       = d.width  / 20;
		d.Y_BUFFER       = d.height / 20;
		d.DRAWING_WIDTH  = d.width  - 2 * d.X_BUFFER;
		d.DRAWING_HEIGHT = d.height - 2 * d.Y_BUFFER;
		d.DELAY_BETWEEN_DRAWS = 2.5;
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
			this.props.vars.frozen       === newProps.vars.frozen &&
			this.props.vars.percenttime  === newProps.vars.percenttime &&
			this.state.height            === newState.height &&
			this.state.width             === newState.width
		) { return false; }
		return true;
	}

	componentDidUpdate(prevProps, prevState) {
		const physicsChanged =
			this.props.vars.startheight !== prevProps.vars.startheight ||
			this.props.vars.speed       !== prevProps.vars.speed ||
			this.props.vars.radius      !== prevProps.vars.radius ||
			this.props.vars.omega       !== prevProps.vars.omega ||
			this.props.vars.units       !== prevProps.vars.units ||
			this.props.vars.start_v_x   !== prevProps.vars.start_v_x ||
			this.props.vars.start_v_y   !== prevProps.vars.start_v_y ||
			this.props.vars.time        !== prevProps.vars.time;

		const crossedThreshold =
			(prevProps.vars.percenttime > 20 && this.props.vars.percenttime < 20) ||
			(prevProps.vars.percenttime > 50 && this.props.vars.percenttime < 50);

		this.setDimensions();

		if (physicsChanged) {
			this.update_all_points();
			this.draw_canvas_full();
		} else if (crossedThreshold) {
			const oldLength = this.namesp.points ? this.namesp.points.length : 1;
			this.update_all_points();
			this.namesp.currentframe = Math.floor(
				(this.namesp.currentframe / oldLength) * this.namesp.points.length);
			this.draw_canvas_partial();
		} else if (
			this.props.vars.menuLeftOpen !== prevProps.vars.menuLeftOpen ||
			this.state.width  !== prevState.width ||
			this.state.height !== prevState.height
		) {
			this.update_all_points();
			this.draw_canvas_partial();
		} else {
			this.update_all_points();
			this.draw_canvas_full();
		}
	}

	// ── Instance methods ───────────────────────────────────────────────────────

	update_all_points() {
		const v = this.props.vars;
		this.namesp.points    = getInertialPoints(
			v.time, v.radius, Number(v.omega), v.startheight,
			Number(v.start_v_x), v.start_v_y, v.percenttime);
		this.namesp.transform = computeTransform(
			this.namesp.points, v.radius, this.namesp.dimensions);
	}

	draw_canvas_full() {
		this.namesp.currentframe = 1;
		clearTimeout(this.timeouts.repeattimeout); this.timeouts.repeattimeout = null;
		clearTimeout(this.timeouts.movetimeout);   this.timeouts.movetimeout   = null;

		const ctx = this.canvasElement.getContext('2d');
		const v   = this.props.vars;

		if (v.frozen) {
			draw_inertial_frame(ctx, this.namesp.points.length - 1,
				this.namesp.points, this.namesp.transform,
				v.radius, Number(v.omega), this.namesp.dimensions);
		} else {
			draw_inertial_active(ctx, v, this.namesp, this.timeouts);
		}
	}

	draw_canvas_partial() {
		clearTimeout(this.timeouts.movetimeout);   this.timeouts.movetimeout   = null;
		clearTimeout(this.timeouts.repeattimeout); this.timeouts.repeattimeout = null;

		const ctx = this.canvasElement.getContext('2d');
		const v   = this.props.vars;
		const { points, transform, dimensions } = this.namesp;
		if (!points || !transform || !dimensions) return;

		this.namesp.currentframe = Math.min(
			this.namesp.currentframe || 1, points.length - 1);

		draw_inertial_frame(ctx, this.namesp.currentframe,
			points, transform, v.radius, Number(v.omega), dimensions);

		if (!v.frozen) {
			draw_inertial_active(ctx, v, this.namesp, this.timeouts);
		}
	}

	render() {
		return (
			<div ref={this.parentDiv} className="canvasParent"
				style={{ width: '100%', height: '100%', position: 'absolute',
				         background: '#0d0d1f' }}>
				<canvas ref={this.inertialCanvasRef}
					width={this.state.width} height={this.state.height} />
			</div>
		);
	}
}


// ── Point generation ───────────────────────────────────────────────────────────

function getInertialPoints(time, radius, omega, startheight, start_v_x, start_v_y, percenttime) {
	let time_increment;
	if      (time < 1.2) { time_increment = time / 130; }
	else if (time > 50)  { time_increment = time / 6500; }
	else                 { time_increment = 0.0077; }

	if      (percenttime < 10) { time_increment /= 5; }
	else if (percenttime < 50) { time_increment /= 2; }

	const pts = [];
	if (time > 0) {
		for (let t = 0; t <= Number(time); t += time_increment) {
			pts.push(inertialPoint(t, radius, omega, startheight, start_v_x, start_v_y));
		}
		pts.push(inertialPoint(Number(time), radius, omega, startheight, start_v_x, start_v_y));
	} else {
		pts.push(inertialPoint(0, radius, 0, startheight, 0, 0));
	}
	return pts;
}

// Single point in the inertial frame at time t.
function inertialPoint(time, radius, omega, startheight, start_v_x, start_v_y) {
	// Person rides the rim clockwise (same direction the station rotates).
	const personAngle = (3 * Math.PI / 2) - omega * time;
	return {
		time,
		personX: radius * Math.cos(personAngle),
		personY: radius * Math.sin(personAngle),
		// Coin travels in a straight line — no real forces act on it.
		coinX: start_v_x * time,
		coinY: start_v_y * time - (radius - startheight),
	};
}


// ── Coordinate transform ───────────────────────────────────────────────────────

// Fit both the station ring and the full coin path into the drawing area.
function computeTransform(points, radius, dimensions) {
	let minX = -radius, maxX = radius;
	let minY = -radius, maxY = radius;

	for (const p of points) {
		if (p.coinX < minX) minX = p.coinX;
		if (p.coinX > maxX) maxX = p.coinX;
		if (p.coinY < minY) minY = p.coinY;
		if (p.coinY > maxY) maxY = p.coinY;
	}

	const pad = radius * 0.05;
	minX -= pad; maxX += pad;
	minY -= pad; maxY += pad;

	const rangeX = maxX - minX;
	const rangeY = maxY - minY;
	const scale  = Math.min(
		dimensions.DRAWING_WIDTH  / rangeX,
		dimensions.DRAWING_HEIGHT / rangeY
	);

	// Canvas coords of the physics origin (0, 0) — i.e., station centre.
	const physCX = (minX + maxX) / 2;
	const physCY = (minY + maxY) / 2;
	const cx = dimensions.X_BUFFER + dimensions.DRAWING_WIDTH  / 2 - physCX * scale;
	const cy = dimensions.Y_BUFFER + dimensions.DRAWING_HEIGHT / 2 + physCY * scale;

	return { scale, cx, cy };
}

function toCanvas(physX, physY, transform) {
	return {
		x: transform.cx + physX * transform.scale,
		y: transform.cy - physY * transform.scale,
	};
}


// ── Drawing functions ──────────────────────────────────────────────────────────

// Draw the complete scene at a given frame index (clear + redraw).
function draw_inertial_frame(ctx, frame, points, transform, radius, omega, dimensions) {
	ctx.clearRect(0, 0, dimensions.width, dimensions.height);

	draw_ring(ctx, radius, transform);

	const pt = points[Math.min(frame, points.length - 1)];

	// Highlight the local-floor arc at the person's current position.
	const personAngle = (3 * Math.PI / 2) - omega * pt.time;
	draw_floor_arc(ctx, personAngle, radius, transform);

	draw_coin_trail(ctx, points, frame, transform);
	draw_person_dot(ctx, pt, transform);
}

// Outer ring of the station.
function draw_ring(ctx, radius, transform) {
	const c = toCanvas(0, 0, transform);
	const r = radius * transform.scale;

	ctx.beginPath();
	ctx.arc(c.x, c.y, r, 0, 2 * Math.PI);
	ctx.fillStyle   = 'rgba(255,255,255,0.04)';
	ctx.fill();
	ctx.lineWidth   = 6;
	ctx.strokeStyle = '#007acc';
	ctx.stroke();
	ctx.lineWidth   = 1;
	ctx.strokeStyle = '#000';
}

// Short arc of "floor" centred on the person's current position — rotates with the station.
function draw_floor_arc(ctx, personAngle, radius, transform) {
	const c       = toCanvas(0, 0, transform);
	const r       = radius * transform.scale;
	const arcHalf = Math.PI / 5;  // 36° each side → 72° total

	// Canvas angles are measured clockwise from +x.
	// Physics angles are counter-clockwise from +x.
	// Flipping y: canvas angle = −physics angle.
	const ca = -personAngle;

	ctx.beginPath();
	ctx.arc(c.x, c.y, r, ca - arcHalf, ca + arcHalf);
	ctx.lineWidth   = 9;
	ctx.strokeStyle = '#4caf50';
	ctx.stroke();
	ctx.lineWidth   = 1;
	ctx.strokeStyle = '#000';
}

// Straight-line coin trail from frame 0 up to endFrame.
function draw_coin_trail(ctx, points, endFrame, transform) {
	if (!points || points.length === 0) return;

	const start = toCanvas(points[0].coinX, points[0].coinY, transform);

	// Start dot
	ctx.beginPath();
	ctx.arc(start.x, start.y, 5, 0, 2 * Math.PI);
	ctx.lineWidth   = 1;
	ctx.strokeStyle = '#5c6870';
	ctx.stroke();

	if (endFrame < 1) return;

	// Trail line
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	const limit = Math.min(endFrame, points.length - 1);
	for (let i = 1; i <= limit; i++) {
		const p = toCanvas(points[i].coinX, points[i].coinY, transform);
		ctx.lineTo(p.x, p.y);
	}
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth   = 2;
	ctx.stroke();
	ctx.lineWidth   = 1;

	// End dot (only when fully drawn)
	if (endFrame >= points.length - 1) {
		const end = toCanvas(points[limit].coinX, points[limit].coinY, transform);
		ctx.beginPath();
		ctx.arc(end.x, end.y, 5, 0, 2 * Math.PI);
		ctx.strokeStyle = '#5c6870';
		ctx.stroke();
	}
}

// Red dot marking the person's position on the rim.
function draw_person_dot(ctx, pt, transform) {
	const pos = toCanvas(pt.personX, pt.personY, transform);
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
	ctx.fillStyle   = '#e74c3c';
	ctx.fill();
	ctx.lineWidth   = 1;
	ctx.strokeStyle = '#fff';
	ctx.stroke();
}

// Animation loop: clear and redraw every frame in sync with percenttime.
function draw_inertial_active(ctx, vars, namesp, timeouts) {
	const { points, transform, dimensions } = namesp;
	if (!points || !transform || !dimensions) return;

	if (timeouts.repeattimeout !== null) {
		clearTimeout(timeouts.repeattimeout); timeouts.repeattimeout = null;
		clearTimeout(timeouts.movetimeout);   timeouts.movetimeout   = null;
	}

	const time        = vars.time;
	const percenttime = vars.percenttime;

	// Guard: nothing to animate if time is zero or non-finite.
	if (!(time > 0)) {
		draw_inertial_frame(ctx, 0, points, transform,
			vars.radius, Number(vars.omega), dimensions);
		return;
	}

	const framespersecond = 38;
	const pointspersecond = points.length / (time * (100 / percenttime));
	const ppsgoal         = pointspersecond / framespersecond;
	const ppsactual       = Math.max(1, Math.ceil(ppsgoal));
	const offset          = ppsactual / ppsgoal;
	const delay_ms        = (1 / framespersecond) * offset * 1000;

	function advance() {
		if (namesp.currentframe >= points.length) {
			clearTimeout(timeouts.movetimeout); timeouts.movetimeout = null;

			draw_inertial_frame(ctx, points.length - 1,
				points, transform, vars.radius, Number(vars.omega), dimensions);

			timeouts.repeattimeout = setTimeout(() => {
				namesp.currentframe = 1;
				draw_inertial_active(ctx, vars, namesp, timeouts);
			}, dimensions.DELAY_BETWEEN_DRAWS * 1000);
			return;
		}

		draw_inertial_frame(ctx, namesp.currentframe,
			points, transform, vars.radius, Number(vars.omega), dimensions);

		namesp.currentframe += ppsactual;
		timeouts.movetimeout = setTimeout(advance, delay_ms);
	}

	timeouts.movetimeout = setTimeout(advance, delay_ms);
}

export default CanvasInertial;
