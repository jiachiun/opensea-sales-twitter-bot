const axios = require('axios');
const twit = require('twit');

// KIA_Sales_Bot
const twitterConfig_KIA = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY_KIA,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET_KIA,
};

// KIASalesBot (OFficial)
const twitterConfig_KIA2 = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY_KIA2,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET_KIA2,
};

// CyberHornetsBot
const twitterConfig_CYBERHORNETS = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY_CYBERHORNETS,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET_CYBERHORNETS,
};

// Castle Kid
const twitterConfig_CASTLE_KID = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY__CASTLE_KID,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET__CASTLE_KID,
};

// Twitter Clients
const twitterClient_KIA = new twit(twitterConfig_KIA);
const twitterClient_KIA2 = new twit(twitterConfig_KIA2);
const twitterClient_CYBERHORNETS = new twit(twitterConfig_CYBERHORNETS);
const twitterClient_CASTLE_KID = new twit(twitterConfig_CASTLE_KID);

function getTwitterClient(twitterClient) {
    switch(twitterClient) {
        case "KIA":
            return twitterClient_KIA;
        case "KIA2":
            return twitterClient_KIA2;
        case "CYBERHORNETS":
            return twitterClient_CYBERHORNETS;
        case "CASTLE_KID":
            return twitterClient_CASTLE_KID;
        default:
            return null;
    }
}

// Tweet a text-based status
async function tweet(twitterClient, tweetText) {
    const tweet = {
        status: tweetText,
    };
    
    const client = getTwitterClient(twitterClient);

    client.post('statuses/update', tweet, (error, tweet, response) => {
        if (!error) {
            console.log(`Successfully tweeted: ${tweetText}`);
        } else {
            console.error(error);
        }
    });
}

// OPTIONAL - use this method if you want the tweet to include the full image file of the OpenSea item in the tweet.
async function tweetWithImage(twitterClient, tweetText, imageUrl) {
    // Format our image to base64
    const processedImage = await getBase64(imageUrl);

    const client = getTwitterClient(twitterClient);
    
    // Upload the item's image from OpenSea to Twitter & retrieve a reference to it
    client.post('media/upload', { media_data: processedImage }, (error, media, response) => {
        if (!error) {
            const tweet = {
                status: tweetText,
                media_ids: [media.media_id_string]
            };

            client.post('statuses/update', tweet, (error, tweet, response) => {
                if (!error) {
                    console.log(`Successfully tweeted: ${tweetText}`);
                } else {
                    console.error(error);
                }
            });
        } else {
            console.error(error);
        }
    });
}

// Format a provided URL into it's base64 representation
function getBase64(url) {
    return axios.get(url, { responseType: 'arraybuffer'}).then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

module.exports = {
    tweet: tweet,
    tweetWithImage: tweetWithImage
};
