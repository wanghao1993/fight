## 1.babelParserDefaultPlugins

列举三个babel插件

1.[大数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

2.[可选链](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

3.[控制合并运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator)

第二个和三个对于提升编码幸福感，非常有用。强烈建议安装
```js
/**
 * List of @babel/parser plugins that are used for template expression
 * transforms and SFC script transforms. By default we enable proposals slated
 * for ES2020. This will need to be updated as the spec moves forward.
 * Full list at https://babeljs.io/docs/en/next/babel-parser#plugins
 */
export const babelParserDefaultPlugins = [
  'bigInt',
  'optionalChaining',
  'nullishCoalescingOperator'
] as const
```

## 2.EMPTY_OBJ
```ts
export const EMPTY_OBJ: { readonly [key: string]: any } = __DEV__
  ? Object.freeze({})
  : {}
```
返回一个空对象，dev模式下使用了`Object.freeze`这个对象方法。

**freeze**
这个方法的主要目的是冻结对象，但是仅仅只能冻结第一层属性，对象中的对象无法冻结。

```js
const a = Object.freeze({
    b: 1
})
a.b = 2 // 无法修改

const c = Object.freeze({
    b: {
        d: 1
    }
})
c.b.d = 2 // 可以修改
```

Tips:
`Vue中对于仅仅是展示的数据可以用这个API冻结起来，来提高性能`

## 3.EMPTY_ARR
和上面的类似
```ts
const EMPTY_ARR = __DEV__ ? Object.freeze([]) : []
```

## 4.NOOP
作用：返回一个空函数

当我看到这个函数的时候我是疑惑的？我觉得很多人都会有这种疑惑。经过我查阅资料得到以下结论：

1. 回调函数默认值，减少判断
    ```js
    例如：function test(a, b, cb = Noop) {
        cb()
        // 如果没有Noop的时候cb()就会报错，或则需要多一层判断 cb&&cb()
    }
    ```
2. 便于代码压缩

    
3. 

## 5.No
永远返回false
```ts
const NO = () => false
```

## 6.isOn
判断是否是on开头的，可以拿来判断是不是事件
```ts
const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

isOn('onClick') // true
isOn('onclick') // true
```
`^`正则中表示取反，翻译成人话就是 不是以on开头后面跟了小写a-z的字符串

## 7.isModelListener
判断字符串是否以`onUpdate:`开头
```ts
const isModelListener = (key: string) => key.startsWith('onUpdate:')
```
`startsWith`字符串的新方法还有`padStart`,`padEnd`,`endsWith`

## 8.extend
` Object.assign`合并对象，可以看我之前写的关于对象的文章[# 夯实基础（二）-对象](https://juejin.cn/post/6844904197859573768#heading-25)
```js
const extend = Object.assign
```

## 9.remove
移除数组的某一项，不多赘述，实现方法有很多，例如使用`filter`
```ts
export const remove = <T>(arr: T[], el: T) => {
  const i = arr.indexOf(el)
  if (i > -1) {
    arr.splice(i, 1)
  }
}
```

## 10.hasOwn
判断某个对象是否有该属性，`不包括原型链上的`
```ts
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)
```

## 11.isArray
判断是否是数组
```js
Array.isArray
```

## 12.isMap
判断是否是map
```js
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]'
```

## 13.isSet
判断是否是set
```js
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]'
```
使用`toTypeString`方法校验

## 14.toTypeString
实际上就是`Object.prototype.toString`，可以精确的判断任何数据类型。
```js
export const toTypeString = value =>
  objectToString.call(value)
  
export const objectToString = Object.prototype.toString
```

## 15.isDate
判断是否是日期，使用`instanceOf` 判断，instanceOf的原理就是 在实例的`__proto__`一直向上寻找是否存在`xxx.__proto__ `等于某个构造函数的`protoytype`
```js
export const isDate = (val: unknown): val is Date => val instanceof Date
```

**instanceOf模拟**
```js
function myInstanceOf (left, right) {
    const rightProto = right.prototype
    let leftVaule = left.__proto__

    while (true) {
        if (leftVaule === null) {
            return false
        } else if (leftVaule === rightProto) {
            return true
        }

        leftVaule = leftVaule.__proto__
    }
}

var temp = {}
var a = {
    name: 1,
    obj: temp
}

var b = Object.create(a)
console.log(b.obj === a.obj)
```

## 16.判断基本类型
使用`typeof`判断。typeof 返回值有`string, number, boolean, symbol, undefined, function, bigint, object`
```js
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
```

## 17.isObject
判断是否是对象，
```js
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'
```


## 18.isPromise
判断是否是Promise
```js
export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}
// 这里也能用 Object.prototype.toString.call判断，这里之所以这么写。我觉得是因为可以判断自定义的promise
```

## 19.toRawType
获取具体的数据类型，因为通过`Object.prototype.toString.call(a)`得到数据类型一般长这样的。`[object Promise]`，通过`.slice(8, -1)`可以直接得到`Promise`

```js
export const toRawType = (value: unknown): string => {
  // extract "RawType" from strings like "[object RawType]"
  return toTypeString(value).slice(8, -1)
}
```

## 20.isPlainObject

判断是否是纯粹的对象
```js
export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === '[object Object]'
```

## 21.isIntegerKey
判断key是否为 十进制的 数字。
`parseInt`第二个参数为 进制类型
```js
export const isIntegerKey = (key: unknown) =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key
```

## 22.makeMap&&isReservedProp
判断是否是保留关键字，`makeMap`将字符串转换为对象map，值为`true`
```js

export const isReservedProp = /*#__PURE__*/ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ',key,ref,' +
    'onVnodeBeforeMount,onVnodeMounted,' +
    'onVnodeBeforeUpdate,onVnodeUpdated,' +
    'onVnodeBeforeUnmount,onVnodeUnmounted'
)

export function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => boolean {
  const map: Record<string, boolean> = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}
```


## 23.cacheStringFunction

缓存函数
```js
const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as any
}

```

## 24.hasChanged
判断两个对象是否改变
```js
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
  
const a = {}
const b = a
undefined
const c = Object.assign({}, a)
Object.is(a, b) => true
Object.is(a, c) => false
```

## 25.invokeArrayFns
执行数组里的参数一致的函数
```js
export const invokeArrayFns = (fns: Function[], arg?: any) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg)
  }
}
```

## 26.def
定义对象属性，使用`defineProperty`去配置对象的四个属性
```js
export const def = (obj: object, key: string | symbol, value: any) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  })
}

```

## 27.toNumber
转换成number，如果是`NaN`就直接输出，如果是数字就转换成数字
```js
export const toNumber = (val: any): any => {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}
```

## 28.getGlobalThis

获取全局的`this`，优先使用`globalThis`，再其次是`self`，然后是`window`, 然后是`global`,node中是global，`Web Worker` 中不能访问到 `window` 对象，但是我们却能通过 `self` 访问到 `Worker` 环境中的全局对象。

```js
let _globalThis;
export const getGlobalThis = (): any => {
  return (
    _globalThis ||
    (_globalThis =
      typeof globalThis !== 'undefined'
        ? globalThis
        : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
        ? global
        : {})
  )
}
```

初次执行是`undefined`，第二次就不需要执行了，直接取值。