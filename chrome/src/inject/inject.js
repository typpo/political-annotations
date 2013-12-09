console.log('Injected.');

var BOX_TEMPLATE =
'<div id="cc_box" class="cc_box">' +
'</div>';

var BOX_CONTENT =
  '<div class="cc_top"><img src="https://usercontent.googleapis.com/freebase/v1/image/en/<%= name.toLowerCase().replace(\' \', \'_\') %>"/><h1><%=name%></h1>' +
  '<% if (contact.twitter_id) { %>' +
  '<a class="cc_tweet_link" target="_blank" href="http://twitter.com/<%= contact.twitter_id %>"><img class="cc_twitter" src="http://s.huffpost.com/images/icons/twitter-icon-vsmall.png"/></a>' +
  '<% } %>' +
  '<% if (contact.facebook_id) { %>' +
  '<a class="cc_fb_link" target="_blank" href="http://facebook.com/<%= contact.facebook_id %>"><img class="cc_facebook" src="http://i.imgur.com/inGem0b.png"/></a>' +
  '<% } %>' +
  '<%= capitalize(contact.state_rank) %> Senator, <%= contact.state_name %> (<%= contact.party %>)<br>' +
  'Phone: <a href="tel:<%= contact.phone %>"><%= contact.phone %></a><br>' +
  'Site: <a href="<%= contact.website %>"><%= contact.website %></a>' +
  '</div>' +
  '<div class="cc_content">' +
  '<span class="cc_sub">Where\'s the money?</span>' +
  '<table>' +
  '<% for (var i=0; i < contribs.length; i++) { %>' +
    '<tr><td><a target="_blank" href="https://www.google.com/search?q=<%= contribs[i].name %>"><%= contribs[i].name %></a></td><td>$<%= commaSeparateNumber(contribs[i].total_amount) %></td></tr>' +
  '<% } %>' +
  '</table>' +
  '<span class="cc_sub cc_bottom"><a target="_blank" href="http://www.opensecrets.org/usearch/?q=<%= name.replace(\' \', \'+\')  %>">See more</a></span>' +
  '</div><div class="cc_arrow_down"></div>';

var MOUSE_TIMEOUT_MS = 700;

(function() {
  console.log('Loaded.');
  var $ = jQuery.noConflict();

  loadSenators(function() {
    chrome.storage.local.get('all_pols', function(data) {
      if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      if (data.all_pols.length < 1) {
        console.error('Where are the politicians?');
        return;
      }

      highlightPolititions(data.all_pols);
      bindDialogs();
    });
  });

  function highlightPolititions(pols) {
  	var regex_str = '(' + pols.join('|') + ')';
	  var regex = RegExp(regex_str, 'g');
	  $('p').each(function() {
	    this.innerHTML = this.innerHTML.replace(regex, '<span class="cc_highlight">$1</span>');
	  });
  }

  var t_hide = null;
  function bindDialogs() {
    $('.cc_highlight').on('mouseenter', function(e) {
      clearTimeout(t_hide);

      // Create box, if it doesn't exist
      var $box = $('#cc_box');
      if ($box.length < 1) {
        $box = $(tmpl(BOX_TEMPLATE, {})).appendTo('body');
      }

      $box.html('Loading...');

      // Position box
      $box.css({
        top: $(this).offset().top - $('#cc_box').height() - 70,
        left: $(this).offset().left - $('#cc_box').width()/2 + $(this).width()
      }).on('mouseenter', function() {
        clearTimeout(t_hide);
      }).on('mouseleave', function() {
        t_hide = setTimeout(function() {
          $box.hide();
        }, MOUSE_TIMEOUT_MS);
      }).show();

      // Load content
      var $cc_high = $(this);
      var name = $cc_high.text();
      fetchDetails(name, function(data) {
        $box.html(tmpl(BOX_CONTENT, {
          name: name,
          contact: data.contact,
          contribs: data.contribs,
        }));
        clearTimeout(t_hide);
      });
    }).on('mouseleave', function() {
      t_hide = setTimeout(function() {
        $('#cc_box').hide();
      }, MOUSE_TIMEOUT_MS);
    });
  }

  var contrib_cache = {};
  function fetchDetails(name, callback) {
    chrome.storage.local.get(name, function(data) {
      var url = 'http://localhost/person?name=' + name + '&id=' + data[name].bioguide_id;
      if (contrib_cache[url]) {
        setTimeout(function() {
          callback(contrib_cache[url]);
        }, 0);
      } else {
        $.getJSON(url, function(data) {
          if (data.name)  {
            contrib_cache[url] = data;
          }
          callback(data);
        });
      }
    });
  }

  function loadSenators(callback) {
    console.log('Checking senators');
    chrome.storage.local.get('synced', function(data) {
      if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      console.log('Loading senators');
        $.ajax({
            url: "http://localhost/legislature",
            dataType: 'json',
            timeout: 10000,
            success:  function(data){
                var legislators = data.results;
                var all_pols = [];
                for (var i=0; i < legislators.length; i++) {
                    var legislator = legislators[i];
                    var key = legislator.first_name + ' ' + legislator.last_name;
                    all_pols.push(key);
                    var obj = {};
                    obj[key] = legislator;
                    chrome.storage.local.set(obj);
                }
                chrome.storage.local.set({'all_pols': all_pols});
                callback();
            },
            error: function()
            {
                console.log("error loading url");
                $('#cc_box').empty().html("There was error loading contents.  Please refresh the page and try again.");
            }
        });
    });
  }

})(jQuery);

// John Resig - http://ejohn.org/ - MIT Licensed
var cache = {};
function tmpl(str, data) {
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
}

function commaSeparateNumber(val){
  while (/(\d+)(\d{3})/.test(val.toString())){
    val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
  }
  return val;
}

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}
