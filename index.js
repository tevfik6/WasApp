var App = require('app')
var BrowserWindow = require('browser-window')
var Tray = require('tray')
var Menu = require('menu')
var Fs = require('fs')
var Shell = require('shell')
var Extend = require('util')._extend


var mainWindow = null,
    trayIcon = null,
    menu = null,
    settings = {},
    settingsFromFile = {},
    noMessageIcon = __dirname+'/icons/icon_menubar.png',
    messageIcon = __dirname+'/icons/icon_menubar_alert.png',
    settingsFile = App.getPath('appData') + "/Settings.json",
    cacheIndex = App.getPath('appData') + "/Application Cache/Index"

var defaultSettings = {
    "hideDockIcon": false,
    "hideOnBlur": false
}


var settingsActions = {
    hideDockIcon: function () {
        if (defaultSettings.hideDockIcon == true){
            App.dock.hide()
        }
        else{
            App.dock.show()
            mainWindow.webContents.executeJavaScript("document.title = ''; updateDockNum();")
        }
    }
}

var syncSettings = function () {
    if ( ! Fs.existsSync(settingsFile) ) return

    settingsFromFile = JSON.parse(Fs.readFileSync(settingsFile, 'utf8'))
    Object.keys(defaultSettings).forEach(function (key) {
        if(defaultSettings[key] != settingsFromFile[key] ){
            defaultSettings[key] = settingsFromFile[key]
            typeof settingsActions[key] === 'function' && settingsActions[key]()
        }
    })
}

var saveSettings = function () {
    Fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 4));
}

var changeSettings = function (key, value) {
    if ( key in defaultSettings ) {
        defaultSettings[key] = value
        typeof settingsActions[key] === 'function' && settingsActions[key]()
        saveSettings()
    }
}

App.on('window-all-closed', function () {
    App.quit()
})

App.on('before-quit', function () {
    mainWindow.forceClose = true
})

App.on('activate', function () {
    mainWindow.show()
})


App.on('ready', function () {
    syncSettings()

    trayIcon = new Tray(noMessageIcon)
    trayIcon.setToolTip(App.getName())

    menu = Menu.buildFromTemplate(menuContent);
    Menu.setApplicationMenu(menu);

    mainWindow = new BrowserWindow({
        "width": 900,
        "height": 650,
        "title-bar-style": "hidden-inset",
        "title": App.getName(),
        "web-preferences": {
            "node-integration": false,
        },
    })
    // mainWindow.openDevTools()

    mainWindow.loadURL('https://web.whatsapp.com', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36'
    })

    mainWindow.webContents.on('dom-ready', function (event) {
        //adjusting buttons based on hidden-inset title-bar-style
        var customCSS = Fs.readFileSync(__dirname+"/custom.css", 'utf8');
        mainWindow.webContents.insertCSS(customCSS)

        var jQueryLib = Fs.readFileSync(__dirname+"/jquery-2.1.4.min.js", 'utf8');
        mainWindow.webContents.executeJavaScript(jQueryLib)
        var jQuery = Fs.readFileSync(__dirname+"/custom.js", 'utf8');
        mainWindow.webContents.executeJavaScript(jQuery)
		var tempDefaultSettings = defaultSettings;

		tempDefaultSettings['settings_png'] = ""
		var original_data = Fs.readFileSync(__dirname+"/settings.png");
		tempDefaultSettings['settings_png'] = original_data.toString('base64')
		// console.log(tempDefaultSettings['settings_png'])

		// tempDefaultSettings['settings_png'] = new Buffer("Hello World").toString('base64');
        mainWindow.webContents.executeJavaScript("var defaultSettings = "+JSON.stringify(tempDefaultSettings))

    })

    mainWindow.on('close', function (event) {
        if ( mainWindow.forceClose ) return
        event.preventDefault()
        mainWindow.hide()
    })

    mainWindow.on('blur', function (event) {
        // console.log("defaultSettings.hideOnBlur: " + defaultSettings.hideOnBlur)
        defaultSettings.hideOnBlur && mainWindow.hide()
        // if( defaultSettings.hideDockIcon == true ){
        //     App.dock.hide()
        // }
    })

    mainWindow.on('focus', function (event) {
        // App.dock.show()
    })

    mainWindow.webContents.on("new-window", function (event, url) {
        Shell.openExternal(url)
        event.preventDefault()
    })

    mainWindow.on('page-title-updated', function (event, title) {
        event.preventDefault()
        var titleData = false
        var titleIsJSON = false
        try{
            titleData =  JSON.parse(title)
            // console.log("titleData: "+ title)
            titleIsJSON = true
        } catch(e){
            titleIsJSON = false
            titleData = title
        }
        var messageCount = ''
        if ( titleIsJSON ) {
            messageCount = titleData.messageCount
            if (messageCount == 0) {
                messageCount = ''
                trayIcon.setImage(noMessageIcon)
            }
            else{
                trayIcon.setImage(messageIcon)
            }


            var settings = titleData.changedSettings;
            for (var settingKey in settings) {
                // console.log("CHANGED: "+settingKey + " : "+ settings[settingKey])
                changeSettings(settingKey, settings[settingKey])
            }

        }
        else{
            trayIcon.setImage(noMessageIcon)
        }
        App.dock.setBadge(messageCount.toString())
    })

    trayIcon.on('click', function () {
        if (mainWindow.isVisible()) {
            if ( mainWindow.isFocused() ) {
                mainWindow.hide()
            }
            else {
                mainWindow.focus()
            }
        }
        else {
            mainWindow.show()
        }
    })
    trayIcon.on('right-click', function () {
        var contextMenu = Menu.buildFromTemplate([
            { 
                label: 'Hide Dock Icon',
                type: 'checkbox',
                checked: defaultSettings.hideDockIcon,
                click: function () {
                    changeSettings('hideDockIcon', !defaultSettings.hideDockIcon);
                }
            },
            {
                label: 'Hide On Blur',
                type: 'checkbox',
                checked: defaultSettings.hideOnBlur,
                click: function () {
                    changeSettings('hideOnBlur', !defaultSettings.hideOnBlur);
                }
            },
            { type: 'separator' },
            {
                label: 'Delete Cache and Reload',
                click: function () {
                    try { Fs.unlinkSync( cacheIndex ) } catch (e) { }
                    mainWindow.reload()
                }
            },
            { type: 'separator' },
            {
                label: 'About '+App.getName(),
                selector: 'orderFrontStandardAboutPanel:'
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                selector: 'terminate:'
            },
          ]);
        trayIcon.popUpContextMenu(contextMenu);
    })
});

var menuContent = [
    {
        label: App.getName(),
        submenu: [
            {
                label: 'About '+App.getName(),
                selector: 'orderFrontStandardAboutPanel:'
            },
            { type: 'separator' },
            {
                label: 'Delete Cache and Reload',
                click: function () {
                    try { Fs.unlinkSync( cacheIndex ) } catch (e) { }
                    mainWindow.reload()
                }
            },
            { type: 'separator' },
            {
                label: 'Hide '+App.getName(),
                accelerator: 'Command+H',
                selector: 'hide:'
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Shift+H',
                selector: 'hideOtherApplications:'
            },
            {
                label: 'Show All',
                selector: 'unhideAllApplications:'
            },
            { type: 'separator' },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                selector: 'terminate:'
            },
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'Command+Z',
                selector: 'undo:'
            },
            {
                label: 'Redo',
                accelerator: 'Shift+Command+Z',
                selector: 'redo:'
            },
            { type: 'separator' },
            {
                label: 'Cut',
                accelerator: 'Command+X',
                selector: 'cut:'
            },
            {
                label: 'Copy',
                accelerator: 'Command+C',
                selector: 'copy:'
            },
            {
                label: 'Paste',
                accelerator: 'Command+V',
                selector: 'paste:'
            },
            {
                label: 'Select All',
                accelerator: 'Command+A',
                selector: 'selectAll:'
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'Command+R',
                click: function() { mainWindow.reload(); }
            },
            {
                label: 'Toggle DevTools',
                accelerator: 'Alt+Command+I',
                click: function() { mainWindow.toggleDevTools(); }
            },
        ]
    },
    {
        label: 'Window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'Command+M',
                selector: 'performMiniaturize:'
            },
            {
                label: 'Close',
                accelerator: 'Command+W',
                selector: 'hide:'
            },
            { type: 'separator' },
            {
                label: 'Bring All to Front',
                selector: 'arrangeInFront:'
            }
        ]
    }
]
