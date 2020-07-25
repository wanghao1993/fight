function carry(fn, ...arg1) {
    return function (...arg2) {
        return fn(...arg1, ...arg2)
    }
}

function add (x, y) {

    return (x + y)
  
}
var res = carry(add, 2)(2)

console.log(res)