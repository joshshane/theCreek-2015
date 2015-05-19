history.navigationMode = 'compatible';
$(document).ready(function(){
    $(document).on('click', '.message-link', function (e) {
        if (window.history.pushState) {
            e.preventDefault();
            window.history.pushState({},'',$(e.target).attr('href'));
            setActiveMessage();
        }
    });
    $(document).on('click', '.play-video-button', function (e) {
        e.preventDefault();
        player.play();
    });
    $(document).on('click', '.show-discussion-button', function (e) {
        e.preventDefault();
        $(".discussion-questions-holder").toggle();
    });

    setActiveMessage(); //Used to set active message from non-ajax load
});

$(window).on("popstate", function(e) {
    setActiveMessage(); //To handel recal on back button
});

var player;
function setActiveMessage()
{
    messageSlug = getUrlSegment(3);
    //alert(messageSlug);
    
    $(".discussion-questions-holder").hide();
    
    if (messageSlug) //A message is specified
    {
        if (messageMedia[messageSlug]) {
            //Set the video
            if(player)
            {
                player.load(messageMedia[messageSlug]);
            }
            else
            {
                player = new Clappr.Player(
                {
                    source: messageMedia[messageSlug],
                    parentId: ".message-media-player",
                    width:'100%',
                    height:'100%',
                    poster: $('.message-graphic').attr('src')
                });
            }
            
            $('.message-media-player').show();

        }
        else
        {
            $('.message-media-player').hide();
        }
        
        $('.play-wrapper').prepend("<div class='play-background-box' />");
        

        //Highlight the message
        $('.message-link').removeClass('active');
        $('.message-link-'+ messageSlug).addClass('active');
        
        //Set the description
        $('.message-description').hide();
        $('.message-description-'+ messageSlug).show();
        
        //Set the questions
        $('.message-questions').hide();
        $('.message-questions-'+ messageSlug).show();
        
        //Set selected button
    }
    else    //Enable default
    {
        //Set the video
        $('.message-media-player').hide();
        
        //Highlight the message
        $('.message-link').removeClass('active');
        $('.message-link-overview').addClass('active');
        
        //Set the description
        $('.message-description').hide();
        $('.message-description-overview').show();
        
        //Set the questions
        $('.message-questions').hide();
    }
    
}


function getUrlSegment(segNum)
{
    var newURL = window.location.pathname;
	var pathArray = window.location.pathname.split( '/' );
    if (pathArray.length >= segNum) {
        return pathArray[segNum];
    }
    else
    {
        return '';
    }
}