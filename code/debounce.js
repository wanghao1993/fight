function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = [...arguments];
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args)
      }, wait);
    }
  }

function throttle(func, wait) {
    var previous = 0;
    return function() {
        let now = Date.now();
        let context = this;
        let args = arguments;
        if (now - previous > wait) {
            func.apply(context, args);
            previous = now;
        }
    }
}
