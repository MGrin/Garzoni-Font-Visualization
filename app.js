var express = require('express');
var livereload = require('express-livereload');
var fs = require('fs');

var app = express();
livereload(app, {
  watchDir: 'client/'
});

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'jade');
app.set('views', __dirname + '/client/jade');
app.use(express.static(__dirname + '/client'));

app.get('/', function (req, res) {
  res.render('index.jade');
});

app.get('/data', function (req, res) {
  fs.readFile(__dirname + '/server/data/garzoni.csv', 'utf-8', function (err, file) {
    if (err) return res.send(500, err);
    res.send({
      source: 'file',
      data: file
    });
  });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
