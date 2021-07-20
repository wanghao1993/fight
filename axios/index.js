/*
 * @Author: your name
 * @Date: 2021-07-20 21:41:52
 * @LastEditTime: 2021-07-20 21:44:11
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /fight/axios/index.js
 */


class myAjax {
    constructor (options) {
        this._options = options
        return this.init()
    }

    init () {
        const promise = new Promise((resolve, reject) => {
            resolve(1)
        })

        return promise
    }
}