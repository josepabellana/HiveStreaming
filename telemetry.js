(function () {
  amp.plugin("telemetry", function (options) {
    window.onbeforeunload = function (e) { //sending the information when closimg the window
      fetch("/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          streamInformation,
          videobitlog,
          
        })
      });

    }
    let streamInformation = {}; //streaminfroamtion contains information about the languages and video and sound bit rate
    let videobitlog = {}; //this record the changes in the bitrate 
    


    var myVar = setInterval(function () { //every duration we send the objects to our server and reinitialize the objects to get new statistics for the next period
      fetch("/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          streamInformation,
          videobitlog,
          
        })
      });
      
      texttracklog = {};
      videobitlog = {};
      player
        .currentVideoStreamList()
        .streams[0].tracks.forEach(function (element) {
          videobitlog[element.bitrate] = {
            download: 0,
            failed: 0,
            frames: 0,
            changes: []
          };
        });

    }, options.timeperiod);


    let player = this;
    var init = function () {
      console.log("plugin telemetry initialized with player ", player);
    };

   
    player.addEventListener("loadedmetadata", function () {
      
  

      //building videobitarraylog

      player.addEventListener(amp.eventName.downloadbitratechanged, function () {
        console.log("videobitratechanged");
        videobitlog[
          player.videoBufferData().downloadCompleted.mediaDownload.bitrate
        ].changes.push(player.currentTime());
      });

      player
        .currentVideoStreamList()
        .streams[0].tracks.forEach(function (element) {
          videobitlog[element.bitrate] = {
            download: 0,
            failed: 0,
            frames: 0,
            changes: []
          };
        });
      console.log(videobitlog);


      let videoBufferData = player.videoBufferData();
      if (videoBufferData) {
        videoBufferData.addEventListener(
          amp.bufferDataEventName.downloadcompleted,
          function () {
            videobitlog[
              player.videoBufferData().downloadCompleted.mediaDownload.bitrate
            ].download += player.videoBufferData().downloadCompleted._bytes;
            videobitlog[
              player.videoBufferData().downloadCompleted.mediaDownload.bitrate
            ].frames += 1;
            console.log("changelogforvideo", videobitlog);
          }
        );

        videoBufferData.addEventListener(
          amp.bufferDataEventName.downloadfailed,
          function () {
            console.log("video downloadfailed");
            videobitlog[
              player.videoBufferData().downloadCompleted.mediaDownload.bitrate
            ].failed += 1;
          }
        );
      }
      

      console.log(
        "loadedmetadata",
        "manifest",
        player.src(),
        player.height,
        player.width,
        "protocol",
        player.currentType()
      );
      streamInformation["height"] = player.height();
      streamInformation["width"] = player.width();
      streamInformation["manifest"] = player.src();
      for(let videotrack in videobitlog){
        if(videotrack.download >0) streamInformation["currentBitrate"] = videotrack;
      }
      streamInformation["videotracks"] = player.currentVideoStreamList().streams[0].tracks.map(el => {
        let obj = {
          bitrate: el.bitrate,
          height: el.height,
          width: el.width
        };
        return obj;
      });
      console.log(streamInformation)
    });

    // initialize the plugin
    init();
  });
}.call(this));