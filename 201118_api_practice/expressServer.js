const express = require('express')
const app = express()

const request = require('request');

//----------------- 토큰 발행 패키지 ----------------------
const jwt = require('jsonwebtoken');    


// 랜더링할 파일이 있는 디렉토리
app.set('views', __dirname + '/views');
// 사용하는 뷰 엔진
app.set('view engine', 'ejs');


// JSON 타입의 데이터를 받기위한 설정
app.use(express.json());
// urlencoded 타입의 데이터를 받기위한 설정
app.use(express.urlencoded({ extended: false }));


//디자인 파일이 위치할 정적 요소들을 저장하는 디렉토리
app.use(express.static(__dirname + '/public'));


//------------- api key, secret 값 ----------------------
var api_info = require("./api_info.js");   


//------------------ database 연결 ----------------------
var mysql_info = require("./mysql_info.js");
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: mysql_info[0],
	user: mysql_info[1],
	password: mysql_info[2],
	port: mysql_info[3],
	database: mysql_info[4]
});
connection.connect();


//------------------ 서버 코딩 시작 ----------------------


app.get('/signup', function(req, res){
    res.render('signup');
});

app.get('/login', function(req, res){
    res.render('login');
})


//------- api 인증코드 받고 토큰 발행 ----------------------
app.get('/authResult', function(req, res){
    var authCode = req.query.code; // 인증코드 받음
    console.log("인증코드 : " , authCode);

    var option = {
        method : "POST",
        url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
        headers : {
            "Content-Type" : ""
        },
        form : {
            code : authCode,
            client_id : api_info[0],
            client_secret : api_info[1],
            redirect_uri : "http://localhost:3000/authResult",
            grant_type : "authorization_code"
        }
    };

    request(option, function(error, response, body){
        var accessRequestResult = JSON.parse(body);
        console.log(accessRequestResult);
        res.render("resultChild", { data: accessRequestResult });
    });
});


//---------------------- 가입 sql 전송 ----------------------
app.post('/signup', function(req, res){
    var userName = req.body.userName;
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;
    var userAccessToken = req.body.userAccessToken;
    var userRefreshToken = req.body.userRefreshToken;
    var userSeqNo = req.body.userSeqNo;

    console.log(userName, userEmail, userAccessToken, userRefreshToken, userSeqNo, userPassword);
    
    var insertUserSql = "INSERT INTO user (`name`, `email`, `accesstoken`, `refreshtoken`, `userseqno`, `password`) VALUES (?, ?, ?, ?, ?, ?)"

    connection.query(insertUserSql, [userName, userEmail, userAccessToken, userRefreshToken, userSeqNo, userPassword] , function(error, results, fields){
        if(error){
            throw error;
        }else {
            res.json("1");
        }
        console.log(results);
    });
});


//---------------------- 로그인 ----------------------
app.post('/login', function(req, res){
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;

    var searchEmailSql = "SELECT * FROM user WHERE email = ?";

    connection.query(searchEmailSql, [userEmail, userPassword] , function(error, results, fields){

        if(error){
            throw error;
        }else {
            if(results.length == 0){

                res.json("존재하지 않는 회원입니다.");

            } else {

                // 비밀번호 확인
                var storedUserPw = results[0].password;
                if(storedUserPw == userPassword){

                    // 로그인 완료 & 토큰발행
                    var tokenKey = "f@i#n%tne#ckfhlafkd0102test!@#%";
                    jwt.sign(
                      {
                        userId: results[0].id,
                        userEmail: results[0].email,
                      },
                      tokenKey,
                      {
                        expiresIn: "10d",
                        issuer: "fintech.admin",
                        subject: "user.login.info",
                      },
                      function (err, token) {
                        console.log("로그인 성공", token);
                        res.json(token);
                      }
                    );

                } else {
                    // 로그인 실패
                    res.send("비밀번호를 잘못 입력하셨습니다.");
                }

            }
        }

    });

});

//---------------------- 서버 실행 ----------------------
app.listen(3000, function(){
    console.log('서버가 3000번 포트에서 실행중 입니다.');
})

