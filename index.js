const glasstron = require('glasstron')
const electron = require('electron')
electron.app.commandLine.appendSwitch("enable-transparent-visuals")
electron.app.on('ready', () => {
	setTimeout(
		spawnWindow,
		process.platform == "linux" ? 1000 : 0
	);
});

function spawnWindow(){
	win = new glasstron.BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		frame: false,
		show: false,
		webPreferences: {
			nativeWindowOpen: false
		}
	})
	win.blurType = "blurbehind"
	win.setBlur(true)
	win.setMenu(null)
	//win.loadFile('./app/index.html')
	win.loadURL("http://127.0.0.1:5500/app/index.html")
	win.once('ready-to-show', () => {
		win.show()
	})
}