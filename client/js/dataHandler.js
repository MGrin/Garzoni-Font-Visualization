var csvToArray = function (csvString) {
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
};

var DataController = function () {
  this.loadData = function (successCb, errorCb) {
    $.ajax({
      type: "GET",
      url: "/data",
      dataType: "json",
      success: function(data) {
        visual.loading.analyse();
        if (data.source === 'file') {
          var statistics = new FileStatistics(data.source, data.data);
          return successCb(statistics);
        } else if (data.source === 'mongo') {
          var statistics = new MongoStatistics(data.source, data.data);
          return successCb(statistics);
        } else {
          return errorCb('Unknown data source');
        }
        // statistics = new Statistics(csvToArray(data));
      },
      error: function (data) {
        return errorCb(data.response);
      }
    });
  };
};

var Statistics = function () {
  this.onFilterChange = function (){};
};
Statistics.prototype = {
  addToSelection: function (column) {
    if (this.selection.indexOf(column) > -1) return;
    this.selection.unshift(column);
    this.onSelectionChange('add', column);
    return;
  },
  removeFromSelection: function (column) {
    if (this.selection.indexOf(column) < 0) return;
    this.selection = _.without(this.selection, column);
    this.onSelectionChange('remove', column);
    return;
  },
  clearAllSelections: function () {
    var that = this;
    _.each(that.selection, function (selection) {
      that.removeFromSelection(selection);
    });
  },
  setOnSelectionChange: function (cb) {
    this.onSelectionChange = cb;
  },
  filters: {},
  modifyFilter: function (column, values) {
    var that = this;

    if (numericalVariables.indexOf(column) > -1) values = _.map(values, function (val) {return Number(val)});
    this.filters[column] = values;

    var filteredData = [];
    async.eachSeries(this.originalData, function (record, next) {
      var valid = true;
      _.each(_.keys(that.filters), function (column) {
        var filter = that.filters[column];
        var value = nameFilters[column] ? nameFilters[column](record[column]) : record[column];

        if (filter && filter.length > 0) valid = valid && (filter.indexOf(value) > -1);
      });
      if (valid) filteredData.push(record);
      return next();
    }, function () {
      that.data = filteredData
      return that.onFilterChage();
    });
  },
  setOnFilterChange: function (cb) {
    this.onFilterChage = cb;
  },
  clearAllFilters: function () {
    this.data = this.originalData;
    var that = this;
    if (_.keys(that.filters).length > 0) {
      _.each(_.keys(that.filters), function (column) {
        that.filters[column] = [];
      });
      return that.onFilterChage();
    }
  }
};

var numericalVariables = [
  'annual_salary', 'enrolmentM', 'enrolmentY', 'startM', 'startY', 'length', 'a_age',
];


var FileStatistics = function (source, data) {
  this.source = source;
  data = csvToArray(data);
  this.description = data[0];

  this.data = _.rest(data);
  this.originalData = _.rest(data);

  this.selection = [];
  this.filters = [];

  this.fixDataTypes();
  this.numberOfRecords = this.data.length;
};
FileStatistics.prototype = _.extend(FileStatistics.prototype, Statistics.prototype);
FileStatistics.prototype.fixDataTypes = function () {
  var that = this;

  var newData = _.map(that.data, function (record) {
    var newRecord = {};

    _.each(_.keys(record), function (key) {
      if (numericalVariables.indexOf(key) > -1) {
        var newValue = null;
        if (record[key] && record[key] !== '') newValue = Number(record[key]);

        newRecord[key] = newValue;
      } else {
        newRecord[key] = record[key];
      }
    });
    return newRecord;
  });

  this.data = newData;
};
FileStatistics.prototype.getNumberOfRecords = function (cb) {
  return cb(null, this.numberOfRecords);
};
FileStatistics.prototype.getDescriptions = function (cb) {
  return cb(null, this.description);
};
FileStatistics.prototype.unique = function (columnName, cb, nameFilter) {
  this.constructHistogram(columnName, function (err, hist) {
    if (err) return cb(err);
    var unique = _.keys(hist);

    return cb(null, unique);
  }, nameFilter, true);
};
FileStatistics.prototype.constructHistogram = function (columnName, cb, nameFilter, allDataset) {
  var that = this;
  var hist = {};

  var data = allDataset ? that.originalData : that.data;

  _.each(data, function (record) {
    if (!record[columnName]) return;
    var name = record[columnName];
    if (nameFilter) name = nameFilter(name);
    if (!hist[name]) hist[name] = 0;
    hist[name]++;
  });
  return cb(null, hist);
};

FileStatistics.prototype.getNumberOfRegisters = function (cb) {
  this.unique('register', function (err, uniqueRegisters) {
    return cb(null, uniqueRegisters.length);
  });
};

var MongoStatistics = function (source, data) {

  this.selection = [];
  this.filters = [];
};
MongoStatistics.prototype = _.extend(MongoStatistics.prototype, Statistics.prototype);
MongoStatistics.prototype.getDescriptions = function (cb) {
  return cb('Not implemented!');
};
MongoStatistics.prototype.getNumberOfRecords = function (cb) {
  return cb('Not implemented!');
};
MongoStatistics.prototype.getNumberOfRegisters = function (cb) {
  return cb('Not implemented');
};
MongoStatistics.prototype.unique = function (columnName, cb, nameFilter) {
  return cb('Not implemented');
};
MongoStatistics.prototype.constructHistogram = function (columnName, cb, nameFilter) {
  return cb('Not implemented');
};