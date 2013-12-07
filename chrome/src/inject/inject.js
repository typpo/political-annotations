// Test me:
// http://www.factcheck.org/2013/12/boehner-vs-castro-on-the-exchange/
//

console.log('Injected.');

(function() {
  console.log('Loaded.');
  var $ = jQuery.noConflict();

  // Get politicians

  // Wrap name with span with a special class
  document.body.innerHTML = document.body.innerHTML.replace(/John Boehner/g, '<span class="_cc_highlight">John Boehner</span>');

  // Build/request on hover
  $('._cc_highlight').on('mouseover', function() {
    alert('You got me');

  });


  console.log('Done.');
})(jQuery);
