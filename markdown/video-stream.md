---
title: 'Electron 低延迟视频流播放方案探索'
date: 2020/4/5
categories: 前端
---

好久不见，接近四个月没更新博客了! 

去年[最后一篇](https://juejin.im/post/5e0010866fb9a015fd69c645#comment)文章介绍了我们的 Electron 桌面客户端的一些优化措施，这篇文章也跟我们正在开发的 Electron 客户端有一定关系。最近我们正在预研在 Electron 页面中实时播放会议视频流的方案。

<br>

![](https://bobi.ink/images/video-push/conf.jpeg)

<br>

视频会议界面是最后一块没有被 Web 取代的页面, 它完全用原生开发的，所以开发效率比较低，比如要做一些动画效果开发很痛苦，难以响应多变的产品需求。所以我们在想: **能不能将 Web 页面端来播放底层库 WebRTC 接收到的视频流**? **或者为什么不直接通过浏览器的 WebRTC API 来进行通讯呢**？

先回答后者，因为我们视频会议这块的逻辑处理、音视频处理已经被抽取成独立的、跨平台的模块，统一进行维护；另外浏览器的 WebRTC API 提供的接口非常高级，就像一个黑盒一样，无法定制化、扩展，遇到问题也很难诊断和处理, 受限于浏览器。最大的原因还是变动有点大，时间上不允许。

因此目前只能选前者，即底层库给 Electron 页面推送视频流，在页面实时播放。 再此之前，笔者几乎没有接触过音视频开发，我能想到的是通过类似直播的方式，底层库作为"主播端", Web 页面作为"观众端"。

![](https://bobi.ink/images/video-push/overall.png)

<br>

因为视频流只是在本地进行转发，所以我们不需要考虑各种复杂的网络情况、带宽限制。唯一的要求是低延迟，低资源消耗：

- 我们视频会议语音和视频是分离的。 只有一路混合语音，通过 SIP 传输。而会议视频则可能存在多路，使用 WebRTC 进行传输。我们不需要处理语音(由底层库直接播放), 这就要求我们的视频播放延迟不能太高, 出现语音和视频不同步。
- 不需要考虑浏览器兼容性。Electron 浏览器版本为 Chrome 80
- 本地转发，不需要考虑网络情况、带宽限制

<br>
<br>

**最近因为工作需要才有机会接触到音视频相关的知识，我知道的只是皮毛，所以文章肯定存在不少问题，敬请斧正**。下面，跟着音视频小白的我，一起探索探索有哪些方案。

<br>
<br>

**目录**



- [① 典型的Web直播方案](#①-典型的web直播方案)
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



<br>
<br>

## ① 典型的Web直播方案

Web 直播有很多方案(参考这篇文章：[《Web 直播，你需要先知道这些》](https://imweb.io/topic/5a542e43a192c3b460fce3a8)):

- **RTMP (Real Time Messaging Protocol)** 属于 Adobe。延时低，实时性较好。不过浏览器需要借助 Flash 才能播放; 但是我们也可以转换成 HTTP/Websocket 流喂给 [`flv.js`](https://github.com/bilibili/flv.js/tree/master/docs) 实现播放。
- **RTP (Real-time Transport Protocol)** [WebRTC 底层就基于 RTP/RTCP](https://www.jianshu.com/p/17997567d828)。实时性非常好，适用于视频监控、视频会议、IP 电话。
- **HLS (Http Live Streaming)** 苹果提出的基于 HTTP 的流媒体传输协议。Safari 支持较好，高版本 Chrome 也支持，也有一些比较成熟的第三方方案。

<br>

HLS 延迟太高，不符合我们的要求，所以一开始就放弃了。搜了很多资料，很多都是介绍 RTMP 的，可见 RTMP 在国内采用有多广泛, 因此我们打算试试:

<br>

首先是搭建 RMTP 服务器，可以直接基于 [Node-Media-Server](https://github.com/illuspas/Node-Media-Server)，代码很简单:

```js
const NodeMediaServer = require('node-media-server')

const config = {
  // RMTP 服务器, 用于RTMP 推流和拉流
  rtmp: {
    port: 1935, // 1935 是RTMP的标准端口
    chunk_size: 0,
    gop_cache: false,
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

<br>
<br>

### RTMP 推流

[`ffmpeg`](http://www.ffmpeg.org) 是音视频开发的必备神器，本文将通过它来捕获摄像头，进行各种转换和处理，最后进行视频流推送。 下面看看怎么用 ffmpeg 进行 RTMP 推流。

首先进行视频采集，下面命令列举所有支持的设备类型：

> 本文的所有命令都在 macOS 下面执行, 其他平台用法差不多，自行搜索

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

<br>

`macOS` 下通常使用 `avfoundation` 进行设备采集, 下面列举当前终端所有支持的输入设备:

```shell
$ fmpeg -f avfoundation -list_devices true -i ""
[AVFoundation input device @ 0x7f8487425400] AVFoundation video devices:
[AVFoundation input device @ 0x7f8487425400] [0] FaceTime HD Camera
[AVFoundation input device @ 0x7f8487425400] [1] Capture screen 0
[AVFoundation input device @ 0x7f8487425400] AVFoundation audio devices:
[AVFoundation input device @ 0x7f8487425400] [0] Built-in Microphone
[AVFoundation input device @ 0x7f8487425400] [1] Boom2Device
```

<br>

我们将使用 `FaceTime HD Camera` 这个输入设备来采集视频，并推送 RTMP 流：

```shell
$ ffmpeg -f avfoundation -r 30 -i "FaceTime HD Camera" -c:v libx264 -preset superfast -tune zerolatency -an -f flv rtmp://localhost/live/test
```

<br>

稍微解释一下上面的命令:

- `-f avfoundation -r 30 -i "FaceTime HD Camera"` 表示从 `FaceTime HD Camera` 中以 30 fps 的帧率采集视频
- `-c:v libx264` 输出视频的编码格式是 H.264,  RTMP 通常采用H.264 编码
- `-f flv` 指的视频的封包格式, RTMP 一般采用 flv 封包格式。
- `-an` 忽略音频流
- `-preset superfast -tune zerolatency` H.264 的转码预设参数和调优参数。会影响视频质量和压缩率

<br>

> **封包格式(format)**和**编码(codec)**是音视频开发中最基础的概念。
> <br>
> **封包格式**: 相当于一种储存视频信息的容器，将编码好的音频、视频、或者是字幕、脚本之类的文件根据相应的规范组合在一起，从而生成一个封装格式的文件。常见的封包格式有 avi、mpeg、flv、mov 等
> <br>
> **编码格式**: 编码主要的目的是为了压缩。从设备采集到的音视频流称为裸码流(rawvideo 格式, 即没有经过编码压缩处理的数据)。举例：一个 720p，30fps，60min 的电影，裸流大小为：12Bx1280x720x30x60x100 = 1.9T。这不管在文件系统上存储、还是在网络上传输，成本都太高了，所以我们需要编码压缩。 H264 是目前最常见的编码格式之一。

<br>
<br>

### RTMP 拉流

最简单的，我们可以使用 [`ffplay`](http://www.ffmpeg.org/ffplay.html) (ffmpeg 提供的工具套件之一) 播放器来测试推流和拉流是否正常:

```shell
$ ffplay rtmp://localhost/live/test
```

<br>

Flash 已经过时， 为了在 Web 页面中实现 RTMP 流播放，我们还要借助 [`flv.js`](https://github.com/bilibili/flv.js)。 flvjs 估计大家都很熟悉(花边：如何看待哔哩哔哩的 flv.js 作者月薪不到 5000 元？)，它是 B 站开源的 flv 播放器。按照官方的介绍：

> flv.js works by transmuxing FLV file stream into ISO BMFF (Fragmented MP4) segments, followed by feeding mp4 segments into an HTML5 `<video>` element through `Media Source Extensions API`.

<br>

上面提到，flv(Flash Video) 是一个视频封包格式，`flvjs` 做的就是**把 flv 转换成 Fragmented MP4(ISO BMFF) 封包格式**，然后喂给[Media Source Extension API, MSE](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API), 接着我们将 MSE 挂载到 `<video>` 就可以直接播放了, 它的架构如下:

<br>

![](https://bobi.ink/images/video-push/flv-arch.png)

<br>
<br>

flvjs 支持通过 HTTP Streaming、 WebSocket 或者自定义数据源等多种形式拉取二进制视频流。下面示例通过 flvjs 来拉取 `node-media-server` 的视频流:

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

<br>

> 完整示例代码在[这里](https://github.com/ivan-94/video-push/tree/master/rtmp)

<br>
<br>

### RTMP 低延迟优化

**推流端**

`ffmpeg` 推流端可以通过一些控制参数来降低推流的延迟，主要优化方向是提高编码的效率、减少缓冲大小，当然有时候要牺牲一些代码质量和带宽。 这篇文章 [ffmpeg 的转码延时测试与设置优化](https://blog.csdn.net/fireroll/article/details/51902018) 总结了一些优化措施可以参考一下:

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

NMS 也可以通过降低缓冲大小和[关闭 GOP Cache](https://github.com/ossrs/srs/wiki/v1_CN_LowLatency) 来优化延迟。

<br>

**flvjs 端**

flvjs 可以开启 `enableStashBuffer` 来提高实时性。 实际测试中，flvjs 可能会出现'累积延迟'现象，可以通过[手动 seek](https://github.com/bilibili/flv.js/issues/258)来纠正。

<br>
<br>

经过一番折腾，优化到最好的延迟是 400ms，往下就束手无策了(对这块熟悉的同学可以请教一下)。而且在对接到底层库实际推送时，播放效果并不理想，出现各种卡顿、延迟。由于时间和知识有限，我们很难定位到具体的问题在哪， 所以我们暂时放弃了这个方案。

<br>
<br>

## ② JSMpeg & BroadwayJS

Jerry Qu 写得 [《HTML5 视频直播（二）》](https://imququ.com/post/html5-live-player-2.html) 给了我不少启发，得知了 [`JSMpeg`](https://github.com/phoboslab/jsmpeg) 和 [`Broadwayjs`](https://github.com/mbebenita/Broadway) 这些方案

**这两个库不依赖于浏览器的 video 的播放机制，使用纯 JS/WASM 实现视频解码器，然后直接通过 Canvas2d 或 WebGL 绘制出来**。Broadwayjs 目前不支持语音，JSMpeg 支持语音(基于 WebAudio)。

<br>

经过简单的测试, 相比 RTMP， JSMpeg 和 BroadwayJS 延迟都非常低，基本符合我们的要求。下面简单介绍一下 JSMpeg 用法。Broadwayjs 用法差不多, 下文会简单带过。它们的基本处理过程如下：

<br>

![](https://bobi.ink/images/video-push/jsmpeg.png)

<br>

### Relay 服务器

因为 ffmpeg 无法向 Web 直接推流，因此我们还是需要创建一个中转（relay）服务器来接收视频推流，再通过 WebSocket 转发给页面播放器。

ffmpeg 支持 HTTP、TCP、UDP 等各种推流方式。HTTP 推流更方便我们处理, 因为是本地环境，这些网络协议不会有明显的性能差别。

下面创建一个 HTTP 服务器来接收推流，推送路径是 `/push/:id`:

```js
this.server = http
  .createServer((req, res) => {
    const url = req.url || '/'
    if (!url.startsWith('/push/')) {
      res.statusCode = 404
      // ...
      return
    }

    const id = url.slice(6)

    // 禁止超时
    res.connection.setTimeout(0)

    // 转发出去
    req.on('data', (c) => {
      this.broadcast(id, c)
    })

    req.on('end', () => {
      /* ... */
    })
  })
  .listen(port)
```

<br>
<br>

接着通过 `WebSocket` 将流转发出去, 页面可以通过 `ws://localhost:PORT/pull/{id}` 拉取视频流:

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
      cb(false, undefined, '')
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
<br>

### 推送

这里同样使用 ffmpeg 作为推送示例:

```shell
$ ffmpeg -f avfoundation -r 30 -i "FaceTime HD Camera" -f mpegts -codec:v mpeg1video -an  -bf 0 -b:v 1500k -maxrate 2500k http://localhost:9999/push/test
```

稍微解释一下 ffmpeg 命令

- `-f mpegts -codec:v mpeg1video -an` 指定使用 MPEG-TS 封包格式， 并使用 mpeg1 视频编码，忽略音频
- `-bf 0` JSMpeg 解码器暂时不能正确地处理 B 帧。所以这些将 B 帧禁用。关于什么是 I/B/P 帧, 参考这篇[文章](https://www.jianshu.com/p/b3d1004229db)
- `-b:v 1500k -maxrate 2500k` 设置推流的平均码率和最大码率。经过测试，JSMpeg 码率过高容易出现花屏和数组越界崩溃。

另外 JSMpeg 还要求，视频的宽度必须是 2 的倍数。ffmpeg 可以通过滤镜(filter)或设置视频尺寸(-s)来解决这个问题, 不过多余转换都要消耗一定 CPU 资源的：

```shell
ffmpeg -i in.mp4 -f mpeg1video -vf "crop=iw-mod(iw\,2):ih-mod(ih\,2)" -bf 0 out.mpg
```

<br>
<br>

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

> 完整代码见[这里](https://github.com/ivan-94/video-push/tree/master/jsmpeg)

<br>
<br>

### 多进程优化

实际测试下来，JSMpeg 视频延迟在 100ms - 200ms 之间。当然这还取决于视频的质量、终端的性能等因素。

受限于终端性能以及解码器效率, 对于平均码率(笔者粗略测试大概为 2000k)较高的视频流，JSMpeg 有很大概率会出现花屏或者内存访问越界问题(memory access out of bounds)。

![](https://bobi.ink/images/video-push/jsmpeg-problems.png)

<br>

因此我们不得不通过压缩视频的质量、降低视频分辨率等手段来降低视频码率。然而这并不能根本解决问题，这是使用 JSMpeg 的痛点之一。详见[JSMpeg 的性能说明](https://github.com/phoboslab/jsmpeg#performance-considerations)

<br>

因为解码本身是一个 CPU 密集型的操作，且由浏览器来执行，CPU 占用还是挺高的(笔者机器单个页面单个播放器, CPU 占用率在 16%左右)，而且 JSMpeg 播放器一旦异常崩溃会难以恢复。

在我们的实际应用场景中，一个页面可能会播放多路视频, 如果所有视频都在浏览器主进程中进行解码渲染，页面操作体验会很差。 所以最好是将 JSMpeg 分离到 Worker 中, **一来保证主进程可以响应用户的交互，二来 JSMpeg 崩溃不会连累主进程**。

好在将 JSMpeg 放在 Worker 中执行容易: Worker 中支持独立 WebSocket 请求，另外 Canvas 通过 `transferControlToOffscreen()` 方法创建 `OffscreenCanvas` 对象并传递给 Worker，实现 canvas 离屏渲染。

先来看看 `worker.js`, 和上面的代码差不多，主要是新增了 worker 通讯:

```js
importScripts('./jsmpeg.js')

this.window = this

this.addEventListener('message', (evt) => {
  const data = evt.data

  switch (data.type) {
    // 创建播放器
    case 'create':
      const { url, canvas, ...config } = data.data
      this.id = url
      this.player = new JSMpeg.Player(url, {
        canvas,
        audio: false,
        pauseWhenHidden: false,
        videoBufferSize: 10 * 1024 * 1024,
        ...config,
      })

      break

    // 销毁播放器
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

<br>
<br>

再来看看主进程, 通过 `transferControlToOffscreen()` 生成离屏渲染画布，让 JSMpeg 可以无缝迁移到 Worker:

```js
const video = document.getElementById('video')
const wk = new Worker('./jsmpeg.worker.js')

wk.onmessage = (evt) => {
  const data = evt.data
  switch (data.type) {
    case 'ready':
      // 创建 OffscreenCanvas 对象
      const oc = video.transferControlToOffscreen()

      wk.postMessage(
        {
          type: 'create',
          data: {
            canvas: oc,
            url: 'ws://localhost:9999/pull/test',
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

还有一个类似 JSMpeg 的解决方案 ———— [Broadwayjs](https://github.com/mbebenita/Broadway)。 它是一个 `H.264` 解码器, 通过 [`Emscripten`](https://github.com/emscripten-core/emscripten) 工具从 Android 的 H.264 解码器转化而成。它支持接收 H.264 裸流，不过也有一些限制：不支持 [`weighted prediction for P-frames` & `CABAC entropy encoding`](https://github.com/mbebenita/Broadway#encoding-video)。

<br>

推送示例：

```shell
$ ffmpeg -f avfoundation  -r 30 -i "FaceTime HD Camera"  -f rawvideo -c:v libx264 -pix_fmt yuv420p -vprofile baseline -tune zerolatency -coder 0 -bf 0 -flags -loop -wpredp 0 -an  http://localhost:9999/push/test
```

<br>
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

> 完整代码看[这里](https://github.com/ivan-94/video-push/tree/master/broadway)

经过测试，同等质量和尺寸的视频流 JSMpeg 和 Broadway CPU 消耗差不多。但是 Broadway 视频流不受码率限制，没有花屏和崩溃现象。当然, 对于高质量视频, ffmpeg 转换和 Broadway 播放, 资源消耗都非常惊人。

<br>

其他类似的方案:

- [wfs](https://github.com/ChihChengYang/wfs.js) html5 player for raw h.264 streams.

<br>
<br>

## ③ 直接渲染 YUV

**回到文章开始，其实底层库从 WebRTC 中拿到的是 YUV 的原始视频流, 也就是没有经过编码压缩的一帧一帧的图像。上文介绍的方案都有额外的解封包、解编码的过程，最终输出的也是 YUV 格式的视频帧，它们的最后一步都是将这些 YUV 格式视频帧转换成 RGB 格式，渲染到 Canvas 中**。


**那能不能将原始的 YUV 视频帧直接转发过来，直接在 Cavans 上渲染不就得了**？ 将去掉中间的解编码过程, 效果怎样？试一试。

<br>

> 此前已经有文章做过这方面的尝试: [《IVWEB 玩转 WASM 系列-WEBGL YUV 渲染图像实践》](https://juejin.im/post/5de29d7be51d455f9b335efa)。我们参考它搞一个。

至于什么是 `YUV`，我就不科普, 自行搜索。 YUV 帧的大小可以根据这个公式计算出来： `(width * height * 3) >> 1`,
**即 `YUV420p` 的每个像素占用 1.5 bytes**。

因此我们只需要知道视频的大小, 就可以切割视频流，将视频帧分离出来了。 下面新建一个中转服务器来接收推流, 在这里将 YUV 裸流切割成一帧一帧图像数据，下发给浏览器：

<br>

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

[`Splitter`](https://github.com/ivan-94/video-push/blob/master/yuv/size-split.js) 根据固定字节大小切割 Buffer。 

<br>

如果渲染 YUV ？ 可以参考 [JSMpeg WebGL 渲染器](https://github.com/phoboslab/jsmpeg/blob/master/src/webgl.js), [Broadway.js WebGL 渲染器](https://github.com/mbebenita/Broadway/blob/master/Player/YUVCanvas.js)。 具体如何渲染就不展开了， 下面直接将 Broadway.js 的 [`YUVCanvas.js`](https://github.com/mbebenita/Broadway/blob/master/Player/YUVCanvas.js) 直接拿过来用：

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

<br>
<br>

> 需要注意的是：JSMpeg 和 Broadway 的 Canvas 渲染都要求视频的宽度必须是 8 的倍数。不符合这个要求的会报错，[《IVWEB 玩转 WASM 系列-WEBGL YUV 渲染图像实践》](https://juejin.im/post/5de29d7be51d455f9b335efa) 处理了这个问题。

<br>

最后看看 ffmpeg 推送示例:

```shell
$ ffmpeg -f avfoundation -r 30 -i "FaceTime HD Camera" -f rawvideo -c:v rawvideo -pix_fmt yuv420p "http://localhost:9999/push?id=test&width=320&height=240"
```

<br>

> 完整代码看[这里](https://github.com/ivan-94/video-push/tree/master/yuv)

<br>
<br>

下面看看简单资源消耗对比。 笔者设备是 15 款 Macboook pro, 视频源采集自摄像头，分辨率 320x240、像素格式 uyvy422、帧率 30。

_下表 `J` 表示 `JSMpeg`、`B` 表示 `Broadway`、`Y` 表示 `YUV`_

|        | CPU (J/B/Y)       | 内存 (J/B/Y)        | 平均码率 (J/B/Y)      |
| ------ | ----------------- | ------------------- | --------------------- |
| ffmpeg | 9% / 9% / 5%      | 12MB / 12MB / 9MB   | 1600k / 200k / 27000k |
| 服务器 | 0.6% / 0.6% /1.4% | 18MB / 18MB / 42MB  | N/A                   |
| 播放器 | 16% / 13% / 8%    | 70MB / 200MB / 50MB | N/A                   |

<br>

从结果来看，直接渲染 YUV 综合占用的资源最少。因为没有经过压缩，码率也是非常高的，不过本地环境不受带宽限制，这个问题也不大。我们还可以利用`requestAnimationFrame` 由浏览器来调度播放的速率，丢掉积累的帧，保持低延迟播放。

<br>
<br>

本文完

## 扩展阅读

- [直播原理与 web 直播实战](https://juejin.im/post/5ab851b6f265da23826df601)
- [IVWEB 玩转 WASM 系列-WEBGL YUV 渲染图像实践](https://juejin.im/post/5de29d7be51d455f9b335efa)
- [低延时直播应用](https://github.com/ossrs/srs/wiki/v1_CN_LowLatency)
- [基于 H5 的直播协议和视频监控方案](https://zhuanlan.zhihu.com/p/100519553)
- [HTML5 视频直播（二）](https://imququ.com/post/html5-live-player-2.html) 
