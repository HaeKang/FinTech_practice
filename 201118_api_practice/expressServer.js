const express = require('express')
const app = express()

const request = require('request');

// auth 라이브러리
const auth = require('./lib/auth');

// 시간 라이브러리
require('date-utils');

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
});


app.get('/main', function(req, res){
    res.render('main');
});


app.get('/balance', function(req, res){
    res.render('balance');
});


app.get('/qrcode', function(req, res){
    res.render('qrcode');
});


app.get('/qrreader', function(req, res){
    res.render('qrreader');
});

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

                    // 로그인 완료 & 토큰발행 -> auth 인증 기능
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


//---------------------- 로그인한 유저 계좌 리스트 출력  --------------
app.post('/list', auth, function(req, res){

    var userId = req.decoded.userId;
    var userSelectSql = "SELECT * FROM user WHERE id = ?";

    connection.query(userSelectSql, [userId], function(err, results){
        if(err){
            throw err;
        } else {

            var userAccessToken = results[0].accesstoken;
            var userSeqNo = results[0].userseqno;

            // api 옵션들 설정 (user/me)
            var option = {
                method : "GET",
                url : "https://testapi.openbanking.or.kr/v2.0/user/me",
                headers : {
                    Authorization : "Bearer "+ userAccessToken
                },
                qs : {
                    // 쿼리 보냄
                    user_seq_no : userSeqNo
                }
            }

            // api에 요청 
            request(option, function(error, response, body){
                var listResult = JSON.parse(body);
                console.log(listResult);
                res.json(listResult);
            });

        }
    });

});


//---------------------- 계좌 잔액 확인  ----------------
app.post('/balance', auth, function(req, res){

    var userId = req.decoded.userId;  
    var finusenum = req.body.fin_use_num;   // 핀테크번호

    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = "T991671660U" + countnum; // 은행거래고유번호

    var newDate = new Date();
    var nowTime = newDate.toFormat('YYYYMMDDHH24MISS');

    var userSelectSql = "SELECT * FROM user WHERE id = ?";

    connection.query(userSelectSql, [userId], function(err, results){
        if(err){
            throw err;
        } else {

            var userAccessToken = results[0].accesstoken;

            // api 옵션들 설정 (user/me)
            var option = {
                method : "GET",
                url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
                headers : {
                    Authorization : "Bearer "+ userAccessToken
                },
                qs : {
                    // 쿼리 보냄
                    bank_tran_id : transId,
                    fintech_use_num : finusenum,
                    tran_dtime : nowTime
                }
            }

            // api에 요청 
            request(option, function(error, response, body){
                var requestResultJSON = JSON.parse(body);
                console.log(requestResultJSON);
                res.json(requestResultJSON);
            });

        }
    });

});


//---------------------- 거래 내역 확인  ----------------
app.post('/transactionList', auth, function(req, res){

    var userId = req.decoded.userId;  
    var finusenum = req.body.fin_use_num;   // 핀테크번호

    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = "T991671660U" + countnum; // 은행거래고유번호

    var newDate = new Date();
    var nowTime = newDate.toFormat('YYYYMMDDHH24MISS');
    var nowDay = newDate.toFormat('YYYYMMDD');

    var userSelectSql = "SELECT * FROM user WHERE id = ?";

    connection.query(userSelectSql, [userId], function(err, results){
        if(err){
            throw err;
        } else {

            var userAccessToken = results[0].accesstoken;

            // api 옵션들 설정 (user/me)
            var option = {
                method : "GET",
                url : "https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num",
                headers : {
                    Authorization : "Bearer "+ userAccessToken
                },
                qs : {
                    // 쿼리 보냄
                    bank_tran_id : transId,
                    fintech_use_num : finusenum,
                    inquiry_type : "A",
                    inquiry_base : "D",
                    from_date  : "20201101",
                    to_date  : nowDay,
                    sort_order : "D",
                    tran_dtime : nowTime
                }
            }

            // api에 요청 
            request(option, function(error, response, body){
                var requestResultJSON = JSON.parse(body);
                console.log(requestResultJSON);
                res.json(requestResultJSON);
            });

        }
    });



});

//---------------------- 출금  --------------------------
app.post('/withdraw', auth, function(req, res){
 
    var finusenum = req.body.fin_use_num;   // 현재 로그인한 사용자의 핀테크번호
    var tofinusenum = req.body.to_fin_use_num;  // 돈을 받을 사용자의 핀테크 번호

    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = "T991671660U" + countnum; // 은행거래고유번호

    var amount = req.body.amount;

    var newDate = new Date();
    var nowTime = newDate.toFormat('YYYYMMDDHH24MISS');

    var userId = req.decoded.userId; 
    var userSelectSql = "SELECT * FROM user WHERE id = ?";

    connection.query(userSelectSql, [userId], function(err, results){
        if(err){throw err}

        else {

          // 출금
          var userAccessToken = results[0].accesstoken;
          var userSeqNo = results[0].userseqno;

          var option = {
            method : "POST",
            url : "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
            headers : {
                Authorization : "Bearer " + userAccessToken
            },

            //get 요청을 보낼때 데이터는 qs, post 에 form, json 입력가능
            json : {
                "bank_tran_id": transId,
                "cntr_account_type": "N",   // 고정값
                "cntr_account_num": "7836598807",   // 사이트에서 계좌관리 들가면 있음
                "dps_print_content": "쇼핑몰환불",  // 고정값
                "fintech_use_num": finusenum,
                "wd_print_content": "오픈뱅킹출금", // 고정값
                "tran_amt": amount,
                "tran_dtime": nowTime,
                "req_client_name": "홍길동",    // 고정값
                "req_client_fintech_use_num" : finusenum,
                "req_client_num": "HONGGILDONG1234",    // 고정값
                "transfer_purpose": "ST",   // 고정값
                "recv_client_name": "진상언",   // 고정값
                "recv_client_bank_code": "097", // 고정값
                "recv_client_account_num": "7836598807" // 사이트에서 계좌관리 들가면 있음
            }
          };

          request(option, function (error, response, body1) {

            // 입금 전용 accessToken 부여
            var option = {

                method : "POST",
                url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
                headers : {
                    "Content-Type" : "application/x-www-form-urlencoded"
                },
                form : {
                    client_id : api_info[0],
                    client_secret : api_info[1],
                    scope : "oob",
                    grant_type : "client_credentials"
                
                }
            };


            request(option, function(error, response, body){
                var acctoken2 = JSON.parse(body);
                acctoken2 = acctoken2.access_token;

                // 입금
                console.log(acctoken2);


                if(body1.rsp_code == "A0000"){
                    var countnum2 = Math.floor(Math.random() * 1000000000) + 1;
                    var transId2 = "T991671660U" + countnum2; // 은행거래고유번호

                    var option = {

                        method : "POST",
                        url : "https://testapi.openbanking.or.kr/v2.0/transfer/deposit/fin_num",
                        headers : {
                            Authorization : "Bearer " + acctoken2
                        },

                        json: {
                            "cntr_account_type" : "N",
                            "cntr_account_num" : "5612035165",
                            "wd_pass_phrase" : "NONE",
                            "wd_print_content" : "환불금액",
                            "name_check_option" : "on",
                            "tran_dtime" : nowTime,
                            "req_cnt" : 1,
                            "req_list" : [{
                                "tran_no": "1",
                                "bank_tran_id": transId2,
                                "fintech_use_num": finusenum,
                                "print_content": "오픈서비스캐시백",
                                "tran_amt": "500",
                                "req_client_name": "김오픈",
                                "req_client_num": "HONGGILDONG1234",
                                "req_client_fintech_use_num": finusenum,
                                "transfer_purpose": "ST"
                            }]
                        }
                    }
                }
                    request(option, function(error, response, body){
                        console.log(body);
                        res.json(body);
                    });

            
        });


    });
        
}});

});


//---------------------- 서버 실행 ----------------------
app.listen(3000, function(){
    console.log('서버가 3000번 포트에서 실행중 입니다.');
})

