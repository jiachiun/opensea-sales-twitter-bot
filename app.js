const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const cache = require('./cache');

// Discord start
const Discord = require('discord.js');
import { TextChannel } from 'discord.js';




function buildMessage(sale) {
    return (
        new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(sale.asset.name + ' sold!')
            .setURL(sale.asset.permalink)
            .setAuthor('OpenSea Bot', 'https://files.readme.io/566c72b-opensea-logomark-full-colored.png', 'https://github.com/sbauch/opensea-discord-bot')
            .setThumbnail(sale.asset.collection.image_url)
            .addFields(
                { name: 'Name', value: sale.asset.name },
                { name: 'Amount', value: `${ethers.utils.formatEther(sale.total_price || '0')}${ethers.constants.EtherSymbol}` },
                { name: 'Buyer', value: sale?.winner_account?.address, },
                { name: 'Seller', value: sale?.seller?.address, }
            )
            .setImage(sale.asset.image_url)
            .setTimestamp(Date.parse(`${sale?.created_date}Z`))
            .setFooter('Sold on OpenSea', 'https://files.readme.io/566c72b-opensea-logomark-full-colored.png')
    );
}



const discordBot = new Discord.Client();
const sales_bot_channel; 

discordBot.on('ready', () => {
  console.log(`Logged in as ${discordBot.user.tag}!`);

  sales_bot_channel = await discordBot.channels.fetch(process.env.DISCORD_CHANNEL_ID);
});

discordBot.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }

  if (msg.content === "test") {
    sales_bot_channel.send('test successful!')
    .then(message => console.log(`Sent message: ${message.content}`))
    .catch(console.error);
  }
});

discordBot.login(process.env.DISCORD_BOT_TOKEN);

sales_bot_channel.send('hello!')
.then(message => console.log(`Sent message: ${message.content}`))
.catch(console.error);
// Discord end


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
