var HISTOGRAM_UNIQUE_LIMIT = 150;

var statistics;
var charts = {
  histograms: {},
  measurables: {
    dataQuantity: 'year'
  }
};

var selectedColumns = [];

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
        $('#dashboard #general-info .thumbnail').html(generalInfoHTML);
        return next();
      }, function (next) {
        var descriptionHTML = '';
        var descriptions = statistics.description;
        for (var key in descriptions) {
          descriptionHTML += '<a href="#" class="list-group-item" id="list-item-' + key + '">' +
                                '<h4 class="list-group-item-heading">' + key + '</h4>' +
                                '<p class="list-group-item-text">' + descriptions[key] + '</p>' +
                              '</a>';
        }
        $('#dashboard #data-description .list-group').html(descriptionHTML);
        return next();
      }, function (next) {
        $('#data-description .list-group .list-group-item').each(function () {
          var column = $(this).attr('id').substring('list-item-'.length);
          $(this).click(function () {
            if ($(this).hasClass('active')) {
              selectedColumns = _.without(selectedColumns, column);
            } else {
              selectedColumns.push(column);
            }
            $(this).toggleClass('active');
            updateDashboard();
          });
        });
        $('#dashboard').fadeIn(300, next);
      }, function (next) {
        drawDefaultView();
        return next();
      }
    ], function () {

    });
  }
}

var drawDefaultView = function () {
  $('#informative-charts').fadeOut();
  $('#general-charts').fadeIn();
  // Records Registers distribution pie chart
  charts.recordRegister = {};
  charts.recordRegister.ctx = $("#records-registers-distribution-pie canvas").get(0).getContext("2d");
  charts.recordRegister.chart = new Chart(charts.recordRegister.ctx).Doughnut(statistics.getRecordRegisterDrawablePie(),{});

  // Records Year distribution pie chart
  charts.recordYear = {};
  charts.recordYear.ctx = $("#records-year-distribution-pie canvas").get(0).getContext("2d");
  charts.recordYear.chart = new Chart(charts.recordYear.ctx).Doughnut(statistics.getRecordYearDrawablePie(),{});

  charts.dataQuantity = {};
  charts.dataQuantity.ctx = $('#registrer-year-value canvas').get(0).getContext("2d");
  charts.dataQuantity.chart = new Chart(charts.dataQuantity.ctx).Bar(statistics.getDataQuantityDrawableBar(charts.measurables.dataQuantity), {});
};

var updateDashboard = function () {
  if (selectedColumns.length === 0){
    $('#general-info #selectedColumns').html('')
    _.each(_.keys(charts.histograms), function (histo) {
      charts.histograms[histo].chart.destroy();
    });
    return drawDefaultView();
  }

  var needHistograms = _.intersection(selectedColumns, booleanColumns).length !== selectedColumns.length;

  $('#general-charts').fadeOut();

  var title = '<strong>Selected columns:</strong> ';
  _.each(selectedColumns, function (column, index) {
    title += '"' + column + '"';
    if (index < selectedColumns.length-1) title += ', ';
  });
  $('#general-info #selectedColumns').html(title)

  if (needHistograms) {
    _.each(_.keys(charts.histograms), function (histo) {
      charts.histograms[histo].chart.destroy();
    });
    var histogramsHTML = '';

    _.each(selectedColumns, function (column) {
      if (statistics.isBoolean(column)) return;

      histogramsHTML += '<div class="' + (statistics.isNumeric(column)?'col-lg-12':'col-lg-6') + ' thumbnail text-center">' +
                          '<h4>"' + column + '" ' + (statistics.isNumeric(column)?'histogram':'pie chart') + '</h4>' +
                          '<canvas id="histogram-' + column + '">' +
                        '</div>';
    });
    $('#informative-charts #histograms').html(histogramsHTML);
    $('#informative-charts #histograms').show();

    setTimeout(function () {
      _.each(selectedColumns, function (column) {
        if (statistics.isBoolean(column)) return;
        charts.histograms[column] = {};
        charts.histograms[column].ctx = $('#histogram-' + column).get(0).getContext("2d");
        if (statistics.isNumeric(column)) {
          charts.histograms[column].chart = new Chart(charts.histograms[column].ctx).Bar(statistics.getHistogramDrawable(column), {});
        } else {
          charts.histograms[column].chart = new Chart(charts.histograms[column].ctx).Pie(statistics.getHistogramDrawable(column, 'pie'), {});
        }
      });
    }, 1);

  } else {
    $('#informative-charts #histograms').hide();
  }
  $('#informative-charts').fadeIn();
}

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
      $(this).text('Show by years');
    } else {
      charts.measurables.dataQuantity = 'year';
      $('#registrer-year-value h4').text('Number of records per year, in %');
      $(this).text('Show by registers');
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