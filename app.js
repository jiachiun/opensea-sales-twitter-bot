const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const cache = require('./cache');
const Discord = require('discord.js');
require("./ExtendedMessage");
require('./discord-helper');



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

    if (msg.content === "!commands" || msg.content === "!command" ) {
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

    if (msg.content === "!knet" ) {
        showKNet(msg);
    }
});


// Login to Discord Bot
discordBot.login(process.env.DISCORD_BOT_TOKEN);



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
// setInterval(() => {
//     const lastSaleTime = cache.get('lastSaleTime', null) || moment().startOf('minute').subtract(59, "seconds").unix();

//     console.log(`Last sale (in seconds since Unix epoch): ${cache.get('lastSaleTime', null)}`);

//     axios.get('https://api.opensea.io/api/v1/events', {
//         params: {
//             // collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
//             collection_slug: "koala-intelligence-agency",
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

//         console.log(`[KIA] ${events.length} sales since the last one...`);

//         _.each(sortedEvents, (event) => {
//             const created = _.get(event, 'created_date');

//             cache.set('lastSaleTime', moment(created).unix());

//             const message = buildMessageSale(event);
//             sales_bot_channel.send(message);
//             // formatAndSendTweet(event, "KIA", "🐨 #HugLife #NFT");
//             // formatAndSendTweet(event, "KIA2", "🐨 #HugLife #NFT");
//             return;
//         });
//     }).catch((error) => {
//         console.error(error);
//     });
// }, 60000);

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
