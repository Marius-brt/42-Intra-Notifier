const puppeteer = require('puppeteer')
const { app, BrowserWindow, ipcMain } = require('electron')
const notifier = require('node-notifier')
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
					notifier.notify({
						title: 'Intra Notifier',
						message: "Notifier started !",
						icon: path.join(__dirname, 'logo.png'),
						timeout: 2
					})
					check()
					interval = setInterval(check, 10000)
					win.webContents.send("started")
				}
				else
				{
					notifier.notify({
						title: 'Intra Notifier',
						message: "Error connection !",
						icon: path.join(__dirname, 'logo.png'),
						timeout: 5
					})
					await browser.close();
					win.webContents.send("stopped")
				}
			} else {
				notifier.notify({
					title: 'Intra Notifier',
					message: "Cannot find Google Chrome !",
					icon: path.join(__dirname, 'logo.png'),
					timeout: 5
				})
				win.webContents.send("stopped")
			}
		} else {
			notifier.notify({
				title: 'Intra Notifier',
				message: "Intra Notifier already started !",
				icon: path.join(__dirname, 'logo.png'),
				timeout: 5
			})
		}
	} else {
		notifier.notify({
			title: 'Intra Notifier',
			message: "Missing username or password !",
			icon: path.join(__dirname, 'logo.png'),
			timeout: 5
		})
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
		notifier.notify({
			title: 'Intra Notifier',
			message: `Intra Notifier stopped !`,
			icon: path.join(__dirname, 'logo.png'),
			timeout: 2
		})
	} else {
		notifier.notify({
			title: 'Intra Notifier',
			message: "Intra Notifier not started !",
			icon: path.join(__dirname, 'logo.png'),
			timeout: 5
		})
	}
})

async function check()
{
	await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
	let bodyHTML = await page.evaluate(() => document.body.innerHTML);
	const $ = cheerio.load(bodyHTML);
	var data = $('.project-item.reminder').map((i, el) => {
		return {
			id: $(el).attr("data-scale-team"),
			text: $(el).find('.project-item-text').text().replace(/[^\x20-\x7E]/g, ''),
			time: Date.parse($(el).find("span[data-long-date]").attr("data-long-date")),
			notified: false
		}
	}).get()
	data.forEach(el => {
		var date = new Date(el.time)
		if(evaluations[el.id]) {
			if(!evaluations[el.id].notified) {
				const today = new Date();
				const minutes = parseInt(Math.abs(date.getTime() - today.getTime()) / (1000 * 60) % 60);
				if(minutes <= 3) {
					if(el.text.startsWith("You will evaluate")) {
						notifier.notify({
							title: 'Remember',
							message: `You will evaluate someone in ${diffDate(date)}`,
							icon: path.join(__dirname, 'logo.png'),
							wait: true,
							actions: ['Close']
						})
					} else {
						notifier.notify({
							title: 'Remember',
							message: `You will be evaluated in ${diffDate(date)}`,
							icon: path.join(__dirname, 'logo.png'),
							wait: true,
							actions: ['Close']
						})
					}
				}
			}
		} else {
			if(el.text.startsWith("You will evaluate")) {
				notifier.notify({
					title: 'New evaluation !',
					message: `You will evaluate someone in ${diffDate(date)}`,
					icon: path.join(__dirname, 'logo.png'),
					timeout: 10
				})
			} else {
				notifier.notify({
					title: 'New evaluation !',
					message: `You will be evaluated in ${diffDate(date)}`,
					icon: path.join(__dirname, 'logo.png'),
					timeout: 10
				})
			}
			evaluations[el.id] = el
		}
	})
}

function diffDate(endDate) {
	const today = new Date();
	const hours = parseInt(Math.abs(endDate - today) / (1000 * 60 * 60) % 24);
	const minutes = parseInt(Math.abs(endDate.getTime() - today.getTime()) / (1000 * 60) % 60);
	return `${hours > 0 ? hours + " hours " : ""}${minutes > 0 ? minutes + " mins " : ""}`
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