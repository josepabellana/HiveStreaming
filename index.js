var http = require('https');
const express = require('express');
const app = express();
const fs = require('fs');
const url = require('url');
var bodyParser = require('body-parser');
var qs = require('querystring');
const { countReset } = require('console');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})
app.use(express.static(__dirname));
app.use(bodyParser.json());


app.post('/', function (req, res) {
  console.log("post");
  console.log(req.body);
  fs.appendFile("statisticuser"+ new Date().getDate(), JSON.stringify(req.body) + '\n', function (err) {
    if (err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });
  res.end();

})
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("server listening at: ", host, port)
})