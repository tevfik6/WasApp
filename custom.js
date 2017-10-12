var $tev = require("jquery");
var ipcR = require('electron').ipcRenderer
var debounceTimer; 
var updateDockNum;
$tev(function() {
    var wasApp = {
        settings: defaultSettings
    };
    // console.log("wasApp", wasApp);
    var changeSettings = function(key, value) {
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
    updateDockNum = function() {
        // console.log( "updateDockNum is running" );
        var selector = ".chat.unread"
        var messageCount = 0;
        var elementCount = $tev(selector).length;
        // console.log( "elementCount is", elementCount);
        $tev(selector).each(function(i, v) {
            var $this = $tev(this).find(".chat-secondary .chat-meta > span > div > span");
            if ($this.length > 0) {
                // console.log($this.html(), $this.text(), $this);
                messageCount += parseInt($this.text());
            }
            if(i == elementCount-1){
                // console.log("Message count sent", messageCount);
                ipcR.send('message-count', messageCount) 
            }
        });
        if(elementCount == 0){
            ipcR.send('no-message');
        }
    };
    $tev(document).delegate('.chat-meta', 'DOMSubtreeModified', function(event) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout("updateDockNum()", 250);
    });
});