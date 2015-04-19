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
  'accommodation_master',
  'clothes_master',
  'female_guarantor',
  'generic_expenses_master',
  'has_fled',
  'personal_care_master',
  'salary_master',
  'm_gender',
  'a_gender'
];

var booleanStrings = {
  'a_quondam': ['Apprentice father is alive', 'Apprentice father is dead'],
  'accommodation_master': ['Master pays for the accommodation', 'Apprentice pays for the accommodation'],
  'clothes_master': ['Master pays for the apprentice\'s clothes', 'Apprentice pays for his clothes'],
  'female_guarantor': ['There is a female among the guarantors', 'There is no a female among the guarantors'],
  'generic_expenses_master': ['Master pays for the generic expenses', 'Apprentice pays for the generic expenses'],
  'has_fled': ['Apprentice has fled', 'Apprentice does not have fled'],
  'personal_care_master': ['Master pays for the personal care', 'Apprentice pays for the personal care'],
  'salary_master': ['Master pays the salary', 'Someone else pays the salary'],
  'm_gender': ['Male', 'Female'],
  'a_gender': ['Male', 'Female']
}

var Statistics = function (data) {
  this.description = data[0];
  this.data = _.rest(data);
  this.filters = {};

  var that = this;

  this.originalData = _.map(that.data, function (record) {
    var newRecord = {};
    for (var key in record) {
      if (!that.filters[key]) that.filters[key] = [];
      newRecord[key] = that.fixDataType(key, record[key]);
    }
    return newRecord;
  });

  this.data = this.originalData;

  this.computeHistograms();
  that.registers = that.histograms.register;
  that.years = that.histograms.startY;
};

Statistics.prototype.getGeneralYearDataValue = function () {
  var that = this;
  var yearValue = {};
  var nbOfRecords = this.getNbOfRecords();
  _.each(_.keys(that.years), function (year) {
    yearValue[year] = Number(that.years[year])/nbOfRecords * 100;
  });

  return yearValue;
};

Statistics.prototype.getGeneralRegisterDataValue = function () {
  var that = this;
  var registerValue = {};
  var nbOfRecords = this.getNbOfRecords();
  _.each(_.keys(that.registers), function (register) {
    registerValue[register] = Number(that.registers[register])/nbOfRecords * 100;
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

Statistics.prototype.fixDataType = function (column, value) {
  var that = this;
  if (that.isNumeric(column)) {
    if (value && value !== '') return Number(value);
  } else if (that.isBoolean(column)) {
    if (value && value !== '') {
      if (value === '1' || value === 'M') return '1';
      if (value === '0' || value === 'F') return '0';
      return undefined;
    }
  } else if (column !== '' && value && value !== ''){
    return value;
  }
};

Statistics.prototype.computeHistograms = function () {
  var that = this;
  this.histograms = {};
  _.each(that.data, function (record, nextRecord) {
    _.each(_.keys(record), function (column) {
      if (!that.histograms[column]) that.histograms[column] = {};
      if (!that.histograms[column][record[column]]) that.histograms[column][record[column]] = 0;
      that.histograms[column][record[column]]++;
    });
  });
};

Statistics.prototype.applyFilters = function (cb) {
  var filteredData = [];
  var that = this;

  _.each(this.originalData, function (record) {
    var acceptedRecord = true;
    for (var column in record) {
      if (!that.filters[column] || that.filters[column].length === 0) continue;

      var value = that.fixDataType(column, record[column]);
      if (column === 'register') value = transformRegisterName(record[column]);

      if (that.filters[column].indexOf(value) < 0) {
        acceptedRecord = false;
        break;
      }
    }
    if (acceptedRecord) filteredData.push(record);
  });

  that.data = filteredData;
  that.computeHistograms();
  return cb();
};

Statistics.prototype.booleanToLabel = function (column, value) {
  value = value === '1';
  return value?booleanStrings[column][0]:booleanStrings[column][1];
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
  var that = this;
  var data = this.histograms[column];
  if (!this.isNumeric(column)) return _.values(data);


  var data = _.pairs(this.histograms[column]);
  data = _.sortBy(data, function (val) {
    return Number(val[0]);
  });
  data = _.map(data, function (val) {
    return Number(val[1]);
  });
  return data;
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
        label: that.isBoolean(column) ? that.booleanToLabel(column, labels[i]) : labels[i]
      });
    }
  }
  return drawableData;
};

Statistics.prototype.addFilter = function (column, value, cb) {
  var that = this;
  if (this.isBoolean(column)) {
    var rightValue = this.fixDataType(column, value);
    this.filters[column].push(rightValue);
  } else if (this.isFactor(column) || this.isNumeric(column)) {
    this.filters[column] = _.map(value, function (filterValue) {
      return that.fixDataType(column, filterValue);
    });
  }

  this.applyFilters(cb);
};

Statistics.prototype.removeFilter = function (column, value, cb) {
  var that = this;
  if (this.isBoolean(column)) {
    var rightValue = this.fixDataType(column, value);
    that.filters[column] = _.without(that.filters[column], rightValue);
  } else if (this.isFactor(column) || this.isNumeric(column)) {
    that.filters[column] = [];
  }

  this.applyFilters(cb);
};

Statistics.prototype.removeAllFilters = function (column, cb) {
  this.filters[column] = [];
  this.applyFilters(cb);
}

Statistics.prototype.cleanFilters = function (cb) {
  for (var column in this.description) {
    this.filters[column] = [];
    this.data = this.originalData;
    this.computeHistograms();
    return cb();
  }
}