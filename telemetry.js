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
          events,
          bufferingEvents,
        }),
      });
    };
    let bufferingEvents = {
      duration: [],
      time: [],
    };
    let streamInformation = {
      bitrateChanges: [],
    }; //stream information contains information
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
      //every duration we send the objects to our server and reinitialize the objects to get new statistics for the next period
      fetch("/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamInformation,
          events,
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
      function evenLogHandler(e) {
        if (e.type === "waiting") {
          memoizeWaiting.time = Date.now();
          bufferingEvents.time.push(Date.now());
        } else if (memoizeWaiting.time !== 0) {
          let waitingTime = Date.now() - memoizeWaiting.time;
          bufferingEvents.duration.push(waitingTime);
          events.buffered += waitingTime;
          memoizeWaiting.time = 0;
          myVar();
        }
        events[e.type].time.push(Date.now());
        console.log("buffering", bufferingEvents);
        console.log("events", events);
      }

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
        //downloadComplete
        videoBufferData.addEventListener(
          amp.bufferDataEventName.downloadcompleted,
          function () {
            if(player.videoBufferData().downloadCompleted.mediaDownload.bitrate !== streamInformation["currentBitrate"]){
            streamInformation["currentBitrate"] =
              player.videoBufferData().downloadCompleted.mediaDownload.bitrate;
            myVar();
            }
          }
        );
      }

      player.addEventListener(
        amp.eventName.downloadbitratechanged,
        function () {
          console.log(
            "videobitratechanged",
            player.videoBufferData().downloadCompleted.mediaDownload.bitrate,
            player.currentTime()
          );
          if (
            streamInformation["bitrateChanges"][
              streamInformation["bitrateChanges"].length - 1
            ][0] !==
            player.videoBufferData().downloadCompleted.mediaDownload.bitrate
          ) {
            streamInformation["bitrateChanges"].push([
              player.videoBufferData().downloadCompleted.mediaDownload.bitrate,
              Date.now(),
            ]);
            myVar();
          }
        }
      );

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
    });

    // initialize the plugin
    init();
  });
}.call(this));
