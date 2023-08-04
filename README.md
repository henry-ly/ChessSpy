# ChessSpy
A simple Discord Bot that collects a users recent games using the lichess REST API and displays the openings with the worst results.

![example](https://github.com/henry-ly/ChessSpy/blob/master/recording.gif)

## Installation
Installation will require a bot user and a config.json file in the following format:

```json
{
	"clientId": <client id>,
	"guildId": <guild id>,
	"token": <bot token>,
	"prefix": "!"
}
```

See [Discord Bot Tutorial](https://discord.com/developers/docs/getting-started) for more information.
After setting up the bot and inviting it to a Discord Server, proceed with the following:
```sh
npm install
node index.js
```
