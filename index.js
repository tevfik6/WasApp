var Electron = require('electron')
const {
    app,
    BrowserWindow,
    Tray,
    Menu,
    shell,
    ipcMain
} = Electron
var App = app
var Fs = require('fs')
var Shell = shell
var mainWindow = null,
    trayIcon = null,
    menu = null,
    settings = {},
    settingsFromFile = {},
    noMessageIcon = __dirname + '/icons/icon_menubar.png',
    messageIcon = __dirname + '/icons/icon_menubar_alert.png',
    settingsFile = App.getPath('appData') + "/Settings.json",
    cacheIndex = App.getPath('appData') + "/Application Cache/Index"
var path = require('path')
var defaultSettings = {
    "hideDockIcon": false,
    "hideOnBlur": false
}
var settingsActions = {
    hideDockIcon: function() {
        if (defaultSettings.hideDockIcon == true) {
            App.dock.hide()
        } else {
            App.dock.show()
            mainWindow.webContents.executeJavaScript("document.title = ''; updateDockNum();")
        }
    }
}
var syncSettings = function() {
    if (!Fs.existsSync(settingsFile)) return
    settingsFromFile = JSON.parse(Fs.readFileSync(settingsFile, 'utf8'))
    Object.keys(defaultSettings).forEach(function(key) {
        if (defaultSettings[key] != settingsFromFile[key]) {
            defaultSettings[key] = settingsFromFile[key]
            typeof settingsActions[key] === 'function' && settingsActions[key]()
        }
    })
}
var saveSettings = function() {
    Fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 4));
}
var changeSettings = function(key, value) {
    if (key in defaultSettings) {
        defaultSettings[key] = value
        typeof settingsActions[key] === 'function' && settingsActions[key]()
        saveSettings()
    }
}

ipcMain.on('message-count', (event, messageCount) => {
    // console.log("messageCount:", messageCount)  // prints "ping"
    trayIcon.setImage(messageIcon)
    App.dock.setBadge(messageCount.toString())
})

ipcMain.on('no-message', (event) => {
    // console.log("Hiding message Icon")  // prints "ping"
    App.dock.setBadge('')
    trayIcon.setImage(noMessageIcon);
})

App.on('window-all-closed', function() {
    App.quit()
})
App.on('before-quit', function() {
    mainWindow.forceClose = true
})
App.on('activate', function() {
    mainWindow.show()
})
App.on('ready', function() {
    syncSettings()
    trayIcon = new Tray(noMessageIcon)
    trayIcon.setToolTip(App.getName())
    menu = Menu.buildFromTemplate(menuContent);
    Menu.setApplicationMenu(menu);
    // var customjs = __dirname + "/custom.js";
    mainWindow = new BrowserWindow({
        "width": 900,
        "height": 650,
        "titleBarStyle": "hiddenInset",
        "title": App.getName()
    })
    // mainWindow.openDevTools()
    mainWindow.loadURL('https://web.whatsapp.com', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    })
    mainWindow.webContents.on('dom-ready', function(event) {
        //adjusting buttons based on hidden-inset title-bar-style
        var customCSS = Fs.readFileSync(__dirname + "/custom.css", 'utf8');
        mainWindow.webContents.insertCSS(customCSS)
        var jQuery = Fs.readFileSync(__dirname + "/custom.js", 'utf8');
        mainWindow.webContents.executeJavaScript(jQuery)
        mainWindow.webContents.executeJavaScript("var defaultSettings = " + JSON.stringify(defaultSettings))
    })
    mainWindow.on('close', function(event) {
        if (mainWindow.forceClose) return
        event.preventDefault()
        mainWindow.hide()
    })
    mainWindow.on('blur', function(event) {
        // console.log("defaultSettings.hideOnBlur: " + defaultSettings.hideOnBlur)
        defaultSettings.hideOnBlur && mainWindow.hide()
        // if( defaultSettings.hideDockIcon == true ){
        //     App.dock.hide()
        // }
    })
    mainWindow.on('focus', function(event) {
        // App.dock.show()
    })
    mainWindow.webContents.on("new-window", function(event, url) {
        Shell.openExternal(url)
        event.preventDefault()
    })
    trayIcon.on('click', function() {
        if (mainWindow.isVisible()) {
            if (mainWindow.isFocused()) {
                mainWindow.hide()
            } else {
                mainWindow.focus()
            }
        } else {
            mainWindow.show()
        }
    })
    trayIcon.on('right-click', function() {
        var contextMenu = Menu.buildFromTemplate([{
            label: 'Hide Dock Icon',
            type: 'checkbox',
            checked: defaultSettings.hideDockIcon,
            click: function() {
                changeSettings('hideDockIcon', !defaultSettings.hideDockIcon);
            }
        }, {
            label: 'Hide On Blur',
            type: 'checkbox',
            checked: defaultSettings.hideOnBlur,
            click: function() {
                changeSettings('hideOnBlur', !defaultSettings.hideOnBlur);
            }
        }, {
            type: 'separator'
        }, {
            label: 'Delete Cache and Reload',
            click: function() {
                try {
                    Fs.unlinkSync(cacheIndex)
                } catch (e) {}
                mainWindow.reload()
            }
        }, {
            type: 'separator'
        }, {
            label: 'About ' + App.getName(),
            selector: 'orderFrontStandardAboutPanel:'
        }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            selector: 'terminate:'
        }, ]);
        trayIcon.popUpContextMenu(contextMenu);
    })
});
var menuContent = [{
    label: App.getName(),
    submenu: [{
        label: 'About ' + App.getName(),
        selector: 'orderFrontStandardAboutPanel:'
    }, {
        type: 'separator'
    }, {
        label: 'Delete Cache and Reload',
        click: function() {
            try {
                Fs.unlinkSync(cacheIndex)
            } catch (e) {}
            mainWindow.reload()
        }
    }, {
        type: 'separator'
    }, {
        label: 'Hide ' + App.getName(),
        accelerator: 'Command+H',
        selector: 'hide:'
    }, {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
    }, {
        label: 'Show All',
        selector: 'unhideAllApplications:'
    }, {
        type: 'separator'
    }, {
        label: 'Quit',
        accelerator: 'Command+Q',
        selector: 'terminate:'
    }, ]
}, {
    label: 'Edit',
    submenu: [{
        label: 'Undo',
        accelerator: 'Command+Z',
        selector: 'undo:'
    }, {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        selector: 'redo:'
    }, {
        type: 'separator'
    }, {
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
    }, {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
    }, {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
    }, {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
    }]
}, {
    label: 'View',
    submenu: [{
        label: 'Reload',
        accelerator: 'Command+R',
        click: function() {
            mainWindow.reload();
        }
    }, {
        label: 'Toggle DevTools',
        accelerator: 'Alt+Command+I',
        click: function() {
            mainWindow.toggleDevTools();
        }
    }, ]
}, {
    label: 'Window',
    submenu: [{
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:'
    }, {
        label: 'Close',
        accelerator: 'Command+W',
        selector: 'hide:'
    }, {
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
    }]
}]