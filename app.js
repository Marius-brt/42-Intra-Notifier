const { ipcRenderer } = require('electron')

document.getElementById("start-btn").addEventListener("click", start);
document.getElementById("stop-btn").addEventListener("click", stop);

$('#state').html("Stopped".fontcolor("red"))

ipcRenderer.on("data", (event, data) => {
	document.getElementById('username').value = data.username
	document.getElementById('password').value = data.password
})

ipcRenderer.on("starting", (event, data) => {
	$('#state').html("Starting...".fontcolor("green"))
})

ipcRenderer.on("started", (event, data) => {
	$('#state').html("Started".fontcolor("green"))
})

ipcRenderer.on("stopped", (event, data) => {
	$('#state').html("Stopped".fontcolor("red"))
})

ipcRenderer.on("stopping", (event, data) => {
	$('#state').html("Stopping...".fontcolor("red"))
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