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

var transformRegisterName = function (register) {
  var registerNameSplit = register.split(', ');
  var label = 'Register ' + registerNameSplit[3] + ', ' + registerNameSplit[4];
  return label;
};

var getRandomColor = function () {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

var numericColumns = [
  'a_age',
  'annual_salary',
  'enrolmentM',
  'enrolmentY',
  'length',
  'startM',
  'startY'
];

var booleanColumns = [
  'a_quondam',
  'accomondation_master',
  'clothes_master',
  'female_guarantor',
  'generic_expenses_master',
  'has_fled',
  'personal_care_master',
  'salary_master',
  'm_gender',
  'a_gender'
];

var Statistics = function (data) {
  this.description = data[0];
  this.data = _.rest(data);
  var that = this;

  this.data = _.map(that.data, function (record) {
    var newRecord = {};
    for (var key in record) {
      if (that.isNumeric(key)) {
        if (record[key] && record[key] !== '') newRecord[key] = Number(record[key]);
      } else if (that.isBoolean(key)) {
        if (record[key] && record[key] !== '') newRecord[key] = (record[key] === '1');
      } else if (key !== '' && record[key] && record[key] !== ''){
        newRecord[key] = record[key];
      }
    }
    return newRecord;
  });

  this.histograms = {};

  async.eachSeries(that.data, function (record, nextRecord) {
    _.each(_.keys(record), function (column) {
      if (!that.histograms[column]) that.histograms[column] = {};
      if (!that.histograms[column][record[column]]) that.histograms[column][record[column]] = 0;
      that.histograms[column][record[column]]++;
    });
    return nextRecord();
  }, function () {
    that.registers = that.histograms.register;
    that.years = that.histograms.startY;
  });
};

Statistics.prototype.isNumeric = function (column) {
  return numericColumns.indexOf(column) > -1;
};

Statistics.prototype.isBoolean = function (column) {
  return booleanColumns.indexOf(column) > -1;
};

Statistics.prototype.isFactor = function (column) {
  return booleanColumns.indexOf(column) < 0 && numericColumns.indexOf(column) < 0;
}

Statistics.prototype.getNbOfRecords = function () {
  return this.data.length;
};

Statistics.prototype.getNbOfRegisters = function (cb) {
  return this.getUniqueValues('register').length;
};

Statistics.prototype.getUniqueValues = function (column) {
  var res = _.keys(this.histograms[column]);
  if (!this.isNumeric(column)) return res;

  return _.sortBy(res, function (num) {
    return Number(num);
  });
};

Statistics.prototype.getHistogramData = function (column) {
  if (!this.isNumeric(column)) return _.values(this.histograms[column]);;


  var data = _.pairs(this.histograms[column]);
  data = _.sortBy(data, function (val) {
    return Number(val[0]);
  });
  data = _.map(data, function (val) {
    return Number(val[1]);
  });
  return data;
};

Statistics.prototype.getGeneralYearDataValue = function () {
  var that = this;
  var yearValue = {};
  var nbOfRecords = this.getNbOfRecords();
  _.each(_.keys(that.years), function (year) {
    yearValue[year] = Number(that.years[year])/nbOfRecords;
  });

  return yearValue;
};

Statistics.prototype.getGeneralRegisterDataValue = function () {
  var that = this;
  var registerValue = {};
  var nbOfRecords = this.getNbOfRecords();
  _.each(_.keys(that.registers), function (register) {
    registerValue[register] = Number(that.registers[register])/nbOfRecords;
  });

  return registerValue;
};

Statistics.prototype.getRecordRegisterDrawablePie = function () {
  var drawableData = [];
  var that = this;
  _.each(_.keys(that.registers), function (register) {
    drawableData.push({
      value: that.registers[register],
      color: getRandomColor(),
      label: transformRegisterName(register)
    });
  });

  return drawableData;
};

Statistics.prototype.getRecordYearDrawablePie = function () {
  var drawableData = [];
  var that = this;
  _.each(_.keys(that.years), function (year) {
    drawableData.push({
      value: that.years[year],
      color: getRandomColor(),
      label: year
    });
  });

  return drawableData;
};

Statistics.prototype.getDataQuantityDrawableBar = function (type) {
  var that = this;

  var values = [];
  var labels;
  var label;

  if (type === 'year') {
    labels = _.sortBy(_.keys(that.years), function (year) {
      return Number(year);
    });
    var yearValues = that.getGeneralYearDataValue();
    _.each(labels, function (year) {
      var value = yearValues[year] + '';
      value = value.substring(0, 4);
      values.push(Number(value));
    });
  } else if (type === 'register') {
    values = _.map(_.values(that.getGeneralRegisterDataValue()), function (num) {
      return Number(('' + num).substring(0, 4));
    });
    labels = _.map(_.keys(that.registers), function (register) {
      return transformRegisterName(register);
    });
  }

  var drawableData = {
    labels: labels,
    datasets: [{
      label: type,
      fillColor: "rgba(151,187,205,0.5)",
      strokeColor: "rgba(151,187,205,0.8)",
      highlightFill: "rgba(151,187,205,0.75)",
      highlightStroke: "rgba(151,187,205,1)",
      data: values
    }]
  };

  return drawableData;
};

Statistics.prototype.getHistogramDrawable = function (column, type) {
  if (this.isBoolean(column)) return {};

  if (!type) type = 'hist';

  var that = this;
  var values = that.getHistogramData(column);
  var labels = that.getUniqueValues(column);

  if (column === 'register') {
    labels = _.map(labels, function (register) {
      return transformRegisterName(register);
    });
  }
  var drawableData;
  if (type === 'hist') {
    drawableData  = {
      labels: labels,
      datasets: [{
        label: 'Histogram for ' + column,
        fillColor: "rgba(151,187,205,0.5)",
        strokeColor: "rgba(151,187,205,0.8)",
        highlightFill: "rgba(151,187,205,0.75)",
        highlightStroke: "rgba(151,187,205,1)",
        data: values
      }]
    };
  } else if (type === 'pie') {
    drawableData = [];
    for (var i = 0; i < values.length; i++) {
      drawableData.push({
        value: values[i],
        color: getRandomColor(),
        label: labels[i]
      });
    }
  }
  return drawableData;
}