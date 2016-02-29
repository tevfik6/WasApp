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

    (function checkUntilFind(){
        if ($(".menu-item:last").length == 0){
            setTimeout(function () {
                checkUntilFind()
            }, 500);
        }
        else{
            updateDockNumRecursive();
            var $lastItem = $(".pane-list-header .menu-item:last");
            var $clonedItem = $lastItem.clone(true).removeAttr('data-reactid');
            $clonedItem.find('span').remove();
            $clonedItem.find('button').removeClass("icon-menu").removeAttr('data-ignore-capture').removeAttr('data-reactid').text("Settings").attr("title", "Settings")
			// console.log(wasApp);
			$clonedItem.find('.icon').css({
				'background-image':'url("data:image/png;base64,'+wasApp.settings.settings_png+'")',
				'background-size':'24px 24px'
			});
			wasApp.settings.settings_png = 1;
			delete wasApp.settings.settings_png;

			// .css({"background-image":"url(file:/"+wasApp.settings.__dirname+"/settings.png)"});
            $clonedItem.insertAfter($lastItem);

            $clonedItem.on('click', function (event) {
                // var $settingsWindow = $("<div>", {style:"background-color:white; opacity:0.4; position: absolute; top:0; left:0; width:100%; height:100%; z-index: 99;", id:"settings-window"}).appendTo('body');
                // $settingsWindow.append($('<div class="media-viewer media-viewer-animate"> <div class="media-panel-header"> <div class="chat media-chat"> <div class="chat-body"> <h2>WasApp Settings</h2> </div> </div> <div class="menu menu-horizontal media-panel-tools"> <div class="menu-item"> <button class="icon icon-l btn-media-share icon-x-viewer" title="Close"> Close </button> </div> </div> </div> <div class="media-content" dir="ltr"> </div> </div> </div>'));
                var $settingsWindow = $('<div id="settings-window" class="backdrop" style="opacity: 1;"> <div class="popup-container"> <div class="popup" style="opacity: 0.4; transform: scale(0.1);"> <div class="popup-body"> <div class="popup-title">WasApp Settings</div> <div class="popup-contents"> </div> </div> <div class="popup-controls"> <button class="btn-plain btn-default popup-controls-item">OK</button> </div> </div> </div> </div>').appendTo("body");

                Velocity($("#settings-window .popup"), { scale: [1, 0.1], opacity:[1, 0.1]}, { duration: 400 });
                // $settingsWindow.find(".popup").get(0).animate({ scaleX: 1, scaleY: 1, opacity: 1}, 15000);
                // var $settingsContent = $settingsWindow.find(".media-content");
                var $settingsContent = $settingsWindow.find(".popup-contents");
                // console.log("$settingsContent", $settingsContent);
                // var $settingList = $("<ul>",{ class:"unstyled" });
                $.each(wasApp.settings, function (key, value) {
                    // console.log("key",key,"value", value);
                    var self = $(this);
                    var re = /([A-W])/g;
                    var subst = ' $1';
                    var result = key.replace(re, subst);
                    result = result.charAt(0).toUpperCase() + result.slice(1);
                    var elementClass = value ? "checked" : "unchecked";
                    $("<div>", {class:"section "+elementClass}).html('<span class="checkbox-wrapper"><div class="checkbox-container"><div class="checkbox '+elementClass+'" data-settings-key="'+key+'"></div></div></span><span class="checkbox-text">'+result+'</span>')
                    // .appendTo($settingList);
                    .appendTo($settingsContent);
                });
                // $settingList.appendTo($settingsContent);
            });

            $(document).delegate("#settings-window .icon-x-viewer", "click", function () {
                Velocity($("#settings-window"), {opacity:0.4}, {
                    duration: 100,
                    complete: function () {
                        $("#settings-window").remove();
                    }
                })
            });

            $(document).delegate("#settings-window .checkbox", 'click', function (event) {
                var $this = $(this);
                var $parentLi = $this.parents('li');
                $parentLi.toggleClass("checked unchecked");
                $this.toggleClass("checked unchecked");

                var key = $this.attr("data-settings-key");
                var value = $this.hasClass("checked");
                changeSettings(key, value)
            });

            $(document).delegate("#settings-window .popup-controls-item", 'click', function (event) {
                Velocity($("#settings-window .popup"), { scale: [0.1, 1], opacity:[0.1, 1]}, { duration: 250, complete: function(){
                    $("#settings-window").remove();
                } });
            });
        }
    })();

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
