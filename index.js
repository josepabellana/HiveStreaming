const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(express.static(__dirname));
app.use(bodyParser.json());


app.post('/', function (req, res) {
  let { height,width, currentBitrate, videotracks, bitrateChanges} =  req.body.streamInformation;


  //check if current Bitrate is not optimal
  if(Array.isArray(videotracks)){
    let optimalHeight = videotracks.filter(el=>el.bitrate === currentBitrate)[0].height;
    let optimalWidth = videotracks.filter(el=>el.bitrate === currentBitrate)[0].width;
    
    if(optimalHeight < height || optimalWidth < width) console.log('The bitrate chosen by the player is meant for a smaller player frame size');
  }


  //check if bitrate change has happened more than 2 in the last 10 seconds
  let length = bitrateChanges.length;
  if(length>3){
    if(bitrateChanges[length-1][1] - bitrateChanges[length-3][1] < 10000) console.log('There has been more than 2 changes in bitrate in the last 10 seconds')
  }
  // fs.appendFile("statisticuser"+ new Date().getDate()+'.json', JSON.stringify(req.body) + '\n', function (err) {
  //   if (err) {
  //     return console.log(err);
  //   }
  //   console.log("The file was saved!");
  // });
  res.end();

})
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/monitor', function (req, res) {
    res.sendFile(__dirname + '/monitoring/monitor.html');
  });

var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("server listening at: ", host, port)
})