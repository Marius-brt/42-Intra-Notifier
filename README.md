<p align="center">
	<img src="https://raw.githubusercontent.com/Marius-brt/42-Intra-Notifier/2.0/logo.png"
		alt="Logo"
		style="height: 150px" />
</p>
<p align="center">
	<img alt="GitHub all releases" src="https://img.shields.io/github/downloads/Marius-brt/42-intra-notifier/total?style=flat-square">
	<img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/Marius-brt/42-intra-notifier?style=flat-square">
</p>

# Intra Notifier

Intra Notifier is a software that allows you to be notified when you have a new evaluation and also to have a reminder 15 minutes and 4 minutes before it.

<img src="https://raw.githubusercontent.com/Marius-brt/42-Intra-Notifier/2.0/app_screen.png"
		alt="Screen"
		style="width:100%;"/>

## Features

- Dark and Light theme
- Be notified when you have an evaluation
- Show stats on dashboard (level, grade, evaluation points)
- Easter Eggs (best feature I know)

## How to install ?

Go to [release](https://github.com/Marius-brt/42-Intra-Notifier/releases) and choose the latest version corresponding to the OS of your machine (I guess MacOS ?) and click on NAME_OF_VERSION.zip.

> **Google Chrome need to be installed** : If not, install it from the software on your Mac called "*Managed Software Center*".

## How to use it ?

You have to unzip the file then open Intra Notifier (in your download folder normally). Enter your Intra username and password then click on Login. You can minimize the application but do not click on the red cross. When you want to stop receiving notifications, just click close the app.

## How to add mobile notification ?

Mobile notifications are available in version 2.3.0 of Intra Notifier. They are a bit tricky to set up but you can follow this [tutorial](https://github.com/Marius-brt/42-Intra-Notifier/blob/2.0/mobile-notif.md).

## How it's working ?

In order to finish the project quickly, I decided to use [Electron](https://github.com/electron/electron) for its simplicity. For the scrapping I use [Puppeteer](https://github.com/puppeteer/puppeteer). It connects to your 42 account and get the auth cookies. Then, it makes HTTP requests with your cookies every 60 seconds to retrieve your data from the Intra using [Axios](https://github.com/axios/axios)(your cookies are not sent to us obviously). Then I use [Cheerio](https://github.com/cheeriojs/cheerio) to get the ratings in the html of the page. The username and password are stored locally on the computer using [Electron Store](https://github.com/sindresorhus/electron-store) (password is encrypted).

## About 

If you like the project, you can star this repository. If you find a bug or have an idea of a feature to add, you can say it in [Discussions](https://github.com/Marius-brt/42-Intra-Notifier/discussions) or in [Issues](https://github.com/Marius-brt/42-Intra-Notifier/issues)

