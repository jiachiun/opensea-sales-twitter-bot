const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const cache = require('./cache');
const Discord = require('discord.js');
require("./ExtendedMessage");


// ===================================================================================
// Message Formatting
// ===================================================================================

// Build Sale Message
function buildMessageSale(sale) {

    // If single sale
    if(sale.asset)
    {
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
    // If is bundle
    else if(sale.asset_bundle)
    {
        const buyer_name = sale?.winner_account?.user?.username? sale?.winner_account?.user?.username : sale?.winner_account?.address;
        const seller_name = sale?.seller?.user?.username? sale?.seller?.user?.username : sale?.seller?.address;
        const amount = ethers.utils.formatEther(sale.total_price || '0');

        return (
            new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('A bundle titled \'' + sale.asset_bundle.name + '\' was purchased for ' + amount + ' ETH')
                .setURL(sale.asset_bundle.permalink)
                // .setAuthor('OpenSea Bot', 'https://files.readme.io/566c72b-opensea-logomark-full-colored.png', 'https://github.com/sbauch/opensea-discord-bot')
                // .setThumbnail(sale.asset.collection.image_url)
                .addFields(
                    { name: 'Name', value: sale.asset_bundle.name },
                    { name: 'Amount', value: `${amount}${ethers.constants.EtherSymbol}` },
                    { name: 'From', value: `[${seller_name}](https://opensea.io/${seller_name})`, inline: true },
                    { name: 'To', value: `[${buyer_name}](https://opensea.io/${buyer_name})`, inline: true },
                    { name: 'Quantity', value: `${sale.quantity}` }
                )
                .setImage(sale.asset_bundle.assets[0].image_url)
                .setTimestamp(Date.parse(`${sale?.created_date}Z`))
                .setFooter('Purchased on OpenSea',)
        );
    }
}

// Build Listing Message
function buildMessageListing(listing) {

    if(listing.asset)
    {
        const seller_name = listing?.seller?.user?.username? listing?.seller?.user?.username : listing?.seller?.address;
        const amount = ethers.utils.formatEther(listing.ending_price || '0');

        return (
        
            new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(listing.asset.name + ' was listed for ' + amount + ' ETH')
                .setURL(listing.asset.permalink)
                .addFields(
                    { name: 'Name', value: listing.asset.name },
                    { name: 'Amount', value: `${amount}${ethers.constants.EtherSymbol}` },
                    { name: 'Owner', value: `[${seller_name}](https://opensea.io/${seller_name})`, inline: true }
                )
                .setImage(listing.asset.image_url)
                .setTimestamp(Date.parse(`${listing?.created_date}Z`))
                .setFooter('Listed on OpenSea',)
        );
    }
    else if(listing.asset_bundle)
    {
        const maker_name = listing?.maker?.user?.username? listing?.maker?.user?.username : listing?.maker?.address;
        const amount = ethers.utils.formatEther(listing.ending_price || '0');

        return (
        
            new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('A bundle titled \'' + listing.asset_bundle.name + '\'was listed for ' + amount + ' ETH')
                .setURL(listing.asset_bundle.permalink)
                .addFields(
                    { name: 'Name', value: listing.asset_bundle.name },
                    { name: 'Amount', value: `${amount}${ethers.constants.EtherSymbol}` },
                    { name: 'Owner', value: `[${maker_name}](https://opensea.io/${maker_name})`, inline: true },
                    { name: 'Quantity', value: `${listing.quantity}`, inline: true }
                    
                )
                .setImage(listing.asset_bundle.assets[0].image_url)
                .setTimestamp(Date.parse(`${listing?.created_date}Z`))
                .setFooter('Listed on OpenSea',)
        );
    }

       
    
    
}

// Build Delisting Message
function buildMessageDelisting(delisting) {
    const buyer_name = delisting?.winner_account?.user?.username? delisting?.winner_account?.user?.username : delisting?.winner_account?.address;
    const seller_name = delisting?.seller?.user?.username? delisting?.seller?.user?.username : delisting?.seller?.address;
    const amount = ethers.utils.formatEther(delisting.ending_price || '0');

    return (
        new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(delisting.asset.name + ' was delisted. Rooty Roo!')
            .setURL(delisting.asset.permalink)
            .addFields(
                { name: 'Name', value: delisting.asset.name },
                { name: 'Owner', value: `[${seller_name}](https://opensea.io/${seller_name})` }
            )
            .setImage(delisting.asset.image_url)
            .setTimestamp(Date.parse(`${delisting?.created_date}Z`))
            .setFooter('Delisted from OpenSea',)
    );
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

// ===================================================================================
// Discord Custom Commands
// ===================================================================================

function showCommands_KIA(message) {
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
            { name: 'Show Last 3 Sales', value: ':shopping_bags: `!sales`' },
            { name: 'Get Project Stats', value: ':bar_chart: `!stats`' },
            { name: 'Get the Floor Price', value: ':chart_with_upwards_trend: `!floor`' },
            { name: 'Get the Market Price for ETH', value: ':chart: `!eth`' },
            { name: '\u200B', value: '──────── FUN ────────' },
            { name: 'Get a Quote', value: ':speech_left: `!quote`' },
            { name: 'Get a Joke', value: ':laughing: `!joke`' },
            { name: '\u200B', value: 'Use `!commands` to see list of available commands.' },
        )

    message.channel.send(msg);
}

function showCommands_CASTLE_KID(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Castle Kid Bot Commands')
        .setThumbnail('https://uploads-ssl.webflow.com/618ed456007311248b074a6f/61a6633da16c350520699845_sneakpeek1-p-500.jpeg')
        .addFields(
            { name: '\u200B', value: '──────── SALES ────────' },
            { name: 'Show the Latest Sale', value: ':shopping_cart: `!sale`' },
            { name: 'Show Last 3 Sales', value: ':shopping_bags: `!sales`' },
            { name: '\u200B', value: 'Use `!commands` to see list of available commands.' },
        )

    message.channel.send(msg);
}

function showCommands_ELDR(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('ELDR LABS Bot Commands')
        .setThumbnail('https://i.ibb.co/zNXmMfp/logo-eldr-labs.jpg')
        .addFields(
            { name: '\u200B', value: '──────── INFO ────────' },
            { name: 'Links', value: ':link: `!links`' },
            { name: 'OpenSea Collections', value: '`doodles`, `azuki`, `clonex`' },
            { name: '\u200B', value: '──────── SALES ────────' },
            { name: 'Show the Latest Sale', value: ':shopping_cart: `!sale <collection_name>`' },
            { name: 'Show Last 3 Sales', value: ':shopping_bags: `!sales <collection_name>`' },
            { name: 'Get Project Stats', value: ':bar_chart: `!stats <collection_name>`' },
            { name: 'Get the Floor Price', value: ':chart_with_upwards_trend: `!floor <collection_name>`' },
            { name: '\u200B', value: '──────── OTHERS ────────' },
            { name: 'Get the Market Price for ETH', value: ':chart: `!eth`' },
            { name: 'Get a Quote', value: ':speech_left: `!quote`' },
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


function showLinks_ELDR(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('ELDR Labs Official Links')
        .setThumbnail('https://i.ibb.co/zNXmMfp/logo-eldr-labs.jpg')
        .addFields(
            { name: 'WhiteBearVG', value: 'YouTube - <https://t.co/OdUfZKAcVY>\nTwitter - <https://twitter.com/WhiteBearVG>\n' },
            { name: 'ELDR Labs', value: 'Twitter - <https://twitter.com/ELDRLabs>\n' },
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
    axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit')
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

function showRecentSales(message, collection_slug = null, limit = 1) {

    if(collection_slug == null)
        message.inlineReply("Oops. Unable to complete the request.\nReason: The collection name is invalid or has been recently changed. Please contact the developer for tech support.");
    else {

        axios.get('https://api.opensea.io/api/v1/events', {
            headers: {
                "X-API-KEY": process.env.OPENSEA_API_KEY,
            },
            params: {
                collection_slug: collection_slug,
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
            message.inlineReply("Oops. Unable to connect to the API. Please try again later.\n:warning: The OpenSea API is temporarily down causing disruption to our bots: Please go to <https://opensea.io/collection/koala-intelligence-agency?tab=activity> to check the activities while OpenSea works to resolve, thank you!");
        });
    }
}

function showFloor(message, collection_slug = null) {

    if(collection_slug == null)
        message.inlineReply("Oops. Unable to complete the request.\nReason: The collection name is invalid or has been recently changed. Please contact the developer for tech support.");
    else {
        axios.get('https://api.opensea.io/api/v1/collection/' + collection_slug + '/stats?format=json', {
            headers: {
                "X-API-KEY": process.env.OPENSEA_API_KEY,
            }
        })
        .then((response) => {
            const stats = _.get(response, ['data', 'stats']);
            message.channel.send(`Floor Price for ` + collection_slug + `: ${stats.floor_price}ETH`);
        })
        .catch((error) => {
            console.error(error);
            message.inlineReply("Oops. Unable to connect to the API. Please try again later.\n:Warning: The OpenSea API may be temporarily down causing disruption to our bots: Please go to <https://opensea.io/collection/" + collection_slug + "?tab=activity> to check the activities while OpenSea works to resolve, thank you!");
        });
    }
}

function showMoonMessage(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`"If you focus on the floor you will miss the moon."`)
    message.channel.send(msg);
}

function showWenCommunityTakeOver(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`"August 1st! KIA Community takes over."`)
    message.channel.send(msg);
}

function showKIASigners(message) {
    const msg = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`"The 5 Multi-sig Signers:"`)
        .addFields(
            { name: '\u200B', value: '@TheAccountant | goingconcern.eth' },
            { name: '\u200B', value: '@jwlpt45' },
            { name: '\u200B', value: '@Bromelia.eth' },
            { name: '\u200B', value: '@Wes' },
            { name: '\u200B', value: '@djbooth.eth [Speg]' },
        )
    message.channel.send(msg);
}



function showStats(message, collection_slug = null) {
    axios.get('https://api.opensea.io/api/v1/collection/' + collection_slug + '/stats?format=json', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        }
    })
    .then((response) => {
        const stats = _.get(response, ['data', 'stats']);

        const msg = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('OpenSea Stats for ' + collection_slug)
            .setURL('https://opensea.io/collection/' + collection_slug + '?tab=activity')
            .setThumbnail('https://i.ibb.co/zNXmMfp/logo-eldr-labs.jpg')
            .addFields(
                { name: '\u200B', value: '────────────────────────────' },
                { name: 'Unique Owners', value: `${stats.num_owners}`, inline: true },
                { name: 'Floor Price', value: `${stats.floor_price}${ethers.constants.EtherSymbol}`, inline: true },
                { name: '\u200B', value: '────────────────────────────' },
                { name: 'Sales (24H)', value: `${stats.one_day_sales}`, inline: true },
                { name: 'Volume (24H)', value: `${stats.one_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (24H)', value: `${stats.one_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },
                
                { name: 'Sales (7D)', value: `${stats.seven_day_sales}`, inline: true },
                { name: 'Volume (7D)', value: `${stats.seven_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (7D)', value: `${stats.seven_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },

                { name: 'Sales (30D)', value: `${stats.thirty_day_sales}`, inline: true },
                { name: 'Volume (30D)', value: `${stats.thirty_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (30D)', value: `${stats.thirty_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: '\u200B', value: '────────────────────────────' },
                { name: 'Avg Price (24H)', value: `${stats.one_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true},
                { name: 'Avg Price (7D)', value: `${stats.seven_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Avg Price (30D)', value: `${stats.thirty_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true},

                { name: 'Total Sales', value: `${stats.total_sales}`, inline: true },
                { name: 'Total Volume', value: `${stats.total_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Market Cap', value: `${stats.market_cap.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
            )

        message.channel.send(msg);
        
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.\n:warning: The OpenSea API is temporarily down causing disruption to our bots: Please go to <https://opensea.io/collection/koala-intelligence-agency?tab=activity> to check the activities while OpenSea works to resolve, thank you!");
    });
}


function showStatsKIA(message) {
    axios.get('https://api.opensea.io/api/v1/collection/koala-intelligence-agency/stats?format=json', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        }
    })
    .then((response) => {
        const stats = _.get(response, ['data', 'stats']);

        const msg = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('KIA OpenSea Stats')
            .setURL('https://opensea.io/collection/koala-intelligence-agency?tab=activity')
            .setThumbnail('https://den.koalaintelligence.agency/assets/logo.png')
            .addFields(
                { name: '\u200B', value: '────────────────────────────' },
                { name: 'Unique Owners', value: `${stats.num_owners}`, inline: true },
                { name: 'Floor Price', value: `${stats.floor_price}${ethers.constants.EtherSymbol}`, inline: true },
                { name: '\u200B', value: '────────────────────────────' },
                { name: 'Sales (24H)', value: `${stats.one_day_sales}`, inline: true },
                { name: 'Volume (24H)', value: `${stats.one_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (24H)', value: `${stats.one_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },
                
                { name: 'Sales (7D)', value: `${stats.seven_day_sales}`, inline: true },
                { name: 'Volume (7D)', value: `${stats.seven_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (7D)', value: `${stats.seven_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },

                { name: 'Sales (30D)', value: `${stats.thirty_day_sales}`, inline: true },
                { name: 'Volume (30D)', value: `${stats.thirty_day_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Change (30D)', value: `${stats.thirty_day_change.toFixed(4)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: '\u200B', value: '────────────────────────────' },
                { name: 'Avg Price (24H)', value: `${stats.one_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true},
                { name: 'Avg Price (7D)', value: `${stats.seven_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Avg Price (30D)', value: `${stats.thirty_day_average_price.toFixed(3)}${ethers.constants.EtherSymbol} `, inline: true},

                { name: 'Total Sales', value: `${stats.total_sales}`, inline: true },
                { name: 'Total Volume', value: `${stats.total_volume.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: 'Market Cap', value: `${stats.market_cap.toFixed(2)}${ethers.constants.EtherSymbol} `, inline: true },
                { name: '\u200B', value: 'For charts, visit Dune Analytics.\n[:link: Dashboard by YatMaxi](https://dune.xyz/yatmaxi/Koala-Intelligence-Agency)\n[:link: Dashboard by JayC](https://dune.xyz/jayc/Koala-Intelligence-Agency-Dashboard)' },
            )

        message.channel.send(msg);
        
    })
    .catch((error) => {
        console.error(error);
        message.inlineReply("Oops. Unable to connect to the API. Please try again later.\n:warning: The OpenSea API is temporarily down causing disruption to our bots: Please go to <https://opensea.io/collection/koala-intelligence-agency?tab=activity> to check the activities while OpenSea works to resolve, thank you!");
    });
}

// ===================================================================================
// Discord Bots
// ===================================================================================
const discordBot_KIA = new Discord.Client();
const discordBot_KIA_NEW = new Discord.Client();
const discordBot_CASTLE_KID = new Discord.Client();
const discordBot_ROO_TROOP = new Discord.Client();
const discordBot_ELDR = new Discord.Client();

// ===================================================================================
// Discord Channels
// ===================================================================================

// KIA
var sales_bot_channel_KIA;
var sales_bot_channel_KIA_NEW;

// Castle Kid
var sales_bot_channel_CASTLE_KID;

// Roo Troop
var listing_bot_channel_ROO_TROOP;
var delisting_bot_channel_ROO_TROOP;

// ELDR
var sales_bot_channel_ELDR;



// ====================================================================
// Discord Bot: KIA
// ====================================================================

discordBot_KIA.on('ready', () => {
    console.log(`Logged in as ${discordBot_KIA.user.tag}!`);
    sales_bot_channel_KIA = discordBot_KIA.channels.cache.get(process.env.DISCORD_CHANNEL_ID_SALES_BOT__KIA);
});

discordBot_KIA.on('message', msg => {

    if (msg.content === "!commands" || msg.content === "!command" ) {
        showCommands_KIA(msg);
    }

    if (msg.content === "!sale" ) {
        showRecentSales(msg, "koala-intelligence-agency", 1);
    }

    if (msg.content === "!sales" ) {
        showRecentSales(msg, "koala-intelligence-agency", 3);
    }

    if (msg.content === "!floor" ) {
        showMoonMessage(msg);
    }

    if (msg.content === "!stats" ) {
        showStatsKIA(msg);
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


    if (msg.content === "!eth" ) {
        showETH(msg);
    }
});

// ====================================================================
// Discord Bot: KIA New
// ====================================================================

discordBot_KIA_NEW.on('ready', () => {
    console.log(`Logged in as ${discordBot_KIA_NEW.user.tag}!`);
    sales_bot_channel_KIA_NEW = discordBot_KIA_NEW.channels.cache.get(process.env.DISCORD_CHANNEL_ID_SALES_BOT__KIA_NEW);
});

discordBot_KIA_NEW.on('message', msg => {

    if (msg.content === "!commands" || msg.content === "!command" ) {
        showCommands_KIA(msg);
    }

    if (msg.content === "!sale" ) {
        showRecentSales(msg, "koala-intelligence-agency", 1);
    }

    if (msg.content === "!sales" ) {
        showRecentSales(msg, "koala-intelligence-agency", 3);
    }

    if (msg.content === "!floor" ) {
        showFloor(msg);
    }

    if (msg.content === "!stats" ) {
        showStatsKIA(msg);
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

    if (msg.content === "!eth" ) {
        showETH(msg);
    }

    if (msg.content === "!wen" ) {
        showWenCommunityTakeOver(msg);
    }

    if (msg.content === "!signers" ) {
        showKIASigners(msg);
    }

    
});

// ====================================================================
// Discord Bot: Castle Kid
// ====================================================================

discordBot_CASTLE_KID.on('ready', () => {
    console.log(`Logged in as ${discordBot_CASTLE_KID.user.tag}!`);
    sales_bot_channel_CASTLE_KID = discordBot_CASTLE_KID.channels.cache.get(process.env.DISCORD_CHANNEL_ID_SALES_BOT__CASTLE_KID);
});

discordBot_CASTLE_KID.on('message', msg => {

    if (msg.content === "!commands" || msg.content === "!command" ) {
        showCommands_CASTLE_KID(msg);
    }
    
    if (msg.content === "!sale" ) {
        showRecentSales(msg, "castle-kid-colin-tilley", 1);
    }

    if (msg.content === "!sales" ) {
        showRecentSales(msg, "castle-kid-colin-tilley", 3);
    }
});


// ====================================================================
// Discord Bot: Roo Troop
// ====================================================================

discordBot_ROO_TROOP.on('ready', () => {
    console.log(`Logged in as ${discordBot_ROO_TROOP.user.tag}!`);
    listing_bot_channel_ROO_TROOP = discordBot_ROO_TROOP.channels.cache.get(process.env.DISCORD_CHANNEL_ID_LISTING_BOT__ROO_TROOP);
    delisting_bot_channel_ROO_TROOP = discordBot_ROO_TROOP.channels.cache.get(process.env.DISCORD_CHANNEL_ID_DELISTING_BOT__ROO_TROOP);
});

// ====================================================================
// Discord Bot: ELDR
// ====================================================================

discordBot_ELDR.on('ready', () => {
    console.log(`Logged in as ${discordBot_ELDR.user.tag}!`);
    sales_bot_channel_ELDR = discordBot_ELDR.channels.cache.get(process.env.DISCORD_CHANNEL_ID_SALES_BOT__ELDR);
});

discordBot_ELDR.on('message', msg => {

    let content = msg.content.toLowerCase();

    if (content === "!commands" || msg.content === "!command" ) {
        showCommands_ELDR(msg);
    }

    // ============================================
    // Doodles - https://opensea.io/collection/doodles-official
    // ============================================

    if(content.startsWith("!sale"))
    {
        if (content === "!sale doodles" ) {
            showRecentSales(msg, "doodles-official", 1);
        }

        if (content === "!sale clonex" ) {
            showRecentSales(msg, "clonex", 1);
        }

        if (content === "!sale azuki" ) {
            showRecentSales(msg, "azuki", 1);
        }
    }

    if(content.startsWith("!sales"))
    {
        if (content === "!sales doodles" ) {
            showRecentSales(msg, "doodles-official", 3);
        }

        if (content === "!sales clonex" ) {
            showRecentSales(msg, "clonex", 3);
        }

        if (content === "!sales azuki" ) {
            showRecentSales(msg, "azuki", 3);
        }
    }

    if(content.startsWith("!floor"))
    {
        if (content === "!floor doodles" ) {
            showFloor(msg, "doodles-official");
        }

        if (content === "!floor clonex" ) {
            showFloor(msg, "clonex");
        }

        if (content === "!floor azuki" ) {
            showFloor(msg, "azuki");
        }
    }

    if(content.startsWith("!stats"))
    {
        if (content === "!stats doodles" ) {
            showStats(msg, "doodles-official");
        }

        if (content === "!stats clonex" ) {
            showStats(msg, "clonex");
        }

        if (content === "!stats azuki" ) {
            showStats(msg, "azuki");
        }
    }


    if (content === "!quote" ) {
        showQuote(msg);
    }

    if (content === "!links" ) {
        showLinks_ELDR(msg);
    }

    if (content === "!eth" ) {
        showETH(msg);
    }
});


// ====================================================================
// Login to Discord Bots
// ====================================================================
discordBot_KIA.login(process.env.DISCORD_BOT_TOKEN__KIA);
discordBot_KIA_NEW.login(process.env.DISCORD_BOT_TOKEN__KIA_NEW);
discordBot_CASTLE_KID.login(process.env.DISCORD_BOT_TOKEN__CASTLE_KID);
discordBot_ROO_TROOP.login(process.env.DISCORD_BOT_TOKEN__ROO_TROOP);
discordBot_ELDR.login(process.env.DISCORD_BOT_TOKEN__ELDR);


// ====================================================================
// Retrieve Event
// Poll OpenSea every 60 seconds & retrieve all sales for a given collection in either the time since the last sale OR in the last minute
// ====================================================================

// GET SALE EVENT FOR KIA
setInterval(() => {
    const lastSaleTime_KIA = cache.get('lastSaleTime_KIA', null) || moment().startOf('minute').subtract(59, "seconds").unix();

    console.log(`Last sale (in seconds since Unix epoch): ${cache.get('lastSaleTime_KIA', null)}`);

    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        },
        params: {
            // collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
            collection_slug: "koala-intelligence-agency",
            event_type: 'successful',
            // occurred_after: lastSaleTime_KIA+1,
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

            if(moment(created).unix() < moment().subtract(119, "seconds").unix() )
                return;

            const message = buildMessageSale(event);
            sales_bot_channel_KIA.send(message); 
            sales_bot_channel_KIA_NEW.send(message);

            formatAndSendTweet(event, "KIA", "🐨 #HugLife #NFT");
            formatAndSendTweet(event, "KIA2", "🐨 #HugLife #NFT");

            cache.set('lastSaleTime_KIA', moment(created).unix());
            return;
        });
    }).catch((error) => {
        // lastSaleTime_KIA++;
        console.error(error);
    });
}, 120000);

// GET SALE EVENT FOR CYBERHORNETS
// setInterval(() => {
//     const lastSaleTime_CYBERHORNETS = cache.get('lastSaleTime_CYBERHORNETS', null) || moment().startOf('minute').subtract(59, "seconds").unix();

//     console.log(`Last sale (in seconds since Unix epoch): ${cache.get('lastSaleTime_CYBERHORNETS', null)}`);

//     axios.get('https://api.opensea.io/api/v1/events', {
//         headers: {
//             "X-API-KEY": process.env.OPENSEA_API_KEY,
//         },
//         params: {
//             // collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
//             collection_slug: "cyber-hornets-colony-club",
//             event_type: 'successful',
//             // occurred_after: lastSaleTime_CYBERHORNETS,
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

//             if(moment(created).unix() < moment().subtract(59, "seconds").unix() )
//                 return;

//             cache.set('lastSaleTime_CYBERHORNETS', moment(created).unix());

//             return formatAndSendTweet(event, "CYBERHORNETS" , "#CyberHornets #TheSwarm");
//         });
//     }).catch((error) => {
//         // lastSaleTime_CYBERHORNETS++;
//         console.error(error);
//     });
// }, 60000);

// GET SALE EVENT FOR CASTLE_KID
setInterval(() => {
    const lastSaleTime_CASTLE_KID = cache.get('lastSaleTime_CASTLE_KID', null) || moment().startOf('minute').subtract(59, "seconds").unix();
    console.log(`Last sale (in seconds since Unix epoch): ${cache.get('lastSaleTime_CASTLE_KID', null)}`);

    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        },
        params: {
            // collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
            collection_slug: "castle-kid-colin-tilley",
            event_type: 'successful',
            // occurred_after: lastSaleTime_CASTLE_KID+1,
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })

        console.log(`[CASTLE KID] ${events.length} sales since the last one...`);

        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');

            if(moment(created).unix() < moment().subtract(159, "seconds").unix() )
                return;
            

            const message = buildMessageSale(event);
            sales_bot_channel_CASTLE_KID.send(message);

            formatAndSendTweet(event, "CASTLE_KID", "🏰 #stormthecastle");
            
            cache.set('lastSaleTime_CASTLE_KID', moment(created).unix());

            return;
        });
    }).catch((error) => {
        // lastSaleTime_CASTLE_KID++;
        console.error(error);
    });
}, 160000);


// GET LISTING EVENT FOR ROO TROOP
setInterval(() => {
    const lastListingTime_ROO_TROOP = cache.get('lastListingTime_ROO_TROOP', null) || moment().startOf('minute').subtract(59, "seconds").unix();

    console.log(`Last listing (in seconds since Unix epoch): ${cache.get('lastListingTime_ROO_TROOP', null)}`);

    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        },
        params: {
            collection_slug: "roo-troop",
            event_type: 'created',
            // occurred_after: lastListingTime_ROO_TROOP+1,
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })

        console.log(`[ROO TROOP] ${events.length} listings since the last one...`);

        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');

            if(moment(created).unix() < moment().subtract(139, "seconds").unix() )
                return;

            const message = buildMessageListing(event);
            listing_bot_channel_ROO_TROOP.send(message);

            // formatAndSendTweet(event, "ROO_TROOP", "#rootyroo");
            cache.set('lastListingTime_ROO_TROOP', moment(created).unix());
            return;
        });
    }).catch((error) => {
        // lastListingTime_ROO_TROOP++;    // Increment the time by 1 second to skip the error-causing item
        console.error(error);
    });
}, 140000);


// GET DELISTING EVENT FOR ROO TROOP
setInterval(() => {
    const lastDelistingTime_ROO_TROOP = cache.get('lastDelistingTime_ROO_TROOP', null) || moment().startOf('minute').subtract(59, "seconds").unix();

    console.log(`Last delisting (in seconds since Unix epoch): ${cache.get('lastDelistingTime_ROO_TROOP', null)}`);

    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        },
        params: {
            collection_slug: "roo-troop",
            event_type: 'cancelled',
            // occurred_after: lastDelistingTime_ROO_TROOP+1,
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })

        console.log(`[ROO TROOP] ${events.length} delistings since the last one...`);

        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');

            if(moment(created).unix() < moment().subtract(189, "seconds").unix() )
                return;

            const message = buildMessageDelisting(event);
            delisting_bot_channel_ROO_TROOP.send(message);

            cache.set('lastDelistingTime_ROO_TROOP', moment(created).unix());
            // formatAndSendTweet(event, "ROO_TROOP", "#rootyroo");
            return;
        });
    }).catch((error) => {
        // lastDelistingTime_ROO_TROOP++;
        console.error(error);
    });
}, 190000);

// GET LISTING EVENT FOR JoeyMob
setInterval(() => {
    const lastListingTime_JOEYMOB = cache.get('lastListingTime_ROO_TROOP', null) || moment().startOf('minute').subtract(59, "seconds").unix();

    console.log(`Last listing (in seconds since Unix epoch): ${cache.get('lastListingTime_JOEYMOB', null)}`);

    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        },
        params: {
            collection_slug: "joeymob",
            event_type: 'created',
            // occurred_after: lastListingTime_JOEYMOB+1,
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })

        console.log(`[JOEYMOB] ${events.length} listings since the last one...`);

        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');

            if(moment(created).unix() < moment().subtract(149, "seconds").unix() )
                return;

            const message = buildMessageListing(event);
            listing_bot_channel_ROO_TROOP.send(message);

            // formatAndSendTweet(event, "ROO_TROOP", "#rootyroo");
            cache.set('lastListingTime_JOEYMOB', moment(created).unix());
            return;
        });
    }).catch((error) => {
        // lastListingTime_ROO_TROOP++;    // Increment the time by 1 second to skip the error-causing item
        console.error(error);
    });
}, 150000);


// GET DELISTING EVENT FOR JOEYMOB
setInterval(() => {
    const lastDelistingTime_JOEYMOB = cache.get('lastDelistingTime_ROO_TROOP', null) || moment().startOf('minute').subtract(59, "seconds").unix();

    console.log(`Last delisting (in seconds since Unix epoch): ${cache.get('lastDelistingTime_JOEYMOB', null)}`);

    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        },
        params: {
            collection_slug: "joeymob",
            event_type: 'cancelled',
            // occurred_after: lastDelistingTime_JOEYMOB+1,
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })

        console.log(`[JOEYMOB] ${events.length} delistings since the last one...`);

        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');

            if(moment(created).unix() < moment().subtract(179, "seconds").unix() )
                return;

            const message = buildMessageDelisting(event);
            delisting_bot_channel_ROO_TROOP.send(message);

            cache.set('lastDelistingTime_JOEYMOB', moment(created).unix());
            // formatAndSendTweet(event, "ROO_TROOP", "#rootyroo");
            return;
        });
    }).catch((error) => {
        // lastDelistingTime_JOEYMOB++;
        console.error(error);
    });
}, 180000);

// GET SALE EVENT FOR ELDR: doodles-official
setInterval(() => {

    console.log('Logging sales for Doodles');
    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY_JC,
        },
        params: {
            collection_slug: "doodles-official",
            event_type: 'successful',
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);
        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })
        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');
            if(moment(created).unix() < moment().subtract(59, "seconds").unix() )
                return;
            const message = buildMessageSale(event);
            sales_bot_channel_ELDR.send(message);
            return;
        });
    }).catch((error) => {
        console.error(error);
    });

    console.log('Logging sales for Clonex');
    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY_JC,
        },
        params: {
            collection_slug: "clonex",
            event_type: 'successful',
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);
        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })
        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');
            if(moment(created).unix() < moment().subtract(59, "seconds").unix() )
                return;
            const message = buildMessageSale(event);
            sales_bot_channel_ELDR.send(message);
            return;
        });
    }).catch((error) => {
        console.error(error);
    });

    console.log('Logging sales for Azuki');
    axios.get('https://api.opensea.io/api/v1/events', {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY_JC,
        },
        params: {
            collection_slug: "azuki",
            event_type: 'successful',
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);
        const sortedEvents = _.sortBy(events, function(event) {
            const created = _.get(event, 'created_date');

            return new Date(created);
        })
        _.each(sortedEvents, (event) => {
            const created = _.get(event, 'created_date');
            if(moment(created).unix() < moment().subtract(59, "seconds").unix() )
                return;
            const message = buildMessageSale(event);
            sales_bot_channel_ELDR.send(message);
            return;
        });
    }).catch((error) => {
        console.error(error);
    });


}, 60000);

console.log(`============================================================`);