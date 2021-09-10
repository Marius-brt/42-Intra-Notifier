const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const puppeteer = require('puppeteer-core')
const chrome = require('chrome-paths')
const axios = require('axios')
const Store = require('electron-store')
const cheerio = require('cheerio')
const crypto = require('./src/crypto')
const store = new Store()

app.commandLine.appendSwitch("enable-transparent-visuals")
app.on('ready', () => {
	setTimeout(
		spawnWindow,
		process.platform == "linux" ? 1000 : 0
	)
})

var cookies = null
var cookieString = ''
var evaluations = {}

function spawnWindow(){
	win = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		titleBarStyle: 'hidden',
		//frame: false,
		show: false,
		webPreferences: {
			nativeWindowOpen: false,
			nodeIntegration: true,
            contextIsolation: false
		}
	})
	win.setMenu(null)
	win.loadFile('./app/index.html')
	//win.loadURL("http://127.0.0.1:5500/app/index.html")
	win.once('ready-to-show', async () => {
		win.show()
		if(store.get('username') && store.get('password')) {
			win.webContents.send("init_data", {
				username: store.get("username"),
				password: store.get("password")
			})
			win.webContents.send("try_login")
			if(await getCookies()) {
				win.webContents.send("user_data", await getUserData())
			} else {
				win.webContents.send("failed_login")
			}
		}
	})
}

async function getUserData() {
	var html = await request("https://profile.intra.42.fr/")
	var $ = cheerio.load(html)
	var data = $('body').map((i, el) => {
		return {
			login: $(el).find(".login[data-login]").attr("data-login"),
			name: parseString($(el).find("span.name > span").text()),
			points: parseInt($(el).find("span.user-correction-point-value").children().first().text()),
			grade: parseString($(el).find('.user-grade-value').text()),
			level: parseInt($(el).find(".on-progress").text().replace(/[^0-9]/g, '').split('')[0])
		}
	}).get()
	/*var evals = $('.project-item.reminder').map((i, el) => {
		return {
			id: $(el).attr("data-scale-team"),
			text: $(el).find('.project-item-text').text().replace(/[^\x20-\x7E]/g, ''),
			time: Date.parse($(el).find("span[data-long-date]").attr("data-long-date")),
			first_notif: false,
			last_notif: false,
			new_notif: false,
			username: $(el).find("a[data-user-link]").attr("data-user-link"),
			url: $(el).find("a[data-user-link]").attr("href"),
			place: '',
			image: ''
		}
	}).get()*/
	var evals = [
        {
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
	await checkNotif(evals)
	return {
		user_data: data[0],
		evaluations
	}
}

async function getCookies() {
	const browser = await puppeteer.launch({ headless: true, executablePath: chrome.chrome })
	const page = await browser.newPage()	
	await page.goto('https://signin.intra.42.fr/users/sign_in')
	await page.type('#user_login', store.get('username'))
	await page.type('#user_password', store.get('password'))
	await page.keyboard.press('Enter')
	await page.waitForNavigation()
	if (page.url() == "https://profile.intra.42.fr/") {
		win.webContents.send("logged")
		cookies = await page._client.send('Network.getAllCookies')
		var cookiesTmp = []
		cookies.cookies.forEach(el => {	
			cookiesTmp.push(`${el.name}=${el.value}`)
		})
		cookieString = cookiesTmp.join('; ')
		browser.close()
		return true
	} else {
		win.webContents.send("failed_login")
		browser.close()
		return false
	}
}

async function request(url) {
	if(cookies) {
		let data
		await axios({
			method: 'get',
			url: url,
			headers: { 
			  'Cookie': cookieString
			}
		}).then(response => {
			data = response.data
		}).catch(error => {
			console.log(error)
		})
		return data
	} else {
		return ""
	}
}

async function checkNotif(evals) {
	for (const el of evals) {
		if(evaluations[el.id] == undefined) {
			evaluations[el.id] = el
			if(el.url != undefined && el.username != undefined) {
				var userHtml = await request(el.url)
				var p = cheerio.load(userHtml)
				evaluations[el.id].place = parseString(p('.user-poste-infos').text().split('.', 1)[0])
				evaluations[el.id].image = p('.bg-image-item.profile-image').attr("style")
			}
		} else {
			if(evaluations[el.id].url == undefined && el.url != undefined && el.username != undefined) {
				evaluations[el.id].url = el.url
				evaluations[el.id].username = el.username
				var userHtml = await request(el.url)
				var p = cheerio.load(userHtml)
				evaluations[el.id].place = parseString(p('.user-poste-infos').text().split('.', 1)[0])
				evaluations[el.id].image = p('.bg-image-item.profile-image').attr("style")
			}
		}
	}
	/*Remove passed eval if not in eval object*/
	for (const [key, value] of Object.entries(evaluations)) {
		if(!evals.some((el) => {
			return el.id === key;
		})) {
			delete evaluations[key]
		}
	}
	evalNotif()
}

function evalNotif() {
	var evals = Object.values(evaluations).sort((a,b) => {
		return new Date(a.time) - new Date(b.time)
	})
	evals.forEach((el, i) => {
		const endDate = new Date(el.time)
		const now = new Date()
		if(endDate - now > 0) {
			setTimeout(() => {
				const diff = getDiff(endDate)
				var options = {
					silent: true,
					timeoutType: 'never'
				}
				if(!el.first_notif && diff.minutes < 14 && diff.hours == 0) {
					Object.keys(evaluations)[i].new_notif = true
					Object.keys(evaluations)[i].first_notif = true
					Object.keys(evaluations)[i].last_notif = true
					options.title = "Intra Notifier: last"
					if(el.text.startsWith("You will evaluate")) {
						options.subtitle = `You will evaluate someone in ${diffDate(endDate)}`
					} else {
						options.subtitle = `You will be evaluated in ${diffDate(endDate)}`
					}
				}
				if(!el.last_notif && diff.minutes <= 14 && diff.hours == 0) {
					Object.keys(evaluations)[i].new_notif = true
					Object.keys(evaluations)[i].first_notif = true
					options.title = "Intra Notifier: first"
					if(el.text.startsWith("You will evaluate")) {
						options.subtitle = `You will evaluate someone in ${diffDate(endDate)}`
					} else {
						options.subtitle = `You will be evaluated in ${diffDate(endDate)}`
					}
				}
				if(!el.new_notif && ((diff.minutes > 14 && diff.hours == 0) || diff.hours > 0)) {
					Object.keys(evaluations)[i].new_notif = true
					options.title = "Intra Notifier: New evaluation !"
					if(el.text.startsWith("You will evaluate")) {
						options.subtitle = `You will evaluate someone in ${diffDate(endDate)}`
					} else {
						options.subtitle = `You will be evaluated in ${diffDate(endDate)}`
					}
				}
				new Notification(options).show()
			}, i * 5000)
		}
	})
}

function parseString(str) {
	return str.replace(/[^\x20-\x7E]/g, '').trim()
}

function getDiff(endDate) {
	const today = new Date()
	var seconds = Math.floor((endDate - today)/1000)
	var minutes = Math.floor(seconds/60)
	var hours = Math.floor(minutes/60)
	var days = Math.floor(hours/24)
	hours = hours-(days*24)
	minutes = minutes-(days*24*60)-(hours*60)
	seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60)
	return {
		seconds,
		minutes,
		hours
	}
}

function diffDate(endDate) {
	const today = new Date()
	const time = getDiff(endDate)
	if(endDate - today < 0)
	{
		return `few seconds`
	} else {
		if(time.hours > 0 || time.minutes > 0) {
			return `${time.hours > 0 ? time.hours + " hours " : ""}${time.minutes > 0 ? time.minutes + " mins " : ""}`
		} else {
			return `${time.seconds} secs`
		}
	}
}