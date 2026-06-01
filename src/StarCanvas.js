import React, { Component } from 'react';

const STAR_COUNT = 1000;

// ── Glow sprites ───────────────────────────────────────────────────────────────
// Two sets (cool / warm) × five radius tiers (5–9 px) = 10 tiny offscreen canvases.
// createRadialGradient is called once at startup, never per frame.

function makeSpriteTier(r, stops) {
	const pad  = 2;
	const size = r * 2 + pad * 2;
	const oc   = document.createElement('canvas');
	oc.width = oc.height = size;
	const ctx = oc.getContext('2d');
	const cx  = r + pad;
	const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, r);
	stops.forEach(([pos, color]) => grd.addColorStop(pos, color));
	ctx.beginPath();
	ctx.arc(cx, cx, r, 0, 2 * Math.PI);
	ctx.fillStyle = grd;
	ctx.fill();
	return oc;
}

function createGlowSprites() {
	const cool = {};
	const warm = {};
	for (let r = 5; r <= 9; r++) {
		cool[r] = makeSpriteTier(r, [
			[0,    'rgba(200, 220, 255, 0.65)'],
			[0.30, 'rgba(210, 228, 255, 0.30)'],
			[0.65, 'rgba(215, 230, 255, 0.10)'],
			[1,    'rgba(220, 235, 255, 0)'],
		]);
		warm[r] = makeSpriteTier(r, [
			[0,    'rgba(255, 220, 140, 0.65)'],
			[0.30, 'rgba(255, 210, 120, 0.30)'],
			[0.65, 'rgba(255, 200, 100, 0.10)'],
			[1,    'rgba(255, 190,  90, 0)'],
		]);
	}
	return { cool, warm };
}

// ── Star colours ───────────────────────────────────────────────────────────────
// Ten spectral variants from deep blue to rare red-orange.
// `warm` flag routes to the matching glow sprite set.

function starColor() {
	const roll = Math.random();
	if (roll < 0.14) return { r: 175, g: 205, b: 255, warm: false }; // deep blue
	if (roll < 0.30) return { r: 205, g: 225, b: 255, warm: false }; // blue-white
	if (roll < 0.46) return { r: 235, g: 243, b: 255, warm: false }; // pale blue-white
	if (roll < 0.58) return { r: 255, g: 255, b: 255, warm: false }; // pure white
	if (roll < 0.68) return { r: 255, g: 250, b: 228, warm: false }; // warm white
	if (roll < 0.76) return { r: 255, g: 240, b: 175, warm: true  }; // yellow-white
	if (roll < 0.83) return { r: 255, g: 222, b: 130, warm: true  }; // yellow
	if (roll < 0.89) return { r: 255, g: 195, b:  95, warm: true  }; // orange-yellow
	if (roll < 0.94) return { r: 255, g: 155, b:  80, warm: true  }; // orange
	if (roll < 0.97) return { r: 255, g: 115, b:  70, warm: true  }; // red-orange
	return               { r: 160, g: 185, b: 255, warm: false };    // vivid blue
}

// ── Star generation ────────────────────────────────────────────────────────────

function buildStar(radius, opacity, color, posProps) {
	const { r: cr, g: cg, b: cb, warm } = color;
	const hasGlow  = radius > 1.3;
	const glowTier = hasGlow ? Math.max(5, Math.min(9, Math.round(radius * 3.5))) : 0;
	return {
		...posProps,
		radius,
		hasGlow,
		glowTier,
		glowSet:   warm ? 'warm' : 'cool',
		coreStyle: `rgba(${cr},${cg},${cb},${opacity.toFixed(3)})`,
	};
}

function sampleRadius()  { return 0.25 + Math.pow(Math.random(), 1.5) * 2.75; }
function sampleOpacity() { return 0.10 + Math.pow(Math.random(), 1.7) * 0.90; }

// Stars for rotation mode — stored as (relX, relY) offset from rotation center
function generateRotationStars(centerX, centerY) {
	const maxR = Math.sqrt(
		Math.pow(Math.max(centerX, window.innerWidth  - centerX), 2) +
		Math.pow(Math.max(centerY, window.innerHeight - centerY), 2)
	) + 80;

	const viewportArea = window.innerWidth * window.innerHeight;
	const circleArea   = Math.PI * maxR * maxR;
	const count = Math.min(5000, Math.max(500, Math.round(STAR_COUNT * circleArea / viewportArea)));

	const stars = [];
	for (let i = 0; i < count; i++) {
		const angle = Math.random() * 2 * Math.PI;
		const r     = Math.sqrt(Math.random()) * maxR;
		stars.push(buildStar(sampleRadius(), sampleOpacity(), starColor(), {
			relX: r * Math.cos(angle),
			relY: r * Math.sin(angle),
		}));
	}
	return stars;
}

// Stars for large-station mode — fixed viewport positions, scroll horizontally
function generateScrollStars() {
	const stars = [];
	for (let i = 0; i < STAR_COUNT; i++) {
		stars.push(buildStar(sampleRadius(), sampleOpacity(), starColor(), {
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
		}));
	}
	return stars;
}


// ── Component ──────────────────────────────────────────────────────────────────

class StarCanvas extends Component {

	constructor(props) {
		super(props);
		this.canvasRef    = React.createRef();
		this.glowSprites  = null;
		this.stars        = [];
		this.currentAngle = 0;
		this.scrollOffset = 0;
		this.animId       = null;
		this.lastTime     = null;

		this.animate      = this.animate.bind(this);
		this.handleResize = this.handleResize.bind(this);
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────────

	componentDidMount() {
		this.glowSprites = createGlowSprites();
		this.resizeCanvas();
		this.initStars();
		window.addEventListener('resize', this.handleResize);
		// visualViewport fires when mobile browser chrome slides in/out
		if (window.visualViewport) {
			window.visualViewport.addEventListener('resize', this.handleResize);
		}
		this.animId = requestAnimationFrame(this.animate);
	}

	shouldComponentUpdate(nextProps) {
		return (
			nextProps.centerX      !== this.props.centerX      ||
			nextProps.centerY      !== this.props.centerY      ||
			nextProps.duration     !== this.props.duration     ||
			nextProps.starSpeed    !== this.props.starSpeed    ||
			nextProps.percenttime  !== this.props.percenttime  ||
			nextProps.frozen       !== this.props.frozen       ||
			nextProps.largeStation !== this.props.largeStation
		);
	}

	componentDidUpdate(prevProps) {
		const centerChanged = prevProps.centerX !== this.props.centerX ||
		                      prevProps.centerY !== this.props.centerY;
		const modeChanged   = prevProps.largeStation !== this.props.largeStation;
		if (centerChanged || modeChanged) {
			this.initStars();
		}
	}

	componentWillUnmount() {
		if (this.animId) cancelAnimationFrame(this.animId);
		window.removeEventListener('resize', this.handleResize);
		if (window.visualViewport) {
			window.visualViewport.removeEventListener('resize', this.handleResize);
		}
	}

	// ── Canvas / star setup ────────────────────────────────────────────────────

	// Returns true if the pixel buffer was actually changed.
	resizeCanvas() {
		const canvas = this.canvasRef.current;
		if (!canvas) return false;
		// visualViewport accounts for browser toolbars that overlay the viewport
		// (e.g. Samsung Browser's bottom bar) which innerHeight misses.
		const vv = window.visualViewport;
		const w = vv ? vv.width  : window.innerWidth;
		const h = vv ? vv.height : window.innerHeight;
		// Keep --app-height in sync every frame so the CSS flex layout always fits
		// within the true visible area, even if no resize event fired.
		document.documentElement.style.setProperty('--app-height', h + 'px');
		if (canvas.width === w && canvas.height === h) return false;
		canvas.width  = w;
		canvas.height = h;
		return true;
	}

	handleResize() {
		const resized = this.resizeCanvas();
		if (resized && this.props.largeStation) this.initStars();
	}

	initStars() {
		if (this.props.largeStation) {
			this.stars        = generateScrollStars();
			this.scrollOffset = 0;
		} else if (this.props.centerX != null) {
			this.stars = generateRotationStars(this.props.centerX, this.props.centerY);
		}
	}

	// ── Animation loop ─────────────────────────────────────────────────────────

	animate(timestamp) {
		if (this.lastTime !== null && !this.props.frozen) {
			const delta = timestamp - this.lastTime;
			if (this.props.largeStation) {
				this.scrollOffset += delta * (window.innerWidth / 10000);
			} else if (this.props.duration > 0 && isFinite(this.props.duration)) {
				const effectiveDuration =
					this.props.duration /
					((this.props.percenttime / 100) * (this.props.starSpeed / 100));
				if (isFinite(effectiveDuration) && effectiveDuration > 0) {
					this.currentAngle -= (2 * Math.PI * delta) / effectiveDuration;
				}
			}
		}
		this.lastTime = this.props.frozen ? null : timestamp;
		this.draw();
		this.animId = requestAnimationFrame(this.animate);
	}

	// ── Drawing ────────────────────────────────────────────────────────────────

	draw() {
		const canvas = this.canvasRef.current;
		if (!canvas || !this.glowSprites) return;
		// Self-correct every frame in case the viewport changed without an event
		// (e.g. Samsung Browser chrome sliding in/out).
		const resized = this.resizeCanvas();
		if (resized && this.props.largeStation) this.initStars();
		if (this.stars.length === 0) return;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if (this.props.largeStation) {
			this.drawScroll(ctx, canvas.width);
		} else {
			this.drawRotate(ctx);
		}
	}

	drawStar(ctx, sx, sy, star) {
		if (star.hasGlow) {
			const sprite = this.glowSprites[star.glowSet][star.glowTier];
			const half   = sprite.width / 2;
			ctx.drawImage(sprite, Math.round(sx - half), Math.round(sy - half));
		}
		ctx.beginPath();
		ctx.arc(sx, sy, star.radius, 0, 2 * Math.PI);
		ctx.fillStyle = star.coreStyle;
		ctx.fill();
	}

	drawRotate(ctx) {
		const cx  = this.props.centerX;
		const cy  = this.props.centerY;
		const cos = Math.cos(this.currentAngle);
		const sin = Math.sin(this.currentAngle);
		for (const star of this.stars) {
			const sx = cx + star.relX * cos - star.relY * sin;
			const sy = cy + star.relX * sin + star.relY * cos;
			this.drawStar(ctx, sx, sy, star);
		}
	}

	drawScroll(ctx, w) {
		const offset = this.scrollOffset % w;
		for (const star of this.stars) {
			const sx  = (star.x + offset) % w;
			const pad = star.hasGlow ? star.glowTier + 2 : star.radius + 2;
			this.drawStar(ctx, sx, star.y, star);
			if      (sx < pad)     this.drawStar(ctx, sx + w, star.y, star);
			else if (sx > w - pad) this.drawStar(ctx, sx - w, star.y, star);
		}
	}

	// ── Render ─────────────────────────────────────────────────────────────────

	render() {
		return (
			<canvas
				ref={this.canvasRef}
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					zIndex: -5,
					pointerEvents: 'none',
				}}
			/>
		);
	}
}

export default StarCanvas;
