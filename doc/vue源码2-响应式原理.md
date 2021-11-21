# 前言

第一节[初始化过程](https://juejin.cn/post/7020205624969396231#heading-0)介绍了，Vue的初始化过程是怎么样的，这一节，我们主要看一下Vue的响应原理，以及具体的细节，最后自己实现一个miniVue

# 目标

清楚Vue的响应原理，并且实现一个miniVue

# 响应原理

通过第一节的阅读，我们搞清楚了，数据的响应初始化是在 `src/core/instance/state.js` 中实现的。

```js
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

## initState

1. 将`_watchers`设置为[]

2. 初始化`props`

3. 初始化`methods`

4. 初始化`initData`

5. 初始化`computed`

6. 初始化`watch`

通过上面的顺序可以得知，相同变量名称的优先级是`props>methods>data>computed`

## initProps

```js
function initProps (vm: Component, propsOptions: Object) {
    // 获取 props
  const propsData = vm.$options.propsData || {}
  // 清空 _props
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  
  // 缓存props的key
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  // 如果不是根组件，就禁止初始化为响应式
  if (!isRoot) {
    toggleObserving(false)
  }
  // 遍历props
  for (const key in propsOptions) {
    keys.push(key)
    
    // validateProp 校验prop
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      
      // 关键字校验，如果是保留关键字就warning
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      
      // 避免直接修改props中的值，因为父组件渲染的时候会被重制，如果需要用的花 最好使用data和 computed代替
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
    // 设置 props 代理
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  // props init完成后 将 toggleObserving 设置为true
  toggleObserving(true)
}

```

## initMethods

```js
function initMethods (vm: Component, methods: Object) {
// 获取props
  const props = vm.$options.props
  // 遍历methods
  for (const key in methods) {
  //判断是否在props中被定义过
    if (process.env.NODE_ENV !== 'production') {
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 如果没有就绑定到 vm 上。以便能够通过this.xxx去访问
    // noop 是预定义的一个空函数
    // 可以看前面写的，vue中的工具函数解析
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}
```

## initData
1. 前置判断，data需要是一个函数，返回一个对象

2. data中的key 不能出现在mehods和props中

3. 为data设置响应式，并且代理到vm._data上
```js
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}
```

## initComputed

1. 为computed创建Watcher`_computedWatchers`

2. 重复性判断`props`, `methods`, `data`

3. `defineComputed`

```js
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  // 为computed创建Watcher 用来缓存
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()
  
  // 遍历computed
  for (const key in computed) {
    const userDef = computed[key]
    // 如果是个函数就使用，用户自定义的 getter
    // 否则取自定义对象中的get
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }
    // 为每一个computed的创建一个Watcher
    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    // 判断vm中是否已经有，如果没有就重新定义
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
    // 重复性判断
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(`The computed property "${key}" is already defined as a method.`, vm)
      }
    }
  }
}
```

## defineComputed

1. 定义get

2. 定义get

```js
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  // shouldCache 是否需要缓存，服务端不缓存
  const shouldCache = !isServerRendering()
  
  // userDef是函数
  if (typeof userDef === 'function') {
    // sharedPropertyDefinition 是一个通用的对象模型
    
    // const sharedPropertyDefinition = {
    //  enumerable: true,
    //  configurable: true,
    //  get: noop,
    //  set: noop
    // }
    
    // shouldCache => true createComputedGetter
    // shouldCache => false createGetterInvoker
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
  // 是否是用户自定义的get set
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  
  // 在vm 设置  computed 属性
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

```

## initWatch

1. 遍历watch，如果某个watch的handler是数组，那么就遍历这个handler

2. 创建watcher

3. createWatcher通过`$watch`创建`watch`
```js
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}


```

## observe
`observe`函数，接受两个参数，一个是需要被观察的对象`value`，一个是`asRootData`


```js
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 如果不是对象，或则是Vnode 就 返回 不观察
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 如果该对象已经有__ob__，并且value.__ob__是Obersever的实例，那么直接获取
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
    // 否则新建Observer
    
    // shouldObserve，通过toggleObserving来切换状态
    // toggleObserving这个函数用来控制对象是否需要被观察
    // isExtensible 如果被Object.frooze了就无法被观察
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

```
## Observer

Observer对象，包含`value`,`dep`, `vmcount`,`observeArray`,`walk`几个属性

```js

export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // 为对象设置 __ob__，第二次直接获取该对象的 observe
    def(value, '__ob__', this)
    // 如果是函数走单独的处理方法
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      // walk
      this.walk(value)
    }
  }
  
  // walk 方法遍历key值，分别设置响应式
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  // 数组的observe
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}
```

## defineReactive

defineReactive，是Vue的核心所在，也是响应式原理最直接的体现。

```js
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  
  
  // 新建一个dep， 下一步解析Dep是什么
  const dep = new Dep()
  // 获取obj[key]的 配置数据属性
  
  // 如果该数据的 configurable是false 就直接返回
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  
  // 获取 getter， setter
  const getter = property && property.get
  const setter = property && property.set
  
  // 如果 getter不存在或者存在setter 并且 只有obj 和key 那么 value = obj[key]
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
  
  // 是否存在子对象
  let childOb = !shallow && observe(val)
  
  // 为data中的属性，设置拦截器
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // getter 是否存在get。如果存在就用get，如果不存在就使用obj[key]
      const value = getter ? getter.call(obj) : val
      
      // 判断Dep是否有 target
      // 在get的时候就会触发watcher 的get。这时候就会Dep.target设置为当前get的属性值的dep的taget
      if (Dep.target) {
        dep.depend()
        // get的时候依赖收集
        if (childOb) {
          childOb.dep.depend()
          // 如果是数组就递归遍历依赖收集
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      // 自定义 setter
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      // set的时候 调用dep的notify方法，通知收集的依赖方
      dep.notify()
    }
  })
}
```
## Dep

Dep类，Dep类是一个订阅器，包含添加订阅者，移除订阅者，以及通知订阅者，可以把它理解成一个调度中心，一个属性对应一个Dep

```js
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;
  // 一个属性一个Dep
  // Dep 包含一个target, id 以及订阅者，还有一系列的方法
  constructor () {
    this.id = uid++
    this.subs = []
  }
  // 添加订阅者
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }
  // 移除订阅者
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }
  // Dep的侦听器 Watcher添加一个Dep
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  // 通知订阅者更新
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}

```

## Watcher

一个组件对应一个 Renderwatcher，一个computed对应一个Watcher, 一个watch对应一个Watcher,

`Renderwatche`的时候会把 

```js
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    // _watcher = isRenderWatcher
    if (isRenderWatcher) {
      vm._watcher = this
    }
    
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  
  // 当出发watcher 的get的时候，会将当前的watcher 赋值给 Dep.target，并且在targetStack中push一个
  
  // 见Dep类中的pushTarget方法
  get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          const info = `callback for watcher "${this.expression}"`
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info)
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
```