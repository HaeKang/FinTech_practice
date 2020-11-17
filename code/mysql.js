// mysql
var mysql_info = require("./mysql_info.js");

var mysql = require('mysql');
var connection = mysql.createConnection({
	host: mysql_info[0],
	user: mysql_info[1],
	password: mysql_info[2],
	port: mysql_info[3],
	database: mysql_info[4]
});

// module.exports = connection;

connection.connect();

connection.query('SELECT * FROM user', function(error, results, fields){
    if(error) throw error;
    console.log(results);
});

connection.end();