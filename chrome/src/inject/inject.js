console.log('Injected.');

var BOX_TEMPLATE =
'<div id="cc_box" class="cc_box">' +
'</div>';

var BOX_CONTENT =
  '<div class="cc_top">' +
    '<img src="https://usercontent.googleapis.com/freebase/v1/image/en/<%= name.toLowerCase().replace(\' \', \'_\') %>"/>' +
    '<h1><%=name%></h1>' +
    '<a class="cc_tweet_link" target="_blank" href="http://twitter.com/<%= contact.twitter_id %>"><img class="cc_twitter" src="http://s.huffpost.com/images/icons/twitter-icon-vsmall.png"/></a>' +
    '<a class="cc_fb_link" target="_blank" href="http://facebook.com"><img class="cc_facebook" src="http://i.imgur.com/inGem0b.png"/></a>' +
    '<%= capitalize(contact.state_rank) %> Senator, <%= contact.state_name %> (<%= contact.party %>)<br>' +
    'Phone: <a href="tel:<%= contact.phone %>"><%= contact.phone %></a><br>' +
    'Site: <a href="<%= contact.website %>"><%= contact.website %></a>' +
  '</div>' +
  '<button id="top-contrib" class="tab active">Top 5 Contributors</button>' +
  '<button id="visualize" class="tab">visualization</button>' +
  '<div id="cc_content" class="cc_content"></div>' +
  '<div class="cc_arrow_down"></div>';

var TOP_CONTRIB = 
  '<table>' +
    '<% for (var i=0; i < contribs.length; i++) { %>' +
      '<tr><td><a target="_blank" href="https://www.google.com/search?q=<%= contribs[i].name %>"><%= contribs[i].name %></a></td><td>$<%= commaSeparateNumber(contribs[i].total_amount) %></td></tr>' +
    '<% } %>' +
  '</table>';

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

  function bindDialogs() {
    var t_hide = null;
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
        left: $(this).offset().left - $('#cc_box').width()/2 + $(this).width() })
      .on('mouseenter', function() {
        clearTimeout(t_hide); })
      .on('mouseleave', function() {
        t_hide = setTimeout(function() {
          $box.hide();
        }, mouseenter_TIMEOUT_MS); })
      .show();

      // Load content
      var $cc_high = $(this);
      var name = $cc_high.text();
      fetchDetails(name, function(data) {

        data.name = name;
        var $top_contrib = $(tmpl(TOP_CONTRIB, data));
        var $box_content = $(tmpl(BOX_CONTENT, data));
        $box_content.filter('#cc_content').html($top_contrib);
        $box.html($box_content);

        bindTabClicks($box, data.contribs);

        clearTimeout(t_hide);
      });
    }).on('mouseleave', function() {
      t_hide = setTimeout(function() {
        $('#cc_box').hide();
      }, mouseenter_TIMEOUT_MS);
    });
  }

  function bindTabClicks(cc_box, contribs) {
    var alt_content; // keeps the hidden content in memory
    cc_box.find('.tab').click(function(){
      if ($(this).hasClass('active')) return;
      else cc_box.find('.tab').toggleClass('active');

      // render the visualization if it's the first time
      if (!alt_content){
        var w = cc_box.find('#cc_content').width();
        var h = cc_box.find('#cc_content').height();
        alt_content = visualize(contribs,w,h);
      }

      alt_content = cc_box.find('#cc_content').replaceWith(alt_content);
    });
  }

  function visualize(contribs,w,h) {
    var el = $('<div id="cc_content" class="cc_content"></div>')[0];

    var root = {children:[]};
    contribs.forEach(function(contrib){
      root.children.push(
        {name: contrib.name, value: contrib.total_amount}
    )});

    var bubble = d3.layout.pack()
        .size([w,h])
        .padding(2);

    var svg = d3.select(el).append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('class', 'bubble')

    var node = svg.selectAll('.node')
        .data(bubble.nodes(root)
        .filter(function(d){ return !d.children; }))
      .enter().append('g')
        .attr('class', 'node')
        .attr('transform', function(d){
          return 'translate('+ d.x +','+ d.y +')'; })

    node.append('circle')
        .attr('r', function(d){ return d.r; })
        .style('fill', 'rgb(230,200,200)')

    node.append('text')
        .attr('dy', '.15em')
        .style('text-anchor', 'middle')
        .text(function(d){ 
          return d.name + '\n' +
            '($'+ commaSeparateNumber(d.value) +')'; })

    return el;
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
