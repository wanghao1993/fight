# 前言

本文的主要目的是为了学习`vue-next`的发布流程。学习本文后，将获得三个技能
```
1.nodejs调试技能
2.知晓vue-next发布流程
3.改进自己项目的发布流程
```

# 准备工作
clone项目到本地 [vue-next](https://github.com/vuejs/vue-next)，并且确保`node 版本10+ yarn 1.x`，源码在`/vue-next/blob/master/scripts/release`。

打开项目后，在`node scripts`中可以看到 发布是执行的 `/vue-next/blob/master/scripts/release.js`

nodejs 如何调试可以看前面的文章[你可能不知道的Vue-devtools打开文件的原理](https://juejin.cn/post/6994246955945689101)
# 发布流程-一图胜千言

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a8edf6724da6448f8b1b112ed3f8d11e~tplv-k3u1fbpfcp-watermark.image)


# 源码解析-逐行分析

### 1-30行，这里主要是引入一些包以及声明一些变量。

`minimist`解析参数

`semver`npm版本管理工具

`enquirer` 交互式命令行工具

`preid` 发布的版本好，如果有就采用自定义的，如果没用就采用`semver`管理。

`isDryRun` 是否是调试状态

`packages` 需要打包的package

`skippedPackages` 需要跳过的

`versionIncrements` 哪种方式修改版本号
```js
const args = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const semver = require('semver')
// The semantic versioner for npm
const currentVersion = require('../package.json').version
const { prompt } = require('enquirer')
// 交互
const execa = require('execa')

const preId =
  args.preid ||
  (semver.prerelease(currentVersion) && semver.prerelease(currentVersion)[0])
const isDryRun = args.dry
const skipTests = args.skipTests
const skipBuild = args.skipBuild
const packages = fs
  .readdirSync(path.resolve(__dirname, '../packages'))
  .filter(p => !p.endsWith('.ts') && !p.startsWith('.'))

const skippedPackages = []

const versionIncrements = [
  'patch',
  'minor',
  'major',
  ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] : [])
]
```

### 32-40行 一些工具方法

`inc` 接受一个额外的`identifier`字符串参数，该参数将附加字符串的值作为预发布标识符
例如：
```
inc ( '1.2.3' ,  ' prerelease' ,  'beta' )  // '1.2.4-beta.0'
```
`bin` 执行命令

`run` execa 执行
```
```js
const inc = i => semver.inc(currentVersion, i, preId)
const bin = name => path.resolve(__dirname, '../node_modules/.bin/' + name)
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
const dryRun = (bin, args, opts = {}) =>
  console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)
const runIfNotDry = isDryRun ? dryRun : run
const getPkgRoot = pkg => path.resolve(__dirname, '../packages/' + pkg)
const step = msg => console.log(chalk.cyan(msg))

```

### Main函数

#### 43-80选择发行什么版本

```js
  let targetVersion = args._[0]

  if (!targetVersion) {
    // no explicit version, offer suggestions
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(['custom'])
    })

    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion
        })
      ).version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }
  
    if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`
  })

  if (!yes) {
    return
  }
```

`targetVersion` 目标版本
```
args 为minimist 获取到的参数，args._中的参数为

npm run release 1.1.2 那么 args._ => [1.1.2]
```
具体可以参考[minimist](https://www.npmjs.com/package/minimist)

如果没有 目标版本那么就会触发一个交互，如下:


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a4d6877cdedd4a23aaa99d72061f226f~tplv-k3u1fbpfcp-watermark.image)

`versionIncrements` 就是上面定义的，如果选择了`custom`自定义版本号，那么就继续要求输入：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cb136948e8924fb1a1d023a3b7c11a55~tplv-k3u1fbpfcp-watermark.image).

输入完成后由`semver`校验是否符合npm版本号要求。

如果校验通过就会开启开始要求确认，是否发布。

`Running tests...`

#### 81-90执行测试

```js
  // run tests before release
  step('\nRunning tests...')
  if (!skipTests && !isDryRun) {
    await run(bin('jest'), ['--clearCache'])
    await run('yarn', ['test', '--bail'])
  } else {
    console.log(`(skipped)`)
  }

```
这一段很简单。就是是否跳过测试或则只是打印调试。

`run`函数
```js
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
```

`run(bin('jest'), ['--clearCache'])` => 相当于在命令行跑步jest --clearCache，为什么使用`bin`，是因为可能没有全局安装，使用node_modules中`jest bin`执行。

`run('yarn', ['test', '--bail'])` => 相当于 `yarn test --bail`，yarn是前置安装的所以不需要 bin.

#### 91-94 更新版本号

```js
  // update all package versions and inter-dependencies
  step('\nUpdating cross dependencies...')
  updateVersions(targetVersion)

  // build all packages with types
  step('\nBuilding all packages...')
  if (!skipBuild && !isDryRun) {
    await run('yarn', ['build', '--release'])
    // test generated dts files
    step('\nVerifying type declarations...')
    await run('yarn', ['test-dts-only'])
  } else {
    console.log(`(skipped)`)
  }
```

这一段开始更新`packages`和`内部以来的`版本号。如果更新，那么我们需要搞清楚`updateVersions`
```js
function updateVersions(version) {
  // 1. update root package.json
  updatePackage(path.resolve(__dirname, '..'), version)
  // 2. update all packages
  packages.forEach(p => updatePackage(getPkgRoot(p), version))
}

function updatePackage(pkgRoot, version) {
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  updateDeps(pkg, 'dependencies', version)
  updateDeps(pkg, 'peerDependencies', version)
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

function updateDeps(pkg, depType, version) {
  const deps = pkg[depType]
  if (!deps) return
  Object.keys(deps).forEach(dep => {
    if (
      dep === 'vue' ||
      (dep.startsWith('@vue') && packages.includes(dep.replace(/^@vue\//, '')))
    ) {
      console.log(
        chalk.yellow(`${pkg.name} -> ${depType} -> ${dep}@${version}`)
      )
      deps[dep] = version
    }
  })
}
```
主要是以上三个函数：`updateVersions`, `updatePackage`, `updateDeps`

`updateVersions`: 在packages.forEach(p => updatePackage(getPkgRoot(p), version))打一个断点。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d1ddc7e0caed41e3bf4aa205a4b40110~tplv-k3u1fbpfcp-watermark.image)

这是我们看到`packages`是以下包，然后遍历执行`updatePackage`.

```js
function updatePackage(pkgRoot, version) {
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  updateDeps(pkg, 'dependencies', version)
  updateDeps(pkg, 'peerDependencies', version)
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}
```
内容很简单，更新根目录下的版本号，然后在更新其中`dependencies`, `peerDependencies`的版本。如下图：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a83d5d81593843569a9695b588be0f2a~tplv-k3u1fbpfcp-watermark.image)

#### 94-104 开始build
```js
// build all packages with types
  step('\nBuilding all packages...')
  if (!skipBuild && !isDryRun) {
    await run('yarn', ['build', '--release'])
    // test generated dts files
    step('\nVerifying type declarations...')
    await run('yarn', ['test-dts-only'])
  } else {
    console.log(`(skipped)`)
  }

```

build执行了两个命令 `yarn build --release` `yarn test-dts-only`

#### 106-116 生成日志并且提交

```js
  // generate changelog
  await run(`yarn`, ['changelog'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', ['commit', '-m', `release: v${targetVersion}`])
  } else {
    console.log('No changes to commit.')
  }

```
这一部分执行了 `yarn changelog`

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5b133879fe154dccbd81b5c200d84368~tplv-k3u1fbpfcp-watermark.image)

然后执行 `git diff`如果有变更就提交。提交comment是：`release: vxxx`.

#### 123-142行 打tag&push

```js
// push to GitHub
  step('\nPushing to GitHub...')
  await runIfNotDry('git', ['tag', `v${targetVersion}`])
  await runIfNotDry('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
  await runIfNotDry('git', ['push'])

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }

  if (skippedPackages.length) {
    console.log(
      chalk.yellow(
        `The following packages are skipped and NOT published:\n- ${skippedPackages.join(
          '\n- '
        )}`
      )
    )
  }
```

这一部分含简单就是打tag，然后push，最后如果有跳过的包，会打印出黄色的字体。到底发布就结束了～

# 总结

通过看完上面的源码，能够学习到一个优秀开源项目的发布流程是什么样的。

其实业界也有很多辅助发布的工具例如：

- 使用 [husky](https://github.com/typicode/husky) 和 [lint-staged](https://github.com/okonet/lint-staged) 提交`commit`时用`ESLint`等校验代码提交是否能够通过检测，如果检测不通过将无法成功提交，从而规范团队编码 

- 使用[git-cz](https://github.com/streamich/git-cz)来规范提交格式等等

