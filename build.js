const builder = require("electron-builder")
const Platform = builder.Platform

// Promise is returned
builder.build({
  targets: Platform.MAC.createTarget(),
  config: {
	  appId: "mbrouty.intra.notifier",
	  icon: './logo.png'
  }
}).then()