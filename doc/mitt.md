# tiny-emitter

功能，一个事件订阅和发布的事件中心

# 思考

一个事件中心应该包含哪些功能

· 发布
· 订阅
· 取消订阅
· 一次执行
基本上起码要包含以上几种方法

# 源码分析

```js
// 第一步：新建一个类别
function E () {

}
// 原型
E.prototype = {
  // on 方法
  // e是一个对象，维护了事件的名称和cb
  // e: {
      'eventName': [{
          ctx: _this1,
          fn: () => {console.log(1)}
      }, {
          ctx: _this2,
          fn: () => {console.log(3)}
      }]
  }
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },
  
  // once 方法
  // 创建一个listener，通过调用off，在执行一次就移除掉
  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  // emit方法

  emit: function (name) {
    // emit 参数
    var data = [].slice.call(arguments, 1);
    
    // 当前事件下面的所有cb的拷贝
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;
    
    // 执行
    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  // off 方法

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    // 某个事件 cb list
    var evts = e[name];
    var liveEvents = [];
    // 如果存在 evts and cb
    // 过滤出cb不一致的
    // 这里可以用filter改造

    // const liveEvents = evts.filter(item => item.fn != callback && item.fn._ != callback /* 用于once的取消订阅 */)
    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    // 将过滤掉的重新赋值
    // 或则直接删除掉eventName
    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;
module.exports.TinyEmitter = E;
```

# 总结

通过源码不难发现，支持链式调用