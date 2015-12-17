var express = require('express');
var app = express();
var solver = require('./solver');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.engine('html', require('ejs').__express);
app.set('view engine', 'html');
app.use(express.static('public'));

app.post('/solve', solver);
app.get('/', function (req, res) {
    res.render('index');
});

var server = app.listen(3000, function () {
    var port = server.address().port;

    console.log('Listening on port %s', port);
});

module.exports = app;
