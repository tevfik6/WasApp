var updateDockNum;
$(function(){
	// console.log("defaultSettings", defaultSettings);

	var wasApp = {
        messageCount: 0,
        settings: defaultSettings
    };
    // console.log("wasApp", wasApp);

    var changeSettings = function (key, value) {
        // console.log(key, value);
        wasApp.settings[key] = value;
		wasApp['changedSettings'] = {};
		wasApp['changedSettings'][key] = value;
        // console.log("wasApp", wasApp);
        document.title = JSON.stringify(wasApp);
		wasApp.changedSettings = 1;
		delete wasApp.changedSettings;
		// console.log("wasApp", wasApp);
    };

    updateDockNum = function () {
        // console.log( "updateDockNum is running" );
        wasApp.messageCount = 0;
        $(".unread-count").each(function(i, v){
            var $this = $(this);
            // console.log($this.html(), $this.text(), $this);
            wasApp.messageCount += parseInt( $this.text() );
        });
        setTimeout(function() {
            // console.log(wasApp, JSON.stringify(wasApp));
            document.title = JSON.stringify(wasApp);
        }, 25)
    };

	$(document).delegate('.chat-meta', 'DOMSubtreeModified', function(event) {
        updateDockNum();
    });

    var trialCount = 3;
    function updateDockNumRecursive() {
        setTimeout( function () {
            // console.log( "trialCount", trialCount );
            if( trialCount >= 0 ){
                updateDockNum();
                updateDockNumRecursive();
            };
        }, 1000 );
        trialCount--;
    };
});
