const builder = require("electron-builder")
const Platform = builder.Platform

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
	  appId: "mbrouty.intra.notifier",
	  icon: './logo_win.png'
  }
})