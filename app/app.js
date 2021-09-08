const { ipcRenderer } = require('electron')

document.getElementById("start-btn").addEventListener("click", start);
document.getElementById("stop-btn").addEventListener("click", stop);

ipcRenderer.on("data", (event, data) => {
	document.getElementById('username').value = data.username
	document.getElementById('password').value = data.password
})

ipcRenderer.on("starting", (event, data) => {
	document.getElementById("state").innerHTML = "Starting..."
	document.getElementById("start-btn").disabled = true
	document.getElementById("stop-btn").disabled = true
})

ipcRenderer.on("started", (event, data) => {
	document.getElementById("state").innerHTML = "Started"
	document.getElementById("start-btn").disabled = true
	document.getElementById("stop-btn").disabled = false
})

ipcRenderer.on("stopped", (event, data) => {
	document.getElementById("state").innerHTML = "Stopped"
	document.getElementById("start-btn").disabled = false
	document.getElementById("stop-btn").disabled = true
})

ipcRenderer.on("stopping", (event, data) => {
	document.getElementById("start-btn").disabled = true
	document.getElementById("stop-btn").disabled = true
	document.getElementById("state").innerHTML = "Stopping..."
})

function start()
{
	ipcRenderer.send('start', 
	{
		username: document.getElementById('username').value,
		password: document.getElementById('password').value
	})
}

function stop()
{
	ipcRenderer.send('stop')
}