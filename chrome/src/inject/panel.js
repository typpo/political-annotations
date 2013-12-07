/**
 * @author      Patrick Thach
 */

var PANEL = function () {

    return {

        init:function () {
            this.click();
            $(".tab-pane").hide();
        },

        click: function()
        {
            $(".tab").click(function(el)
            {
                el.preventDefault();
                $(".tab-pane").hide();

                $($(this).attr("href")).show("slow");

                alert("got here!");

            });
        }

    }; //end return
}(); // end

$(function () {
    PANEL.init();
}); //scripts loaded ready to rock and roll