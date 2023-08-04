const {Client, Events, GatewayIntentBits} = require('discord.js');
const config = require('./config.json');
const client = new Client({intents: [GatewayIntentBits.Guilds,
                                    GatewayIntentBits.GuildMessages,
                                    GatewayIntentBits.MessageContent]});

client.once(Events.ClientReady, () => {
    console.log('Ready!');
});

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    if (message.content.indexOf(config.prefix) !== 0) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    let player = args[0];
    let numberOfGames = args[1];
    let color = args[2];

    if (command === 'spy') {
        message.channel.send('Finding the opening move weaknesses of ' +
                            args[0] + '...');
        let lossMap = await score(player, numberOfGames, color);
        sortedMap = new Map([...lossMap.entries()].sort((a, b) => a[1] - b[1]).slice(0, 5));
        let resString = '';

        for (const [key, value] of sortedMap) {
            resString += (key +' Score: ' + value + '\n');
        }
        message.channel.send(resString);
    }

});

client.login(config.token);

function createQueryString(player, numberOfGames, colorQuery) {
    const url = new URL('https://lichess.org/api/games/user/'+ player +'?player=');
    let params = {
        player: player,
        pgnInJson: true,
        max: numberOfGames,
        color: colorQuery,
        opening: true
        };
    url.search = new URLSearchParams(params).toString();
    return url;
}

function stripSystemEmojis(input) {
    return input.replace(/[^\w.,\s]/g, '');
}

async function score(player, numberOfGames, color) {

    const lossMap = new Map;
    let games = 120;
    let colorQuery;

    if (typeof numberOfGames !== "undefined") {
        games = numberOfGames;
    }

    if (typeof color !== "undefined") {
        colorQuery = color;
    }

    let sanitizedUsername = stripSystemEmojis(player);

    if (!sanitizedUsername) {
        throw new Error("Invalid username");
    }

    let url = createQueryString(sanitizedUsername, games, colorQuery);

    let response = await fetch(url, {
        headers: {
            "Accept": "application/x-ndjson"
        }
    });

    let data = (await response.text()).match(/.+/g).map(JSON.parse);

    // For each game we are only interested in the pgn
    for (const [__, json] of Object.entries(data)) {
        for (const [key, value] of Object.entries(json).filter(([key]) => key == "pgn")) {

            // TODO: Look for libraries for handling pgn format in an elegant way.
            // The current solution splits our pgn on newline and process it as a list.

            let result = value.split(/\r?\n/);
            const gameMode = new RegExp("\\[Event \"(Rated|≤2000) (Bullet|Rapid|Blitz) game\"\\]")

            if (gameMode.test(result[0])) {
                let moveLength = result[result.length-4].indexOf(' 4.');
                let opening = result[result.length-7].slice(10, -2);
                var openingLine = opening + ' ' + result[result.length-4].substring(0, moveLength);
            } else {
                let moveLength = result[result.length-4].indexOf(' 4.');
                let opening = result[result.length-7].slice(10, -2);
                var openingLine = opening + ' ' + result[result.length-4].substring(0, moveLength);
            }

            if (isNaN(lossMap.get(openingLine))) {
                lossMap.set(openingLine, 0);
            }

            if ((result[3].includes(player) && result[5].includes('1-0'))|| //white wins
                result[4].includes(player) && result[5].includes('0-1')){ //black wins
                lossMap.set(openingLine, lossMap.get(openingLine) + 1);
            } else {
                lossMap.set(openingLine, lossMap.get(openingLine) - 1);
            }
        }
    }

    return lossMap;
}
