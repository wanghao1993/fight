---
theme: awesome-green
---
# 前言

作为一个工作了4年的前端菜鸟，我想是时候沉淀一下了。思来想去还是觉得从使用的框架Vue开始，于是我打算使用1-2个月的时间，来详细阅读Vue的源码，虽然之前粗略的阅读过几次。

# 目标

搞清楚各个模块的作用，梳理Vue初始化的主要流程。

# 阅读前准备

此次阅读是基于`V2.6.14`

1.github下载Vue源码

2.安装包

3.创建test html文件

# 目录结构说明

```
.
├── BACKERS.md
├── LICENSE
├── README.md
├── benchmarks // 性能测试
│   ├── big-table
│   ├── dbmon
│   ├── reorder-list
│   ├── ssr
│   ├── svg
│   └── uptime
├── dist // 编译后的目录
├── examples // 🌰
│   ├── commits
│   ├── elastic-header
│   ├── firebase
│   ├── grid
│   ├── markdown
│   ├── modal
│   ├── move-animations
│   ├── select2
│   ├── svg
│   ├── test.html
│   ├── todomvc
│   └── tree
├── flow // flow申明
│   ├── compiler.js
│   ├── component.js
│   ├── global-api.js
│   ├── modules.js
│   ├── options.js
│   ├── ssr.js
│   ├── vnode.js
│   └── weex.js
├── package.json
├── packages // 一些额外的包，可以独立发布
│   ├── vue-server-renderer
│   ├── vue-template-compiler
│   ├── weex-template-compiler
│   └── weex-vue-framework
├── scripts // 一些脚本 例如 build 和 release的脚本 可以阅读看看
│   ├── alias.js
│   ├── build.js
│   ├── config.js
│   ├── feature-flags.js
│   ├── gen-release-note.js
│   ├── get-weex-version.js
│   ├── git-hooks
│   ├── release-weex.sh
│   ├── release.sh
│   └── verify-commit-msg.js
├── src // 核心模块，重点要讲解的模块
│   ├── compiler
│   ├── core
│   ├── platforms
│   ├── server
│   ├── sfc
│   └── shared
├── test // 测试模块
│   ├── e2e
│   ├── helpers
│   ├── ssr
│   ├── unit
│   └── weex
├── types // ts 声明
│   ├── index.d.ts
│   ├── options.d.ts
│   ├── plugin.d.ts
│   ├── test
│   ├── tsconfig.json
│   ├── typings.json
│   ├── umd.d.ts
│   ├── vnode.d.ts
│   └── vue.d.ts
└── yarn.lock

```

为了更好的调试，我们在test下新建一个`test.html`，然后引入`dist/vue.js`

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="./../dist/vue.js"></script>
```

准备工作基本已经完毕，现在开始看主流程。

# 初始化
`src/core/index.js`，

 ```js
 import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'
 ```
 
Vue从`./instance/index`导入

```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue

```

初始化，主要是这个`_init方法`。

它在`instance/init`中定义，一共包含四个方法`initMixin`, `initInternalComponent`, `resolveConstructorOptions`, `resolveModifiedOptions`
   
## initMixin

这个函数的主要功能是初始化一些东西：具体什么内容会在注释中注明；
```js
let uid = 0
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    // 每个vue实例 都会生成一个uid，且自增
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    // 合并options 子组件和根组件合并配置项有不同
    // 优化子组件的options的合并
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    // 设置代理，将 vm 实例上的属性代理到 vm._renderProxy
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // initLifecycle 初始化 $parent, $root, $children, $refs
    initLifecycle(vm)
    // 初始化事件
    initEvents(vm)
    
    // 初始化 $slots，$scopedSlots, 挂载$createElement
    // 将$attrs, $listeners设置为响应式
    initRender(vm)
    
    // 调用 beforeCreate
    callHook(vm, 'beforeCreate')
    
    // 在 data/props 初始化之前，初始化 inject，并且在初始化的时候，切换为非 响应式状态
    // 所以 inject的是非响应式的
    initInjections(vm) // resolve injections before data/props
    
    // 初始化数据 props, data, method, computed等等
    initState(vm)
    
    // 初始化provide
    initProvide(vm) // resolve provide after data/props
    
    // 调用 created 钩子
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }
    // 挂在到el上
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```

## resolveConstructorOptions 
这个函数作用是，合并options

```js
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 是否存在父类，如果存在父类就递归
  if (Ctor.super) {
    // 递归合并options, 如果是基类的话
    const superOptions = resolveConstructorOptions(Ctor.super)
    // 如果options发生改变就需要重新合并
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      // 如果options发生改变就需要重新合并
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      // 然后重新合并
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

```
通过debugger，我们可以看到合并后的`$options`如下图：

![init.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ad30464a3a5f411b972bee53d17decc4~tplv-k3u1fbpfcp-zoom-1.image)

合并了，初始化时候传入的`options` 以及 vue 构造函数的一些属性

## resolveModifiedOptions

这个函数的功能是用来 如果 super的option发生了改变就通过遍历的方式，新旧不一样就重新赋值
```js
function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}

```


# $mount

通过断点调试。我们知道$mount的方法定义在`platforms/web/runtime/index.js`

```js
// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
$mount只做了一件事情，执行了`mountComponent`

```
# mountComponent
updateComponent主要做了几件事情：

1.执行`beforeMount`生命周期函数；

2.执行挂载，获取vdom并转换为dom;

3.调用`_update`方法；

4.创建组件的`Watcher`

5.执行`mounted`生命周期函数；

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  callHook(vm, 'beforeMount')

  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

# 总结

new Vue()的主流成，实际上看起来还是比较简单的。

1.通过调用`_init`进行初始化

2.初始化`$parent, $root, $children, $refs`

3.初始化一些自定义事件，包括新旧事件的对比和更新

4.初始化 `$slots，$scopedSlots, $createElement`

5.调用`beforeCreate`

6.在data/props初始化之前，初始化 `inject`，并且在初始化的时候，切换为非 响应式状态

7.初始化数据 props, data, method, computed等等

8.初始化`provide`

9.调用`created`钩子函数

10.如果有`el`就自动挂载执行`$mount`，如果没有就需要手动调用 `$mount`

11.$mount执行`mountComponent`；

    11.1 执行`beforeMount`生命周期函数；

    11.2 执行挂载，获取vdom并转换为dom;

    11.3 调用`_update`方法；

    11.4 创建组件的`Watcher`

    11.5 执行`mounted`生命周期函数；
   
到这里这个初始化到渲染的流程基本走完了，至于具体的细节，我们后面再说

# 下一节预告

响应式原理，以及实现及简版Vue

# 最后
看了一下似乎也没有那么难，
卑微求关注，求点赞，希望大家关注一下我的公众号[前端工兵](https://wh-blog.obs.cn-south-1.myhuaweicloud.com/qrcode_for_gh_32e7bfb8e243_430.jpg)，我们一起进步，写的不好的，喷轻点～
