const express = require('express')
const app = express()
 
app.set('views', __dirname + '/views');//랜더링할 파일이 있는 디렉토리 
app.set('view engine', 'ejs'); // 사용하는 뷰 엔진

app.use(express.json()); // JSON 타입의 데이터를 받기위한 설정
app.use(express.urlencoded({ extended: false })); // urlencoded 타입의 데이터를 받기위한 설정

app.use(express.static(__dirname + '/public')); //디자인 파일이 위치할 정적 요소들을 저장하는 디렉토리

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/test', function (req, res) {
    res.send('<html><h1>hello</h1></html>')
})

app.get('/ejs', function(req, res){
  res.render('test');
})

app.get('/designTest', function(req, res){
  res.render('blank');
})

app.post('/getTestData', function(req, res){
  console.log(req.body);
  console.log("사용자 아이디는?", req.body.sendUserId);
  console.log("사용자 패스워드는?", req.body.sendUserPassword);
  res.json('요청 잘 왔습니다');
})
 
app.listen(3000, function(){
    console.log('서버가 3000번 포트에서 실행중 입니다.');
})
