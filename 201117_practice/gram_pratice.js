

// let은 재할당 가능, const는 재할당 불가능


const div_es6 = (p1, p2) => {
    return p1/p2;
}

console.log(div_es6(1,2));


// class

var car = {
    name : "car_test",
    ph : "500ph",
    start : function(){
        console.log("car start");
    },
    end : function(){
        console.log("car end");
    }
}

console.log(car.name);
car.start();
car.end();



var object_test = {
	name : "sonata",
	ph : "500ph",
	start : function () {
		console.log("engine is starting");
	},
	stop : function () {
		console.log("engine is stoped");
	}
}

var object_test2 = {
    name : "bmw",
	ph : "500ph",
	start : function () {
        console.log('insert keys');
		console.log("engine is starting");
	},
	stop : function () {
		console.log("engine is stoped");
	}
}


var obtest = [object_test, object_test2];
console.log(obtest[1].name)


// for 문 es6

obtest.map( (obj) => {
    console.log(obj.name);
} )


obtest.map( (obj) => {
    if(obj.name == "bmw"){
        console.log("!");
    }
} )


// 동기 비동기

var fs = require('fs');

console.log("첫번째 기능입니다");
fs.readFile('example/test.txt', 'utf8', function(err, result){
    if(err){
        console.error(err);
        throw err;
    } else {
        console.error("두번째 기능 진행중");
        console.log(result);
    }
});
console.log("마지막 기능");