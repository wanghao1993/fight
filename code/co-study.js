function* generatorFunc(suffix = ''){  const res = yield 1;  console.log(res, 'generatorFunc-res' + suffix);  const res2 = yield 1;  console.log(res2, 'generatorFunc-res-2' + suffix);  const res3 = yield 1;  console.log(res3, 'generatorFunc-res-3' + suffix);  const res4 = yield 1;  console.log(res4, 'generatorFunc-res-4' + suffix);}function coSimple(gen){  const ctx = this;  const args = Array.prototype.slice.call(arguments, 1);  gen = gen.apply(ctx, args);  console.log(gen, 'gen');  return new Promise((resolve, reject) => {    onFulfilled();    function onFulfilled(res){      const ret = gen.next(res);      next(ret);    }    function next(ret) {      const promise = resolve(ret.value);      promise && promise.then(onFulfilled);    }  });}coSimple(generatorFunc, ' 哎呀，我真的是后缀');



function* gen5() {

    const res1 = yield new Promise((resolve) => resolve(1))
    cosnoel.log(res1)
    const res2 = yield new Promise((resolve) => resolve(2))
    cosnoel.log(res2)
    const res3 = yield new Promise((resolve) => resolve(3))
    cosnoel.log(res3)
    const res4 = yield new Promise((resolve) => resolve(4))
    cosnoel.log(res4)
    const res5 = yield new Promise((resolve) => resolve(5))
    cosnoel.log(res5)
    const res6 = yield new Promise((resolve) => resolve(6))
    cosnoel.log(res6)
}