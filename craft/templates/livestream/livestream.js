/***************************************************************
 *
 *  Determine next Service
 *
 ***************************************************************/

var NextServiceTime = function(weekly, special, theOffsetSeconds)
{
	this.weekly_services = weekly;
	this.special_events = special;
	this.offsetSeconds = theOffsetSeconds;
	this.recalculate(weekly,special);
	
}

NextServiceTime.prototype.recalculate = function ()
{
	var serviceTimes = this.weekly_services;
	var specialEvents = this.special_events;
	var minTime = 60*60*24*30; //A Month, just to make sure something is smaller
	var minIndex = -1;
	var nextServiceDate = null;
	var now = new Date(new Date().getTime() + this.offsetSeconds*1000);
	for (index = 0; index < serviceTimes.length; ++index) {
		
		//Lets see if we should pick this week or next
		var dateOffset = ( now.getDay() <= serviceTimes[index].day ? serviceTimes[index].day : ( serviceTimes[index].day + 7) ) - now.getDay();
		
		//Generate a date for this service
		var nextDate = new Date( now.getFullYear(), 
                            now.getMonth(), 
                            now.getDate() + dateOffset,
                          serviceTimes[index].hour,
                          serviceTimes[index].minute,
                          serviceTimes[index].second,0);
		
		//Lets see if the end of the service happend earlier today, if so, lets move to next week
		if(nextDate.getTime() + (serviceTimes[index].durationMinutes * 60 * 1000) < now.getTime()) // If Date is in past
		{
			nextDate.setDate(nextDate.getDate() + 7);
		}
		
		//Calculate the #seconds till this service
		serviceTimes[index].secondsTill = Math.round((nextDate.getTime() - now.getTime())/1000);
                
		//Keep track of the service with the minimum time until
		if (serviceTimes[index].secondsTill < minTime) {
                    minTime = serviceTimes[index].secondsTill;
                    nextServiceDate = nextDate;
		    minIndex = index;
                }
	}
	
	for (index = 0; index < specialEvents.length; ++index) {
		var nextDate = specialEvents[index];
		
		//Calculate the #seconds till this service
		serviceTimes[index].secondsTill = Math.round((nextDate.getTime()-now.getTime())/1000);
                
		//Keep track of the service with the minimum time until
		if (serviceTimes[index].secondsTill < minTime) {
                    minTime = serviceTimes[index].secondsTill;
                    nextServiceDate = nextDate;
		    minIndex = index;
                }
	}

	this.date = new Date(nextServiceDate.getTime());
	this.durationMinutes = serviceTimes[minIndex].durationMinutes;
	this.prerollSeconds = serviceTimes[minIndex].prerollSeconds;
	//return { date: nextServiceDate, durationMinutes: serviceTimes[minIndex].durationMinutes, prerollSeconds: serviceTimes[minIndex].prerollSeconds };
}


/***************************************************************
 *
 *  Determine Time to Service
 *
 ***************************************************************/

// Expects the correct current time in the same time zone as the nextServiceTime
function secondsTillNextService(nextServiceDate, offset) {
	var now = new Date();
	var timeDiff = (nextServiceDate - now) / 1000;
	timeDiff -= offset;
	return timeDiff;

}

var Countdown = function(nextService,offset){
	this.nextService = nextService;
	this.offsetSeconds = offset;
	
	this.videoPreloaded = false;
	this.currentState = "";
}

Countdown.prototype.update = function () {
	var secondsTill = secondsTillNextService(this.nextService.date, this.offsetSeconds);
		
	if (secondsTill <= this.nextService.prerollSeconds) //If no longer counting, some action is needed
	{

		if (secondsTill >= -1 * this.nextService.durationMinutes*60) //If we haven't yet ended
		{
			//Let's go live!
			if (this.currentState != "LIVE")
			{
				console.log("Live State");

				this.currentState = "LIVE";
				goLive();
			}
		}
		else //Otherwise, lets leave the live state
		{
			if (this.currentState != "DEAD")
			{
				console.log("Dead State");

				this.currentState = "DEAD";
				goNotLive();
				
				//Then let's recalc a new service time
				this.nextService.recalculate();
			}
			
		}
		
	}
	else //Otherwise, we're still countingdown
	{
		if (this.currentState != "COUNTING")
		{
			console.log("Counting State");

			this.currentState = "COUNTING";
		}
		
		var days, hours, minutes, seconds, countdown_text;
		
		days = parseInt(secondsTill / 86400);
		secondsTill = secondsTill % 86400;
	    
		hours = parseInt(secondsTill / 3600);
		secondsTill = secondsTill % 3600;
	    
		minutes = parseInt(secondsTill / 60);
		seconds = parseInt(secondsTill % 60);
	    
		//if (seconds < 10) seconds = "0" + seconds; //Append a leading zero
	    
	    
		// format countdown string
		if (days != 0) countdown_text = "" + days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds ";
		if (days === 0 && hours != 0) countdown_text = "" + hours + " hours " + minutes + " minutes " + seconds + " seconds ";
		if (days === 0 && hours === 0) countdown_text = "" + minutes + " minutes " + seconds + " seconds ";
		if (days === 0 && hours === 0 && minutes === 0) countdown_text = "" + seconds + " seconds ";
		
		$('.countdown-days span').html(days);
		$('.countdown-hours span').html(hours);
		$('.countdown-minutes span').html(minutes);
		$('.countdown-seconds span').html(seconds);
		
		$('#countdown').html(countdown_text);
		
		
	}
    
}

/***************************************************************
 *
 *  Offset object for tracking differences between client
 *  machine time and actual time.
 *
 ***************************************************************/

var Offset = function(callback) {
	this.value = 0;
	this.valid = false;
	this.callback = callback;
	var theOffset = this;
	$.ajax({
		url: "http://www.joshshane.com/wowza-status/time.php",
		jsonp: "callback",
		dataType: "jsonp",
		// work with the response
		success: function (response)
		{
			//"Fri, 17 Apr 2015 17:40:08 -0400"
			var d = new Date(response.date);
			var now = new Date();
			
			theOffset.value = (d - now) / 1000;
			theOffset.valid = true;
			if (isNaN(theOffset.value)) {	//Just in case there's a problem, disable offset
				theOffset.value = 0;
				theOffset.valid = false;
			}
			else
			{
				theOffset.valid = true;
				theOffset.callback();
			}
		},
		error: function()
		{
			theOffset.value = 0;
		}
	});
}


/***************************************************************
 *
 *  Switching between Live and not Live
 *
 ***************************************************************/
//Select the correct player you are using
//var player = "CLAPPR";
var player = "DACAST";

function goLive()
{
	$('#not-live').hide();
	//$('#is-live').html('<script id="49378_c_62460" width="100%" src="//player.viewer.dacast.com/js/dacast_player.js" player="default" class="dacast-video"></script>');
	$('#is-live').show('');
	
	if (player == "CLAPPR") {
		//Regenerate and load the correct stream url and security key.
		$.getJSON('http://www.joshshane.com/hcstream.m3u8.php?callback=?',function(res){
		    player.load(res.url);	//code
		});
	}
	if (player == "DACAST") {
		$('#is-live').html('<div><iframe src="http://static.viewer.dacast.com/b/49378/c/62460" width="100%" height="100%"  frameborder="0" scrolling="no" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe></div>');
	}

	
}

function goNotLive()
{
	$('#is-live').hide('');
	$('#not-live').show();
	
	if (player == "CLAPPR") {
		player.destory();
	}
	
	if (player == "DACAST") {
		$('#is-live').html('');
	}
}



/***************************************************************
 *
 *  Setup and Execution
 *
 ***************************************************************/

//Define when weekly services are
    var weekly_services = [];
    // Format: weekly_services.push({day: '0', hour: '17', minute: '40', second: '00'});
    weekly_services.push({day: '0', hour: '9', minute: '30', second: '00', durationMinutes: '90', prerollSeconds:'120'});
    weekly_services.push({day: '0', hour: '11', minute: '15', second: '00', durationMinutes: '90', prerollSeconds:'120'});
    //weekly_services.push({day: '4', hour: '15', minute: '57', second: '00', durationMinutes: '5', prerollSeconds:'30'});
    //weekly_services.push({day: '4', hour: '17', minute: '15', second: '00', durationMinutes: '5', prerollSeconds:'30'});



//Define any special events
    var special_events = [];
    // Format: special_events.push('December 25, 2015 13:30:00');


var offset = new Offset(function()
{
	//Callback function
	//Lets wait for a valid offset calc, then start countdown
	$('#countdown-holder').show();
	var nextService = new NextServiceTime(weekly_services,special_events, offset.value);
	var countdown = new Countdown(nextService,offset.value);
	window.setInterval(function() { countdown.update(); }, 1000);
});


