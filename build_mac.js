const builder = require("electron-builder")
const Platform = builder.Platform

builder.build({
  targets: Platform.MAC.createTarget(),
  config: {
	  appId: "mbrouty.intra.notifier",
	  icon: './logo.png'
  }
})