(function () {
  amp.plugin("telemetry", function (options) {

    // video frame size -- done
    // available video bitrates 
    // bitrate switches 
    // number of buffering events 
    // time spent in buffering state 

    window.onbeforeunload = function (e) {
      //sending the information when closimg the window
      fetch("/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamInformation,
        }),
      });
    };
    let streamInformation = {
      'bitrateChanges' : []
    }; //streaminfroamtion contains information
    var myVar = setInterval(function () {
      //every duration we send the objects to our server and reinitialize the objects to get new statistics for the next period
      fetch("/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamInformation,
          
        }),
      });

      
      
    }, options.timeperiod);

    let player = this;
    var init = function () {
      console.log("plugin telemetry initialized with player ", player);
    };

    player.addEventListener("loadedmetadata", function () {
      
      

      let videoBufferData = player.videoBufferData();
      if (videoBufferData) {
        videoBufferData.addEventListener(
          amp.bufferDataEventName.downloadcompleted,
          function () {
            streamInformation[
              'currentBitrate'
            ] = player.videoBufferData().downloadCompleted.mediaDownload.bitrate
            console.log("changelogforvideo", streamInformation);
          }
        );
      }
      

      player.addEventListener(amp.eventName.downloadbitratechanged, function () {
        console.log("videobitratechanged",player.videoBufferData().downloadCompleted.mediaDownload.bitrate,player.currentTime());

        streamInformation['bitrateChanges'].push([player.videoBufferData().downloadCompleted.mediaDownload.bitrate, Date.now()])
      });


      streamInformation["height"] = player.height();
      streamInformation["width"] = player.width();
      streamInformation["videotracks"] = player
        .currentVideoStreamList()
        .streams[0].tracks.map((el) => {
          let obj = {
            bitrate: el.bitrate,
            height: el.height,
            width: el.width,
          };
          return obj;
        });
      console.log(streamInformation);
    });

    // initialize the plugin
    init();
  });
}.call(this));
