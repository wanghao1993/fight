##### 1.防抖
作用：停止动作后多久才开始执行函数
```js
function debounce (fn, delay = 300, imm) {
    let timer

    return function () {
        if (imm) {
            fn.apply(this, arguments)
        }
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            fn.apply(this, arguments)
        }, delay)
    }
}

```
##### 2.节流
多久执行一次
```js
function throttle (fn, delay = 300) {
    let lastTime
    return function () {
        const now = +new Date()
        if (now - lastTime > wait) {
            fn.apply(this, arguments)
        }
    }
}
```
##### 3.new
new操作符做了这些事：

1.它创建了一个全新的对象。

2.它会被执行[[Prototype]]（也就是__proto__）链接。

3.它使this指向新创建的对象。。

4.通过new创建的每个对象将最终被[[Prototype]]链接到这个函数的prototype对象上。
如果函数没有返回对象类型Object(包含Functoin, Array, Date, RegExg, Error)，那么new表达式中的函数调用将返回该对象引用。
```js

function MyNew (func, ...args) {
    const obj = {}

    if (func.prototype !== null) {
        obj.__proto__ = func.prototype;
    }

    let res = func.call(obj, ...args)

    if (res && (typeof obj === 'object' || typeof obj === 'function')) {
        return res
    }

    return obj
}

```

##### 4.call, apply, bind

```js
Function.prototype.call2 = function (ctx = globalThis) {
    ctx.fn = this

    const res = ctx.fn(...args)

    delete ctx.fn

    return res
}
```
##### 5.发布订阅
```js

function E () {}

E.prototype = {
    event: {},
    on: function (ename, fn) {
        if (this.event[ename]) {
            this.event[ename].push(fn)
        } else {
            this.event[ename] = [fn]
        }
    },
    
    remove: function (ename) {
        delete this.events[ename]
    },

    emit: function (ename) {
        this.events[ename].forEach(fn => {
            fn.apply(this, args)
        })
    }
}


```
##### 6.instanceOf

###### 7.Promise

###### 8.async/await

```js
function asyncToGenerator(generatorFunc) {
    return function() {
      const gen = generatorFunc.apply(this, arguments)
      return new Promise((resolve, reject) => {
        function step(key, arg) {
          let generatorResult
          try {
            generatorResult = gen[key](arg)
          } catch (error) {
            return reject(error)
          }
          const { value, done } = generatorResult
          if (done) {
            return resolve(value)
          } else {
            return Promise.resolve(value).then(val => step('next', val), err => step('throw', err))
          }
        }
        step("next")
      })
    }
}

```
###### 9.深拷贝

简单实现一下
```js

const isObject = o => Object.prototype.toString.call(o) === '[object Object]'

const isArray = o => Object.prototype.toString.call(o) === '[object Array]'

const isDate = o => Object.prototype.toString.call(o) === '[object Date]'

const isNull = o => o === null
function deepClone (Obj) {
    if (typeof Obj !== 'object') return Obj
    let cloneObj = isArray(Obj[key]) ? [] : {}
    for (const key in Obj) {
        if (isObject(Obj[key]) || isArray(Obj[key])) {
            cloneObj[key] = deepClone(Obj[key])
        } else if (isDate(Obj[key])) {
            cloneObj[key] = new Date(Obj[key])
        } else {
            cloneObj[key] = Obj[key]
        }
    }

    return cloneObj
}

```

###### 10.数组flatten扁平化

```js
function flatten (arr, n = 1) {
    if (Array.isArray(arr)) {
        throw Error('First argument must be an array')
    }

    if (!arr.length) return []
    let count = 0
    
    let res = []
    const loop = a => {
        res = []
        a.forEach(item => {
            if (Array.isArray(item)) {
                res = res.concat([...item])
            } else {
                res.push(item)
            }
        })

        count++

        if (count < n) {
            loop(res)
        }
    }

    loop(arr)

    return res
}
```