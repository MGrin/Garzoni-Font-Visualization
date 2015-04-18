var statistics;
var charts = {
  measurables: {
    dataQuantity: 'year'
  }
};

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
    $('#header').slideUp(500);
    $('#loading-window').removeClass('hide');
    $.ajax({
      type: "GET",
      url: "/data",
      dataType: "text",
      success: function(data) {
        $('#loading-window h1').text('Analysing data...');
        statistics = new Statistics(csvToArray(data));
        currentState = 'show:dashboard';
      }
     });

    async.series([
      function (next) {
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
    async.series([
      function (next) {
        $('#loading-window').fadeOut(300, next);
        $('#dashboard').removeClass('hide');
      }, function (next) {
        var generalInfo = {
          nbOfRecords: statistics.getNbOfRecords(),
          nbOfRegisters: statistics.getNbOfRegisters()
        };

        var generalInfoHTML = '';
        for (var key in generalInfo) {
          generalInfoHTML += '<p id="#' + key + '">' + textById[key] + ':' + '<span class="pull-right">' + generalInfo[key] + '</span></p>'
        }
        $('#dashboard #general-info').html(generalInfoHTML);
        return next();
      }, function (next) {
        var descriptionHTML = '';
        var descriptions = statistics.description;
        for (var key in descriptions) {
          descriptionHTML += '<div class="list-group-item">' +
                                '<h4 class="list-group-item-heading">' + key + '</h4>' +
                                '<p class="list-group-item-text">' + descriptions[key] + '</p>' +
                              '</div>';
        }
        $('#dashboard #data-description .list-group').html(descriptionHTML);
        return next();
      }, function (next) {
        $('#dashboard').fadeIn(300, next);
      }, function (next) {
        // Records Registers distribution pie chart
        charts.recordRegister = {};
        charts.recordRegister.ctx = $("#records-registers-distribution-pie canvas").get(0).getContext("2d");
        charts.recordRegister.chart = new Chart(charts.recordRegister.ctx).Doughnut(statistics.getRecordRegisterDrawablePie(),{});

        // Records Year distribution pie chart
        charts.recordYear = {};
        charts.recordYear.ctx = $("#records-year-distribution-pie canvas").get(0).getContext("2d");
        charts.recordYear.chart = new Chart(charts.recordYear.ctx).Doughnut(statistics.getRecordYearDrawablePie(),{});

        return next();
      }, function (next) {
        charts.dataQuantity = {};
        charts.dataQuantity.ctx = $('#registrer-year-value canvas').get(0).getContext("2d");
        charts.dataQuantity.chart = new Chart(charts.dataQuantity.ctx).Bar(statistics.getDataQuantityDrawableBar(charts.measurables.dataQuantity), {});
      }
    ], function () {

    });
  }
}

var draw
var textById = {
  'nbOfRecords' : "Total number of records",
  'nbOfRegisters' : "Total number of registers"
};

var initOnClickEvents = function () {
  $('#buttons > #use').click(function () {
    changeStateFor('data:use');
  });

  $('#registrer-year-value button').click(function () {
    if (charts.measurables.dataQuantity === 'year') {
      charts.measurables.dataQuantity = 'register';
      $('#registrer-year-value h4').text('Number of records per register, in %');
      $(this).text('Show years');
    } else {
      charts.measurables.dataQuantity = 'year';
      $('#registrer-year-value h4').text('Number of records per year, in %');
      $(this).text('Show registers');
    }
    charts.dataQuantity.chart.destroy();
    charts.dataQuantity.chart = new Chart(charts.dataQuantity.ctx).Bar(statistics.getDataQuantityDrawableBar(charts.measurables.dataQuantity), {});
  });
}

$(document).ready(function () {
  move.select = function(selector){
    return $(selector).get(0);
  };

  $('body').css('height', $(window).height());
  initOnClickEvents();
  changeStateFor('init')
});