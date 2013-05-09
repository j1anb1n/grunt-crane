# Grunt Crane
> 一个基于grunt的G.js模块编译工具

## How To Use
1. ```mkdir YourProject```
2. ```npm install grunt-crane --save-dev```
3. 新建一个Gruntfile.js
3. ```svn co YOUR_CODE ./src```
4. edit your code
5. ```grunt build:YOUR_FILE deploy --env=local```

如果你不想手动编译代码，我们还提供了自动编译的功能，只要执行：
```grunt watch```
每次你保存代码，就会自动编译并分发。

### 目录结构
```
  Your Project/
        build/
        src/
        report/
        config.json
        package.json
        Gruntfile.js
```

### 示例Gruntfile.js
```javascript
module.exports = function(grunt) {
    var config = grunt.file.readJSON('config.json');
    grunt.initConfig(config);

    // load npm tasks
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-crane');

    grunt.registerTask('default', ['build']);
};
```

# 关于Config.json
示例

```javascript
{
    "rootpaths": ["http://static.gdotjs.org/"],
    "src": "src/",
    "dest": "build/",
    "cacheExpire": 604800000,
    "versionTemplate": "<%= url.href.replace(url.ext, '.__' + version + '__' + url.ext) %>",
    "builder": [
        ["config.json", "builder/config"],
        ["**/*.tpl", "builder/template"],
        ["g.js", "builder/copy"],
        ["g-modern.js", "builder/copy"],
        ["**/*.js", "builder/javascript"],
        ["**/*.css", "builder/css"],
        ["**/*.less", "builder/less"],
        ["**/*.as", "builder/nothing"],
        ["**/*", "builder/copy"]
    ],
    "deploy": {
        "local": [
            ["jianbin@127.0.0.1::static", "-avR", "--password-file=/Users/jianbin/.rsync_password"]
        ]
    }
}
```



> src

源代码目录

> dest

编译目标目录

> rootpaths

这个标示着你的静态服务器的根路径，例如你有多台不同域名的静态服务器，你可以这么设置：
rootpaths: ['http://sta1.a.com', 'http://sta2.a.com', 'http://static.b.com/v1/']

rootpath会用于G.js的加载根路径，以及编译过程中对css中图片路径的处理之类的操作。

> cacheExpire

cacheExpire用来配置你的静态内容缓存的时间，这条配置将会用于生成版本号。

> versionTemplate

版本号的模板，遵循[microTemplate](http://ejohn.org/blog/javascript-micro-templating/)语法。
示例中的:
```<%= url.href.replace(url.ext, '.__' + version + '__' + url.ext) %>```

生成的结果类似:```http://sta.a.com/lib/jquery/jquery.1.8.2.__1234567__.js```

版本号会用于G.js加载模块时使用，以及css编译时，对于rootpaths下的图片文件也会自动添加版本号。

> builder

这条配置用于配置不同文件所适配的builder，配置采用数组形式。每一项为一个数组，第一项是文件的类型，第二个则标识着builder。
文件只会匹配最先匹配到的一个builder进行编译，例如示例中的配置如果对g.js进行编译，则会匹配```builder/copy```，而不是```builder/javascript```。

> deploy

deploy标识着分发服务器的配置。deploy可以为多个环境进行分发，例如：开发环境，测试环境，线上环境等。每个环境又可以对应着多台机器。
目前deploy仅支持rsync的形式。

# Tasks

## grunt build
这个任务用于编译文件，你可以指定文件路径进行编译，文件路径是相对于src目录的，例如编译```src/lib/jquery/jquery-1.8.2.js```:
```
grunt build:lib/jquery/jquery-1.8.2.js
```

你也可以同时编译多个文件，用冒号隔开，例如：
```
grunt build:file1:fil12
```

如果编译目标是一个文件夹，则会编译这个文件夹下的所有文件

如果没有指定文件列表，则编译整个src目录。

编译之后会生成一份报表json，保存在reports目录下。文件名是以当前时间戳生成，你可以通过```--token```参数来指定：
```
grunt build --token=init
grunt build --token=issue-1
```
生成的report大致如下：
```javascript
{
    "token": 1368069475232,
    "input": [
        "lib/form/field.js"
    ],
    "files": [
        "lib/form/field.js"
    ],
    "build": {
        "config.json": {
            "timestamp": 1368069480000
        },
        "config.js": {
            "timestamp": 1368069480000
        },
        "lib/form/field.js": {
            "timestamp": 1368069480000
        }
    },
    "fail": {}
}
```

其中build字段就是这次编译任务所生成的文件，你使用这个字段进行分发。


## grunt deploy
这个任务用于分发文件，如果你跟build任务一起运行，那么会分发这次编译生成的文件。
```
grunt build:lib/jquery/jquery-1.8.2.js deploy
```

你可以选择某个编译报告进行分发
```
grunt deploy:issue-1
```
此时reports/issue-1.json中的build字段的文件将会被分发

你可以通过```--env```参数来指定分发的目标环境:
```
grunt deploy:issue-1 --env=local
```
这样可以通过rsync分发到你配置的local环境的所有机器上

## grunt watch
当处于开发状态时，每次保存都需要编译文件是一件很烦人的事情，因此我们提供了```watch```的功能。你只要简单的执行```grunt watch```，然后每次你保存代码的时候，编译和分发任务都会自动运行。


# Comming soon

1. 关于版本号
