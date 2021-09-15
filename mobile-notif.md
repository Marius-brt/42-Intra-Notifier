# How to add mobile notification ?

1. First you need to create an [IFTTT](https://ifttt.com/home) account.
2. Click on CREATE button.
3. In "If this" choose "Webhook", then "Receive a web request". For the event name write ``eval`` and click on Create.
4. In "Then that" choose "Notifications", then "Send a notification from the IFTTT app". In the Message text box write ``{{Value1}}`` then click on Create
5. Click on Continue then Finish
6. You can now download the IFTTT app on your mobile
7. Open the Intra Notifier settings, enable mobile notifications
8. Then open this [link](https://ifttt.com/maker_webhooks/settings), copy the URL value below Connected As and enter it in Master Key in Intra Notifier. If everything is good, you should receive a notification to tell you that everything is working.
