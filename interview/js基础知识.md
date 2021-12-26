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

##### 闭包的运用

```js
1.私有化

const haha = function () {
    const origin = {
        a: 1,
        b: 2
    }

    return function test () {
        const obj = Object.create(origin)
        return obj
    }
}

const a = haha()()

这样形成私有化，内部origin 无法改变

2.模拟块级作用域自己作用域

```
##### js代码是怎么执行的

分两个阶段：编译和执行。

```js

编译阶段：是将js代码拿来创建执行上下文，并且创建变量环境，词法环境和可执行代码，并且将创建的执行上下文压入执行栈

const c = 1
function a () {
    const b = 1
    const c = b * 2

    function f () {
        console.log(c)
    }

    return f()
}

// 首先执行一段函数的时候会产生一个执行上下文栈，LIFO

// Execution context stack，ECS

const stack = []

// 编译阶段 
stack.push('global ECS')

stack.push('a ECS')

stack.push('c ECS')

// 产生执行上下文和可执行代码

// 执行上下文会包含 变量环境和词法环境

// 变量环境中存储var申明的变量，词法环境中申明let，const申明的变量

// 可执行代码有，
// b = 1, b * 2, console.log(c)

// 执行阶段

js采用的是词法作用域，词法作用域是静态作用域，在函数创建的时候就已经决定了。
```

##### this指向

根据js是怎么执行的，我们就知道了，this的指向

1.由new调用：绑定到新创建的对象

2.由call或apply、bind调用：绑定到指定的对象

3.由上下文对象调用：绑定到上下文对象

4.默认：全局对象