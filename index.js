const { app, BrowserWindow, ipcMain, Menu, Notification } = require('electron')
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

const menuTemplate = [{
    label: "File",
    submenu: [{ role: 'quit' }]
}];


var cookies = null
var cookieString = ''
var evaluations = {}
var win = null
var interval = null
var password, username
var titles = [
    '🦖 Rwwrwwwr !',
    "Beep beep boop 🤖",
    "Hey! Did you remember?",
    'Just a little reminder',
    "🚨 Warning !! No I'm kidding.",
    "Hey! Don't forget!",
    "I hope you remember it!",
    "I offer you this notif 🎁",
    "Waaaawww 🏄‍♂️",
    "You been hacked ! No just a reminder 😹",
    "Are u alive ?",
    "42 is life's answer?",
    "You have some work!"
]

var newTitles = [
    'New evaluation! Well done!',
    'Tiene una nueva evaluación',
    'A new evaluation has arrived 📨'
]

function spawnWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 700,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        show: false,
        minWidth: 800,
        minHeight: 700,
        maxHeight: 1000,
        maxWidth: 1400,
        maximizable: false,
        webPreferences: {
            nativeWindowOpen: false,
            nodeIntegration: true,
            enableBlinkFeatures: "CSSColorSchemeUARendering",
            contextIsolation: false,
            devTools: false
        }
    })
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    win.loadFile('./app/index.html')
    win.once('ready-to-show', async() => {
        win.show()
        win.webContents.send("version", app.getVersion())
        if (store.get('username') && store.get('password')) {
            win.webContents.send("init_data", {
                username: store.get("username"),
                password: crypto.decrypt(store.get("password"))
            })
            username = store.get("username")
            password = crypto.decrypt(store.get("password"))
            win.webContents.send("try_login")
            if (await getCookies()) {
                await win.webContents.send("user_data", await getUserData())
                win.webContents.send("logged")
                interval = setInterval(async() => {
                    win.webContents.send("user_data", await getUserData())
                }, 60000)
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
            image: $(el).find('.user-profile-picture').attr("style"),
            login: $(el).find(".login[data-login]").attr("data-login"),
            name: parseString($(el).find("span.name > span").text()),
            points: parseInt($(el).find("span.user-correction-point-value").children().first().text()),
            grade: parseString($(el).find('.user-grade-value').text()),
            level: parseInt($(el).find(".on-progress").text().replace(/[^0-9]/g, '').split('')[0])
        }
    }).get()
    var evals = $('.project-item.reminder').map((i, el) => {
        var text = $(el).find('.project-item-text').text().replace(/[^\x20-\x7E]/g, '')
        var html = ''
        if (text.includes('by ')) {
            var spl1 = text.split('by ')
            var spl2 = spl1[1].split(' on')
            spl2[0] = `<span class="evaluator"  onclick='require("electron").shell.openExternal("https://profile.intra.42.fr/users/${spl2[0]}")'>${spl2[0]}</span>`
            html = spl1[0] + spl2.join('')
        } else {
            html = text
        }
        return {
            id: $(el).attr("data-scale-team"),
            text,
            time: Date.parse($(el).find("span[data-long-date]").attr("data-long-date")),
            first_notif: false,
            last_notif: false,
            new_notif: false,
            username: $(el).find("a[data-user-link]").attr("data-user-link"),
            url: $(el).find("a[data-user-link]").attr("href"),
            place: '',
            image: '',
            html
        }
    }).get()
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
    await page.type('#user_login', username)
    await page.type('#user_password', password)
    await page.keyboard.press('Enter')
    await page.waitForNavigation()
    if (page.url() == "https://profile.intra.42.fr/") {
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
    if (cookies) {
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
        if (evaluations[el.id] == undefined) {
            evaluations[el.id] = el
            if (el.url != undefined && el.username != undefined) {
                var userHtml = await request(el.url)
                var p = cheerio.load(userHtml)
                evaluations[el.id].place = parseString(p('.user-poste-infos').text().split('.', 1)[0])
                evaluations[el.id].image = p('.bg-image-item.profile-image').attr("style")
            }
        } else {
            if (evaluations[el.id].url == undefined && el.url != undefined && el.username != undefined) {
                evaluations[el.id].url = el.url
                evaluations[el.id].username = el.username
                var userHtml = await request(el.url)
                var p = cheerio.load(userHtml)
                evaluations[el.id].place = parseString(p('.user-poste-infos').text().split('.', 1)[0])
                evaluations[el.id].image = p('.bg-image-item.profile-image').attr("style")
            }
        }
    }
    for (const [key, value] of Object.entries(evaluations)) {
        if (!evals.some((el) => {
                return el.id === key;
            })) {
            delete evaluations[key]
        }
    }
    evalNotif()
}

function evalNotif() {
    var evals = Object.values(evaluations).sort((a, b) => {
        return new Date(a.time) - new Date(b.time)
    })
    evals.forEach((el, i) => {
        const endDate = new Date(el.time)
        const now = new Date()
        if (endDate - now > 0) {
            setTimeout(() => {
                const diff = getDiff(endDate)
                var options = {
                    silent: true,
                    timeoutType: 'never'
                }
                if (diff.hours == 0 && diff.days == 0) {
                    if (!el.last_notif && diff.minutes < 4) {
                        evaluations[el.id].new_notif = true
                        evaluations[el.id].first_notif = true
                        evaluations[el.id].last_notif = true
                        options.title = titles[Math.floor(Math.random() * titles.length)]
                        if (el.text.startsWith("You will evaluate")) {
                            options.subtitle = `You will evaluate ${el.username} in ${diffDate(endDate)}`
                            options.body = `place: ${el.place}`
                        } else {
                            options.subtitle = `You will be evaluated by ${el.username} in ${diffDate(endDate)}`
                        }
                        new Notification(options).show()
                    }
                    if (!el.first_notif && diff.minutes >= 4 && diff.minutes <= 14) {
                        evaluations[el.id].new_notif = true
                        evaluations[el.id].first_notif = true
                        options.title = titles[Math.floor(Math.random() * titles.length)]
                        if (el.text.startsWith("You will evaluate")) {
                            options.subtitle = `You will evaluate ${el.username} in ${diffDate(endDate)}`
                            options.body = `place: ${el.place}`
                        } else {
                            options.subtitle = `You will be evaluated by ${el.username} in ${diffDate(endDate)}`
                        }
                        new Notification(options).show()
                    }
                }
                if (!el.new_notif && ((diff.minutes > 14 && diff.hours == 0) || diff.hours > 0 || diff.days > 0)) {
                    evaluations[el.id].new_notif = true
                    options.title = newTitles[Math.floor(Math.random() * newTitles.length)]
                    if (el.text.startsWith("You will evaluate")) {
                        options.subtitle = `You will evaluate someone in ${diffDate(endDate)}`
                    } else {
                        options.subtitle = `You will be evaluated in ${diffDate(endDate)}`
                    }
                    new Notification(options).show()
                }
            }, i * 5000)
        }
    })
}

ipcMain.on("login", async(event, args) => {
    if (args.username != '' && args.password != '') {
        win.webContents.send("try_login")
        if (args.save) {
            store.set('username', args.username)
            store.set('password', crypto.encrypt(args.password))
        }
        username = args.username
        password = args.password
        if (await getCookies()) {
            await win.webContents.send("user_data", await getUserData())
            win.webContents.send("logged")
            interval = setInterval(async() => {
                win.webContents.send("user_data", await getUserData())
            }, 60000)
        } else {
            store.delete('username')
            store.delete('password')
            win.webContents.send("failed_login")
        }
    }
})

ipcMain.on("logout", async(event, args) => {
    if (store.get('username') && store.get('password')) {
        clearInterval(interval)
        username = ''
        password = ''
        cookieString = ''
        store.delete('username')
        store.delete('password')
    }
})

function parseString(str) {
    return str.replace(/[^\x20-\x7E]/g, '').trim()
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
        return `few seconds`
    } else {
        if (time.hours > 0 || time.minutes > 0 || time.days > 0) {
            return `${time.days > 0 ? time.days + " days " : ""}${time.hours > 0 ? twoDigits(time.hours) + " hours " : ""}${time.minutes > 0 ? twoDigits(time.minutes) + " mins " : ""}`
        } else {
            return `${time.seconds} secs`
        }
    }
}

function twoDigits(nb) {
    return ("0" + nb).slice(-2)
}