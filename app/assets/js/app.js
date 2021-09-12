const { ipcRenderer } = require('electron')

$('#app').hide()
$('#login').show()

function settings(value) {
    if (value) {
        $('#app').hide()
        $('#settings').show()
    } else {
        $('#app').show()
        $('#settings').hide()
    }
}

ipcRenderer.on("version", (event, data) => {
    fetch('https://raw.githubusercontent.com/Marius-brt/42-Intra-Notifier/main/version.txt')
        .then(response => response.text())
        .then(version => {
            if (parseInt(version.replace(/\./g, "")) > parseInt(data.replace(/\./g, ""))) {
                console.log("new version available")
            } else {
                console.log("up to date")
            }
        });
    $('#version').text(data)
})

ipcRenderer.on("init_data", (event, data) => {
    document.getElementById('username').value = data.username
    document.getElementById('password').value = data.password
})

ipcRenderer.on("user_data", (event, data) => {
    var evals = Object.values(data.evaluations)
    $("#evaluations").empty()

    if (evals.length > 0) {
        $('#not_found').hide()
        $('#evaluations').show()
    } else {
        $('#not_found').show()
        $('#evaluations').hide()
    }

    evals = evals.sort((a, b) => {
        return new Date(a.time) - new Date(b.time)
    })

    evals.forEach(el => {
        var date = new Date(el.time)
        $("#evaluations").append(`
			<li class="event" data-date="${date.getHours()}:${date.getMinutes()}">
				<h3>${el.text.startsWith("You will evaluate") ? "Correction" : "Evaluation"}</h3>
				<p>${el.text}</p>
				<i class="far fa-clock"><p>${diffDate(date)}</p></i>
			</li>`)
    })
    $('#points-card').text(data.user_data.points)
    $('#grade-card').text(data.user_data.grade)
    $('#level-card').text(data.user_data.level)
})

ipcRenderer.on("user_data", (event, data) => {
    console.log(data)
})

ipcRenderer.on("logged", (event, data) => {
    $('#login').hide()
    $('#app').show()
    $('#loading').hide()
})

ipcRenderer.on("try_login", (event, data) => {
    $('#loading').show()
    $("#username").prop('disabled', true);
    $("#password").prop('disabled', true);
    $("#login_btn").prop('disabled', true);
})

ipcRenderer.on("failed_login", (event, data) => {
    $('#loading').hide()
    $('#error_message').text('Failed login')
    $("#username").prop('disabled', false);
    $("#password").prop('disabled', false);
    $("#login_btn").prop('disabled', false);
})

function login() {
    if (document.getElementById('username').value != '' && document.getElementById('password').value != '') {
        $('#error_message').text('')
        ipcRenderer.send('login', {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            save: $('#stay_logged').is(":checked")
        })
    } else {
        $('#error_message').text('Missing Username or/and Password')
    }
}

function logout() {
    document.getElementById('username').value = ''
    document.getElementById('password').value = ''
    $('#loading').hide()
    $('#app').hide()
    $('#login').show()
    $("#username").prop('disabled', false);
    $("#password").prop('disabled', false);
    $("#login_btn").prop('disabled', false);
    ipcRenderer.send('logout')
}

function getDiff(endDate) {
    const today = new Date()
    var seconds = Math.floor((endDate - today) / 1000)
    var minutes = Math.floor(seconds / 60)
    var hours = Math.floor(minutes / 60)
    var days = Math.floor(hours / 24)
    hours = hours - (days * 24)
    minutes = minutes - (days * 24 * 60) - (hours * 60)
    seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60)
    return {
        seconds,
        minutes,
        hours
    }
}

function diffDate(endDate) {
    const today = new Date()
    const time = getDiff(endDate)
    if (endDate - today < 0) {
        return `few seconds`
    } else {
        if (time.hours > 0 || time.minutes > 0) {
            return `${time.hours > 0 ? time.hours + " hours " : ""}${time.minutes > 0 ? time.minutes + " mins " : ""}`
        } else {
            return `${time.seconds} secs`
        }
    }
}