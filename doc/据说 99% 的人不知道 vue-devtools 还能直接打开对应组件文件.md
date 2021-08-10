**这是我参与8月更文挑战的第1天，活动详情查看：[8月更文挑战](https://juejin.cn/post/6987962113788493831 "https://juejin.cn/post/6987962113788493831")**
>首先感谢[若川大佬](https://juejin.cn/user/1415826704971918)组织的这次源码阅读，原文地址[据说 99% 的人不知道 vue-devtools 还能直接打开对应组件文件？本文原理揭秘](https://juejin.cn/post/6959348263547830280)

# 1.学习内容
  - vue-devtools打开对应文件的原理以及vscode的调试方式

# 2.准备
 - vscode
 - vue-devtools Vue3版本
 - vue3 demo项目

# 3.Vue-devtools是什么
对于vue开发者来说。对这个再熟悉不过了，如果不熟悉的参考一下文档vue-devtools。
1. 工具的主要功能有
2. 查看组件
3. 查看数据，修改数据以便模拟不同数据时候页面的表现形式
4. 查看vuex的事件和数据
5. 打开组件对应的vue文件
6. 查看render code
7. 查看vue组件对应的dom

**这次主要是探寻第4点的原理**

# 4.学习目的
1. 掌握vscode的调试方式
2. 掌握vue-devtools打开组件对应的vue文件的原理

# 5.掌握调试和原理

## 5.1 原理

原理很简单，就是使用`code`命令，
```js
code xxx
```
在命令后工具中输入`code`，如果出现以下提示就是 本机没有code，需要安装
```
~ % code
zsh: command not found: code
```

在mac中的vscode中 使用 `command + shift + p`可以召唤出安装窗口，输入shell 就可以看到，然后点击安装

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eeed62c277884263beed8beee43a986f~tplv-k3u1fbpfcp-zoom-1.image)

## 5.2 调试
  打开准备好的vue3项目，找到package.json文件，可以看到debug
  
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/411af0de3c0d42488fc30f915c276370~tplv-k3u1fbpfcp-zoom-1.image)

1. 切换vscode到debug 模块
2. 通过package.json中的debug启动serve

在[vue-devtools](https://devtools.vuejs.org/guide/open-in-editor.html#vue-cli-3)官网可以看到，支持 Open Components in Editor 的功能来自 [launch-editor-middleware](https://github.com/yyx990803/launch-editor#middleware)。

  > 
  > 1.vue-cli 3支持这个功能。开箱即用
  
  >  ```js
  >  Vue CLI 3 supports this feature out-of-the-box when running vue-cli-service serve.
  > ```

  > 2.也可以通过webpack单独引入，具体可以参考官方文档 [webpack中使用open-in-editor](https://devtools.vuejs.org/guide/open-in-editor.html#webpack)

3.通过官方文档得知，如何唤起这个功能，是通过express
```js
app.use('/__open-in-editor', openInEditor())
```
当触发该功能的时候，可以在network中看到有个如下的请求。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1dd62bac6ae34fd0bac8a0c399ed9e24~tplv-k3u1fbpfcp-zoom-1.image)



4.我们在 node_modules  中搜索 `launch-editor-middleware` 这个包，查看index.js这个文件

看到其中的代码如下：

```js
const url = require('url')
const path = require('path')
const launch = require('launch-editor')
module.exports = (specifiedEditor, srcRoot, onErrorCallback) => {
  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  if (typeof srcRoot === 'function') {
    onErrorCallback = srcRoot
    srcRoot = undefined
  }

  srcRoot = srcRoot || process.cwd()

  return function launchEditorMiddleware (req, res, next) {
    const { file } = url.parse(req.url, true).query || {}
    if (!file) {
      res.statusCode = 500
      res.end(`launch-editor-middleware: required query param "file" is missing.`)
    } else {
      launch(path.resolve(srcRoot, file), specifiedEditor, onErrorCallback)
      res.end()
    }
  }
}
```

从整体来看，整个方法是采用了一个闭包的方式实现一个模块化。

4～13行，通过判断传入的类型，来给变量重新赋值，简化了操作者的使用，在不想要传入全部参数的时候传入最后一个参数。

15行，作用是获取当前文件的根目录，如果没有传入就使用，执行serve命令的目录

17行以后就是判断是否有文件，如果没有文件就返回，`launch-editor-middleware: required query param "file" is missing.`  否则就执行launch的方法，该方法来自 `launch-editor`.

此时我们可以在 launch 函数这里打一个断点。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8778b37cc1a1448eb348891ae94359d2~tplv-k3u1fbpfcp-zoom-1.image)


然后，在启动的项目上使用vue-devtools 打开文，不出意外会在此处停止。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/322877bd2e84473dbbb6f3afdcb68b56~tplv-k3u1fbpfcp-zoom-1.image)

在右上角会出现一个调试工具条，第一个是继续，第二个是跳过当前，第三个是进入到next call中，第四个是跳出。
此时我们可以三个参数分别是什么：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5cdddd46dfb54c308249273ea8d55a17~tplv-k3u1fbpfcp-zoom-1.image)

关注一下 onErrorCallback 他的提示
```js
`To specify an editor, specify the EDITOR env variable or ` 
`add "editor" field to your Vue project config.
```
后面我们解释一下是什么意思，这里可能有些人会遇到打开不到指定文件的问题。

## 5.3 launch-editor 源码解析
先看主函数
```js
function launchEditor (file, specifiedEditor, onErrorCallback) {
  // 首先这里会解析文件
  const parsed = parseFile(file)
  let { fileName } = parsed
  const { lineNumber, columnNumber } = parsed
	// 判断文件是否存在
  if (!fs.existsSync(fileName)) {
    return
  }
	// 前面说过了
  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  onErrorCallback = wrapErrorCallback(onErrorCallback)
	// 看名字，大概是猜测编辑器的意思
  const [editor, ...args] = guessEditor(specifiedEditor)
  if (!editor) {
    onErrorCallback(fileName, null)
    return
  }
  // 使用process 来判断当前系统
	
  // 一些兼容问题
  if (
    process.platform === 'linux' &&
    fileName.startsWith('/mnt/') &&
    /Microsoft/i.test(os.release())
  ) {
    // Assume WSL / "Bash on Ubuntu on Windows" is being used, and
    // that the file exists on the Windows file system.
    // `os.release()` is "4.4.0-43-Microsoft" in the current release
    // build of WSL, see: https://github.com/Microsoft/BashOnWindows/issues/423#issuecomment-221627364
    // When a Windows editor is specified, interop functionality can
    // handle the path translation, but only if a relative path is used.
    fileName = path.relative('', fileName)
  }

  if (lineNumber) {
    const extraArgs = getArgumentsForPosition(editor, fileName, lineNumber, columnNumber)
    args.push.apply(args, extraArgs)
  } else {
    args.push(fileName)
  }
	
  // 防止二次绑定，如果已经有一个进程，并且是命令行工具的时候就kill 掉
  if (_childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    _childProcess.kill('SIGKILL')
  }
	
  // 如果是win32 就执行 cmd
  if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.
    _childProcess = childProcess.spawn(
      'cmd.exe',
      ['/C', editor].concat(args),
      { stdio: 'inherit' }
    )
  } else {
    // 否则就xxx
    _childProcess = childProcess.spawn(editor, args, { stdio: 'inherit' })
  }
  
  // 退出
  _childProcess.on('exit', function (errorCode) {
    _childProcess = null

    if (errorCode) {
      onErrorCallback(fileName, '(code ' + errorCode + ')')
    }
  })
	// 错误的处理
  _childProcess.on('error', function (error) {
    onErrorCallback(fileName, error.message)
  })
}

module.exports = launchEditor
```
分析完上面的主函数，可以看出，真正执行打开文件的 代码 只有 这几行：

```js
if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.
    _childProcess = childProcess.spawn(
      'cmd.exe',
      ['/C', editor].concat(args),
      { stdio: 'inherit' }
    )
  } else {
    // 否则就xxx
    _childProcess = childProcess.spawn(editor, args, { stdio: 'inherit' })
  }
```

## 5.4 意外出现
我屁颠屁颠的去浏览器上想打开对应的文件。可惜很遗憾的是，我没有打开，而是在控制台把整个文件的内容输出了。

于是我在

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ed0f64fbeaad4fd18f3d50225892857e~tplv-k3u1fbpfcp-zoom-1.image)

打了一个断点，于是发现

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/26aa8458e80544f1ad780d22cd8342e5~tplv-k3u1fbpfcp-zoom-1.image)


卧槽，我的`editor 怎么是vi，怎么不是code`？
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5e8ce5b2fb9f4ee5b562514f78d81d05~tplv-k3u1fbpfcp-zoom-1.image)

于是我就看在哪里获取的 editor，原来是通过`guessEditor`获取的，于是在这个函数这里打个断点

```js
const [editor, ...args] = guessEditor(specifiedEditor)
```
guessEditor的源码如下：

```js
const path = require('path')
const shellQuote = require('shell-quote')
const childProcess = require('child_process')

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time

// 这些文件里存了 各个系统编辑器可能安装的目录
const COMMON_EDITORS_OSX = require('./editor-info/osx')
const COMMON_EDITORS_LINUX = require('./editor-info/linux')
const COMMON_EDITORS_WIN = require('./editor-info/windows')

module.exports = function guessEditor (specifiedEditor) {
  // 如果有指定的编辑器
  if (specifiedEditor) {
    return shellQuote.parse(specifiedEditor)
  }
  // We can find out which editor is currently running by:
  // `ps x` on macOS and Linux
  // `Get-Process` on Windows
  // 通过使用 子进程的 执行 ps x 来获取所有进程，然后拿到key
  
  // 如果通过遍历 获取有没有匹配的，如果有匹配的 就返回对应的编辑器执行打开文件的命令
  
  /*
    '/Applications/Sublime Text 2.app/Contents/MacOS/Sublime Text 2':
    '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
  '/Applications/Sublime Text Dev.app/Contents/MacOS/Sublime Text':
    '/Applications/Sublime Text Dev.app/Contents/SharedSupport/bin/subl',
  '/Applications/Visual Studio Code.app/Contents/MacOS/Electron': 'code',
  '/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Electron':
  */
  try {
    if (process.platform === 'darwin') {
      const output = childProcess.execSync('ps x').toString()
      const processNames = Object.keys(COMMON_EDITORS_OSX)
      for (let i = 0; i < processNames.length; i++) {
        const processName = processNames[i]
        if (output.indexOf(processName) !== -1) {
          return [COMMON_EDITORS_OSX[processName]]
        }
      }
    } else if (process.platform === 'win32') {
      const output = childProcess
        .execSync('powershell -Command "Get-Process | Select-Object Path"', {
          stdio: ['pipe', 'pipe', 'ignore']
        })
        .toString()
      const runningProcesses = output.split('\r\n')
      for (let i = 0; i < runningProcesses.length; i++) {
        // `Get-Process` sometimes returns empty lines
        if (!runningProcesses[i]) {
          continue
        }

        const fullProcessPath = runningProcesses[i].trim()
        const shortProcessName = path.basename(fullProcessPath)

        if (COMMON_EDITORS_WIN.indexOf(shortProcessName) !== -1) {
          return [fullProcessPath]
        }
      }
    } else if (process.platform === 'linux') {
      // --no-heading No header line
      // x List all processes owned by you
      // -o comm Need only names column
      const output = childProcess
        .execSync('ps x --no-heading -o comm --sort=comm')
        .toString()
      const processNames = Object.keys(COMMON_EDITORS_LINUX)
      for (let i = 0; i < processNames.length; i++) {
        const processName = processNames[i]
        if (output.indexOf(processName) !== -1) {
          return [COMMON_EDITORS_LINUX[processName]]
        }
      }
    }
  } catch (error) {
    // Ignore...
  }

  // Last resort, use old skool env vars
  // 此处获取自定义的环境变量
  if (process.env.VISUAL) {
    return [process.env.VISUAL]
  } else if (process.env.EDITOR) {
    return [process.env.EDITOR]
  }

  return [null]
}

```

通过调试得知，没有guess到正确的，命令。
所以执行到了获取自定义的环境变量这里。在 vue cli [环境变量](https://cli.vuejs.org/zh/guide/mode-and-env.html#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)这里说到 如何添加环境变量，通过添加`.env[mode]`来添加环境变量。

我添加了一个`editor = code`的环境变量，这时候我又重新试了一下。发现怎么还是不行？还是vi，于是我又试了一下添加`VISUAL = code`，这次很好。真的可以了，成功啦！！

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7e5bfc9fcfd456f95f16bcc44ed8251~tplv-k3u1fbpfcp-zoom-1.image)


## 5.5 为什么设置EDITOR无效
于是我猜想，vue-cli中设置使用`.env`，那么应该是在vue-cli中设置的环境变量。于是继续使用 调试打开。找到 vue-cli-serve。在@vue/cli-service的bin下面，看到了`vue-cli-service.js`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/586b112bcc0340b79f71eeec81666a76~tplv-k3u1fbpfcp-zoom-1.image)

通过上面代码可以看到，是使用了lib/Service
在`lib/Service`中，我找到了 `loadEnv`
```js
  loadEnv (mode) {
    const logger = debug('vue:env')
    const basePath = path.resolve(this.context, `.env${mode ? `.${mode}` : ``}`)
    const localPath = `${basePath}.local`

    const load = envPath => {
      try {
        const env = dotenv.config({ path: envPath, debug: process.env.DEBUG })
        dotenvExpand(env)
        logger(envPath, env)
      } catch (err) {
        // only ignore error if file is not found
        if (err.toString().indexOf('ENOENT') < 0) {
          error(err)
        }
      }
    }

    load(localPath)
    load(basePath)

    // by default, NODE_ENV and BABEL_ENV are set to "development" unless mode
    // is production or test. However the value in .env files will take higher
    // priority.
    if (mode) {
      // always set NODE_ENV during tests
      // as that is necessary for tests to not be affected by each other
      const shouldForceDefaultEnv = (
        process.env.VUE_CLI_TEST &&
        !process.env.VUE_CLI_TEST_TESTING_ENV
      )
      const defaultNodeEnv = (mode === 'production' || mode === 'test')
        ? mode
        : 'development'
      if (shouldForceDefaultEnv || process.env.NODE_ENV == null) {
        process.env.NODE_ENV = defaultNodeEnv
      }
      if (shouldForceDefaultEnv || process.env.BABEL_ENV == null) {
        process.env.BABEL_ENV = defaultNodeEnv
      }
    }
  }
```
loadEnv 主要load两种 env，一种是`local`一种是`base`

local是.env.local中配置的

base是.env.development类似的。具体可以看官方文档他们之间的区别。

然后通过 `dotenv`  这个库去设置`process.env`，读取.env文件也是dotenv提供的功能。

于是继续打断点进入 `dotenv` , 在其中看到了config函数
```js
// Populates process.env from .env file
function config (options /*: ?DotenvConfigOptions */) /*: DotenvConfigOutput */ {
  let dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding /*: string */ = 'utf8'
  let debug = false

  if (options) {
    if (options.path != null) {
      dotenvPath = options.path
    }
    if (options.encoding != null) {
      encoding = options.encoding
    }
    if (options.debug != null) {
      debug = true
    }
  }

  try {
    // specifying an encoding returns a string instead of a buffer
    const parsed = parse(fs.readFileSync(dotenvPath, { encoding }), { debug })

    Object.keys(parsed).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key]
      } else if (debug) {
        log(`"${key}" is already defined in \`process.env\` and will not be overwritten`)
      }
    })

    return { parsed }
  } catch (e) {
    return { error: e }
  }
}
```
**在，第27行看到了**

如果参数在process.env中已经存在，将不会被覆盖。
破案了，在控制台输入 process.env 可以看到，EDITOR有个默认值，为vi

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e22820a91a01406d848a98fe9384a166~tplv-k3u1fbpfcp-zoom-1.image)


我的node版本是v16.4.2，经过查阅官方文档 [process_process_env](http://nodejs.cn/api/process.html#process_process_env)，得知：
```
  EDITOR/VISUAL
              The user's preferred utility to edit text files.  Any
              string acceptable as a command_string operand to the sh -c
              command shall be valid.
```


到此终于明白了。

# 6.总结
1. 使用闭包实现模块化
2. 对于多参数的处理，简化使用
3. 了解到process, child_process的一些作用
4. 了解到了process.env是如何设置的，如何读取的

# 7.思考
通过vue-cli-sever的实现，是否其实可以将团队的配置统一化，集成到团队脚手架中去，以此来为规范化提供便利，达到开箱即用的效果。


> 关注我共同进步