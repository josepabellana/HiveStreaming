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
          // audiobitlog,
          // texttracklog,
          // events,
        })
      });

    }
    let streamInformation = {}; //streaminfroamtion contains information about the languages and video and sound bit rate
    let videobitlog = {}; //this record the changes in the bitrate 
    let events = {
      pause: {
        time: []
      },
      play: {
        time: []
      },
      skip: {
        time: []
      },
      buffering: {
        time: []
      },
      fullscreenchange: {
        time: []
      },

      volumechange: {
        time: []
      },
      ended: {
        time: []
      }
    };
    let texttracklog = {}; //recording the timestamp for each change in subtitle or captions



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
          // audiobitlog,
          // texttracklog,
          // events
        })
      });
      //initialize the objects each period
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

      player.textTracks().tracks_.forEach(function (element) {
        texttracklog[element.label] = {
          changes: []
        };
      });

      events = {
        pause: {
          time: []
        },
        play: {
          time: []
        },
        skip: {
          time: []
        },
        buffering: {
          time: []
        },
        fullscreenchange: {
          time: []
        },

        volumechange: {
          time: []
        },
        ended: {
          time: []
        }
      };


    }, options.timeperiod);


    let player = this;
    var init = function () {
      console.log("plugin telemetry initialized with player ", player);
    };

    player.addEventListener("loadedmetadata", function () {
      player.textTracks().tracks_.forEach(function (element) {
        texttracklog[element.label] = {
          changes: []
        };
      });

      function evenLogHandler(e) {
        events[e.type].time.push(player.currentTime());
        console.log(e.type, "type");
        console.log("events", events);
      }
      player.addEventListener("play", evenLogHandler);
      player.addEventListener("pause", evenLogHandler);
      player.addEventListener("skip", evenLogHandler);
      // player.addEventListener("waiting", evenLogHandler);
      player.addEventListener("fullscreenchange", evenLogHandler);
      player.addEventListener("volumechange", evenLogHandler);
      player.addEventListener("ended", evenLogHandler);
      player.addEventListener("error", evenLogHandler);



      player.addEventListener("texttrackchange", function () {
        
        if (player.getCurrentTextTrack() && player.getCurrentTextTrack().mode == "showing") {
          texttracklog[player.getCurrentTextTrack().label].changes.push(
            player.currentTime()
          );
          console.log("texttrackchanged", texttracklog);
        }
      });

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
        "protocol",
        player.currentType()
      );
      streamInformation['height'] = player.height;
      streamInformation['width'] = player.width;
      streamInformation["manifest"] = player.src();
      streamInformation["protocol"] = player.currentType();
      streamInformation["audiotracks"] = player.currentAudioStreamList().streams.map(element => {
        let obj = {};
        obj["bitrate"] = element.bitrate;
        return obj;
      });

      streamInformation["videotracks"] = player.currentVideoStreamList().streams[0].tracks.map(el => {
        let obj = {
          bitrate: el.bitrate,
          height: el.height,
          width: el.width
        };
        return obj;
      });
    });

    // initialize the plugin
    init();
  });
}.call(this));