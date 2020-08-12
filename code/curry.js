
const curry = (fn, ...args) => (...args2) => fn.apply(null, [].concat(...args, ...args2))

const add = (...args) => {
    return [...args].reduce((a,b) => a + b)
}

var curryAdd = curry(add, 10)

console.log(curryAdd(1, 2,2)) // 3


function a() {
    let b = {}
    return (function () {
        return b
    })()
}

function c() {
    let b = a()
    console.log(b)
}
c()