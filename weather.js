const https = require("https")
const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + "boston" +  '&appid=c28d969af297d17793e0f93cf4b440ec'
https.get(url, res => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      data = JSON.parse(data);
      console.log(Math.round(data.main.temp - 273));
    })
  }).on('error', err => {
    console.log(err.message);
  })