const { ipcRenderer } = require('electron')

ipcRenderer.on("user_data", (event, data) => {
	console.log(data)
})