<script src="../../../../../../Desktop/Работа/Tula/Интегра/player.js"></script>
<template>
  <div>
    <video ref="livestream" class="videosize" controls autoplay muted></video>
    <div ref="log"> "Log" <br></div>
  </div>
</template>

<script>
const INIT = 0
const SELECT_STREAM = 1
const CODEC_DATA = 2
const SEGMENT_DATA = 3

module.exports = {
  name: 'video-player',
  props: {
    schema: {
      type: String,
      default: "ws"
    },
    server: {
      type: String,
      default: "localhost"
    },
    port: {
      type: Number,
      default: 8081
    },
    suuid: {
      type: String,
      default: ""
    },
    verbose: {
      type: Boolean,
      default: false
    },
    proto: {
      type: String,
      default: ""
    },
    login: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      default: ""
    }
  },
  data: function () {
    return {
      state: INIT,
      camName: null,
      trackName: null,
      mime: null,
      queue: [],
      ms: null,
      ws: null,
      video: null,
      sourceBuffer: null,
      playPromise: null,

      pausedTime: null,

      isInited: false,
      isPlaying: false,
      timeoutStart: null,
      streamingStarted: false,

      keepAliveTimer: null,
      pingTimer: null
    };
  },
  mounted() {
    this.initialize()
  },
  beforeDestroy() {
    this.stop()
  },
  methods: {
    initialize() {
      console.log("SUUID: " + this.suuid + "\r\n")
      this.log("SUUID: " + this.suuid + "\r\n")
      if ('MediaSource' in window) {
        this.ms = new MediaSource()
        this.ms.addEventListener('sourceopen', this.start, false);
        this.video = this.$refs["livestream"]
        this.video.src = window.URL.createObjectURL(this.ms);
        this.video.onpause = () => {
          console.log("The video has been paused");
          this.log("The video has been paused");
          //this.video.play();
        };
        this.video.onplay = () => {
          console.log("The video has been started");
          this.log("The video has been started");
          // this.$nuxt.$bus.$emit("setCameraLoader", false)
          if (this.isPlaying === false) {
            //this.start();
          }
        };
        this.isInited = true;
      } else {
        console.error("Unsupported MSE");
        this.log("Unsupported MSE");
      }
    },
    onMessage: function (event) {
      //TODO проверка FSM state
      if (!this.video.paused || (!(event.data instanceof Blob))) {
        const self = this
        if (event.type === 'message') {
          const data = event.data
          if (typeof data === 'string') {
            // проверяем тип события и выбираем, что делать
            const msg = JSON.parse(data)
            switch (msg.type) {
              case 'track':
                console.log("onMime", msg.data)
                this.onMime(msg.data)
                break
              case 'info':
                console.log("onInfo", msg.data)
                this.onInfo(msg.data)
                break
              case 'initialization':
                this.onInit()
                this.onBlob = this.onSegment
                break
              case 'segment':
                // this._video.text = 'segment'
                // if (!this._video.paused) {
                this.pausedTime = msg.time
                // }
                break
              case 'mime':
                this.onMime({
                  mime: msg.data
                })
                break
              default:
                // если сервер спятил, то даем об себе этом знать
                console.log('unknown event:', msg)
                break
            }
          } else if (data instanceof ArrayBuffer) {
            console.log('array', data)
          } else if (data instanceof Blob) {
            const fileReader = new FileReader()
            fileReader.onload = (e) => {
              this.onSegment(e.target.result)
            }
            fileReader.readAsArrayBuffer(event.data)
          }
        } else {
          console.log('event type:', message.type)
        }
      }
    },
    onInfo: function (data) {
      this.camName = data.name
      this.trackName = data.tracks[0].name;
      this.ws.send('{"init":{"track":"' + this.trackName + '"}}')
    },
    onInit: function () {
      if (!this.sourceBuffer) {
        let canPlay = this.$refs["livestream"].canPlayType(this.mime);
        console.log("Can play codec:", canPlay)

        this.sourceBuffer = this.ms.addSourceBuffer(this.mime);
        this.sourceBuffer.mode = "sequence"
        this.sourceBuffer.addEventListener("updateend", this.loadPacket);

        this.ws.send("segment")
        this.video.play()
      }
    },
    onMime: function (data) {
      console.log("onMime", data['mime'])
      this.trackName = data['name']
      this.mime = data['mime']

      this.ws.send('initialization')
      //this.video.play()
    },
    onSegment: function (data) {
      if (this.sourceBuffer) {
        this.pushPacket(data)
      }
    },
    start: function () {
      this.ws = new WebSocket(this.schema + "://" + this.server + ":" + this.port + "/live/" + this.suuid + "?login=" + this.user + "&password=" + this.password);
      //this.ws.binaryType = "arraybuffer";
      this.ws.onopen = (event) => {
        console.log('Socket opened', event);
        this.ws.send('info')
      }
      this.ws.onclose = (event) => {
        console.log('Socket closed', event);
      };
      this.ws.onerror = (err) => {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
      };
      this.ws.onmessage = (event) => {
        console.log("event", event)
        this.onMessage(event)
      }
    },
    stop() {
      if (this.isInited && this.ws) {
        if (this.playPromise) {
          this.playPromise.then(_ => {
            // Automatic playback started!
            // Show playing UI.
            // We can now safely pause video...
            console.log(_)
            this.log(_)
            this.$refs["livestream"]?.pause()
            this.ws.close()
            clearTimeout(this.timeoutStart)
            clearInterval(this.pingTimer)
            this.timeoutStart = null
            this.clearBuffer()
          }).catch(error => {
            // Auto-play was prevented
            // Show paused UI.
            console.log(error)
            this.log(error)
          });
        } else {
          this.$refs["livestream"]?.pause()
          this.ws.close()
          clearTimeout(this.timeoutStart)
          clearInterval(this.pingTimer)
          this.timeoutStart = null
          this.clearBuffer()
        }
      }
    },
    clearBuffer() {
      let self = this

      function clearBufferAfterUpdateComplete() {
        if (self.sourceBuffer.updating === true) {
          window.setTimeout(clearBufferAfterUpdateComplete, Math.random() * 10); /* this checks the flag every 10 milliseconds*/
        } else {
          console.log("CLEAR BUFFER")
          this.log("CLEAR BUFFER")
          self.sourceBuffer.remove(self.video.buffered.start(0), self.video.buffered.end(0));
          // resetCurrentPositionToStart()
        }
      }

      if (this.sourceBuffer && this.video && this.video?.buffered?.length) {
        if (self.video.currentTime > 0) {
          clearBufferAfterUpdateComplete()
          self.video.currentTime = 0
          // self.$refs["livestream"].currentTime = self.$refs["livestream"].buffered.start(0)
        }
      }

    },
    clearBackBuffer() {
      if (this.sourceBuffer && this.$refs["livestream"] && this.$refs["livestream"]?.buffered?.length) {
        if ((this.$refs["livestream"].currentTime < this.$refs["livestream"].buffered.end(0)) && (this.$refs["livestream"].currentTime - this.$refs["livestream"].buffered.start(0)) > 10) {
          setTimeout(() => {
            if (!this.sourceBuffer.updating) {
              console.log("CLEAR BACK BUFFER")
              this.log("CLEAR BACK BUFFER")
              this.sourceBuffer.remove(this.$refs["livestream"].buffered.start(0), this.$refs["livestream"].currentTime - 10);
            }
          }, Math.random() * 10)
        }
      }
    },
    pushPacket(arr) {
      if (this.video) {
        if (this.verbose && arr != null) {
          let view = new Uint8Array(arr);
          console.log("got", arr.byteLength, "bytes.  Values=", view[0], view[1], view[2], view[3], view[4]);
          console.log("Current time: ", this.video.currentTime);
          this.log("Current time: " + this.video.currentTime)
          if (this.video.buffered.length > 0) {
            console.log("Buffered time: ", this.video.buffered.start(0), this.video.buffered.end(0));
            this.log("Buffered time: " + this.video.buffered.start(0) + this.video.buffered.end(0))
          }
        }
        if (this.video.buffered.length > 0) {
          if (this.video.buffered.end(0) - this.video.currentTime > 3) {
            this.video.currentTime = this.video.buffered.end(0) - 1;
          } else if (this.video.buffered.end(0) - this.video.currentTime > 1) {
            // const newTime = video.buffered.end(0)
            // if (newTime > 0) {
            //   video.currentTime = newTime;
            if (this.video.paused) {
              //1 sec delayed start
              this.playPromise = this.video.play();
            }
            // }
          }
        }
      }
      let data = arr;
      if (!this.streamingStarted) {
        this.sourceBuffer.appendBuffer(data);
        this.streamingStarted = true;
        return;
      }
      this.queue.push(data);
      if (this.verbose) {
        console.log("queue push:", this.queue.length);
        this.log("queue push")
      }
      if (!this.sourceBuffer.updating) {
        this.loadPacket();
      }
    },
    loadPacket() {
      if (!this.sourceBuffer.updating) {
        if (this.queue.length > 0) {
          let inp = this.queue.shift();
          if (this.verbose) {
            console.log("queue PULL:", this.queue.length);
            this.log("queue PULL")
          }
          let view = new Uint8Array(inp);
          if (this.verbose) {
            console.log("writing buffer with", view[0], view[1], view[2], view[3], view[4]);
            this.log("writing buffer with")
          }
          this.sourceBuffer.appendBuffer(inp);
        } else {
          this.streamingStarted = false;
        }
      }
    },
    log(msg) {
      this.$refs["log"].innerHTML += msg + '<br>'
      console.log(msg)
    }
  }
};
</script>

<style scoped>
.videosize {
  /*position: absolute;*/
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>