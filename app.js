var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'jade');
app.set('views', __dirname + '/client/jade');
app.use(express.static(__dirname + '/client'));

app.get('/', function (req, res) {
  res.render('index.jade');
});

app.get('/data', function (req, res) {
  res.sendFile(__dirname + '/client/data/garzoni.csv');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
