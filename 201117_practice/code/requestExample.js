// request 패키지 사용
const request = require('request');

// xml 패키지 사용
var parseString = require('xml2js').parseString;

var url = "http://www.weather.go.kr/weather/forecast/mid-term-rss3.jsp?stnId=109";
request(url, function(error, response, body){
    parseString(body, function (err, result) {
        console.dir(result.rss.channel);

        // 예보정보 wf 안에 있는 데이터 출력
        console.dir(result.rss.channel[0].item[0].description[0].header[0].wf[0]);
    });  
});

// JSON 파서
request(url, function(err, response, body){
    console.log('body:', body);
    var parsedJson = JSON.parse(body);
    var articles = parsedJson.articles 
    articles.map( (arts) => {
        console.log(arts.title);
    } )

});
