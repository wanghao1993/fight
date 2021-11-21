function E () {

}


E.prototype = {
    on: function (name, cb, ctx) {
        const e = (this.e || (this.e = {}))

        (e[name] || (e[name] = [])).push({
            cb,
            ctx
        })

        return this
    },

    off: function (name, cb) {
        const e = (this.e || (this.e = {}))

        const evt = this.e[name]
        
        const restEvtArr = []

        if (evt && cb) {
            for (let i = 0; i < evt.length; i++) {
                if (evt[i].cb !== cb) {
                    restEvtArr.push(evt[i])
                }
            }
        }

        restEvtArr.length ? evt = restEvtArr : delete this.e[name]

        return this
    },

    emit: function (name) {
        // 获取emit发送的参数
        const data = [].slice.call(arguments, 1)
        const evtArr = ((this.e || (this.e = {}))[name] || []).slice()
        let i = 0
        const len = evtArr.length

        for (i; i < len; i++) {
            evtArr[i].fn.apply(evtArr[i].ctx, data);
        }

        return this
    },

    once: function (name, cb, ctx) {
        
    }

}