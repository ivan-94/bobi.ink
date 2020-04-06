---
title: '视频推流'
date: 2020/4/5
categories: 前端
---

接近四个月没更新博客了。

去年最后一篇文章介绍了我们的 Electron 桌面客户端的相关优化，这篇文章接着说最近我们在琢磨的一个需求。

**目录**

<!-- TOC -->

- [① 典型的直播方式](#①-典型的直播方式)
  - [RTMP 推流](#rtmp-推流)
  - [RTMP 拉流](#rtmp-拉流)
  - [RTMP 低延迟优化](#rtmp-低延迟优化)
- [② JSMpeg & BroadwayJS](#②-jsmpeg--broadwayjs)
  - [Relay 服务器](#relay-服务器)
  - [推送](#推送)
  - [视频播放](#视频播放)
  - [多进程优化](#多进程优化)
  - [简单说一下 Broadway.js](#简单说一下-broadwayjs)
- [③ 直接渲染 YUV](#③-直接渲染-yuv)
- [扩展阅读](#扩展阅读)

<!-- /TOC -->

我们旧的视频会议界面是完全原生开发的，开发效率比较低，比如要做一些动画效果开发很痛苦。所以最近在预研：**能不能将 Web 页面端来播放底层 WebRTC 接收到的视频流**?

要求:

- 另外我们在这里不需要处理语音，我们只有一路混合语音，通过 SIP 传输。而会议视频则可能存在多路，使用 WebRTC 进行传输。由于语音和视频是分离的，所以要求我们的视频播放延迟不能太高。
- 不需要考虑兼容性。我们在 Electron 浏览器版本为 Chrome 80

再次之前，笔者几乎没有接触过音视频这一块，第一个想到的是通过类似直播的方式，底层作为"主播端", Web 页面作为"观众端"。后面的探索基本上是基于这个方向进行的:

<br>

## ① 典型的直播方式

Web 直播有很多方案([Web 直播，你需要先知道这些](https://imweb.io/topic/5a542e43a192c3b460fce3a8)):

- RTMP (Real Time Messaging Protocol) 属于 Adobe。延时低，实时性较好。原生播放器无法直接播放(需要 Flash)。可以转换成 HTTP/Websocket 流喂给 flv.js 实现播放。
- RTP (Real-time Transport Protocol) WebRTC 底层就基于 RTP。实时性非常好，适用于视频监控、视频会议、IP 电话。
- HLS (Http Live Streaming) 苹果提出的基于 HTTP 的流媒体传输协议。Safari 支持较好，高版本 Chrome 也支持，也有一些比较成熟的第三方方案。

<br>

HLS 延迟太高，不符合我们的要求，所以一开始就放弃了。我们第一个尝试的是 RTMP 协议, 这是目前采用最广泛的直播方案，所以我们打算试试:

首先是搭建 RMTP 服务器，这个可以基于 [Node-Media-Server](https://github.com/illuspas/Node-Media-Server)，代码很简单:

```js
const NodeMediaServer = require('node-media-server')

const config = {
  // RMTP 服务器, 用于RTMP 推流和拉流
  rtmp: {
    port: 1935, // 1935 是RTMP的标准端口
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  // HTTP / WebSocket 流，暴露给 flv.js
  http: {
    port: 8000,
    allow_origin: '*',
  },
}

var nms = new NodeMediaServer(config)
nms.run()
```

### RTMP 推流

ffmpeg 是音视频开发的神器，我们可以通过它来捕获摄像头，并进行 RTMP 推流:

列举所有设备类型

```shell
$ ffmpeg -devices
Devices:
 D. = Demuxing supported
 .E = Muxing supported
 --
 D  avfoundation    AVFoundation input device
 D  lavfi           Libavfilter virtual input device
  E sdl,sdl2        SDL2 output device
```

> 本文的所有命令都在 macOS 下面执行

macOS 下面通常使用 avfoundation 进行设备采集, 下面列举所有支持的输入设备:

```shell
$ fmpeg -f avfoundation -list_devices true -i ""
[AVFoundation input device @ 0x7f8487425400] AVFoundation video devices:
[AVFoundation input device @ 0x7f8487425400] [0] FaceTime HD Camera
[AVFoundation input device @ 0x7f8487425400] [1] Capture screen 0
[AVFoundation input device @ 0x7f8487425400] AVFoundation audio devices:
[AVFoundation input device @ 0x7f8487425400] [0] Built-in Microphone
[AVFoundation input device @ 0x7f8487425400] [1] Boom2Device
```

我们将使用 `FaceTime HD Camera` 这个输入设备来采集视频，并推送 RTMP 流：

```shell
ffmpeg -f avfoundation -r 30 -i "FaceTime HD Camera" -c:v libx264 -preset superfast -tune zerolatency -an -f flv rtmp://localhost/live/test
```

稍微解释一下上面的命令:

- `-f avfoundation -r 30 -i "FaceTime HD Camera"` 表示从 FaceTime HD Camera 中以 30 fps 的帧率采集视频
- `-c:v libx264` 输出视频的编码格式是 H264
- `-f flv` 指的视频的封包格式。
- `-an` 忽略音频流

> 封包格式(format)和编码(codec)是音视频开发中最基础的概念。
> 封包格式: 相当于一种储存视频信息的容器，将编码好的音频、视频、或者是字幕、脚本之类的文件根据相应的规范组合在一起，从而生成一个封装格式的文件。常见的封包格式有 avi、mpeg、flv、mov 等
> 编码格式: 编码主要的目的是为了压缩。从设备采集到的音视频流为裸码流(rawvideo 格式, ，即没有经过编码压缩处理的数据)。举例：一个 720p，30fps，60min 的电影，其大小为：12Bx1280x720x30x60x100 = 1.9T。H264 是非常常见的编码格式之一。

<br>

### RTMP 拉流

最简单的，我们可以使用 `ffplay`(ffmpeg 工具套件之一) 测试推流和拉流是否正常

```shell
$ ffplay rtmp://localhost/live/test
```

Flash 已经过时， 为了在 Web 页面中实现播放，我们还要借助 [`flv.js`](https://github.com/bilibili/flv.js)。 flvjs 相比大家都很熟悉(花边：如何看待哔哩哔哩的 flv.js 作者月薪不到 5000 元？)，它是 B 站开源的 flv 播放器。按照官方的介绍是：

> flv.js works by transmuxing FLV file stream into ISO BMFF (Fragmented MP4) segments, followed by feeding mp4 segments into an HTML5 `<video>` element through `Media Source Extensions API`.

上面提到，flv 是一个封包格式，`flvjs` 做的就是**把 flv 转换成 Fragmented MP4 封包格式**，然后喂给[Media Source Extension, MSE](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API), 接着我们将 MSE 扔给 `<video>` 就可以直接播放了:

![](/images/video-push/flv-arch.png)

<br>

flvjs 支持通过 HTTP Streaming、 WebSocket、自定义数据源等多种形式拉取视频流。下面通过 flvjs 来拉取 node-media-server 的视频流.

```js
    <script src="https://cdn.bootcss.com/flv.js/1.5.0/flv.min.js"></script>
    <video id="video"></video>
    <button id="play">play</button>
    <script>
      if (flvjs.isSupported()) {
        const videoElement = document.getElementById('video');
        const play = document.getElementById('play');

        const flvPlayer = flvjs.createPlayer(
          {
            type: 'flv',
            isLive: true,
            hasAudio: false,
            url: 'ws://localhost:8000/live/test.flv',
          },
          {
            enableStashBuffer: true,
          },
        );

        flvPlayer.attachMediaElement(videoElement);

        play.onclick = () => {
          flvPlayer.load();
          flvPlayer.play();
        };
      }
    </script>
```

完整示例代码在[这里](https://github.com/ivan-94/video-push/tree/master/rtmp)

<br>

### RTMP 低延迟优化

**推流端**

ffmpeg 推流端可以通过一些控制参数来降低推流的延迟，主要优化方向是提高编码的效率。这篇文章 [ffmpeg 的转码延时测试与设置优化](https://blog.csdn.net/fireroll/article/details/51902018) 总结了一些优化措施可以参考一下:

- 关闭 sync-lookahead
- 降低 rc-lookahead，但别小于 10,默认是-1
- 降低 threads(比如从 12 降到 6)
- 禁用 rc-lookahead
- 禁用 b-frames
- 缩小 GOP
- 开启 x264 的 -preset fast/faster/verfast/superfast/ultrafast 参数
- 使用-tune zerolatency 参数

<br>

**node-media-server**

NMS 也可以通过降低缓冲大小和[关闭 GOP Cache](https://github.com/ossrs/srs/wiki/v1_CN_LowLatency)

<br>

**flvjs 端**

flvjs 可以开启 `enableStashBuffer` 来提高实时性。 实际测试中，flvjs 可能会出现'累积延迟'现象，可以通过[手动 seek](https://github.com/bilibili/flv.js/issues/258)来纠正。

<br>
<br>

经过一番折腾，优化到最短的延迟是 400ms，往下就束手无策了(对这块熟悉的同学可以请教一下)。而且在对接到底层 C++实际推送时，播放效果并不理想，出现各种卡顿、延迟。由于时间和知识有限，我们很难定位到具体的问题在哪， 所以我们暂时放弃了这个方案。

<br>
<br>

## ② JSMpeg & BroadwayJS

我在 Jerry Qu [<HTML5 视频直播（二）>](https://imququ.com/post/html5-live-player-2.html) 了解到了 [JSMpeg](https://github.com/phoboslab/jsmpeg) 和 [Broadwayjs](https://github.com/mbebenita/Broadway)。

**这两个库不依赖于浏览器的 video 的播放机制，使用纯 JS/WASM 实现视频解码器，然后直接通过 Canvas2d 或 WebGL 绘制出来**。Broadwayjs 目前不支持语音，JSMpeg 支持语音(基于 WebAudio)。

经过简单的测试, JSMpeg 和 BroadwayJS 延迟非常低，基本符合我们的要求。下面简单介绍一下 JSMpeg 用法。Broadwayjs 用法差不多。整个过程如下：

![](/images/video-push/jsmpeg.png)

<br>

### Relay 服务器

首先我们要创建一个转发（relay）服务器，接收推流，并通过 WebSocket 转发给页面播放器。

最简单的是使用 HTTP 推流, 因为是本地环境，网络层次的消耗基本可以忽略不计。下面创建一个 HTTP 服务器来来接收推流，推送端可以将流推送到 `/push/{id}`:

```js
this.server = http
  .createServer((req, res) => {
    const url = req.url || '/'

    if (!url.startsWith('/push/')) {
      res.statusCode = 404
      res.write('Not found')
      res.end()
      return
    }

    const id = url.slice(6)
    console.log(`${prefix}Stream connected: ${id}`)

    // 禁止超时
    res.connection.setTimeout(0)

    // 转发出去
    req.on('data', (c) => {
      this.broadcast(id, c)
    })

    req.on('end', () => {
      console.log(`${prefix}Stream closed: ${id}`)
    })
  })
  .listen(port, () => {
    console.log(`${prefix}Listening for incomming MPEG-TS Stream on http://127.0.0.1:${port}`)
  })
```

接着通过 WebSocket 将流转发出去, 页面可以通过`ws://localhost:PORT/pull/{id}` 拉取视频流:

```js
/**
 * 使用 webSocket 拉取流
 */
this.wss = new ws.Server({
  server: this.server,
  // 通过 /pull/{id} 拉流
  verifyClient: (info, cb) => {
    if (info.req.url && info.req.url.startsWith('/pull')) {
      cb(true)
    } else {
      cb(false, undefined, 'use /pull/{id}')
    }
  },
})

this.wss.on('connection', (client, req) => {
  const url = req.url
  const id = url.slice(6)

  console.log(`${prefix}new player attached: ${id}`)

  let buzy = false
  const listener = {
    id,
    onMessage: (data) => {
      // 推送
      if (buzy) {
        return
      }

      buzy = true
      client.send(data, { binary: true }, function ack() {
        buzy = false
      })
    },
  }

  this.attachListener(listener)

  client.on('close', () => {
    console.log(`${prefix} player dettached: ${id}`)
    this.detachListener(listener)
  })
})
```

<br>

### 推送

这里同样使用 ffmpeg 作为推送示例。

```shell
$ ffmpeg -f avfoundation -r 30 -i "FaceTime HD Camera" -f mpegts -codec:v mpeg1video -an  -bf 0 -b:v 1500k -maxrate 2500k http://localhost:9999/push/test
```

稍微解释一下 ffmpeg 命令

- `-f mpegts -codec:v mpeg1video -an` 指定使用 MPEG-TS 封包格式， 并使用 mpeg1 视频编码，忽略音频
- `-bf 0` JSMpeg 解码器暂时不能正确地处理 B 帧。所以这些将 B 帧禁用。关于什么是 I/B/P 帧, 参考这篇[文章](https://www.jianshu.com/p/b3d1004229db)
- `-b:v 1500k -maxrate 2500k` 设置推流的平均码率和最大码率。经过测试，JSMpeg 码率过高容易出现花屏和数组越界崩溃。

另外 JSMpeg 还要求，视频的宽度必须是 2 的倍数。ffmpeg 可以通过滤镜(filter)或设置视频尺寸(-s)来解决这个问题, 不过转换也是要消耗一定 CPU 资源的：

```shell
ffmpeg -i in.mp4 -f mpeg1video -vf "crop=iw-mod(iw\,2):ih-mod(ih\,2)" -bf 0 out.mpg
```

### 视频播放

```html
<canvas id="video-canvas"></canvas>
<script type="text/javascript" src="jsmpeg.js"></script>
<script type="text/javascript">
  const canvas = document.getElementById('video-canvas')
  const url = 'ws://localhost:9999/pull/test'
  var player = new JSMpeg.Player(url, {
    canvas: canvas,
    audio: false,
    pauseWhenHidden: false,
    videoBufferSize: 8 * 1024 * 1024,
  })
</script>
```

API 很简单，上面我们传递一个画布给 JSMpeg，禁用了 Audio, 并设置了一个较大的缓冲区大小, 来应对一些码率波动。

<br>

### 多进程优化

实际测试下来，视频延迟在 100ms - 200ms 之间。当然这还取决于视频的质量、终端的性能等因素。

受限于终端性能以及解码器效率, 对于平均高码率(笔者粗略测试大概为 2000k)的视频流，JSMpeg 有很大概率会出现花屏或者内存访问越界问题(memory access out of bounds)。

![](/images/video-push/jsmpeg-problems.png)

<br>

因此我们不得不压缩视频的质量、降低视频分辨率等手段来降低视频码率。并不能根本解决问题，这是使用 JSMpeg 的痛点之一。详见[JSMpeg 的性能说明](https://github.com/phoboslab/jsmpeg#performance-considerations)

因为解码本身是一个 CPU 密集型的操作，且由浏览器来执行，CPU 占用还是挺高的(笔者机器单个页面单个播放器, CPU 占用率在 16%左右)，而且 JSMpeg 一旦异常崩溃会难以恢复。

在我们的实际应用场景中，一个页面可能会播放多路视频, 如果所有视频都在主进程中进行解码渲染，页面操作体验会很差。 所以最好是将 JSMpeg 分离到 Worker 中。

好在将 JSMpeg 放在 Worker 中执行容易。

首先 Worker 中支持独立 WebSocket 请求，另外通过 `HTMLCanvasElement.transferControlToOffscreen()` 创建 `OffscreenCanvas` 对象并传递给 Worker，实现 canvas 离屏渲染。

先来看看 `worker.js`:

```js
importScripts('jsmpeg.min.js')

this.addEventListener('message', (evt) => {
  const data = evt.data

  switch (data.type) {
    case 'create':
      const { url, canvas, ...config } = data.data
      this.id = url
      // 创建播放器
      this.player = new JSMpeg.Player(url, {
        canvas,
        audio: false,
        pauseWhenHidden: false,
        videoBufferSize: 10 * 1024 * 1024,
        ...config,
      })

      break

    case 'destroy':
      try {
        if (this.player) {
          this.player.destroy()
        }
        this.postMessage({ type: 'destroyed' })
      } catch (err) {
        console.log(LOGGER_FREFIX + '销毁失败: ', global.id, err)
        this.postMessage({
          type: 'fatal',
          data: err,
        })
      }
      break
  }
})

// 就绪
this.postMessage({ type: 'ready', data: {} })
```

主进程:

```js
const video = document.getElementId('video')
const wk = new Worker('./worker.js')

wk.onmessage = (evt) => {
  const data = evt.data
  switch (data.type) {
    case 'ready':
      // 创建 OffscreenCanvas 对象
      const oc = video.transferControlToOffscreen()
      this.wk.postMessage(
        {
          type: 'create',
          data: {
            canvas: oc,
            url: this.url,
          },
        },
        [oc] // 注意这里
      )
      break
  }
}
```

<br>
<br>

### 简单说一下 Broadway.js

还有一个类似 JSMpeg 的解决方案，Broadwayjs。 它是一个 H.264 解码器, 通过 Emscripten 工具从 Android 的 H.264 解码器转化而成。它支持接收 H.264 裸流，不过也有一些限制：不支持 `weighted prediction for P-frames` & `CABAC entropy encoding`。

推送示例：

```shell
$ ffmpeg -f avfoundation  -r 30 -i "FaceTime HD Camera"  -f rawvideo -c:v libx264 -pix_fmt yuv420p -vprofile baseline -tune zerolatency -coder 0 -bf 0 -flags -loop -wpredp 0 -an  http://localhost:9999/push/test
```

<br>

客户端示例：

```js
const video = document.getElementById('video')
const url = `ws://localhost:9999/pull/test`
const player = new Player({
  canvas: video,
})
const ws = new WebSocket(url)
ws.binaryType = 'arraybuffer'

ws.onmessage = function (evt) {
  var data = evt.data
  if (typeof data !== 'string') {
    player.decode(new Uint8Array(data))
  } else {
    console.log('get command from server: ', data)
  }
}
```

完整代码看[这里](https://github.com/ivan-94/video-push/tree/master/broadway)

经过测试，同等质量和尺寸的视频流 JSMpeg 和 Broadway CPU 消耗差不多。Broadway 视频流不受码率限制，没有花屏和崩溃现象，但是高质量视频 ffmpeg 转换和 Broadway 播放，资源消耗都非常惊人。

<br>

## ③ 直接渲染 YUV

回到文章开始，我们底层库从 WebRTC 中拿到的是 YUV 的原始视频流, 也就是没有经过编码压缩的一帧一帧的图像。上述的方案都有额外的截封包、解编码的过程，其实最终输出的也是 YUV 格式的视频帧，它们的最后一步都是将这些 YUV 格式视频帧转换成 RGB 格式，渲染到 Canvas 中。

> 参考 [JSMpeg WebGL 渲染器](https://github.com/phoboslab/jsmpeg/blob/master/src/webgl.js), [Broadway.js WebGL 渲染器](https://github.com/mbebenita/Broadway/blob/master/Player/YUVCanvas.js)

能不能将原始的 YUV 视频帧直接转发出来，直接在 Cavans 上渲染，去掉中间的解编码过程？效果怎样？试一下不就知道了。

此前已经有文章做过这方面的尝试: [IVWEB 玩转 WASM 系列-WEBGL YUV 渲染图像实践](https://juejin.im/post/5de29d7be51d455f9b335efa)。我们参考它搞一个。

至于什么是 YUV，我就不科普。 YUV 帧的大小可以根据这个公式计算出来： `(width * height * 3) >> 1`,
即 YUV420p 的每个像素占用 1.5 bytes。 所以我们需要提前知道视频的大小

我们依旧需要一个中转服务器来接收推流。并在这将 YUV 裸流切割成一帧一帧图像数据，下发给浏览器。服务器基本代码为：

```js
this.server = http.createServer((req, res) => {
  // ...
  const parsed = new URL('http://host' + url)
  let id = parsed.searchParams.get('id'),
    width = parsed.searchParams.get('width'),
    height = parsed.searchParams.get('height')

  const nwidth = parseInt(width)
  const nheight = parseInt(height)

  const frameSize = (nwidth * nheight * 3) >> 1

  // 按照字节大小切割流
  const stream = req.pipe(new Splitter(frameSize))

  stream.on('data', (c) => {
    this.broadcast(id, c)
  })
  // ...
})
```

再来看看客户端代码，我们直接将 Broadway.js 的 YUVCanvas.js 直接拿过来用：

```js
const renderer = new YUVCanvas({
  canvas: video,
  type: 'yuv420',
  width: width,
  height: height,
})

// 通过 WebSocket 接收 YUV 帧. 并抽取出 YUV 分量
function onData(data) {
  const ylen = width * height
  const uvlen = (width / 2) * (height / 2)

  renderer.render(
    buff.subarray(0, ylen),
    buff.subarray(ylen, ylen + uvlen),
    buff.subarray(ylen + uvlen, ylen + uvlen + uvlen),
    true
  )
}
```

> 需要注意的是：JSMpeg 和 Broadway 的 Canvas 渲染都要求视频的宽度必须是 8 的倍数。不符合这个要求的会报错，[《IVWEB 玩转 WASM 系列-WEBGL YUV 渲染图像实践》](https://juejin.im/post/5de29d7be51d455f9b335efa) 讲了如何处理这个问题。

<br>

最后看看 ffmpeg 推送示例:

```shell
$ ffmpeg -f avfoundation -r 30 -i "FaceTime HD Camera" -f rawvideo -c:v rawvideo -pix_fmt yuv420p "http://localhost:9999/push?id=test&width=320&height=240"
```

完整代码见这里

<br>
<br>

资源消耗对比。 笔者设备是 15 款 Macboook pro, 视频源采集自摄像头，分辨率 320x240、像素格式 uyvy422、帧率 30。 下表 J 表示 JSMpeg、B 表示 Broadway、Y 表示 YUV。

|        | CPU (J/B/Y)   | 内存            | 平均码率          |
| ------ | ------------- | --------------- | ----------------- |
| ffmpeg | 9%/9%/5%      | 12MB/12MB/9MB   | 1600k/200k/27000k |
| 服务器 | 0.6%/0.6%/1.4 | 18MB/18MB/42MB  | N/A               |
| 播放器 | 16%/13%/8%    | 70MB/200MB/50MB | N/A               |

从结果来看，直接渲染 YUV 综合占用的资源最少。不过因为没有经过压缩，码率也是非常高的，这个给中转服务器打来一点压力，不过几乎可以忽略不计。我们还可以利用`requestAnimationFrame` 由服务器来调度播放的速率，丢掉积累的帧，保持低延迟播放。

<br>
<br>

## 扩展阅读

- [直播原理与 web 直播实战](https://juejin.im/post/5ab851b6f265da23826df601)
- [IVWEB 玩转 WASM 系列-WEBGL YUV 渲染图像实践](https://juejin.im/post/5de29d7be51d455f9b335efa)
- [低延时直播应用](https://github.com/ossrs/srs/wiki/v1_CN_LowLatency)
- [基于 H5 的直播协议和视频监控方案](https://zhuanlan.zhihu.com/p/100519553)
