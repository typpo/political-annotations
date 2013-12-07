console.log('Injected.');

var BOX_TEMPLATE =
'<div id="cc_box" class="cc_box">' +
'</div>';

var BOX_CONTENT =
  '<div class="cc_top"><img src="https://usercontent.googleapis.com/freebase/v1/image/en/<%= name.toLowerCase().replace(\' \', \'_\') %>"/><h1><%=name%></h1>' +
  '<a class="cc_tweet_link" target="_blank" href="http://twitter.com/<%= contact.twitter_id %>"><img class="cc_twitter" src="http://s.huffpost.com/images/icons/twitter-icon-vsmall.png"/></a>' +
  '<a class="cc_fb_link" target="_blank" href="http://facebook.com"><img class="cc_facebook" src="http://i.imgur.com/inGem0b.png"/></a>' +
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
  '</div><div class="cc_arrow_down"></div>';

var mouseenter_TIMEOUT_MS = 700;

(function() {
  console.log('Loaded.');
  var $ = jQuery.noConflict();

  loadSenators(function() {
    chrome.storage.local.get('all_pols', function(data) {
      if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      var politicians = data.all_pols;
      if (politicians.length < 1) {
        console.error('Where are the politicians?');
        return;
      }

      var regex_str = '(';
      for (var i=0; i < politicians.length; i++) {
        if (i > 0) regex_str += '|';
        regex_str += politicians[i];
      }
      regex_str += ')';
      var regex = RegExp(regex_str, 'g');
      $('p').each(function() {
        this.innerHTML = this.innerHTML.replace(regex, '<span class="cc_highlight">$1</span>');
      });

      bindDialogs();
    });
  });

  /*
  function highlightPolititions(pols) {
		for (pol in pols) {
      var polEl = $(":contains('"+pol+"')");
      var replacement = $('<span class="cc_highlight/>');
      polEl.html(polEl.html().replace(pol, replacement.html(pol)));
    }
  }

  highlightPolititions(politicians);
  */

  function bindDialogs() {
    var t_hide = null;
    $('.cc_highlight').on('mouseenter', function(e) {
      clearTimeout(t_hide);

      // Create box, if it doesn't exist
      var $box = $('#cc_box');
      if ($box.length < 1) {
        $box = $(tmpl(BOX_TEMPLATE, {})).appendTo('body');
      }

      // Position box
      $box.html('Loading...');
      var $span = $(this);
      $box.css({
        top: $span.offset().top - $('#cc_box').height() - 70,
        left: $span.offset().left - $('#cc_box').width()/2 + $span.width(),
      }).on('mouseenter', function() {
        clearTimeout(t_hide);
      }).on('mouseleave', function() {
        t_hide = setTimeout(function() {
          $box.hide();
        }, mouseenter_TIMEOUT_MS);
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
      }, mouseenter_TIMEOUT_MS);
    });
  }

  var contrib_cache = {};
  function fetchDetails(name, callback) {
    chrome.storage.local.get(name, function(data) {
      var url = 'http://localhost:5000/person?name=' + name + '&id=' + data[name].bioguide_id;
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
      if (data) {
        console.log('already have');
        callback();
        return;
      }
      console.log('Loading senators');

      $.getJSON('http://localhost:5000/legislature', function(data) {
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
