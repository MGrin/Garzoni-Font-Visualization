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

var Statistics = function (data) {
  this.description = data[0];
  this.data = _.rest(data);
  this.registers = {};
  this.years = {};

  var that = this;
  async.eachSeries(that.data, function (record, nextRecord) {
    if (!that.registers[record.register]) {
      that.registers[record.register] = 0;
    }
    that.registers[record.register]++;

    if (!that.years[record.startY]) {
      that.years[record.startY] = 0;
    }
    that.years[record.startY] ++;
    return nextRecord();
  }, function () {

  });
};

Statistics.prototype.getNbOfRecords = function () {
  return this.data.length;
};

Statistics.prototype.getNbOfRegisters = function (cb) {
  return _.keys(this.registers).length;
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