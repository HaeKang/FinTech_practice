const express = require('express')
const app = express()
 
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/test', function(req, res){
  res.send("test");
})
 
app.listen(3000, function(){
  console.log("서버 실행중");
})