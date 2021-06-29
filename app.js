const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');

function formatAndSendTweet(event) {
    const tokenName = _.get(event, ['asset', 'name']);
    const image = _.get(event, ['asset', 'image_url']);
    const ethPrice = _.get(event, 'total_price');
    const formattedPrice = ethers.utils.formatEther(ethPrice.toString());

    // Don't tweet out sales below 0.5 (preference, can be changed)
    if (Number(formattedPrice) < 0.5) {
        console.log(`${tokenName} sold for ${formattedPrice}${ethers.constants.EtherSymbol}, below tweet price`);
        return;
    }

    const tweetText = `${tokenName} bought for ${formattedPrice}${ethers.constants.EtherSymbol}. #NFT #NFTs`;

    console.log(tweetText);

    return tweet.handleDupesAndTweet(tweetText, image);
}

// Poll OpenSea every minute & retrieve all sales for a given collection in the last minute
// Then pass those events over to the formatter before tweeting
setInterval(() => {
    const lastMinute = moment().startOf('minute').subtract(59, "seconds").unix();

    axios.get('https://api.opensea.io/api/v1/events', {
        params: {
            collection_slug: process.env.OPENSEA_COLLECTION_SLUG,
            event_type: 'successful',
            occurred_after: lastMinute,
            only_opensea: 'false'
        }
    }).then((response) => {
        const events = _.get(response, ['data', 'asset_events']);

        console.log(`${events.length} sales in the last minute...`);

        _.each(events, (event) => {
            return formatAndSendTweet(event);
        });
    }).catch((error) => {
        console.error(error);
    });
}, 60000);