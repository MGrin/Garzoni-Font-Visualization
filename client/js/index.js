var garzoniData = [];

var currentState = '';
var changeStateFor = function (state) {
  if (currentState === state) return;
  stateCallbacks[state]();
  currentState = state;
};
var stateCallbacks = {
  'init': function () {
    async.series([
      function (next) {
         move('#title')
          .duration(500)
          .to(0, 600)
          .scale(0.8)
          .end(next);
      }, function (next) {
        move('#description')
          .duration(500)
          .set('opacity', 1)
          .to(0, 200)
          .end(next);
        move('#buttons')
          .duration(500)
          .set('opacity', 1)
          .to(0, 100)
          .scale(1.4)
          .end(next);
      }, function (next) {

      }
    ], function () {

    });
  },
  'data:use': function () {
    $('#content').removeClass('hide');
    $('#loading-window').removeClass('hide');
    $.ajax({
      type: "GET",
      url: "/data",
      dataType: "text",
      success: function(data) {
        $('#loading-window h1').text('Analysing data...');
        readCsv(data);
      }
     });

    async.series([
      function (next) {
        $('html, body').animate({
          scrollTop: $("#content").offset().top
        }, 500);
        return next();
      }, function (next) {
        var rollData = function () {
          move('#data-symbols')
            .duration(500)
            .to($(window).width()-200, 0)
            .rotate(720)
            .end(function () {
              if (currentState !== 'data:use') return next();

              move('#data-symbols')
                .duration(500)
                .to(0, 0)
                .end(function () {
                  if (currentState === 'data:use') return rollData();
                  return next();
                });
            });
        };
        rollData();
      }
    ], function () {
      return stateCallbacks[currentState]();
    });
  },
  'show:dashboard' : function () {
    $('#dashboard #numberOfRecords').text('Total number of records: ' + (garzoniData.length-1));
    async.series([
      function (next) {
        $('#loading-window').fadeOut(300, next);
      }, function (next) {
        $('#charts').removeClass('hide');
        $('#dashboard').fadeIn(300, next);
      }
    ], function () {

    });
  }
}

var initOnClickEvents = function () {
  $('#buttons > #use').click(function () {
    changeStateFor('data:use');
  });

  $('#buttons > #upload').click(function () {
    changeStateFor('data:upload');
  });
}

function csvToArray(csvString){
  // The array we're going to build
  var csvArray   = [];
  // Break it into rows to start
  var csvRows    = csvString.split(/\n/);
  // Take off the first line to get the headers, then split that into an array
  var csvHeaders = csvRows.shift().split(';');

  // Loop through remaining rows
  for(var rowIndex = 0; rowIndex < csvRows.length; ++rowIndex){
    var rowArray  = csvRows[rowIndex].split(';');

    // Create a new row object to store our data.
    var rowObject = csvArray[rowIndex] = {};

    // Then iterate through the remaining properties and use the headers as keys
    for(var propIndex = 0; propIndex < rowArray.length; ++propIndex){
      // Grab the value from the row array we're looping through...
      var propValue =   rowArray[propIndex].replace(/^"|"$/g,'');
      // ...also grab the relevant header (the RegExp in both of these removes quotes)
      var propLabel = csvHeaders[propIndex].replace(/^"|"$/g,'');;

      rowObject[propLabel] = propValue;
    }
  }

  return csvArray;
}

var readCsv = function (data) {
  console.log('reading data');
  garzoniData = csvToArray(data);

  currentState = 'show:dashboard';
};

$(document).ready(function () {
  move.select = function(selector){
    return $(selector).get(0);
  };

  $('body').css('height', $(window).height());
  initOnClickEvents();
  changeStateFor('init')
});