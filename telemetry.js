(function () {
  amp.plugin("telemetry", function (options) {

    /* 

    1. Video frame size 
    2. Available video bitrates 
    3. Bitrate switches 
    4. Number of buffering events 
    5. time spent in buffering state  
    
    */
  
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
          events
        }),
      });
    };
    let streamInformation = {
      'bitrateChanges' : []
    }; //stream information contains information
    let events = {
      buffered : 0,
      numberOfBufferEvents : 0,
      // pause: {
      //   time: []
      // },
      play: {
        time: []
      },
      // skip: {
      //   time: []
      // },
      waiting: {
        time: []
      },
      // fullscreenchange: {
      //   time: []
      // },
      // volumechange: {
      //   time: []
      // },
      // ended: {
      //   time: []
      // }
    };

    var myVar = function () {
      //every duration we send the objects to our server and reinitialize the objects to get new statistics for the next period
      fetch("/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamInformation,
          events
        }),
      });

      events = {
        play: {
          time: []
        },
        waiting: {
          time: []
        },
        buffered :  calculateBufferAhead(),
        numberOfBufferEvents: player.buffered().length,
      };
      
    };

    let player = this;
    var init = function () {
      console.log("plugin telemetry initialized with player ", player);
      console.log(player.buffered())
    };


    function calculateBufferAhead() {
      var buffered = player.buffered();
      var currentTime = player.currentTime();

      if (!buffered) {
          return undefined;
      }

      console.log(Math.max(0, buffered.end(buffered.length - 1) - currentTime));
  }
    player.addEventListener("loadedmetadata", function () {
      

      //Calculating bufferedAhead *Does not work in SilverlightSS
   


      function evenLogHandler(e) {
        console.log(e)
        events[e.type].time.push(Date.now());
        console.log(e.type, "type");
        console.log("events", events);
        myVar();
      }
      
      player.addEventListener("play", evenLogHandler);
      // player.addEventListener("pause", evenLogHandler);
      // player.addEventListener("skip", evenLogHandler);
      player.addEventListener("waiting", evenLogHandler);
      // player.addEventListener("fullscreenchange", evenLogHandler);
      // player.addEventListener("volumechange", evenLogHandler);
      // player.addEventListener("ended", evenLogHandler);
      // player.addEventListener("error", evenLogHandler);
     


      let videoBufferData = player.videoBufferData();

      if (videoBufferData) {




        //downloadComplete
        videoBufferData.addEventListener(
          amp.bufferDataEventName.downloadcompleted,
          function () {
            streamInformation[
              'currentBitrate'
            ] = player.videoBufferData().downloadCompleted.mediaDownload.bitrate
            // console.log("changelogforvideo", streamInformation);
            myVar();
          }
        );
      }
      

      player.addEventListener(amp.eventName.downloadbitratechanged, function () {
        console.log("videobitratechanged",player.videoBufferData().downloadCompleted.mediaDownload.bitrate,player.currentTime());

        streamInformation['bitrateChanges'].push([player.videoBufferData().downloadCompleted.mediaDownload.bitrate, Date.now()]);
        myVar();
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
      // console.log(streamInformation, events);
    });

    // initialize the plugin
    init();
  });
}.call(this));
