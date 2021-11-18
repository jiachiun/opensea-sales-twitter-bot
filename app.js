const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const cache = require('./cache');
const Discord = require('discord.js');
require("./ExtendedMessage");
require('./discord-helper');



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

function showCommands(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('KIA Bot Commands')
        .setThumbnail('https://den.koalaintelligence.agency/assets/logo.png')
        .addFields(
            { name: '\u200B', value: '──────── INFO ────────' },
            { name: 'Walla Den', value: ':link: `!den`' },
            { name: 'KIA\'s Roadmap', value: ':map: `!roadmap`' },
            { name: 'Rarity Tools', value: ':star2: `!rarity`' },
            { name: 'KNet', value: ':globe_with_meridians: `!knet`' },
            { name: 'Links', value: ':link: `!links`' },
            { name: '\u200B', value: '──────── SALES ────────' },
            { name: 'Show the Latest Sale', value: ':shopping_cart: `!sale`' },
            { name: 'Show Last 3 Sales', value: ':shopping_cart: `!sales`' },
            { name: 'Get Project Stats', value: ':bar_chart: `!sales`' },
            { name: 'Get the Floor Price', value: ':heavy_dollar_sign: `!sales`' },
            { name: 'Get the current Price for ETH', value: ':chart: `!eth`' },
            { name: '\u200B', value: '──────── FUN ────────' },
            { name: 'Get a Quote', value: ':speech_left: `!quote`' },
            { name: 'Get a Joke', value: ':laughing: `!joke`' },
            { name: '\u200B', value: 'Use `!commands` to see list of available commands.' },
        )

    message.channel.send(msg);
}

function showLinks(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('KIA Official Links')
        .setThumbnail('https://den.koalaintelligence.agency/assets/logo.png')
        .addFields(
            { name: 'Websites', value: '<https://koalaintelligence.agency/>\n<https://den.koalaintelligence.agency/>\n' },
            { name: 'Opensea Accounts', value: '<https://opensea.io/collection/koala-intelligence-agency>\n<https://opensea.io/collection/kia-ordinance>\n<https://opensea.io/collection/kia-case-files-v2>\n' },
            { name: 'Social Media', value: '<https://twitter.com/KoalaAgencyNFT>\n<https://tiktok.com/@koalaagencynft>\n<https://instagram.com/koala.agency.nft>\n' },
            { name: 'Verified Contract', value: '<https://etherscan.io/address/0x3f5fb35468e9834a43dca1c160c69eaae78b6360>\n' },
            { name: 'Rarity Tools:', value: '<https://rarity.tools/koala-intelligence-agency>\n' },
            { name: 'HackMD  (Roadmap V2)', value: '<https://hackmd.io/@sJX7GMieToGIMmb_nnCnFQ/kia-v2>\n' },
            { name: '\u200B', value: 'Links can be found in #official-links channel' },
        )

    message.channel.send(msg);
}

function showKNet(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('KNet - Koala Network Application')
        .setURL('https://knet.koalaintelligence.agency/')
        .setDescription(`Participate in Geocache missions and win rewards!\n\n[:link: Visit KNet](https://knet.koalaintelligence.agency/)`)
        .setImage('https://geo1.koalaintelligence.agency/assets/images/image03.gif');
    message.channel.send(msg);
}

function showRarity(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Rarity - Koala Intelligence Agency')
        .setURL('https://rarity.tools/koala-intelligence-agency')
        .setDescription(`Check out the official ranking by Rarity.\n\n[:link: Visit Rarity Tools](https://rarity.tools/koala-intelligence-agency)`)
        .setImage('https://koalaintelligence.agency/assets/images/image02.gif?v=8ab28727');
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
    axios.get('https://v2.jokeapi.dev/joke/Any')
    .then((response) => {
        const type = _.get(response, ['data', 'type']);
        
        if(type === "single")
        {
            const joke = _.get(response, ['data', 'joke']);
            message.channel.send(joke);
        }
        else if(type === "twopart")
        {
            const setup = _.get(response, ['data', 'setup']);
            const delivery = _.get(response, ['data', 'delivery']);
            
            message.channel.send(setup).then( sent => {
                setTimeout(() => {
                    sent.inlineReply(delivery);
                }, 11000);
            });
        }
        else
        {
            message.channel.send("Get a new joke!");
        }
        
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.");
    });
}

function showQuote(message) {
    
    axios.get('https://zenquotes.io/api/random')
    .then((response) => {
        const quote = response.data[0].q;
        const author = response.data[0].a;
        
        const msg = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`"${quote}"`)
            .setFooter(`by ${author}`)
        message.channel.send(msg);
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.");
    });
}

function showETH(message) {
    
    axios.get('https://api.coinbase.com/v2/prices/ETH-USD/spot')
    .then((response) => {
        const conversion = `1 ${response.data.data.base} = ${response.data.data.currency} ${response.data.data.amount}`;
        
        const msg = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Current Market Price for ETH')
            .addFields(
                { name: `${conversion}`, value: '\u200B' },
            )
            .setFooter(`Data provided by Coinbase`)
        message.channel.send(msg);
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.");
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
            message.channel.send(msg);
            return;
        });
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.");
    });
}

function showFloor(message) {
    axios.get('https://api.opensea.io/api/v1/collection/koala-intelligence-agency/stats?format=json')
    .then((response) => {
        const stats = _.get(response, ['data', 'stats']);
        message.channel.send(`Floor Price: ${stats.floor_price}ETH`);
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.");
    });
}


function showStats(message) {
    axios.get('https://api.opensea.io/api/v1/collection/koala-intelligence-agency/stats?format=json')
    .then((response) => {
        const stats = _.get(response, ['data', 'stats']);

        const msg = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('KIA OpenSea Stats')
            .setURL('https://opensea.io/collection/koala-intelligence-agency?tab=activity')
            .setThumbnail('https://den.koalaintelligence.agency/assets/logo.png')
            .addFields(
                { name: 'Unique Owners', value: stats.num_owners, inline: true },
                { name: 'Floor Price', value: `${stats.floor_price}${ethers.constants.EtherSymbol} `, inline: true },

                { name: 'Sales (24H)', value: `${stats.one_day_sales}`, inline: true },
                { name: 'Volume (24H)', value: `${stats.one_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (24H)', value: `${stats.one_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },
                
                { name: 'Sales (7D)', value: `${stats.seven_day_sales}`, inline: true },
                { name: 'Volume (7D)', value: `${stats.seven_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (7D)', value: `${stats.seven_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },

                { name: 'Sales (30D)', value: `${stats.thirty_day_sales}`, inline: true },
                { name: 'Volume (30D)', value: `${stats.thirty_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (30D)', value: `${stats.thirty_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },
                
                { name: 'Avg Price (24H)', value: `${stats.one_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true},
                { name: 'Avg Price (7D)', value: `${stats.seven_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Avg Price (30D)', value: `${stats.thirty_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true},

                { name: 'Total Sales', value: `${stats.total_sales}`, inline: true },
                { name: 'Total Volume', value: `${stats.total_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Market Cap', value: `${stats.market_cap.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: '\u200B', value: 'For charts, visit Dune Analytics.\n[Dashboard by YatMaxi](https://dune.xyz/yatmaxi/Koala-Intelligence-Agency)\n[Dashboard by JayC](https://dune.xyz/jayc/Koala-Intelligence-Agency-Dashboard)' },
            )
            .setTimestamp(Date.parse(`${sale?.created_date}Z`))

        message.channel.send(msg);
        
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.");
    });
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

    if (msg.content === "!commands" || msg.content === "!command" ) {
        showCommands(msg);
    }

    if (msg.content === "!sale" ) {
        showRecentSales(msg, 1);
    }

    if (msg.content === "!sales" ) {
        showRecentSales(msg, 3);
    }

    if (msg.content === "!floor" ) {
        showFloor(msg);
    }

    if (msg.content === "!stats" ) {
        showStats(msg);
    }

    if (msg.content === "!joke" ) {
        showJoke(msg);
    }

    if (msg.content === "!quote" ) {
        showQuote(msg);
    }

    if (msg.content === "!links" ) {
        showLinks(msg);
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

    if (msg.content === "!eth" ) {
        showETH(msg);
    }
});
https://api.opensea.io/api/v1/collection/koala-intelligence-agency/stats

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




