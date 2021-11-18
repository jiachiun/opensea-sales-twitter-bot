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
        .setTitle('KNet - Koala Network Application')
        .setURL('https://knet.koalaintelligence.agency/')
        .setDescription(`Participate in Geocache missions and win rewards!\n\n[:link: Visit KNet](https://knet.koalaintelligence.agency/)`)
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
            }, 12000);
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