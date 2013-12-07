// Test me:
// http://www.factcheck.org/2013/12/boehner-vs-castro-on-the-exchange/
//

console.log('Injected.');

var BOX_TEMPLATE = '<div id="cc_box" class="cc_box">' +
  '<h1><%=name%></h1>' +
  'Some description here......' +
'</div>';

var MOUSEOVER_TIMEOUT_MS = 700;

(function() {
  console.log('Loaded.');
  var $ = jQuery.noConflict();

  // Get politicians

  // Wrap name with span with a special class
  document.body.innerHTML = document.body.innerHTML.replace(/John Boehner/g, '<span class="cc_highlight">John Boehner</span>');

  // Build/request on hover
  var t_hide = null;
  $('.cc_highlight').on('mouseover', function(e) {
    if ($('#cc_box').length < 1) {
      $('body').append(tmpl(BOX_TEMPLATE, {
        name: $(this).text(),
      }));
    }

    var $box = $('#cc_box');
    var $span = $(this);
    $box.css({
      top: $span.offset().top - $('#cc_box').height() - 75,
      left: $span.offset().left - $('#cc_box').width()/2 + $span.width(),
    }).on('mouseover', function() {
      clearTimeout(t_hide);
    }).on('mouseout', function() {
      t_hide = setTimeout(function() {
        $box.remove();
      }, MOUSEOVER_TIMEOUT_MS);
    });
    clearTimeout(t_hide);

  }).on('mouseout', function() {
    t_hide = setTimeout(function() {
      $('#cc_box').remove();
    }, MOUSEOVER_TIMEOUT_MS);
  });

  console.log('Done.');
})(jQuery);

// John Resig - http://ejohn.org/ - MIT Licensed
(function(){
  var cache = {};

  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :

      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +

        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +

        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();