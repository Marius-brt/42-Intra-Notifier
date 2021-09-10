const electron = require('electron')
const puppeteer = require('puppeteer-core')
const chrome = require('chrome-paths')
const axios = require('axios')
const Store = require('electron-store')
const cheerio = require('cheerio')
const crypto = require('./src/crypto')
const store = new Store()

electron.app.commandLine.appendSwitch("enable-transparent-visuals")
electron.app.on('ready', () => {
	setTimeout(
		spawnWindow,
		process.platform == "linux" ? 1000 : 0
	)
})

var cookies = null
var cookieString = ''

function spawnWindow(){
	win = new electron.BrowserWindow({
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
	return data[0]
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

function parseString(str) {
	return str.replace(/[^\x20-\x7E]/g, '').trim()
}