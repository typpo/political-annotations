/**
 * @author      Patrick Thach
 */

$(function () {
    $(".tab-pane").hide();
    $("#contribute").show();

    $(".tab").click(function(el)
    {
        el.preventDefault();

        $(".nav li").removeClass("active");

        $(".tab-pane").hide();
        $(this).parent().attr("class","active").css("color","white");
        $($(this).attr("href")).show("slow");
    });

});