const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(express.static(__dirname));
app.use(bodyParser.json());


app.post('/', function (req, res) {
  let { height,width, currentBitrate, videotracks, bitrateChanges} =  req.body.streamInformation;
  let {duration, time} = req.body.bufferingEvents;

  //check if current Bitrate is not optimal
  if(Array.isArray(videotracks)){
    let optimalHeight = videotracks.filter(el=>el.bitrate === currentBitrate)[0].height;
    let optimalWidth = videotracks.filter(el=>el.bitrate === currentBitrate)[0].width;
    
    if(optimalHeight < height || optimalWidth < width) console.log('HIGHEST_BITRATE_POSSIBLE : The bitrate chosen by the player is meant for a smaller player frame size');
  }


  //check if bitrate change has happened more than 2 in the last 10 seconds
  let length = bitrateChanges.length;
  if(length>3){
    if(bitrateChanges[length-1][1] - bitrateChanges[length-3][1] < 10000) console.log('TOO_MANY_BITRATE_SWITCHES : There has been more than 2 changes in bitrate in the last 10 seconds')
  }

  //check if the number of buffering events longer than 500ms is higher than 3 per 30 secs or if there is any buffering event longer than 1s.
  //get last 30 seconds
  let index = 0;
  for(let i = time.length-1; i>=0;i--){
    if((Date.now() -time[i]) < 30000){
      index = i;
      break;
    }
  }

  if(index !== 0){
    let eventLongerThan1s = false;
    let eventsLonger500ms = 0;
    
    for(let i = index; i<duration.length;i++){
      if(duration[i] > 500) eventsLonger500ms++;
      if(duration[i] > 1000) eventLongerThan1s = true;
    }

    if(eventLongerThan1s || eventsLonger500ms > 3) console.log('TOO_MANY_BUFFERING : There has been one buffering event longer than 1s or more than 3 events longer than 500ms during the last 30 seconds');
  }
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