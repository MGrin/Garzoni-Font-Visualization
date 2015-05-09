var loadingDiv = '<h3>Loading...</h3>';

var Visual = function () {
  var that = this;

  this.landing = {
    show: function () {
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
      ], function () {});
    },
    hide: function () {
      $('#header').slideUp(500);
    }
  };

  this.rolling = {
    state: false,
    exec: function () {
      var that = this;
      move('#data-symbols')
        .duration(500)
        .to($(window).width()-200, 0)
        .rotate(720)
        .end(function () {
          if (!that.state) return;

          move('#data-symbols')
            .duration(500)
            .to(0, 0)
            .end(function () {
              if (that.state) return that.exec();
              return;
            });
        });
    },
    start: function () {
      this.state = true;
      this.exec();
    },
    stop: function () {
      this.state = false;
    }
  };

  this.loading = {
    show: function () {
      $('#content').removeClass('hide');
      $('#loading-window').removeClass('hide');

      that.rolling.start();
    },
    analyse: function () {
      $('#loading-window h1').text('Analysing data...');
    },
    hide: function () {
      that.rolling.stop();
      $('#loading-window').fadeOut(300);
    }
  };

  this.data2drawablePie = function (column, cb, labelFilter) {
    that.statistics.constructHistogram(column, function (err, hist) {
      var drawable = [];
      _.each(_.keys(hist), function (key) {
        drawable.push({
          value: hist[key],
          color: getRandomColor(),
          label: key
        })
      });
      return cb(null, drawable);
    }, labelFilter);
  };

  this.data2drawableBar = function (column, cb, labelFilter) {
    that.statistics.constructHistogram(column, function (err, hist) {
      var values = [];
      var labels = _.keys(hist);

      _.each(labels, function (label) {
        values.push(hist[label]);
      });

      return cb(null, {
        labels: labels,
        datasets: [{
          label: column,
          fillColor: "rgba(151,187,205,0.5)",
          strokeColor: "rgba(151,187,205,0.8)",
          highlightFill: "rgba(151,187,205,0.75)",
          highlightStroke: "rgba(151,187,205,1)",
          data: values
        }]
      });
    }, labelFilter);
  };

  this.charts = {
    summary: {
      registersPie: {
        draw: function () {
          that.dashboard.DOM.registersPie.append(loadingDiv);
          if (!this.context) this.context = that.dashboard.DOM.registersPieCanvas.get(0).getContext("2d");

          if (this.chart) this.chart.destroy();

          var _this = this;
          that.data2drawablePie('register', function (err, drawable) {
            _this.chart = new Chart(_this.context).Doughnut(drawable,{});
            that.dashboard.DOM.registersPie.find('h3').remove();
          }, nameFilters['register']);
        }
      },
      yearsPie: {
        draw: function () {
          that.dashboard.DOM.yearsPie.append(loadingDiv);
          if (!this.context) this.context = that.dashboard.DOM.yearsPieCanvas.get(0).getContext("2d");

          if (this.chart) this.chart.destroy();

          var _this = this;
          that.data2drawablePie('startY', function (err, drawable) {
            _this.chart = new Chart(_this.context).Doughnut(drawable, {});
            that.dashboard.DOM.yearsPie.find('h3').remove();
          });
        }
      },
      registersYearBar: {
        draw: function (type) {
          if (type !== 'year' && type !== 'register') type = 'year';

          this.type = type;
          that.dashboard.DOM.registersYears.append(loadingDiv);
          if (!this.context) this.context = that.dashboard.DOM.registersYearsCanvas.get(0).getContext("2d");

          if (this.chart) this.chart.destroy();

          var _this = this;

          var column = (type === 'year') ? 'startY' : 'register';
          var labelFilter = nameFilters[column];

          that.data2drawableBar(column, function (err, drawable) {
            _this.chart = new Chart(_this.context).Bar(drawable, {});
            that.dashboard.DOM.registersYears.find('h3').remove();
          }, labelFilter);

        }
      },
    }
  };

  var pieCharts = [
    'register', 'profession_code_gen', 'profession_code_strict', 'has_fled',
    'm_profession_code_gen', 'm_profession_code_strict', 'a_gender', 'a_quondam',
    'accommodation_master', 'personal_care_master', 'clothes_master', 'generic_expenses_master', 'salary_master',
    'female_guarantor', 'm_gender'
  ];

  var barCharts = [
    'annual_salary', 'enrolmentY', 'enrolmentM', 'startY', 'startM', 'length', 'a_age'
  ];

  // Todo
  var mapCharts = [
    'a_coords'
  ];

  // Todo
  var tableCharts = [
    'm_name', 'm_surname', 'm_patronimic', 'm_atelier', 'a_name',
    'm_profession', 'a_profession','a_geo_origins', 'a_geo_origins_std',
  ];
  this.getChartType = function (column) {
    if (mapCharts.indexOf(column) > -1) return 'map';
    if (barCharts.indexOf(column) > -1) return 'bar';
    if (tableCharts.indexOf(column) > -1) return 'table';
    if (pieCharts.indexOf(column) > -1) return 'pie';
    return;
  };

  this.plotChartFor = function (column) {
    var html = '';
    var chartType = that.getChartType(column);

    that.charts[column] = {};

    switch (chartType) {
      case "pie": {
        html += '<div class="col-lg-6 text-center" id="chart-' + column + '">' +
                '<h4>' + column + '</h4>' +
                '<canvas></canvas>' +
                '</div>';
        that.dashboard.DOM.informativeCharts.append(html);
        that.charts[column].context = $('#chart-' + column + ' canvas').get(0).getContext("2d");
        that.data2drawablePie(column, function (err, drawable) {
          that.charts[column].chart = new Chart(that.charts[column].context).Pie(drawable,{});
        }, nameFilters[column]);
        break;
      }
      case "bar": {
        html += '<div class="col-lg-12 text-center" id="chart-' + column + '">' +
                '<h4>' + column + '</h4>' +
                '<canvas></canvas>' +
                '</div>';
        that.dashboard.DOM.informativeCharts.append(html);
        that.charts[column].context = $('#chart-' + column + ' canvas').get(0).getContext("2d");
        that.data2drawableBar(column, function (err, drawable) {
          that.charts[column].chart = new Chart(that.charts[column].context).Bar(drawable,{});
        }, nameFilters[column]);
        break;
      }
      case "table": {
        html += '<div class="col-lg-6 text-center" id="chart-' + column + '">' +
                '<h4 class="col-lg-6">' + column + '</h4>' +
                '<table class="table table-striped">' +
                '<tr><td>' + column + '</td><td>Number</td></tr>';
        that.statistics.constructHistogram(column, function (err, hist) {
          var list = _.pairs(hist);
          list = _.sortBy(list, function (el) {
            return -el[1];
          });
          for (var i = 0; i < 5; i++) {
            html += '<tr><td>' + list[i][0] + '</td><td>' + list[i][1] + '</td></tr>';
          }
          html += '</table>' +
                  '<a href="#" class="col-lg-6" id="show-table-' + column + '">Show full table</a></div>';
          that.dashboard.DOM.informativeCharts.append(html);
          $('#show-table-' + column).click(function () {
            that.dashboard.DOM.modalTitle.text(column + ' values histogram');
            var completeHtml = '<table class="table table-striped">' +
                        '<tr><td>' + column + '</td><td>Number</td></tr>';
            _.each(list, function (el) {
              completeHtml += '<tr><td>' + el[0] + '</td><td>' + el[1] + '</td></tr>';
            });
            completeHtml += '</table>';
            that.dashboard.DOM.modalContent.html(completeHtml);
            that.dashboard.DOM.modal.modal('show');
          });
        }, nameFilters[column]);
        break;
      }
      case "map" : {

        break;
      }
      default : {
        console.log('Error: no chart type for ' + column);
      }
    }
  };

  this.removeChartFor = function (column) {
    if (that.charts[column].chart) {
      that.charts[column].chart.destroy();
    }
    that.charts[column] = null;
    $('#chart-' + column).remove();
  }

  this.updateChartFor = function (column) {
    var chartType = that.getChartType(column);
    switch (chartType) {
      case 'pie' : {
        that.charts[column].chart.destroy();
        that.data2drawablePie(column, function (err, drawable) {
          that.charts[column].chart = new Chart(that.charts[column].context).Pie(drawable,{});
        }, nameFilters[column]);
        break;
      }
      case 'bar' : {
        that.charts[column].chart.destroy();
        that.data2drawableBar(column, function (err, drawable) {
          that.charts[column].chart = new Chart(that.charts[column].context).Bar(drawable,{});
        }, nameFilters[column]);
        break;
      }
      case 'table' : {
        var html = '<table class="table table-striped">' +
                    '<tr><td>' + column + '</td><td>Number</td></tr>';
        that.statistics.constructHistogram(column, function (err, hist) {
          var list = _.pairs(hist);
          list = _.sortBy(list, function (el) {
            return -el[1];
          });
          var limit = Math.min(list.length, 5);
          for (var i = 0; i < limit; i++) {
            html += '<tr><td>' + list[i][0] + '</td><td>' + list[i][1] + '</td></tr>';
          }
          html += '</table><h4 class="col-lg-6">' + column + '</h4>' +
                  '<a href="#" class="col-lg-6" id="show-table-' + column + '">Show full table</a>';
          $('#chart-' + column).html(html);
          $('#show-table-' + column).click(function () {
            that.dashboard.DOM.modalTitle.text(column + ' values histogram');
            var completeHtml = '<table class="table table-striped">' +
                        '<tr><td>' + column + '</td><td>Number</td></tr>';
            _.each(list, function (el) {
              completeHtml += '<tr><td>' + el[0] + '</td><td>' + el[1] + '</td></tr>';
            });
            completeHtml += '</table>';
            that.dashboard.DOM.modalContent.html(completeHtml);
            that.dashboard.DOM.modal.modal('show');
          });
        }, nameFilters[column]);
        break;
      }
      case 'map' : {

        break;
      }
    }
  }

  this.dashboard = {
    DOM: {
      main: $('#dashboard'),
      generalInfo: $('#dashboard #general-info #info'),
      descriptions: $('#dashboard #data-description .list-group'),
      summary: $('#general-charts'),
      selectedData: $('#dashboard #general-info #selected-data'),
      selections: $('#dashboard #general-info #selected-data #selectedColumns div'),
      filters: $('#dashboard #general-info #selected-data #filters div'),
      clearSelectionsBtn: $('#dashboard #general-info #selected-data #selectedColumns a'),
      clearFiltersBtn: $('#dashboard #general-info #selected-data #filters a'),
      registersPie: $("#records-registers-distribution-pie"),
      registersPieCanvas: $("#records-registers-distribution-pie canvas"),
      yearsPie: $("#records-year-distribution-pie"),
      yearsPieCanvas: $("#records-year-distribution-pie canvas"),
      registersYears: $("#registrer-year-value"),
      registersYearsCanvas: $("#registrer-year-value canvas"),
      barPlotTitle: $('#registrer-year-value h4'),
      switchBarPlotBtn: $('#registrer-year-value button'),
      informativeCharts: $('#informative-charts'),
      modal: $('#table-view-modal'),
      modalContent: $('#table-view-modal .modal-body'),
      modalTitle: $('#table-view-modal h4')
    },
    inited: false,
    init: function (statistics) {
      that.statistics = statistics;
    },
    modifySelection: function (action, column) {
      console.log(action, column);
      if (that.statistics.selection.length === 1) {
        that.dashboard.DOM.selectedData.slideDown(500);
        that.dashboard.hideSummary();
        that.dashboard.showInformativeCharts();
      } else if (that.statistics.selection.length === 0) {
        that.dashboard.DOM.selectedData.slideUp(500);
        that.dashboard.hideInformativeCharts();
        that.dashboard.showSummary();
      }

      switch (action) {
        case 'add' : {
          that.dashboard.DOM.selections.append('<p id="selection-' + column + '">"' + column + '"</p>');
          that.plotChartFor(column);
          that.dashboard.appendFilter(column);
          break;
        }
        case 'remove' : {
          that.dashboard.DOM.selections.find('#selection-' + column).remove();
          that.removeChartFor(column);
          that.dashboard.removeFilter(column);
          break;
        }
      }
    },
    appendFilter: function (column) {
      var filterHtml = '<p id="filter-' + column + '">' + column;
      that.statistics.unique(column, function (err, unique) {
        filterHtml += '<select multiple="multiple" class="form-group">';
        _.each(unique, function (value) {
          filterHtml += '<option value="' + value + '">' + value + '</option>';
        });
        filterHtml += '</select>';
        filterHtml += '</p>';
        that.dashboard.DOM.filters.append(filterHtml);

        $('#filter-' + column + ' select').change(function () {
          var selections = $(this).val();
          that.statistics.modifyFilter(column, selections);
        });
      }, nameFilters[column]);
    },
    removeFilter: function (column) {
      $('#filter-' + column).remove();
      that.statistics.modifyFilter(column, []);
    },
    filterUpdate: function () {
      _.each(that.statistics.selection, function (column) {
        that.updateChartFor(column);
      });
    },
    show: function () {
      if (this.inited) return;

      that.statistics.setOnSelectionChange(this.modifySelection);
      that.statistics.setOnFilterChange(this.filterUpdate);
      this.DOM.main.show();
      this.showGeneralInfo();
      this.showDescriptions();

      this.showSummary();
      this.inited = true;
    },
    clearSelections: function () {
      that.statistics.clearAllSelections();
      that.dashboard.DOM.descriptions.find('.list-group-item').each(function () {
        $(this).removeClass('active');
      });
    },
    clearFilters: function () {
      that.statistics.clearAllFilters();
      $('[id^=filter-] select').val([]);
    },
    showSummary: function () {
      that.dashboard.DOM.summary.fadeIn(500);

      if (!this.inited) {
        that.charts.summary.registersPie.draw();
        that.charts.summary.yearsPie.draw();
        that.charts.summary.registersYearBar.draw('year');

        that.dashboard.DOM.switchBarPlotBtn.click(function () {
          switch (that.charts.summary.registersYearBar.type) {
            case 'year' : {
              that.charts.summary.registersYearBar.draw('register');
              that.dashboard.DOM.barPlotTitle.text('Number of records per register');
              $(this).text('Show by years');
              break;
            }
            case 'register' : {
              that.charts.summary.registersYearBar.draw('year');
              that.dashboard.DOM.barPlotTitle.text('Number of records per year')
              $(this).text('Show by registers');
              break;
            }
          }
        });
        that.dashboard.DOM.clearSelectionsBtn.click(function () {
          that.dashboard.clearSelections();
        });
        that.dashboard.DOM.clearFiltersBtn.click(function () {
          that.dashboard.clearFilters();
        });
      }
    },
    hideSummary: function () {
      that.dashboard.DOM.summary.fadeOut(500);
    },
    showInformativeCharts: function () {
      that.dashboard.DOM.informativeCharts.fadeIn(500);
    },
    hideInformativeCharts: function () {
      that.dashboard.DOM.informativeCharts.fadeOut(500);
    },
    showGeneralInfo: function () {
      this.DOM.generalInfo.html(loadingDiv);
      var generalInfoHTML = '<div class="text-center">';

      var dashboard = this;
      async.series([
        function (next) {
          generalInfoHTML += '<p>Source: <strong>' + that.statistics.source + '</strong></p>';
          return next();
        }, function (next) {
          that.statistics.getNumberOfRecords(function (err, nbOfRecords) {
            if (err) {
              generalInfoHTML += '<p>Number of records: <strong>' + 'Error!' + '</strong></p>';
              console.log('Statistics.getNumberOfRecords: ' + err);
            } else {
              generalInfoHTML += '<p>Number of records: <strong>' + nbOfRecords + '</strong></p>';
            }
            return next();
          });
        }, function (next) {
          that.statistics.getNumberOfRegisters(function (err, nbOfRegisters) {
            if (err) {
              generalInfoHTML += '<p>Number of registers: <strong>' + 'Error!' + '</strong></p>';
              console.log('Statistics.getNumberOfRegisters: ' + err);
            } else {
              generalInfoHTML += '<p>Number of registers: <strong>' + nbOfRegisters + '</strong></p>';
            }
            return next();
          });
        }, function (next) {
          generalInfoHTML += '</div>';
          return next();
        }
      ], function () {
        dashboard.DOM.generalInfo.html(generalInfoHTML);
      });
    },
    showDescriptions: function () {
      var dashboard = this;
      var descriptions;
      var descriptionsHTML = '';
      dashboard.DOM.descriptions.html(loadingDiv);

      async.series([
        function (next) {
          that.statistics.getDescriptions(function (err, columnDescriptions) {
            if (err) return next(err);

            descriptions = columnDescriptions;

            for (var key in descriptions) {
              descriptionsHTML += '<a href="#" class="list-group-item" id="list-item-' + key + '">' +
                                    '<h4 class="list-group-item-heading">' + key + '</h4>' +
                                    '<p class="list-group-item-text">' + descriptions[key] + '</p>' +
                                  '</a>';
            }
            dashboard.DOM.descriptions.html(descriptionsHTML);
            return next();
          });
        }, function (next) {
          dashboard.DOM.descriptions.find('.list-group-item').each(function () {
            var column = $(this).attr('id').substring('list-item-'.length);
            $(this).click(function () {
              if ($(this).hasClass('active')) {
                that.statistics.removeFromSelection(column);
              } else {
                that.statistics.addToSelection(column);
              }
              $(this).toggleClass('active');
            });
          });
          return next();
        }
      ], function (err) {
        if (err) return dashboard.DOM.descriptions.html('<h3>Error: ' + err + '</err>');
        return;
      });
    }
  }
};

var nameFilters = {
  register: function (register) {
    var registerNameSplit = register.split(', ');
    var label = 'Register ' + registerNameSplit[3] + ', ' + registerNameSplit[4];
    return label;
  },
  annual_salary: function (val) {
    return parseFloat(val);
  },
  enrolmentM: function (val) {
    return parseFloat(val);
  },
  enrolmentY: function (val) {
    return parseFloat(val);
  },
  startM: function (val) {
    return parseFloat(val);
  },
  startY: function (val) {
    return parseFloat(val);
  },
  length: function (val) {
    return parseFloat(val);
  },
  a_age: function (val) {
    return parseFloat(val);
  }
}

var getRandomColor = function () {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};
