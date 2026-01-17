const https = require('https');

const url = 'https://api.krcg.org/card/200155'; // Aziz, Dammar of Istanbul

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(data);
    });
}).on('error', (err) => {
    console.error(err);
});
