const puppeteer = require('puppeteer-core')
const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const Store = require('electron-store')
const cheerio = require('cheerio')
const chromePaths = require('chrome-paths')
const path = require('path')

const store = new Store()

var browser
var win
var page
var interval = null

var evaluations = {}

app.whenReady().then(() => {
	createWindow()
})

function createWindow () {
	win = new BrowserWindow({
		width: 250,
		height: 340,
		autoHideMenuBar: true,
		fullscreenable: false,
		maximizable: false,
		icon: path.join(__dirname, 'logo.png'),
		webPreferences: {
			nativeWindowOpen: false,
			nodeIntegration: true,
			contextIsolation: false
		}
	})

	win.loadFile('./app/index.html')
	win.once('ready-to-show', () => {
		if (store.get('username') && store.get('password')) {
			win.webContents.send("data", {
				username: store.get('username'),
				password: store.get('password')
			})
		}
	})
}

ipcMain.on("start", async (event, args) => {
	store.set('username', args.username)
	store.set('password', args.password)
	if (store.get('username') && store.get('password')) {
		if(interval == null) {
			if(chromePaths.chrome) {
				win.webContents.send("starting")
				browser = await puppeteer.launch({ headless: true, executablePath: chromePaths.chrome })
				page = await browser.newPage()	
				await page.goto('https://signin.intra.42.fr/users/sign_in');
				await page.type('#user_login', store.get('username'));
				await page.type('#user_password', store.get('password'));
				await page.keyboard.press('Enter');
				await page.waitForNavigation();
				if (page.url() == "https://profile.intra.42.fr/")
				{
					notif('Intra Notifier', "Notifier started !", true)
					checkNotif()
					interval = setInterval(checkNotif, 60000)
					win.webContents.send("started")
				}
				else
				{
					notif('Intra Notifier', "Error connection !", true)
					await browser.close();
					win.webContents.send("stopped")
				}
			} else {
				notif('Intra Notifier', "Cannot find Google Chrome !", true)
				win.webContents.send("stopped")
			}
		} else {
			notif('Intra Notifier', "Intra Notifier already started !", true)
		}
	} else {
		notif('Intra Notifier', "Missing username or password !", true)
		win.webContents.send("stopped")
	}
})

ipcMain.on("stop", async (event, args) => {
	evaluations = {}
	if(browser) {
		win.webContents.send("stopping")
		browser.close();
		if(interval) {
			clearInterval(interval)
			interval = null
		}
		win.webContents.send("stopped")
		notif('Intra Notifier', "Intra Notifier stopped !", true)
	} else {
		notif('Intra Notifier', "Intra Notifier not started !", true)
	}
})

async function checkNotif() {
	await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
	let bodyHTML = await page.evaluate(() => document.body.innerHTML);
	const $ = cheerio.load(bodyHTML)
	var data = $('.project-item.reminder').map((i, el) => {
		return {
			id: $(el).attr("data-scale-team"),
			text: $(el).find('.project-item-text').text().replace(/[^\x20-\x7E]/g, ''),
			time: Date.parse($(el).find("span[data-long-date]").attr("data-long-date")),
			first_notif: false,
			last_notif: false,
			new_notif: false,
			username: $(el).find("a[data-user-link]").attr("data-user-link"),
			url: $(el).find("a[data-user-link]").attr("href"),
			place: ''
		}
	}).get()
	data.forEach(async (el, index) => {
		var url = 'profile'
		await setTimeout(async () => {
			var date = new Date(el.time)
			const today = new Date();
			const minutes = parseInt(Math.abs(date.getTime() - today.getTime()) / (1000 * 60) % 60);
			if(!evaluations[el.id]) {
				evaluations[el.id] = el
			}
			if(!evaluations[el.id].first_notif && minutes <= 15) {
				if(el.text.startsWith("You will evaluate")) {
					await page.goto(el.url)
					const placeHtml = await page.evaluate(() => document.body.innerHTML)
					const p = cheerio.load(placeHtml)
					el.place = p('.user-poste-infos').text().split('.', 1)[0]
					url = 'user'
				}
				evaluations[el.id] = el
				evaluations[el.id].first_notif = true
				if(el.text.startsWith("You will evaluate")) {
					notif('Intra Notifier: Remember !', `You will evaluate ${el.username} in ${diffDate(date)}`, false, parsePlace(el.place))
				} else {
					notif('Intra Notifier: Remember !', `You will be evaluated by ${el.username} in ${diffDate(date)}`, false)
				}
			}
			if(!evaluations[el.id].last_notif && minutes <= 4) {
				evaluations[el.id] = el
				evaluations[el.id].last_notif = true
				if(el.text.startsWith("You will evaluate")) {
					notif('Intra Notifier: Remember !', `You will evaluate ${el.username} in ${diffDate(date)}`, false, parsePlace(el.place))
				} else {
					notif('Intra Notifier: Remember !', `You will be evaluated by ${el.username} in ${diffDate(date)}`, false)
				}
			}
			if(!evaluations[el.id].new_notif) {
				evaluations[el.id].new_notif = true;
				if(el.text.startsWith("You will evaluate")) {
					notif("Intra Notifier: New evaluation !", `You will evaluate someone in ${diffDate(date)}`, false)
				} else {
					notif("Intra Notifier: New evaluation !", `You will be evaluated in ${diffDate(date)}`, false)
				}
			}
		}, 5000 * index)
		if(url != 'profile') {
			await page.goto("https://profile.intra.42.fr/")
		}
	})	
}

function diffDate(endDate) {
	const today = new Date();
	const hours = parseInt(Math.abs(endDate - today) / (1000 * 60 * 60) % 24);
	const minutes = parseInt(Math.abs(endDate.getTime() - today.getTime()) / (1000 * 60) % 60);
	return `${hours > 0 ? hours + " hours " : ""}${minutes > 0 ? minutes + " mins " : ""}`
}

function notif(title, description, timeout = true, body = '') {
	const options = {
		title: title,
		subtitle: description,
		body,
		silent: true,
		timeoutType: timeout ? 'default' : 'never'
	}
	new Notification(options).show()
}

function parsePlace(place)
{
	place = place.replace(/[^0-9]/g, '').split('')
	if(parseInt(place[0]) <= 2) {
		return `top ${(parseInt(place[0]) == 1) ? 'right' : 'left'}, row ${place[1]}, place ${place[2]}`
	} else {
		return `bottom ${(parseInt(place[0]) == 3) ? 'right' : 'left'}, row ${place[1]}, place ${place[2]}`
	}
}