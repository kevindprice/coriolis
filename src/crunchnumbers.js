/*eslint-disable eqeqeq*/

//var Decimal = require('decimal.js');
//import * as Decimal from 'decimal.js';

import {Decimal} from 'decimal.js';

Decimal.set({ precision: 30 });


//This JS file does the rest of the number crunching started by App.js,
//using decimal.js to do more precise calculations.
//Decimal.js requires that you multiply and divide, etc. with number.mul(), .div().
//I have left the old, simpler-looking (but equivalent) equations in comments
//so you can seee what's going on.
//I should also note, that CanvasSpace.js does much of this calculation a second time
//in getRelativePoints(). (though it's for a different purpose, and done differently)
//The purpose of crunchnumbers() is mostly just to show the statistics on screen.

var PI = Decimal.acos(-1);

//finds the coin's landing position on the circle, and max height achieved.
//export function crunchnumbers( radius, omega, start_v_x, start_v_y, r_oncoin )
export function crunchnumbers( inputvalues )
{
	
	//Calculate misc. variables /////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	var anglefromVertical=inputvalues.anglefromVertical
	var speed=inputvalues.speed
	var accel_earth=inputvalues.accel_earth
	var percentgravity=inputvalues.percentgravity
	var diameter=inputvalues.diameter
	var startheight=inputvalues.startheight
	
	var computedangle = (-1* anglefromVertical * Math.PI / 180) + (Math.PI / 2);

		//x component of speed without the part from rotation
	var relative_v_x = speed * Math.cos(computedangle)
		//y matches reality
	var relative_v_y = speed * Math.sin(computedangle)
	
	var expectedheight
	var expectedtime
		
	if(relative_v_y > 0)  //was thrown upwards
	{			
		//var expectedheight = height_start + height_thrown; //works out exactly the same for case throw "up"

		expectedheight = (Math.pow(relative_v_y,2) / (2 * accel_earth)) + startheight;
		expectedtime = Math.sqrt( 2 * expectedheight / accel_earth ) + ( relative_v_y / accel_earth)  //same formula as throw "up"
	}
	else if(relative_v_y <= 0)  //was thrown downwards
	{
		expectedheight = startheight;
		
		var end_v_y = -1 * Math.sqrt( Math.pow(relative_v_y,2) + 2*accel_earth*startheight )  //temporary variable
		expectedtime = Math.abs(2 * expectedheight / (relative_v_y + end_v_y))
	}

	var g_accel = accel_earth * percentgravity / 100
	
	var omega = Math.sqrt( g_accel / (diameter/2) )  //radians per second of station
	var standingvelocity = Math.sqrt( g_accel * (diameter/2) )
	
	var r_oncoin = (diameter/2) - startheight	//radius at coin start
	var g_oncoin = omega*omega*r_oncoin;		//gravity acting on the coin
	
	var standingcoin		//standing velocity of coin
	if(startheight < diameter/2)		//if coin started from below the radius (almost always)
	{  standingcoin = -1 * Math.sqrt( g_oncoin * r_oncoin ) } //-1 b/c station is rotating clockwise
	else			//if coin starts above the center of rotation, it's actually going the other way
	{  standingcoin = Math.sqrt( g_oncoin * r_oncoin ) } //-1 b/c station is rotating clockwise
	
	var start_v_x = relative_v_x + standingcoin	//actual starting speed of coin
	
	var expecteddist = Math.abs(relative_v_x * expectedtime) //expected distance on Earth
	var start_speed = Math.sqrt( Math.pow(start_v_x,2) + Math.pow(relative_v_y,2) ) 
		//actual start speed of coin with standing velocity incorporated
	
		//the coin's actual y velocity doesn't change when standing speed is incorporated
	var start_v_y = relative_v_y 
	var radius = diameter/2
	
	//Find the coin's intersection with the circle.///////////////////////
	/////////////////////////////////////////////////////////////////////
	
	//console.log("omega",omega)
	if(Math.abs(start_v_x) < 1e-2)
	{ start_v_x=new Decimal(0) }
	if(Math.abs(start_v_y) < 1e-2)
	{ start_v_y=new Decimal(0) }
	
	radius = new Decimal(radius)
	omega = new Decimal(omega)
	start_v_x = new Decimal(start_v_x)
	start_v_y = new Decimal(start_v_y)
	r_oncoin = new Decimal(r_oncoin)
		
	//slope of ball's path
	//var slope_ball = start_v_y / start_v_x
	var slope = start_v_y.div( start_v_x )  //Decimal.js requires that I
											//divide using .div()
											//and multiply using .mul()
	
	//two possible forms of quadratic equation for x due to the +- operator.
	//sqroot1 is the square root part of the quadratic, which I then punch into the
	//rest of the quadratic formula with the correct operator. 
	//This gives me the x landing coordinate on the circle.
	//Then punch in the x answer into the line in slope-intercept form to get y.
	
	//var sqroot1 = Math.sqrt( Math.pow(radius,2)*(1+Math.pow(slope_ball,2))-Math.pow(r_oncoin,2))
		
	var sqroot1 = ( radius.pow(2).mul( new Decimal(1).add( slope.pow(2) ) ).sub( r_oncoin.pow(2))).sqrt()
	
	
	//first nail down the final position of the coin
	var x_c	//final spot of coin x
	var y_c	//final spot of coin y

	//coin is moving up to the left, or down to the left, or horizontal left
	if( (Number(slope)<0 && Number(start_v_x) < 0) || (slope > 0 && Number(start_v_x) < 0) || (slope == 0 && Number(start_v_x) < 0) )
	{
		//var x_c = ( (slope * r_oncoin) - sqroot1 ) / ( 1 + Math.pow(slope,2)) // -
		x_c = ( (slope.mul(r_oncoin)).sub( sqroot1 )).div( new Decimal(1).add( slope.pow(2)) ) // - operator
		y_c = slope.mul(x_c).sub(r_oncoin)
	}
	//coin is moving up to the right, or down to the right, or horizontal right
	else if((slope > 0 && Number(start_v_x) > 0) || (slope < 0 && Number(start_v_y) < 0) || (slope == 0 && Number(start_v_x) > 0) )
	{
		//var x_c = ( (slope * r_oncoin) + sqroot1 ) / ( 1 + Math.pow(slope,2)) // +
		x_c = ( (slope.mul(r_oncoin)).add(sqroot1)).div( new Decimal(1).add(slope.pow(2))) //+
		y_c = slope.mul(x_c).sub(r_oncoin)
	}
	
	//////////////////////////////////////////////////////////
	//This section calculates the time elapsed,
	//also deals with cases where slope is not finite (thrown vertically),
	//and calculates the max height of the coin above the floor.
	/////////////////////////////////////////////////////////
	
	var time
	var maxvalue
	if(slope.isFinite() && Number(start_v_x) != 0 )
	{
		time= x_c.div(start_v_x)
		
		//Max height--a maximization script. Loop over time increments to find max.
		if(Number(start_v_y) > 0)
		{
			//Max distance from the circle can be found in the exact middle of a chord
			//where the line perpendicular goes to the circle's center.
			
			//The perpendicular line will be y=(-v_x/v_y)x
			//The current chord is y=(v_y/v_x)x-r_oncoin
			//The intersection can be found by (-v_x/v_y)x=(v_y/v_x)x-r_oncoin
			//(v_y/v_x)x-(-v_x/v_y)x=r_oncoin
			//x[(v_y/v_x)+(v_x/v_y)]=r_oncoin
			//x = r_oncoin / [(v_y/v_x)+(v_x/v_y)]
			
			var max_x = r_oncoin / [(start_v_y/start_v_x)+(start_v_x/start_v_y)]
			if((max_x>0 && start_v_x<0) || (max_x>0 && start_v_x<0)) { max_x = 0 }
			var max_y = (start_v_y/start_v_x)*max_x-r_oncoin
			
			maxvalue = radius - Math.sqrt( Math.pow(max_x, 2) + Math.pow(max_y, 2)  )
			
		}
		else //if it was thrown downwards
		{
			maxvalue = radius - r_oncoin; //starting height
		}
	}			//if slope is vertical, fix the calculations
	else if( !slope.isFinite() && Number(start_v_y) > 0 )	//thrown up
	{
		time = (((new Decimal(2).mul(radius)).sub( radius.sub(r_oncoin) ) ).div(start_v_y)).abs()
		x_c = new Decimal(0)
		y_c = radius
		maxvalue = radius	//max height above the floor can't be higher than radius
	}
	else if( !slope.isFinite() && Number(start_v_y) < 0 )	//thrown down
	{
		time = ( radius.sub(r_oncoin).mul(-1) ).div(start_v_y)
		x_c = new Decimal(0)
		y_c = new Decimal(0)
		maxvalue = radius.sub(r_oncoin)		//starting height
	}
	
	
	
	
	
	///Final distance and curvilinear distance at landing//////////////
	///////////////////////////////////////////////////////////////////

	//if start_v_x==0 AND start_v_y == 0, then the coin is frozen in the air and the answers remain undefined. The script deals with this here.
	if(isFinite(time))
	{
		//radial angle swept by the person
		
		//var theta_traversed_person = omega * time
		//var initial_angle_person = (3 * Math.PI) / 2
		//var final_angle_person = initial_angle_person - theta_traversed_person //minus b/c clockwise rotation
		var theta_traversed_person = Number( omega.mul( time ) )
		var initial_angle_person = (new Decimal(3).mul( PI )).div(2)
		var final_angle_person = initial_angle_person.sub(theta_traversed_person)
		
		
		//final position of person
		//fortunately Javascript uses radians, not degrees
		
		//var x_p = radius * Math.cos(final_angle_person)
		//var y_p = radius * Math.sin(final_angle_person)
		var x_p = radius.mul( final_angle_person.cos() )
		var y_p = radius.mul( final_angle_person.sin() )
		
		
		//var x_difference = x_p - x_c
		//var y_difference = x_p - y_c	
		//var total_difference = Math.sqrt( Math.pow(x_difference,2) + Math.pow(y_difference,2) )
		var x_difference = x_p.sub( x_c )
		var y_difference = y_p.sub( y_c )
		var total_difference = ( x_difference.pow(2).add(y_difference.pow(2) ) ).sqrt()	//your final answer!

		
		//Now also calculate the coin's curvilinear distance difference (along floor)
		
		var coin_distance = Math.sqrt(Math.pow(x_c,2) + Math.pow( Number(radius) + Number(y_c),2))
			//chord from floor where person started (270deg) to where coin lands
		
		//(formula) kahn acadamy says chordlength = 2radius * sin(angle/2)
		//so by using that you can get the angle of the chord.
		var half_chord_value = coin_distance/(2*radius)
			//a bugfix for arcsin, if the coin lands almost exactly halfway across
			//then glitchy float values could give you 1.000000000001 and crash.
		if(half_chord_value > 1) { half_chord_value = 1 }  
		var theta_traversed_coin = 2 * Math.asin(half_chord_value) 
				//goes from 3PI/2 start to where the coin lands.
		
		var new_theta_traversed_person = theta_traversed_person
		while(new_theta_traversed_person > 2*Math.PI)
		{ new_theta_traversed_person -= 2* Math.PI}
				
		//correct the arcsin answer if the coin traveled left 
		//and lands in quadrant 1 or 4
		if(x_c>0&&start_v_x<0) { theta_traversed_coin += 2*(Math.PI-theta_traversed_coin) }
		
		var angular_diff = Math.abs(new_theta_traversed_person-theta_traversed_coin)
		if(angular_diff > Math.PI) {  angular_diff = (2* Math.PI) - angular_diff }
		var curvilinear = angular_diff * radius  //convert from radians to feet
				//distance *along floor* at landing
	}

	if(!isFinite(time))		//if the coin isn't moving at all, fix max height
	{ maxvalue = Math.abs(radius - r_oncoin) }	//can't fix the other calculations
		
	return {
		maxheight:Number(maxvalue),
		//x_c : Number(x_c),
		//y_c : Number(y_c),
		time: Number(time),
		slope: Number(slope),
		total_difference: Number(total_difference),
		curvilinear: Number(curvilinear),
		theta_traversed_person: theta_traversed_person,  //has already been converted to a number.
		theta_traversed_coin: theta_traversed_coin,
		
		expectedtime: expectedtime,
		expectedheight: expectedheight,
		standingvelocity: standingvelocity,
		omega: omega,
		start_v_x: start_v_x,
		standingcoin: standingcoin,
		g_oncoin: g_oncoin,			//only in output menu
		expecteddist: expecteddist,
		start_speed: start_speed,	//only in output menu
		
		
	}
}


/*			//Max height: a maximization script ////////////////////////
			
			//Starting values
			var currenttime = 0   //time value at current loop
			var time_increment = time/5  //time to increment over
			
					//iterate forwards to start. Reverses if you've passed the max.
			var direction = 1
			maxvalue = radius.sub(r_oncoin)  //initial "maximum" is initial height
			var current_x = 0		//current coordinates of coin
			var current_y = 0
			var current_value = 0 //height value calculated at current increment
			var disttocenter = 0  //distance to center at current increment
			var previousvalue = 0  //height value from previous loop
			var timesinarow = 0   //how many times in a row has the value not changed
			
			for(var i=0; i<1000; i++)
			{
				currenttime += (time_increment*direction)

				//distance=velocity*time
				current_x = start_v_x * currenttime
				
				//y = mx + b
				current_y = (slope * current_x) - r_oncoin
				
				//pythagoras, to find distance to ball from center of station
				disttocenter = Math.sqrt( Math.pow(current_x,2) +Math.pow(current_y,2) )
				
				current_value = radius - disttocenter	//height from floor
				
				if(current_value<previousvalue)
				{  		//if the values are decreasing
						//then it's the wrong direction.
					direction = direction * -1;
						//time increment decreases when you change direction
						//(means you're close!)
					time_increment = time_increment / 2;
				}	

				if(current_value > maxvalue) { maxvalue = current_value }
				
				if( Math.abs(current_value - previousvalue) < .0001 )
				{ timesinarow += 1	}  //you've probably found the max
				else
				{ timesinarow = 0 }
				
				if(timesinarow === 5) {	break; }
				
				previousvalue = current_value;
			}
*/