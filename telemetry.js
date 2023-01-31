(function () {
  amp.plugin("telemetry", function (options) {
    /* 

    1. Video frame size 
    2. Available video bitrates 
    3. Bitrate switches 
    4. Number of buffering events 
    5. time spent in buffering state  
    
    */

    //storing bufferingEvents and duration
    let bufferingEvents = {
      duration: [],
      time: [],
    };
    //storing changes in bitrate
    let streamInformation = {
      bitrateChanges: [[0,0]],
    }; 
    let events = {
      buffered: 0,
      pause: {
        time: [],
      },
      play: {
        time: [],
      },
      skip: {
        time: [],
      },
      waiting: {
        time: [],
      },
      fullscreenchange: {
        time: [],
      },
      volumechange: {
        time: [],
      },
      ended: {
        time: [],
      },
    };

    var myVar = function () {
      //We send the objects to our server and reinitialize the objects to get new statistics for the next period
      fetch("/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamInformation,
          bufferingEvents,
        }),
      });

      events = {
        buffered: 0,
        pause: {
          time: [],
        },
        play: {
          time: [],
        },
        skip: {
          time: [],
        },
        waiting: {
          time: [],
        },
        fullscreenchange: {
          time: [],
        },
        volumechange: {
          time: [],
        },
        ended: {
          time: [],
        },
      };
    };

    let player = this;
    var init = function () {
      console.log("plugin telemetry initialized with player ", player);
    };

    let memoizeWaiting = {
      time: 0,
    };

    player.addEventListener("loadedmetadata", function () {

      //checks all events(actions from the user) to detect the buffering('waiting') state and calculate its duration
      function evenLogHandler(e) {
        if (e.type === "waiting") {
          memoizeWaiting.time = Date.now();
          bufferingEvents.time.push(Date.now());
        } else if (memoizeWaiting.time !== 0) {
          let waitingTime = Date.now() - memoizeWaiting.time;
          bufferingEvents.duration.push(waitingTime); //we store the duration of a specific buffering event 
          events.buffered += waitingTime; //store the total buffered time
          memoizeWaiting.time = 0;
          myVar();
        }
        events[e.type].time.push(Date.now()); 
      }

      //EventListener for all the actions
      player.addEventListener("play", evenLogHandler);
      player.addEventListener("pause", evenLogHandler);
      player.addEventListener("skip", evenLogHandler);
      player.addEventListener("waiting", evenLogHandler);
      player.addEventListener("fullscreenchange", evenLogHandler);
      player.addEventListener("volumechange", evenLogHandler);
      player.addEventListener("ended", evenLogHandler);
      player.addEventListener("error", evenLogHandler);

      let videoBufferData = player.videoBufferData();

      if (videoBufferData) {
        //once the download has been completed, even in the end or when has stored the next 30sec of video. It triggers this event where we check if bitrate has changed
        videoBufferData.addEventListener(
          amp.bufferDataEventName.downloadcompleted,
          function () {
            if (streamInformation["currentBitrate"] !== player.videoBufferData().downloadCompleted.mediaDownload.bitrate ) {
              streamInformation["currentBitrate"] = player.videoBufferData().downloadCompleted.mediaDownload.bitrate;
              myVar();
            }
          }
        );
      }

      //Event listener for change of current bitrate download
      player.addEventListener(
        amp.eventName.downloadbitratechanged,
        function () {
          //if the bitrate has changed (difference on what we previously stored -> avoid multiple http request) update the stream information
          if (streamInformation["bitrateChanges"][streamInformation["bitrateChanges"].length - 1][0] !== player.videoBufferData().downloadCompleted.mediaDownload.bitrate) {
            streamInformation["bitrateChanges"].push([
              player.videoBufferData().downloadCompleted.mediaDownload.bitrate,
              Date.now(),
            ]);
            myVar();
          }
        }
      );

      //Getting height and width to calculate optimal bitrate
      streamInformation["height"] = player.height();
      streamInformation["width"] = player.width();
      //get current videotracks available for the player
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
    });

    // initialize the plugin
    init();
  });
}.call(this));
