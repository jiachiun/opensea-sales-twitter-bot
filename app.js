const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const cache = require('./cache');
const Discord = require('discord.js');
require("./ExtendedMessage");


function buildMessageSale(sale) {
    const buyer_name = sale?.winner_account?.user?.username? sale?.winner_account?.user?.username : sale?.winner_account?.address;
    const seller_name = sale?.seller?.user?.username? sale?.seller?.user?.username : sale?.seller?.address;
    const amount = ethers.utils.formatEther(sale.total_price || '0');

    return (
        new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(sale.asset.name + ' was purchased for ' + amount + ' ETH')
            .setURL(sale.asset.permalink)
            // .setAuthor('OpenSea Bot', 'https://files.readme.io/566c72b-opensea-logomark-full-colored.png', 'https://github.com/sbauch/opensea-discord-bot')
            // .setThumbnail(sale.asset.collection.image_url)
            .addFields(
                { name: 'Name', value: sale.asset.name },
                { name: 'Amount', value: `${amount}${ethers.constants.EtherSymbol}` },
                { name: 'From', value: `[${seller_name}](https://opensea.io/${seller_name})`, inline: true },
                { name: 'To', value: `[${buyer_name}](https://opensea.io/${buyer_name})`, inline: true }
            )
            .setImage(sale.asset.image_url)
            .setTimestamp(Date.parse(`${sale?.created_date}Z`))
            .setFooter('Purchased on OpenSea',)
    );
}

const discordBot = new Discord.Client();
var sales_bot_channel;

discordBot.on('ready', () => {
    console.log(`Logged in as ${discordBot.user.tag}!`);

    sales_bot_channel = discordBot.channels.cache.get(process.env.DISCORD_CHANNEL_ID_SALES_BOT);

    sales_bot_channel.send("hello world")
        .then(message => console.log(`Sent message: ${message.content}`))
        .catch(console.error);
});

discordBot.on('message', msg => {

    if (msg.content === "!commands" ) {
        showCommands(msg);
    }

    if (msg.content === "!sale" ) {
        showRecentSales(msg, 1);
    }

    if (msg.content === "!sales" ) {
        showRecentSales(msg, 3);
    }

    if (msg.content === "!joke" ) {
        showJoke(msg);
    }

    if (msg.content === "!walladen" || msg.content === "!den" ) {
        showDen(msg);
    }

    if (msg.content === "!roadmap" ) {
        showRoadmap(msg);
    }

    if (msg.content === "!rarity" ) {
        showRarity(msg);
    }
});


// Login to Discord Bot
discordBot.login(process.env.DISCORD_BOT_TOKEN);

function showCommands(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('KIA Bot Commands')
        .setThumbnail('https://den.koalaintelligence.agency/assets/logo.png')
        .addFields(
            { name: 'Walla Den :link:', value: '`!den`' },
            { name: 'KIA\'s Roadmap :map:', value: '`!roadmap`' },
            { name: 'Rarity :star2:', value: '`!rarity`' },
            { name: 'KNet :globe_with_meridians:', value: '`!knet`' },
            { name: 'Show last sale :shopping_cart:', value: '`!sale`' },
            { name: 'Show last 3 sales :shopping_cart:', value: '`!sales`' },
            { name: 'Get a joke :laughing:', value: '`!joke`' },
            { name: 'See list of commands :robot:', value: '`!commands`' },
        );

    message.channel.send(msg);
}


function showKNet(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Rarity - Koala Intelligence Agency')
        .setURL('https://knet.koalaintelligence.agency/')
        .setDescription(`Koala Network Application. Participate in Geocache missions and win rewards!\n\n[:link: Visit KNet](https://knet.koalaintelligence.agency/)`)
        .setImage('https://lh3.googleusercontent.com/0xJn2cxCsaQro2dinw-6iZo8ZOcbB8hw7XNBB3vcYWGEa2gfhYcc2-zfLwb4srozEWuO3RRjOqVxA3C3JHc9jgSlgzpWwFQ4d8EPig=s2500');
    message.channel.send(msg);
}

function showRarity(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Rarity - Koala Intelligence Agency')
        .setURL('https://rarity.tools/koala-intelligence-agency')
        .setDescription(`Check out the official ranking by Rarity.\n\n[:link: Visit Rarity](https://rarity.tools/koala-intelligence-agency)`)
        .setImage('https://lh3.googleusercontent.com/0xJn2cxCsaQro2dinw-6iZo8ZOcbB8hw7XNBB3vcYWGEa2gfhYcc2-zfLwb4srozEWuO3RRjOqVxA3C3JHc9jgSlgzpWwFQ4d8EPig=s2500');
    message.channel.send(msg);
}

function showRoadmap(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Roadmap')
        .setURL('https://hackmd.io/@sJX7GMieToGIMmb_nnCnFQ/kia-v2')
        .setDescription(`Learn more about KIA's Roadmap V2.\n\n[:link: Visit Roadmap V2](https://hackmd.io/@sJX7GMieToGIMmb_nnCnFQ/kia-v2)`)
        .setImage('https://pbs.twimg.com/media/FAYj6T0VcAEEcns?format=jpg&name=4096x4096');
    message.channel.send(msg);
}

function showDen(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Walla Den')
        .setURL('https://den.koalaintelligence.agency/')
        .setDescription(`The ability to slip by unnoticed in the heat of the moment is key to the success of a K.I.A Agent. Recent field research has confirmed that high levels of incognito are essential for deep cover Agents to successfully complete their missions.\n\nK.I.A HQ has developed the next tier of covert intelligence support; The Walla Den, a new tool in the arsenal of a K.I.A Agent, allowing for swift adjustments to their disguise so Agents can remain concealed from enemy eyes.\n\n[:link: Visit Walla Den](https://den.koalaintelligence.agency/)`)
        .setImage('https://images-ext-2.discordapp.net/external/FB1rnCZb-E4mIUPgTURL25k-IsS5GjeHudy3Rn7hQcA/%3Fv%3D43e1c618/https/koalaintelligence.agency/assets/images/image07.jpg?width=1082&height=676');
    message.channel.send(msg);
}

function showJoke(message) {
    axios.get('https://v2.jokeapi.dev/joke/Any', {
        params: {
            type: "twopart"
        }
    })
    .then((response) => {
        const setup = _.get(response, ['data', 'setup']);
        const delivery = _.get(response, ['data', 'delivery']);
        
        message.channel.send(setup).then( sent => {
            setTimeout(() => {
                sent.inlineReply(delivery);
            }, 15000);
        });
    })
    .catch((error) => {
        console.error(error);
    });
}

function showRecentSales(message, limit = 1) {

    axios.get('https://api.opensea.io/api/v1/events', {
        params: {
            collection_slug: "koala-intelligence-agency",
            event_type: 'successful',
            limit: limit,
            only_opensea: 'false'
        }
    })
    .then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');
            return new Date(created);
        })

        _.each(sortedEvents, (event) => {
            const msg = buildMessageSale(event);
            message.reply(msg);
            return;
        });
    })
    .catch((error) => {
        console.error(error);
    });

}


// Format tweet text
function formatAndSendTweet(event, twitterClient, customMessage = "") {
    // Handle both individual items + bundle sales
    const assetName = _.get(event, ['asset', 'name'], _.get(event, ['asset_bundle', 'name']));
    const openseaLink = _.get(event, ['asset', 'permalink'], _.get(event, ['asset_bundle', 'permalink']));

    const totalPrice = _.get(event, 'total_price');

    const tokenDecimals = _.get(event, ['payment_token', 'decimals']);
    const tokenUsdPrice = _.get(event, ['payment_token', 'usd_price']);
    const tokenEthPrice = _.get(event, ['payment_token', 'eth_price']);

    const formattedUnits = ethers.utils.formatUnits(totalPrice, tokenDecimals);
    const formattedEthPrice = formattedUnits * tokenEthPrice;
    const formattedUsdPrice = formattedUnits * tokenUsdPrice;

    const tweetText = `${assetName} bought for ${formattedEthPrice}${ethers.constants.EtherSymbol} ($${Number(formattedUsdPrice).toFixed(2)}) ${customMessage} ${openseaLink}`;

    console.log(tweetText);

    // OPTIONAL PREFERENCE - don't tweet out sales below X ETH (default is 1 ETH - change to what you prefer)
    // if (Number(formattedEthPrice) < 1) {
    //     console.log(`${assetName} sold below tweet price (${formattedEthPrice} ETH).`);
    //     return;
    // }

    // OPTIONAL PREFERENCE - if you want the tweet to include an attached image instead of just text
    const imageUrl = _.get(event, ['asset', 'image_url']);
    return tweet.tweetWithImage(twitterClient, tweetText, imageUrl);

    // return tweet.tweet(twitterClient, tweetText);
}


// Poll OpenSea every 60 seconds & retrieve all sales for a given collection in either the time since the last sale OR in the last minute
// FOR KIA
setInterval(() => {
    const lastSaleTime = cache.get('lastSaleTime', null) || moment().startOf('minute').subtract(59, "seconds").unix();

    console.log(`Last sale (in seconds since Unix epoch): ${cache.get('lastSaleTime', null)}`);

    axios.get('https://api.opensea.io/api/v1/events', {
        params: {
            // collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
            collection_slug: "koala-intelligence-agency",
            event_type: 'successful',
            occurred_after: lastSaleTime,
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })

        console.log(`[KIA] ${events.length} sales since the last one...`);

        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');

            cache.set('lastSaleTime', moment(created).unix());

            const message = buildMessageSale(event);
            sales_bot_channel.send(message);
            // formatAndSendTweet(event, "KIA", "🐨 #HugLife #NFT");
            // formatAndSendTweet(event, "KIA2", "🐨 #HugLife #NFT");
            return;
        });
    }).catch((error) => {
        console.error(error);
    });
}, 60000);

// FOR CYBERHORNETS
// setInterval(() => {
//     const lastSaleTime = cache.get('lastSaleTime', null) || moment().startOf('minute').subtract(59, "seconds").unix();

//     console.log(`Last sale (in seconds since Unix epoch): ${cache.get('lastSaleTime', null)}`);

//     axios.get('https://api.opensea.io/api/v1/events', {
//         params: {
//             // collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
//             collection_slug: "cyber-hornets-colony-club",
//             event_type: 'successful',
//             occurred_after: lastSaleTime,
//             only_opensea: 'false'
//         }
//     }).then((response) => {
//         const events = _.get(response, ['data', 'asset_events']);

//         const sortedEvents = _.sortBy(events, function(event) {
//             const created = _.get(event, 'created_date');

//             return new Date(created);
//         })

//         console.log(`[CyberHornets] ${events.length} sales since the last one...`);

//         _.each(sortedEvents, (event) => {
//             const created = _.get(event, 'created_date');

//             cache.set('lastSaleTime', moment(created).unix());

//             return formatAndSendTweet(event, "CYBERHORNETS" , "#CyberHornets #TheSwarm");
//         });
//     }).catch((error) => {
//         console.error(error);
//     });
// }, 60000);
