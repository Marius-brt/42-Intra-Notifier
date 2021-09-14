const { ipcRenderer } = require('electron')

var drop = false
$('#app').hide()
$('#login').show()
var audio = new Audio('./assets/images/star-wars-intro-hd-1080p.mp3');
var evalsTime = []

function settings(value) {
    if (value) {
        dropdown()
        $('#app').hide()
        $('#settings').show()
    } else {
        $('#app').show()
        $('#settings').hide()
    }
}

$(document).on("click", (e) => {
    if (!$(e.target).hasClass('profile') && $(e.target).parent('.profile').length == 0 && drop) {
        dropdown()
    }
})

$('.profile').on("click", () => {
    dropdown()
})

function dropdown() {
    if (drop) {
        drop = false
        $('#dropdown').hide()
        $('.profile i').addClass('fa-chevron-up').removeClass('fa-chevron-down')
    } else {
        drop = true
        $('#dropdown').show()
        $('.profile i').addClass('fa-chevron-down').removeClass('fa-chevron-up')
    }
}

$('#notif-sound').change(() => {
    ipcRenderer.send('set_setting', {
        name: 'notif_sound',
        value: $('#notif-sound').is(":checked")
    })
})

$('#password').on('keypress', function(e) {
    if (e.which === 13) {
        login()
    }
});

function sw(val) {
    if (val) {
        $('#settings').hide()
        $(".star-wars-container").fadeIn("slow");
        audio.play();
    } else {
        $('#settings').show()
        $('.star-wars-container').hide()
        audio.pause();
        audio.currentTime = 0;
    }
}

ipcRenderer.on("version", (event, data) => {
    fetch('https://raw.githubusercontent.com/Marius-brt/42-Intra-Notifier/main/version.txt')
        .then(response => response.text())
        .then(version => {
            if (parseInt(version.replace(/\./g, "")) > parseInt(data.replace(/\./g, ""))) {
                $('#version-text p').text('New version available!')
                $('#version-text').append(`<button style="margin-top: 15px;" onclick='require("electron").shell.openExternal("https://github.com/Marius-brt/42-Intra-Notifier/releases")'>Download last version</button>`)
            } else {
                $('#version-text p').text('Your version is up to date!')
            }
        });
    $('#version').text(data)
})

ipcRenderer.on("init_data", (event, data) => {
    document.getElementById('username').value = data.username
    document.getElementById('password').value = data.password
})

ipcRenderer.on("settings", (event, data) => {
    $('#notif-sound').prop('checked', data.notif_sound);
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
    evalsTime = []
    evals.forEach(el => {
        evalsTime.push({
            id: el.id + "-time",
            time: el.time
        })
        var date = new Date(el.time)
        $("#evaluations").append(`
			<li class="event noselect" data-date="${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}">
				<div class="timeline-pict" style="${el.image != '' ? el.image : "background: url('./assets/images/avatars/" + Math.floor(Math.random()*(10-1+1)+1) + ".png');"}"></div>
				<h3>${el.text.startsWith("You will evaluate") ? "Correction" : "Evaluation"}</h3>
				<p>${el.html}</p>
				<p class="subtitle">${el.text.startsWith("You will evaluate") && el.place ? 'place: ' + el.place : ''}</p>
				<i class="far fa-clock"><p id="${el.id + "-time"}">${diffDate(date)}</p></i>
			</li>`)
    })
    $('#points-card').text(data.user_data.points)
    $('#grade-card').text(data.user_data.grade)
    $('#level-card').text(data.user_data.level)
    $('#profile-username').text(data.user_data.login)
    $('#profile-avatar').attr('style', data.user_data.image);
    $('#settings-name').text(data.user_data.name)
    $('#settings-login').text(data.user_data.login)
    $('#settings-img').attr('style', data.user_data.image);
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
    dropdown()
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
        days,
        seconds,
        minutes,
        hours
    }
}

function diffDate(endDate) {
    const today = new Date()
    const time = getDiff(endDate)
    if (endDate - today < 0) {
        return `few seconds ago`
    } else {
        if (time.hours > 0 || time.minutes > 0 || time.days > 0) {
            return `${time.days > 0 ? time.days + " days " : ""}${time.hours > 0 ? twoDigits(time.hours) + " hours " : ""}${time.minutes > 0 ? twoDigits(time.minutes) + " mins " : ""} ${time.seconds} secs`
        } else {
            return `${time.seconds} secs`
        }
    }
}

function twoDigits(nb) {
    return ("0" + nb).slice(-2)
}

window.setInterval(() => {
    evalsTime.forEach(el => {
        var dt = new Date(el.time)
        $("#" + el.id).text(diffDate(dt))
    })
}, 1000);

function yes() {
    function c() {
        var e = document.createElement("link");
        e.setAttribute("type", "text/css");
        e.setAttribute("rel", "stylesheet");
        e.setAttribute("href", f);
        e.setAttribute("class", l);
        document.body.appendChild(e)
    }

    function h() {
        var e = document.getElementsByClassName(l);
        for (var t = 0; t < e.length; t++) {
            document.body.removeChild(e[t])
        }
    }

    function p() {
        var e = document.createElement("div");
        e.setAttribute("class", a);
        document.body.appendChild(e);
        setTimeout(function() {
            document.body.removeChild(e)
        }, 100)
    }

    function d(e) {
        return {
            height: e.offsetHeight,
            width: e.offsetWidth
        }
    }

    function v(i) {
        var s = d(i);
        return s.height > e && s.height < n && s.width > t && s.width < r
    }

    function m(e) {
        var t = e;
        var n = 0;
        while (!!t) {
            n += t.offsetTop;
            t = t.offsetParent
        }
        return n
    }

    function g() {
        var e = document.documentElement;
        if (!!window.innerWidth) {
            return window.innerHeight
        } else if (e && !isNaN(e.clientHeight)) {
            return e.clientHeight
        }
        return 0
    }

    function y() {
        if (window.pageYOffset) {
            return window.pageYOffset
        }
        return Math.max(document.documentElement.scrollTop, document.body.scrollTop)
    }

    function E(e) {
        var t = m(e);
        return t >= w && t <= b + w
    }

    function S() {
        var e = document.createElement("audio");
        e.setAttribute("class", l);
        e.src = i;
        e.loop = false;
        e.addEventListener("canplay", function() {
            setTimeout(function() {
                x(k)
            }, 500);
            setTimeout(function() {
                N();
                p();
                for (var e = 0; e < O.length; e++) {
                    T(O[e])
                }
            }, 15500)
        }, true);
        e.addEventListener("ended", function() {
            N();
            h()
        }, true);
        e.innerHTML = " <p>If you are reading this, it is because your browser does not support the audio element. We recommend that you get a new browser.</p> <p>";
        document.body.appendChild(e);
        e.play()
    }

    function x(e) {
        e.className += " " + s + " " + o
    }

    function T(e) {
        e.className += " " + s + " " + u[Math.floor(Math.random() * u.length)]
    }

    function N() {
        var e = document.getElementsByClassName(s);
        var t = new RegExp("\\b" + s + "\\b");
        for (var n = 0; n < e.length;) {
            e[n].className = e[n].className.replace(t, "")
        }
    }
    var e = 30;
    var t = 30;
    var n = 350;
    var r = 350;
    var i = "./assets/images/harlem-shake.mp3";
    var s = "mw-harlem_shake_me";
    var o = "im_first";
    var u = ["im_drunk", "im_baked", "im_trippin", "im_blown"];
    var a = "mw-strobe_light";
    var f = "./assets/css/harlem-shake-style.css";
    var l = "mw_added_css";
    var b = g();
    var w = y();
    var C = document.getElementsByTagName("*");
    var k = null;
    for (var L = 0; L < C.length; L++) {
        var A = C[L];
        if (v(A)) {
            if (E(A)) {
                k = A;
                break
            }
        }
    }
    if (A === null) {
        console.warn("Could not find a node of the right size. Please try a different page.");
        return
    }
    c();
    S();
    var O = [];
    for (var L = 0; L < C.length; L++) {
        var A = C[L];
        if (v(A)) {
            O.push(A)
        }
    }
}