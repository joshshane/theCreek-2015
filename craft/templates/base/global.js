jQuery("document").ready(function($){
    var nav = $('header');
    var pos = nav.offset().top;
    
    $(window).scroll(function () {
        var fix = ($(this).scrollTop() > pos && $(this).width() < 820) ? true : false;
        nav.toggleClass("fix-nav", fix);
        $('body').toggleClass("fix-body", fix);
    });
    
    $(document).on('click','.ham-button', function(){
       /*$('nav').addClass('open');*/
       
       $('body').toggleClass('nav-open-body');
       $('.ham-button i').toggleClass('fa-bars');
       $('.ham-button i').toggleClass('fa-close');
    });
});