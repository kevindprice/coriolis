//This file processes the query variables in the address bar
//so you can customize the link to the model with the variables you want.

/*List of supported queries:
	&units=feet
	&units=imperial
	&units=metric
	&units=meters
	&diameter=  (insert number after equals sign)
	&radius=
	&percenttime=
	&startheight=
	&percentgravity=
	&speed=
	&angle=
	&statsMenu
	&inputMenu
	&thrownUp= (calculates speed needed to throw it this many feet "up" on Earth)
	&throwHeight=
	&frozen
	&noPopUp
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

function getQueryVariable(variable) {
    var query = document.location.href;
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) === variable) {
            if(pair.length===2)
			{ return decodeURIComponent(pair[1]); }
			else
			{ return decodeURIComponent(pair[0]); }
        }
    }
    //console.log('Query variable %s not found', variable);
}


export function processQueryVariables()
{
	var queryflag=false;		//lets app know if there was a query variable

	//if(document.location.href.includes('&'))
	//{ 			//don't skip the queries because this also sets the default variables.
	  
	//imperial or metric units
	var units=getQueryVariable("units")
	if(units==="feet" || units==="imperial" || units==="ft")
		{ units="ft"; queryflag=true;  }
	else if(units==="metric" || units==="meters" || units==="m")
		{ units="m"; queryflag=true; }
	else { units="ft" } //if the result is uninterpretable
  
	var defaults
	if(units==="ft")
		{ defaults = defaultImperial; }
	else
		{ defaults = defaultMetric; }
  
	//check for query variables!
  
	//set diameter
	var diameter = Number(getQueryVariable("diameter"));
	if (isNaN(diameter))
		{ diameter=defaults.diameter}
	else { queryflag=true; }

	//set radius
	var radius = Number(getQueryVariable("radius"));
	if (radius) { diameter=radius*2; queryflag=true; }
  

	//set playback speed
	var percenttime = Number(getQueryVariable("percenttime"));
	if(isNaN(percenttime)) percenttime = Number(getQueryVariable("playback"));
	if (isNaN(percenttime))
		{ percenttime=defaults.percenttime }
	else { queryflag=true; }
  
	//set start  height
	var startheight = Number(getQueryVariable("startheight"));
	if (isNaN(startheight))
		{ startheight=defaults.startheight }
	else { queryflag=true; }

	//set percent gravity
	var gravity = Number(getQueryVariable("percentgravity"));
	if (isNaN(gravity))
		{ gravity=defaults.percentgravity }
	else { queryflag=true; }
  
	//set the speed
	var speed = Number(getQueryVariable("speed"));
	if (isNaN(speed))
		{ speed=defaults.speed; }
	else { queryflag=true; }

	//set the angle
	var angle = Number(getQueryVariable("angle"));
	if (isNaN(angle))
		{ angle=defaults.anglefromVertical }
	else { queryflag=true; }

	//start with right menu open
	var rightMenu = getQueryVariable("statsMenu");
	if(rightMenu==="true" || rightMenu==="statsMenu")
		{ rightMenu=true; }
	else { rightMenu=false; }

	//start with left menu open
	var leftMenu = getQueryVariable("inputMenu");
	if(leftMenu==="true" || leftMenu==="inputMenu")
		{ leftMenu=true; }
	else { leftMenu=false; }
	
		//calculate radians from horizontal-right (the normal type of angle!)
	var computedangle = (-1* angle * Math.PI / 180) + (Math.PI / 2);
  
	//weird case of "height it's thrown to on Earth." 
	//Why am I supporting this feature?
	var accel_earth = defaults.accel_earth
	var thrownUp = Number(getQueryVariable("thrownUp"));
	if (isNaN(thrownUp)) thrownUp = Number(getQueryVariable("throwHeight"));
	if (isNaN(thrownUp)) thrownUp = defaults.thrownUp
	else {
		queryflag = true;
		var relative_v_y = Math.sqrt( 2 * accel_earth * thrownUp );
		
		if(angle===0)
		{	speed=relative_v_y	}
		else
		{	speed=relative_v_y / Math.sin(computedangle) }
	}
  
	//start in a frozen state
	var frozen = getQueryVariable("frozen");
	if(frozen==="true" || frozen==="frozen")
		{ frozen=true; /*queryflag=true;*/ } 
	else if(frozen==="false")
		{ frozen=false; /*queryflag=true;*/ }
	else { if(!queryflag) frozen=false;  //don't freeze by default!
			else frozen=false; }
	var displayPopUp=true
			//frozen state shouldn't lock the defaults
			//thus I'm not doing the queryflag here

	//if a query has been used, don't display the popup message.
	if(	queryflag || 
		getQueryVariable("noPopUp")==="noPopUp" ||
		leftMenu || rightMenu	) 
			{displayPopUp=false;}

	if(window.innerWidth > 750){ leftMenu=true;}

	return {
		diameter: diameter,
		startheight: startheight,
		units: units,
		percentgravity: gravity,
		thrownUp: thrownUp,
		accel_earth: accel_earth,
		anglefromVertical:angle,
		speed: speed,
		percenttime: percenttime,
		
		defaults: defaults,
		leftMenu: leftMenu,
		rightMenu: rightMenu,
		frozen: frozen,
		queryflag:queryflag,
		PopUpOpen: displayPopUp,
	}		
}