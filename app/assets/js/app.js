//const { ipcRenderer } = require('electron')

var evals = [{
        "id": "3528107",
        "text": "You will be evaluated by bsouleau on C Piscine C 06",
        "time": 1631280303353,
        "first_notif": false,
        "last_notif": false,
        "new_notif": false,
        "username": "bsouleau",
        "url": "https://profile.intra.42.fr/users/bsouleau",
        "place": "",
        "image": ''
    },
    {
        "id": "3528108",
        "text": "You will be evaluated on C Piscine C 07",
        "time": 1631277605870,
        "first_notif": false,
        "last_notif": false,
        "new_notif": false,
        "place": "",
        "image": ''
    },
    {
        "id": "3528109",
        "text": "You will be evaluated on C Piscine C 07",
        "time": 1631272500000,
        "first_notif": false,
        "last_notif": false,
        "new_notif": false,
        "place": "",
        "image": ''
    },
    {
        "id": "3528110",
        "text": "You will be evaluated on OUI",
        "time": 1631277605870,
        "first_notif": false,
        "last_notif": false,
        "new_notif": false,
        "place": "",
        "image": ''
    }
]

evals.forEach(el => {
    var date = new Date(el.time)
    var end = addMinutes(date, 15)
    $("#timeline").append(`<li>
		<span></span>
		<div>
			<div class="info">${el.text}</div>
			<div class="image" style="${el.image != '' ? el.image : "background-image: url('assets/images/avatars/" + Math.floor(Math.random()*(10-1+1)+1) + ".png')"}">
		</div>
		<span class="number">
			<span>${date.getHours()}:${date.getMinutes()}</span>
			<span>${end.getHours()}:${end.getMinutes()}</span>
		</span>
	</li>`)
})

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}
/*ipcRenderer.on("user_data", (event, data) => {
    document.getElementById("timeline").appendChild(` <li>
		<span></span>
		<div>
			<div class="title">Test</div>
			<div class="info">Let's make coolest things in css</div>
			<div class="type">Prensetation</div>
		</div>
		<span class="number">
			<span>10:15</span>
		<span>12:00</span>
		</span>
	</li>`)
})*/