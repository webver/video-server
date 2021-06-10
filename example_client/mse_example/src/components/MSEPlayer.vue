<template>
  <div>
        <video ref="livestream" class="videosize" controls autoplay muted></video>
        <div ref="log"> "Log" <br> </div>
  </div>
</template>

<script>
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
            }
        },
        data: function () {
            return {
                isInited: false,
                isPlaying: false,
                timeoutStart: null,
                streamingStarted: false,
                ms: null,
                queue: [],
                ws: null,
                sourceBuffer: null,
                playPromise: null,
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
              console.log("SUUI: " +  this.suuid + "\r\n")
              this.log("SUUID: " + this.suuid + "\r\n")
                if ('MediaSource' in window) {
                    this.ms = new MediaSource()
                    this.ms.addEventListener('sourceopen', this.start, false);
                    this.$refs["livestream"].src = window.URL.createObjectURL(this.ms);
                    this.$refs["livestream"].onpause = () => {
                        console.log("The video has been paused");
                        this.log("The video has been paused");
                        // this.$refs["livestream"].play();
                    };
                    this.$refs["livestream"].onplay = () => {
                        console.log("The video has been started");
                        this.log("The video has been started");
                        // this.$nuxt.$bus.$emit("setCameraLoader", false)
                        if (this.isPlaying === false) {
                            this.start();
                        }
                    };
                  this.isInited = true;
                } else {
                    console.error("Unsupported MSE");
                  this.log("Unsupported MSE");
                }
            },
            start() {
                this.isPlaying = true;
                this.ws = new WebSocket(this.schema + "://" + this.server + ":" + this.port+ "/ws/live?suuid=" + this.suuid);
                // this.ws = new WebSocket("ws://172.20.12.113:8090/ws/live?suuid=" + this.suuid);
                this.ws.binaryType = "arraybuffer";
              this.ws.onopen = (event) => {
                console.log('Socket opened', event);
                this.log('Socket opened');
                this.clearBuffer()
                this.pingTimer = setInterval(() => {
                  if (this.ws != null && this.ws.readyState === WebSocket.OPEN) {
                    console.log("Send ping")
                    this.log("Send ping");
                    this.ws.send("ping")
                    this.keepAliveTimer = setTimeout(() => {
                      console.log("Close connection - no pong")
                      this.log("Close connection - no pong");
                      if (this.ws != null) {
                        this.ws.close()
                      }
                    }, 3000);
                  } else {
                    console.log("No need to send ping")
                    this.log("No need to send ping");
                  }
                }, 5000)
              }
              this.ws.onclose = (event) => {
                console.log('Socket closed', event);
                this.log("Socket closed");
                if (this.isPlaying === true) {
                  clearInterval(this.pingTimer)
                  delete this.ws
                  this.timeoutStart = setTimeout(() => {
                    this.start();
                  }, 1000);
                }
              };
              this.ws.onerror = (err) => {
                console.error('Socket encountered error: ', err.message, 'Closing socket');
                this.log("Socket encountered error");
                this.ws.close();
              };
              this.ws.onmessage = (event) => {
                if (typeof event.data === "string" && event.data === "pong") {
                  console.log("Get pong")
                  this.log("Get pong");
                  if (this.keepAliveTimer != null) {
                    clearTimeout(this.keepAliveTimer)
                  }
                } else {
                  const data = new Uint8Array(event.data);
                  if (data[0] === 9) {
                    let decoded_arr = data.slice(1);
                    let mimeCodec;
                    if (window.TextDecoder) {
                      mimeCodec = new TextDecoder("utf-8").decode(decoded_arr);
                    } else {
                      //mimeCodec =Utf8ArrayToStr(decoded_arr);
                      mimeCodec = String.fromCharCode(decoded_arr)
                    }
                    if (this.verbose) {
                      console.log('first packet with codec data: ' + mimeCodec);
                      this.log("first packet with codec data"  + mimeCodec);
                    }
                    if (!this.sourceBuffer) {
                      this.log("CODEC: " + mimeCodec)

                      let canPlay = this.$refs["livestream"].canPlayType('video/mp4; codecs="' + mimeCodec + '"');

                      this.log(canPlay)


                      this.sourceBuffer = this.ms.addSourceBuffer('video/mp4; codecs="' + mimeCodec + '"');
                      this.sourceBuffer.mode = "sequence"
                      this.sourceBuffer.addEventListener("updateend", this.loadPacket);
                    }
                  } else {
                    this.pushPacket(event.data);
                    // this.clearBackBuffer()
                  }
                }
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
                if(self.sourceBuffer.updating === true) {
                  window.setTimeout(clearBufferAfterUpdateComplete, Math.random()*10); /* this checks the flag every 10 milliseconds*/
                } else {
                  console.log("CLEAR BUFFER")
                  this.log("CLEAR BUFFER")
                  self.sourceBuffer.remove(self.$refs["livestream"].buffered.start(0), self.$refs["livestream"].buffered.end(0));
                  // resetCurrentPositionToStart()
                }
              }

              if (this.sourceBuffer && this.$refs["livestream"] && this.$refs["livestream"]?.buffered?.length) {
                if (this.$refs["livestream"].currentTime > 0 ) {
                  clearBufferAfterUpdateComplete()
                  self.$refs["livestream"].currentTime = 0
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
                  }, Math.random()*10)
                }
              }
            },
            pushPacket(arr) {
              let view = new Uint8Array(arr);
              const video = this.$refs["livestream"]
              if (video) {
                if (this.verbose) {
                  console.log("got", arr.byteLength, "bytes.  Values=", view[0], view[1], view[2], view[3], view[4]);
                  console.log("Current time: ", video.currentTime);
                  this.log("Current time: " + video.currentTime)
                  if (video.buffered.length > 0) {
                    console.log("Buffered time: ", video.buffered.start(0), video.buffered.end(0));
                    this.log("Buffered time: " + video.buffered.start(0) + video.buffered.end(0))
                  }
                }
                if (video.buffered.length > 0) {
                  if (video.buffered.end(0) - video.currentTime > 3) {
                    video.currentTime = video.buffered.end(0) - 1;
                  } else if (video.buffered.end(0) - video.currentTime > 1) {
                    // const newTime = video.buffered.end(0)
                    // if (newTime > 0) {
                    //   video.currentTime = newTime;
                    if (video.paused) {
                      //1 sec delayed start
                      this.playPromise = video.play();
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