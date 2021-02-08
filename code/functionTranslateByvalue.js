function setName (obj) {
    obj.info = {
        name: {a: 3}
    }

    obj = new Object()

    obj.info = {
        name: { a: 2 }
    }
}


const obj = {
    info: {
        name: {a: 1}
    }
}

setName(obj)

console.log(obj.info)