const axios = require('axios');

const gw2 = axios.create({
    baseURL: 'https://api.guildwars2.com/v2',
});

module.exports = gw2;