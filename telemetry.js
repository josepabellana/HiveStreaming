(function () {
  amp.plugin("telemetry", function (options) {
    
    var player = this

    var init = function (){
      console.log('plugin telemetry initialized with player', player)
    
    }

    
    

    // initialize the plugin
    init();
  });
}.call(this));
