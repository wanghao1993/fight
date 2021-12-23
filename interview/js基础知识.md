# JS基础

###### 原型和原型链

    原型：每个构造函数都有一个原型对象指向本身，每个实例都会有个内部__proto__指向构造函数的原型，构造函数的原型对象又有一个构造器指constructor指向构造函数本身

    原型链：每个对象都有一个prototype, prototype本身也是对象，所以它也有prototype，通过这个链接起来的链就是原型链，最终指向null

###### JS如何实现继承
- 原型继承
```js
function Person () {
    this.eyesCount = 2
}

function Women () {
    this.handsCount = 2
}
Women.prototype = new Person()

const xiaohong = new Women()

```
- 构造函数
  
```js
function Father () {
    this.name = 'father'
}

function Son () {
    this.role = 'son'
    Father.call(this)
}

const xiaoming = new Son()
```

- 组合继承
```js
function Father () {
    this.name = 'father'
}

function Son (sonname) {
    this.role = 'son'
    this.sonname = sonname
    Father.call(this)
}

Son.prototype.sayName = function () {
    console.log(this.sonname)
}

const xiaoming2 = new Son()

```
- 原型式继承

```js

const originObj = {
    a: 1
}

const cloneObj = Object.create(originObj)

```
- 寄生继承

```js
const node = {
    x: 1,
    y: 2
}

function Extend () {
    const clone = Object.create(node)

    clone.sayName = function (name) {
        this.name = name
    }
    return clone
}
```
- 寄生组合继承

```js
function sup () {}

function sub () {
    sup.call(this)
}

function inhiret(sub, sup) {
    const o = Object.create(sup.prototype)
    sub.prototype = 0
    o.constructor = sub
}

inhiret(sub, sup)

new sub()

```
- Extend继承

掠过




##### 作用域链

当执行一个函数的时候，会创建一个执行上下文，执行上下文包含一个指向outer的环境记录器，这个outer形成的链就是作用域链

##### 闭包

概念：满足两个条件，1.函数 2.函数访问了自由的变量或非当前作用域中的变量

```js
// exp1
var a = 1

function foo () {
    console.log(a)
}

// exp2

function a () {
    const num = 0

    function b () {
        return nub
    }
    return b
}

const foo = a()
foo()
```

##### this指向

