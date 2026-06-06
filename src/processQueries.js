//This file processes the query variables in the address bar
//so you can customize the link to the model with the variables you want.

/*List of supported queries:
	?units=feet  (also: imperial, ft, metric, meters, m)
	?diameter=
	?radius=
	?percenttime=  (also: playback=)
	?startheight=
	?percentgravity=
	?speed=
	?angle=
	?thrownUp=  (also: throwHeight=) — calculates speed needed to throw this high on Earth
	?frozen
	?statsMenu
	?inputMenu
	?noPopUp
	?view=earth-inertial  (also: station-inertial; case-insensitive)
*/




//Defaults set as namespaces. Can reset to these default values in the input menu.
//Note: these are also present in App.js.
	//If you edit them here, then make sure you edit them there too!
var defaultImperial = {
	diameter:100,
	startheight:4,
	units:"ft",
	percentgravity:100,
	thrownUp:3,
	accel_earth:32.174,
	anglefromVertical:0,
	speed: 14, //13.894,
	percenttime:100,
}

var defaultMetric = {
	diameter: 30, //15.24,
	startheight: 1.2,  //1.219,
	units:"m",
	percentgravity:100,
	thrownUp: 1, //.92,
	accel_earth: 9.80665,
	anglefromVertical:0,
	speed: 4, //4.235,
	percenttime: 100,
}


export function processQueryVariables()
{
	const params = new URLSearchParams(document.location.search);

	// Helper: get a numeric param; returns NaN if absent or non-numeric.
	function getNum(key) { const v = params.get(key); return v === null ? NaN : Number(v); }

	// Helper: true if the param is present at all (flag-style ?key or ?key=anything).
	function hasFlag(key) { return params.has(key); }

	var queryflag = false;

	//imperial or metric units
	var unitsRaw = params.get("units");
	var units;
	if (unitsRaw === "feet" || unitsRaw === "imperial" || unitsRaw === "ft")
		{ units = "ft"; queryflag = true; }
	else if (unitsRaw === "metric" || unitsRaw === "meters" || unitsRaw === "m")
		{ units = "m"; queryflag = true; }
	else { units = "ft"; } //if the result is uninterpretable

	var defaults = (units === "ft") ? defaultImperial : defaultMetric;

	//set diameter
	var diameter = getNum("diameter");
	if (isNaN(diameter))
		{ diameter = defaults.diameter; }
	else { queryflag = true; }

	//set radius (overrides diameter if present)
	var radius = getNum("radius");
	if (radius) { diameter = radius * 2; queryflag = true; }

	//set playback speed
	var percenttime = getNum("percenttime");
	if (isNaN(percenttime)) percenttime = getNum("playback");
	if (isNaN(percenttime))
		{ percenttime = defaults.percenttime; }
	else { queryflag = true; }

	//set starting height
	var startheight = getNum("startheight");
	if (isNaN(startheight))
		{ startheight = defaults.startheight; }
	else { queryflag = true; }

	//set percent gravity
	var gravity = getNum("percentgravity");
	if (isNaN(gravity))
		{ gravity = defaults.percentgravity; }
	else { queryflag = true; }

	//set the speed
	var speed = getNum("speed");
	if (isNaN(speed))
		{ speed = defaults.speed; }
	else { queryflag = true; }

	//set the angle
	var angle = getNum("angle");
	if (isNaN(angle))
		{ angle = defaults.anglefromVertical; }
	else { queryflag = true; }

	//start with stats panel open
	var statsOpen = hasFlag("statsMenu");

	//start with left menu open
	var leftMenu = hasFlag("inputMenu");

	//calculate radians from horizontal-right (the normal type of angle!)
	var computedangle = (-1 * angle * Math.PI / 180) + (Math.PI / 2);

	//weird case of "height it's thrown to on Earth."
	var accel_earth = defaults.accel_earth;
	var thrownUp = getNum("thrownUp");
	if (isNaN(thrownUp)) thrownUp = getNum("throwHeight");
	if (isNaN(thrownUp)) {
		thrownUp = defaults.thrownUp;
	} else {
		queryflag = true;
		var relative_v_y = Math.sqrt(2 * accel_earth * thrownUp);
		if (angle === 0)
			{ speed = relative_v_y; }
		else
			{ speed = relative_v_y / Math.sin(computedangle); }
	}

	//start in a frozen state
	var frozen = false;
	if (params.get("frozen") === "true" || hasFlag("frozen"))
		{ frozen = true; }

	var displayPopUp = true;

	//if a query has been used, don't display the popup message.
	if (queryflag || hasFlag("noPopUp") || leftMenu || statsOpen)
		{ displayPopUp = false; }

	if (window.innerWidth > 750) { leftMenu = true; }

	//set initial view pair (case-insensitive)
	var viewRaw = (params.get("view") || '').toLowerCase().replace(/\s+/g, '');
	var viewPair = 'earth-station'; // default
	if (viewRaw === 'earth-inertial'   || viewRaw === 'earthinertial')   { viewPair = 'earth-inertial';   displayPopUp = false; }
	if (viewRaw === 'station-inertial' || viewRaw === 'stationinertial') { viewPair = 'station-inertial'; displayPopUp = false; }

	return {
		diameter:         diameter,
		startheight:      startheight,
		units:            units,
		percentgravity:   gravity,
		thrownUp:         thrownUp,
		accel_earth:      accel_earth,
		anglefromVertical: angle,
		speed:            speed,
		percenttime:      percenttime,

		defaults:   defaults,
		leftMenu:   leftMenu,
		statsOpen:  statsOpen,
		frozen:     frozen,
		queryflag:  queryflag,
		PopUpOpen:  displayPopUp,
		viewPair:   viewPair,
	}
}
