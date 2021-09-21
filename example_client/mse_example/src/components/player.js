'use strict'

if (typeof MediaSource === 'undefined') {
  // alert('Unsupported MIME type or codec')
}

define(['jquery',
  'bootstrap',
  'moment',
  'datetimepicker',
  'css!../css/bootstrap-datetimepicker.min.css',
  'css!../css/bootstrap.min.css',
  'css!../css/font-awesome.min.css',
  'css!../css/main.css'
], function ($) {
  class VideoPlayer {
    constructor (args, callback) {
      if (typeof callback === 'function' && callback.length === 2) {
        this._callback = callback
      } else {
        this._callback = (err, msg) => {
          if (err) {
            console.error(`VideoPlayer Error: ${err} Namespace: ${this._namespace}`)
            return
          }
          console.log(`VideoPlayer Message: ${msg} Namespace: ${this._namespace}`)
        }
      }
      if (!args.video || !(args.video instanceof HTMLVideoElement)) {
        this._callback('"options.video" is not a video element')
        return
      }
      this._video = args.video
      this._options = this._video.dataset
      this._camID = this._options.camid
      this._login = this._options.login
      this._password = this._options.password
      this._rotate = this._options.fsrotate
      this._dragged = false
      this._prevX = 0
      this._prevY = 0
      this._newX = 0
      this._newY = 0
      this._originX = 0
      this._originY = 0
      this._correctionX = 0 
      this._correctionY = 0
      this._profile = ''
      this._firstInit = false

      // this._status = 'Прямая трансляция'
      // this._text = options.text
      this._container = document.createElement('div')
      this._container.className = 'mse-container'
      //this._container.style.height = '100%'
      

      this._video.parentNode.replaceChild(this._container, this._video)
      this._video.className = 'mse-video'
      this._video.controls = false
      this._video.removeAttribute('controls')
      this._video.volume = 0.5
      

      this._scale = 1

      this._container.appendChild(this._video)

      this._startpause = document.createElement('button')
      this._startpause.className = 'mse-play'
      this._startpause.hidden = true

      this._play = document.createElement('button')
      this._play.className = 'mse-play'

      this._play.addEventListener('click', (event) => {
        this.togglePlay()
      })
      this._startpause.addEventListener('click', (event) => {
        this.togglePlayArchive()
      })
      this._container.addEventListener('click', (event) => {
        
        /*if (event.target == this._container && this._statusInfo.innerHTML == '') {
          if (!this._inputPTZ) {
            this.togglePlay()
          } else if (this._inputPTZ && !this._inputPTZ.checked) {
            this.togglePlay()
          }
        } else if ((event.target == this._container || event.target == this._startpause) && this._statusInfo.innerHTML == 'Архив') {
          this.togglePlayArchive()
        }*/
        if (this._settingsControl && this._settingsControl.style.visibility === 'visible') {

          this._settingsControl.style.visibility = 'hidden'
          if (this._archiveControl && this._settingsControl.style.visibility === 'hidden') {
            this._controls.style.opacity = 0
          }
        }
        if (this._archiveControl.querySelector('.bootstrap-datetimepicker-widget')) {
          this._archiveControl.removeChild(this._archiveControl.querySelector('.bootstrap-datetimepicker-widget'))
        }
      })

      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(entry => {
          if (this._camid_info) {
            if (entry.contentRect.width / 80 < 12) {
              this._camid_info.style.fontSize = '12px'
            } else {
              this._camid_info.style.fontSize = entry.contentRect.width / 80 + 'px'
            }
          }
          if (this._datetime_info) {
            if (entry.contentRect.width / 80 < 12) {
              this._datetime_info.style.fontSize = '12px'
            } else {
              this._datetime_info.style.fontSize = entry.contentRect.width / 80 + 'px'
            }
          }
          if (this._statusInfo) {
            if (entry.contentRect.width / 80 < 12) {
              this._statusInfo.style.fontSize = '12px'
            } else {
              this._statusInfo.style.fontSize = entry.contentRect.width / 80 + 'px'
            }
          }
          if (this._errorMessage) {
            if (entry.contentRect.width / 80 < 12) {
              this._errorMessage.style.fontSize = '12px'
            } else {
              this._errorMessage.style.fontSize = entry.contentRect.width / 80 + 'px'
            }
          }
          if (this._labelPTZ) {
            this._labelPTZ.style.fontSize = entry.contentRect.width / 80 + 'px'
          }
          if (this._labelZoom) {
            this._labelZoom.style.fontSize = entry.contentRect.width / 80 + 'px'
          }
          if (this._labelProfile) {
            this._labelProfile.style.fontSize = entry.contentRect.width / 80 + 'px'
          }
          if (this._loader) {
            this._loader.style.transform = 'translate(-50%, -50%) scale(' + entry.contentRect.width / window.screen.width + ')'
          }
          if (this._controls) {
            if (entry.contentRect.width / 60 < 12) {
              this._controls.style.fontSize = '12px'
            } else {
              this._controls.style.fontSize = entry.contentRect.width / 60 + 'px'
            }
          }
          if (this._qualityButton) {
            if (entry.contentRect.width / 60 < 12) {
              this._qualityButton.style.fontSize = '12px'
            } else {
              this._qualityButton.style.fontSize = entry.contentRect.width / 60 + 'px'
            }
          }
          if (this._inputDateTime) {
            if (entry.contentRect.width / 80 < 7) {
              this._inputDateTime.style.fontSize = '7px'
              this._inputDateTime.style.height = '10px'
            } else {
              this._inputDateTime.style.height = entry.contentRect.width / 60 + 'px'
              this._inputDateTime.style.fontSize = entry.contentRect.width / 80 + 'px'
            }
          }
          if (this._firstDateInput && this._lastDateInput) {
            if (entry.contentRect.width / 92 < 8) {
              this._firstDateInput.style.fontSize = '8px'
              this._firstDateInput.style.height = '8px'
              this._lastDateInput.style.fontSize = '8px'
              this._lastDateInput.style.height = '8px'
            } else {
              this._firstDateInput.style.height = entry.contentRect.width / 60 + 'px'
              this._firstDateInput.style.fontSize = entry.contentRect.width / 92 + 'px'
              this._lastDateInput.style.height = entry.contentRect.width / 60 + 'px'
              this._lastDateInput.style.fontSize = entry.contentRect.width / 92 + 'px'
            }
            this._firstDateInput.style.width = entry.contentRect.width / 7.68 + 'px'
            this._lastDateInput.style.width = entry.contentRect.width / 7.68 + 'px'
          }
          if (this._labelFirstDate && this._labelLastDate) {
            this._labelFirstDate.style.fontSize = entry.contentRect.width / 92 + 'px'
            this._labelLastDate.style.fontSize = entry.contentRect.width / 92 + 'px'
          }
          if (this._tooglePTZ) {
            this._tooglePTZ.style.height = entry.contentRect.width / 60 + 'px'
            this._tooglePTZ.style.width = entry.contentRect.width / 30.72 + 'px'
            //this._tooglePTZ.style.transform = 'scale(' + entry.contentRect.width / window.screen.width + ')'
          }
          if (this._toogleZoom) {
            //this._toogleZoom.style.transform = 'scale(' + entry.contentRect.width / window.screen.width + ')'
            this._toogleZoom.style.height = entry.contentRect.width / 60 + 'px'
            this._toogleZoom.style.width = entry.contentRect.width / 30.72 + 'px'
          }
          if (this._downloadButton && this._cancelButton) {
            //this._buttonsDiv.style.transform = 'scale(' + entry.contentRect.width / window.screen.width + ')'
            this._downloadButton.style.fontSize = entry.contentRect.width / 80 + 'px'
            this._cancelButton.style.fontSize = entry.contentRect.width / 80 + 'px'
          }
          if (this._downloadArchive) {
            this._downloadArchive.style.fontSize = entry.contentRect.width / 80 + 'px'
          }
          if (this._downloadArchiveDiv) {
            this._downloadArchiveDiv.style.fontSize = entry.contentRect.width / 92 + 'px'
          }
        })
      })
      resizeObserver.observe(this._container)

      this._container.addEventListener('touchstart', (event) => {
        if ((this._inputPTZ && this._inputPTZ.checked) || (this._inputZoom && this._inputZoom.checked)) {
          this._firstX = event.x
          this._firstY = event.y
        }
      })

      this._container.addEventListener('touchend', (event) => {
        /*if (this._inputPTZ && this._inputPTZ.checked) {
          this._lastX = event.x
          this._lastY = event.y
          this._offsetX = this._lastX - this._firstX
          this._offsetY = this._lastY - this._firstY

          this._distancePTZ = Math.round(Math.sqrt(Math.pow(this._lastX - this._firstX, 2) + Math.pow(this._lastY - this._firstY, 2)))
          // console.dir(Math.abs(this._lastX - this._firstX) + ' ' + Math.abs(this._lastY - this._firstY) + ' ' + this._distancePTZ)
          if (this._distancePTZ > 0) {
            var xhr = new XMLHttpRequest()
            this.sendQueryAll(this, xhr).then(result => {
              this.move(this, xhr, 'TiltToPanTo')
            }, error => {
              console.log(error)
            })
          }
        }*/
      })

      this._container.addEventListener('mousedown', (event) => {
        if ((this._inputPTZ && this._inputPTZ.checked) || (this._inputZoom && this._inputZoom.checked)) {
          this._firstX = event.x
          this._firstY = event.y
          this._dragged = true
        }
      })

      this._container.addEventListener('mousemove', (event) => {
        if (this._inputZoom && this._inputZoom.checked && this._dragged && this._scale > 1) {
            this._lastX = event.clientX
            this._lastY = event.clientY
            this._offsetX = this._lastX - this._firstX
            this._offsetY = this._lastY - this._firstY
            this._newX = this._offsetX + this._prevX
            this._newY = this._offsetY + this._prevY

            this._coeffX = this._originX / this._container.offsetWidth
            this._coeffY = this._originY / this._container.offsetHeight

            this._rangeX = (this._video.offsetWidth * this._scale - this._container.offsetWidth) / this._scale
            this._rangeY = (this._video.offsetHeight * this._scale - this._container.offsetHeight) / this._scale

            this._thresholdMaxX = this._rangeX * this._coeffX
            this._thresholdMaxY = this._rangeY * this._coeffY

            this._thresholdMinX = this._thresholdMaxX - this._rangeX
            this._thresholdMinY = this._thresholdMaxY - this._rangeY

            if (this._newX < this._thresholdMinX) {
              this._newX = this._thresholdMinX
            } 
            if (this._newX > this._thresholdMaxX) {
              this._newX = this._thresholdMaxX
            }

            if (this._newY < this._thresholdMinY) {
              this._newY = this._thresholdMinY
            } 
            if (this._newY > this._thresholdMaxY) {
              this._newY = this._thresholdMaxY
            }
            
            this._video.style.transformOrigin = this._originX + 'px ' + this._originY + 'px'
            //xLast -= this._newX
            //yLast -= this._newY
            this._video.style.transform = 'scale(' + this._scale + ') translate(' + this._newX + 'px, ' + this._newY + 'px)'
        }
      })

      this._container.addEventListener('mouseup', (event) => {
        /*if (this._inputPTZ && this._inputPTZ.checked) {
          this._lastX = event.x
          this._lastY = event.y
          this._offsetX = this._lastX - this._firstX
          this._offsetY = this._lastY - this._firstY

          this._distancePTZ = Math.round(Math.sqrt(Math.pow(this._lastX - this._firstX, 2) + Math.pow(this._lastY - this._firstY, 2)))
          // console.dir(Math.abs(this._lastX - this._firstX) + ' ' + Math.abs(this._lastY - this._firstY) + ' ' + this._distancePTZ)
          if (this._distancePTZ > 0) {
            var xhr = new XMLHttpRequest()
            this.sendQueryAll(this, xhr).then(result => {
              this.move(this, xhr, 'TiltToPanTo')
            }, error => {
              console.log(error)
            })
          }
        }*/
        if (this._inputZoom && this._inputZoom.checked && this._dragged) {
          this._prevX = this._newX
          this._prevY = this._newY
          xLast += this._prevX * this._scale
          yLast += this._prevY * this._scale
          this._dragged = false
        }
      })

      var xLast = 0  // last x location on the screen
      var yLast = 0  // last y location on the screen
      var xImage = 0 // last x location on the image
      var yImage = 0 // last y location on the image

      this._container.addEventListener('wheel', (event) => {
        if (this._inputZoom && this._inputPTZ) {
          if (this._inputZoom.checked) {
            var delta = event.deltaY || event.detail || event.wheelDelta
           
            var xScreen = event.offsetX
            var yScreen = event.offsetY
    
            // find current location on the image at the current scale
            xImage = xImage + (xScreen - xLast) / this._scale
            yImage = yImage + (yScreen - yLast) / this._scale

            // determine the new scale
            if (delta < 0)
            {
              this._scale *= 1.2
            }
            else
            {
              this._scale /= 1.2
            }
        
            this._scale = this._scale < 1 ? 1 : (this._scale > 16 ? 16 : this._scale)
    
            // determine the location on the screen at the new scale
            var xNew = (xScreen - xImage) / this._scale
            var yNew = (yScreen - yImage) / this._scale

            this._correctionX = xNew
            this._correctionY = yNew

            // save the current screen location
            xLast = xScreen
            yLast = yScreen

            this._originX = xImage
            this._originY = yImage

            this._prevX = xNew
            this._prevY = yNew

            this._coeffX = this._originX / this._container.offsetWidth
            this._coeffY = this._originY / this._container.offsetHeight

            this._rangeX = (this._video.offsetWidth * this._scale - this._container.offsetWidth) / this._scale
            this._rangeY = (this._video.offsetHeight * this._scale - this._container.offsetHeight) / this._scale

            this._thresholdMaxX = this._rangeX * this._coeffX
            this._thresholdMaxY = this._rangeY * this._coeffY

            this._thresholdMinX = this._thresholdMaxX - this._rangeX
            this._thresholdMinY = this._thresholdMaxY - this._rangeY

            if (xNew < this._thresholdMinX) {
              xNew = this._thresholdMinX
            } 
            if (xNew > this._thresholdMaxX) {
              xNew = this._thresholdMaxX
            }

            if (yNew < this._thresholdMinY) {
              yNew = this._thresholdMinY
            } 
            if (yNew > this._thresholdMaxY) {
              yNew = this._thresholdMaxY
            }

            this._video.style.transform = 'scale(' + this._scale + ') translate(' + xNew + 'px, ' + yNew + 'px)'
            this._video.style.transformOrigin = (xImage) + 'px ' + (yImage) + 'px'

            if (this._scale === 1) {
              if (this._video) {
                this._video.style.transform = ''
                this._video.style.transformOrigin = '50% 50%'
              }
              this._prevX = 0
              this._prevY = 0
              this._newX = 0
              this._newY = 0
              xLast = 0
              yLast = 0
              xImage = 0
              yImage = 0
            }
            /*var delta = event.deltaY || event.detail || event.wheelDelta
            var offsetX = 0
            var offsetY = 0
            if (delta > 0) {
              if (this._scale.toFixed(1) > 1) {
                if (this._scale > 5) {
                  this._scale -= 0.2
                } else {
                  this._scale -= 0.1
                }
                offsetX = event.offsetX
                offsetY = event.offsetY
              } else {
                if (this._video) {
                  this._video.style.transform = ''
                }
                this._prevX = 1
                this._prevY = 1
                this._newX = 1
                this._newY = 1
                this._scale = 1
              }
            } else {
              if (this._scale < 10) {
                if (this._scale > 5) {
                  this._scale += 0.2
                } else {
                  this._scale += 0.1
                }
              }
              if (this._scale > 1) {
                offsetX = event.offsetX
                offsetY = event.offsetY
              }
            }
            this._originX = offsetX
            this._originY = offsetY
            
            this._video.style.transform = 'scale(' + this._scale + ')' // translate(' + this._newX + 'px, ' + this._newY + 'px)'

            var rect = this._video.getBoundingClientRect()
            var left = (event.clientX - rect.left - this._video.clientLeft + this._video.scrollLeft) / this._scale
            var top = (event.clientY - rect.top - this._video.clientTop + this._video.scrollTop) / this._scale
            this._video.style.transformOrigin = (offsetX) + 'px ' + (offsetY) + 'px'*/

            //console.dir(this._video.getBoundingClientRect())
          } else if (this._inputPTZ.checked) {
            var delta = event.deltaY || event.detail || event.wheelDelta
            if (delta > 0) {
              var xhr = new XMLHttpRequest()
              this.sendQueryAll(this, xhr).then(result => {
                this.move(this, xhr, 'ZoomOut')
              }, error => {
                // console.log(error)
              })
            } else {
              var xhr = new XMLHttpRequest()
              this.sendQueryAll(this, xhr).then(result => {
                this.move(this, xhr, 'ZoomIn')
              }, error => {
                // console.log(error)
              })
            }
          }
        }
      })

      this._container.appendChild(this._play)
      this._container.appendChild(this._startpause)

      this._info_controls = document.createElement('div')
      this._info_controls.className = 'mse-info-controls'
      this._container.appendChild(this._info_controls)

      this._statusInfo = document.createElement('div')
      this._statusInfo.className = 'mse-status-info'
      this._info_controls.appendChild(this._statusInfo)

      this.createControls()

      screen.orientation.addEventListener("change", (event) => {
        if (this._rotate === true || this._rotate.toLowerCase() === 'true') {
          if (screen.orientation.type === "landscape-primary" || screen.orientation.type === "landscape-secondary") {
            if (!this._container.fullscreenElement && !this._container.mozFullScreenElement && !this._container.webkitFullscreenElement && !this._container.msFullscreenElement) {
              if (this._container.requestFullscreen) {
                this._container.requestFullscreen()
              } else if (this._container.msRequestFullscreen) {
                this._container.msRequestFullscreen()
              } else if (this._container.mozRequestFullScreen) {
                this._container.mozRequestFullScreen()
              } else if (this._container.webkitRequestFullscreen) {
                this._container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
              }
            }
          }
          else if (screen.orientation.type === 'portrait-primary' || screen.orientation.type === 'portrait-secondary') {
            if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
              if (document.exitFullscreen) {
                document.exitFullscreen()
              } else if (document.msExitFullscreen) {
                document.msExitFullscreen()
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen()
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen()
              }
            }
          }
        }
      }, false)

      if (this._datetime_info) {
        this._datetime_info.hidden = true
      }
      if (this._statusInfo) {
        this._statusInfo.hidden = true
      }

      if (!this._options.ip) {
        this._callback('missing "options.ip"')
        this._errorMessage = document.createElement('div')
        this._errorMessage.className = 'mse-error-message'
        this._errorMessage.innerHTML = 'Ошибка! Поле ip не задано.'
        this._container.appendChild(this._errorMessage)
        this._play.hidden = true
        if (this._controls) {
          this._controls.style.visibility = 'hidden'
        }
        return
      }

      if (!this._options.namespace) {
        this._namespace = ' '
        this._callback('missing "options.namespace"')
        this._errorMessage = document.createElement('div')
        this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
        this._errorMessage.className = 'mse-error-message'
        this._errorMessage.innerHTML = 'Ошибка! Поле namespace не задано.'
        this._container.appendChild(this._errorMessage)
        this._play.hidden = true
        if (this._controls) {
          this._controls.style.visibility = 'hidden'
        }
        return
      } else {
        this._namespace = this._options.namespace + `/${this._camID}?login=${this._login}&password=${this._password}`
      }

      if (!this._options.camid) {
        this._callback('missing "options.camid"')
        this._errorMessage = document.createElement('div')
        this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
        this._errorMessage.className = 'mse-error-message'
        this._errorMessage.innerHTML = 'Ошибка! Поле camid не задано.'
        this._container.appendChild(this._errorMessage)
        this._play.hidden = true
        if (this._controls) {
          this._controls.style.visibility = 'hidden'
        }
        return
      }

      if (this._options.time) {
        this._namespace += `&from=${this._options.time}`
      }
      
      this._io = this._options.io
      this._ip = (this._options.ip) ? this._options.ip : window.location.host
      this._ipPTZ = (this._options.ipptz) ? this._options.ipptz : undefined
      this._ipArchive = (this._options.iparchive) ? this._options.iparchive : window.location.host
      /* this._tilt = 0
      this._pan = 0 */
      this._ws = {}
      if (!window.videoPlayers) {
        window.videoPlayers = []
      }
      window.videoPlayers.push(this)

      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
      var observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            switch (mutation.attributeName) {
              case 'autoplay':
                this.stop()
                this.start()
                break
              case 'data-ip':
                if (!this._options.ip) {
                  this._callback('missing "options.ip"')
                  this._errorMessage = document.createElement('div')
                  this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
                  this._errorMessage.className = 'mse-error-message'
                  this._errorMessage.innerHTML = 'Ошибка! Поле ip не задано.'
                  this._container.appendChild(this._errorMessage)
                  this._play.hidden = true
                  this._controls.style.visibility = 'hidden'
                } else {
                  this._ip = this._options.ip
                  this.stop()
                  this.start()
                }
                break
              case 'data-iparchive':
                if (!this._options.iparchive) {
                  this._downloadArchive.hidden = true
                } else {
                  this._ipArchive = this._options.iparchive
                  this._downloadArchive.hidden = false
                }
                break
              case 'data-ipptz':
                if (!this._options.ipptz) {
                  this._inputPTZ.checked = false
                  this._inputPTZ.disabled = true
                  this._tooglePTZ.classList.add('disabled')
                  this._inputZoom.disabled = false
                  this._toogleZoom.classList.remove('disabled')
                  this._triangleDown.hidden = true
                  this._triangleLeft.hidden = true
                  this._triangleRight.hidden = true
                  this._triangleUp.hidden = true
                  this._ipPTZ = undefined
                } else {
                  this._ipPTZ = this._options.ipptz
                  this._inputPTZ.disabled = false
                  this._tooglePTZ.classList.remove('disabled')
                }
                break
              case 'data-namespace':
                if (!this._options.namespace) {
                  this._callback('missing "options.namespace"')
                  this._errorMessage = document.createElement('div')
                  this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
                  this._errorMessage.className = 'mse-error-message'
                  this._errorMessage.innerHTML = 'Ошибка! Поле namespace не задано.'
                  this._container.appendChild(this._errorMessage)
                  this._play.hidden = true
                  this._controls.style.visibility = 'hidden'
                } else {
                  this._namespace = this._options.namespace + `/${this._camID}?login=${this._login}&password=${this._password}`
                  this.stop()
                  this.start()
                }
                break
              case 'data-camid':
                if (!this._options.camid) {
                  this._callback('missing "options.camid"')
                  this._errorMessage = document.createElement('div')
                  this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
                  this._errorMessage.className = 'mse-error-message'
                  this._errorMessage.innerHTML = 'Ошибка! Поле camid не задано.'
                  this._container.appendChild(this._errorMessage)
                  this._play.hidden = true
                  this._controls.style.visibility = 'hidden'
                } else {
                  this._camID = this._options.camid
                  this._namespace = this._options.namespace + `/${this._camID}?login=${this._login}&password=${this._password}`
                  this.stop()
                  this.start()
                }
                break
              case 'data-login':
                this._login = this._options.login
                this._namespace = this._options.namespace + `/${this._camID}?login=${this._login}&password=${this._password}`
                this.stop()
                this.start()
                break
              case 'data-password':
                this._password = this._options.password
                this._namespace = this._options.namespace + `/${this._camID}?login=${this._login}&password=${this._password}`
                this.stop()
                this.start()
                break
              case 'data-controls':
                this._triangleDown.hidden = true
                this._triangleLeft.hidden = true
                this._triangleRight.hidden = true
                this._triangleUp.hidden = true
                this._inputPTZ.checked = false
                this._inputZoom.checked = false
                this._settingsControl.style.visibility = 'hidden'
                this._container.removeChild(this._controls)
                this.createControls()
                if (!this._options.ipptz) {
                  this._inputPTZ.disabled = true
                  this._tooglePTZ.classList.add('disabled')
                  this._inputZoom.disabled = false
                  this._toogleZoom.classList.remove('disabled')
                  this._ipPTZ = undefined
                }
                break
              case 'data-fsrotate':
              this._rotate = this._options.fsrotate
                break
            }
          }
        })
      })
      observer.observe(this._video, { attributes: true })

      if (this._video.autoplay) {
        this._video.muted = true
        this.start()
      }
      return this
    }

    requestDownloadArchive (self, xhr, from, to) {
      return new Promise(function (resolve, reject) {
        xhr.timeout = 3000
        xhr.onreadystatechange = function (e) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr.responseText)
            } else {
              reject(xhr.status)
            }
          }
        }
        xhr.ontimeout = function () {
          reject('timeout')
        }
        xhr.open('GET', 'http://' + self._ipArchive + '/export/open?id=' + self._camID + '&from=' + from + '&to=' + to + '&file_type=mkv', true)
        xhr.send()
      })
    }

    progressArchive (self, xhr, task) {
      return new Promise(function (resolve, reject) {
        xhr.timeout = 3000
        xhr.onreadystatechange = function (e) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr.responseText)
            } else {
              reject(xhr.status)
            }
          }
        }
        xhr.ontimeout = function () {
          reject('timeout')
        }
        xhr.open('GET', 'http://' + self._ipArchive + '/export/info?task=' + task, true)
        xhr.send()
      })
    }

    checkProgressArchive (self, xhr, task) {
      self.progressArchive(self, xhr, task).then(result => {
        let progress = JSON.parse(result).progress
        let error = JSON.parse(result).error
        if (error === -45) {
          self._canDownload = false
          self._preparing.innerHTML = JSON.parse(result).description
        } else {
          if (progress < 1 && self._canDownload) {
            progress *= 100
            self._progressBar.innerHTML = progress.toFixed(2) + '%'
            setTimeout(self.checkProgressArchive, 1000, self, xhr, task)
          } else {
            self._progressBar.innerHTML = '100%'
            let downloadLink = JSON.parse(result).files[0].link
            let downloadName = JSON.parse(result).files[0].name
            const link = document.createElement('a')

            link.href = 'http://' + self._ipArchive + downloadLink
            link.download = downloadName
            self._cancelButton.click()
            self._container.appendChild(link)
            link.click()
            self._container.removeChild(link)
          }
        }
      },
      error => {
        self._preparing.innerHTML = 'Сервер не отвечает'
      })
    }

    sendQueryAll (self, xhr) {
      return new Promise(function (resolve, reject) {
        xhr.timeout = 5000
        xhr.onreadystatechange = function (e) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr.responseText)
            } else {
              reject(xhr.status)
            }
          }
        }
        xhr.ontimeout = function () {
          reject('timeout')
        }
        xhr.open('POST', 'https://' + self._ipPTZ + '/ws_console/exec', true)
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        xhr.send('cmd={\"cmd\":\"ptzclient:Command\",\"params\":{\"key2\":\"' + self._camID + '\", \"login\":\"' + self._login + '\", \"password\":\"' + self._password + '\", \"QueryAll\":true}}')
      })
    }

    sleep (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    async downloadArchive (self, xhr, from, to) {
      this.requestDownloadArchive(self, xhr, from, to).then(result => {
        self._preparing.innerHTML = 'Подготовка: '
        let task = JSON.parse(result).task
        self._timerArchive = setTimeout(self.checkProgressArchive, 1000, self, xhr, task)
      },
      error => {
        self._preparing.innerHTML = 'Сервер не отвечает'
      })
    }

    async move (self, xhr, direction) {
      await this.sleep(500)
      this.sendQueryAll(self, xhr).then(result => {
        var res = JSON.parse(result).result[0]
        if (result && (res.tilt || res.pan || res.zoom)) {
          self._tilt = JSON.parse(result).result[0].tilt ? JSON.parse(result).result[0].tilt + self._offsetY : 0 + self._offsetY
          self._pan = JSON.parse(result).result[0].pan ? JSON.parse(result).result[0].pan + self._offsetX : 0 + self._offsetX
          self._zoom = JSON.parse(result).result[0].zoom ? JSON.parse(result).result[0].zoom : 1

          if (self._pan < 0) {
            self._pan += 35999
          }

          if (self._tilt < 0) {
            self._tilt = 34499 + self._tilt
          }

          if (self._tilt > 9000) {
            self._tilt -= self._offsetY
            self._pan += 18000
            direction = 'TiltToPanTo'
          }

          if (direction === 'ZoomIn') {
            self._zoom += 300
            if (self._zoom > 10000) {
              self._zoom = 10000
            }
          } else if (direction === 'ZoomOut') {
            self._zoom -= 300
            if (self._zoom < 1) {
              self._zoom = 1
            }
          }
          if (direction === 'TiltTo') {
            xhr.open('POST', 'https://' + self._ipPTZ + '/ws_console/exec', true)
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            xhr.send("cmd={\"cmd\":\"ptzclient:Command\",\"params\":{\"key2\":\"" + self._camID + "\", \"login\":\"" + self._login + "\", \"password\":\"" + self._password + "\", \"TiltTo\":" + self._tilt + ",\"PanTo\":" + self._pan + "}}")
          } else if (direction === 'PanTo') {
            xhr.open('POST', 'https://' + self._ipPTZ + '/ws_console/exec', true)
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            xhr.send("cmd={\"cmd\":\"ptzclient:Command\",\"params\":{\"key2\":\"" + self._camID + "\", \"login\":\"" + self._login + "\", \"password\":\"" + self._password + "\", \"TiltTo\":" + self._tilt + ",\"PanTo\":" + self._pan + "}}")
          } else if (direction === 'TiltToPanTo') {
            xhr.open('POST', 'https://' + self._ipPTZ + '/ws_console/exec', true)
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            xhr.send("cmd={\"cmd\":\"ptzclient:Command\",\"params\":{\"key2\":\"" + self._camID + "\", \"login\":\"" + self._login + "\", \"password\":\"" + self._password + "\", \"TiltTo\":" + self._tilt + ",\"PanTo\":" + self._pan + "}}")
          } else if (direction === 'ZoomIn' || direction == 'ZoomOut') {
            xhr.open('POST', 'https://' + self._ipPTZ + '/ws_console/exec', true)
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            xhr.send("cmd={\"cmd\":\"ptzclient:Command\",\"params\":{\"key2\":\"" + self._camID + "\", \"login\":\"" + self._login + "\", \"password\":\"" + self._password + "\", \"ZoomTo\":" + self._zoom + "}}")
          }
        }
      })
    }

    rotateCamera(pan, tilt, zoom) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://' + this._ipPTZ + '/ws_console/exec', true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send("cmd={\"cmd\":\"ptzclient:Command\",\"params\":{\"key2\":\"" + this._camID + "\", \"login\":\"" + this._login + "\", \"password\":\"" + this._password + "\", \"ZoomTo\":" + zoom  + ", \"TiltTo\":" + tilt + ",\"PanTo\":" + pan + "}}");
    }

    createControls () {
      if (this._options.controls) {
        const stb = this._options.controls.indexOf('startstop') !== -1
        const fub = this._options.controls.indexOf('fullscreen') !== -1
        const snb = this._options.controls.indexOf('snapshot') !== -1
        const cyb = this._options.controls.indexOf('cycle') !== -1
        const dat = this._options.controls.indexOf('datetime') !== -1
        const arc = this._options.controls.indexOf('archive') !== -1
        const snd = this._options.controls.indexOf('sound') !== -1
        const stt = this._options.controls.indexOf('settings') !== -1
        const cid = this._options.controls.indexOf('camid') !== -1
        const qlt = this._options.controls.indexOf('quality') !== -1

        this._controls = document.createElement('div')
        this._controls.className = 'mse-controls'
        this._controls.style.fontSize = this._container.style.width / 80 + 'px'
        // this._controls.style = 'display: contents'
        this._controls.addEventListener('mouseover', (event) => {
          if (stb || fub || snb || cyb || arc || snd || stt || qlt) {
            this._controls.style.opacity = '0.8'
          }
        })
        this._controls.addEventListener('mouseout', (event) => {
          if (arc && stt) {
            if (this._archiveControl || this._settingsControl) {
              this._controls.style.opacity = this._archiveControl.hidden && this._settingsControl.style.visibility === 'hidden' ? '0' : '0.8'
            }
          } else if (arc) {
            if (this._archiveControl) {
              this._controls.style.opacity = this._archiveControl.hidden ? '0' : '0.8'
            }
          } else if (stt) {
            if (this._settingsControl) {
              this._controls.style.opacity = this._settingsControl.style.visibility === 'hidden' ? '0' : '0.8'
            }
          } else {
            this._controls.style.opacity = '0'
          }
        })
        this._container.appendChild(this._controls)

        // todo: mute and volume buttons will be determined automatically based on codec string
        if (stb || fub || snb || cyb || dat || arc || snd || stt || cid || qlt) {
          if (cid && !this._container.querySelector('.mse-camid')) {
            this._camid_info = document.createElement('div')
            this._camid_info.className = 'mse-camid'
            // this._camid_info.innerHTML = this._camID
            this._container.appendChild(this._camid_info)
          }
          if (dat && !this._container.querySelector('.mse-datetime-controls')) {
            this._datetime_info = document.createElement('div')
            this._datetime_info.className = 'mse-datetime-controls'
            this._info_controls.appendChild(this._datetime_info)
          }
          if (stb) {
            this._startstop = document.createElement('button')
            this._startstop.className = 'mse-start'
            this._startstop.addEventListener('click', (event) => {
              if (this._statusInfo.innerHTML === 'Архив') {
                this.togglePlayArchive()
              } else {
                this.togglePlay()
              }
            })
            this._controls.appendChild(this._startstop)
          }
          if (snb) {
            this._snapshot = document.createElement('button')
            this._snapshot.className = 'mse-snapshot'
            this._snapshot.addEventListener('click', (event) => {
              if (this._video.readyState < 2) {
                this._callback(null, `readyState: ${this._video.readyState} < 2`)
                return
              }

              const canvas = document.createElement("canvas")
              // const k = this._video.videoWidth / this._video.videoHeight
              // const realWidth = this._video.clientHeight * k
              // const realHeight = this._video.clientHeight
              // const videoXKoeff = this._video.videoWidth / (this._video.clientWidth * this._scale)
              // const videoYKoeff = this._video.videoHeight / (this._video.clientHeight * this._scale)
              // const stripWidth = (this._video.clientWidth - realWidth) / 2
              // const stripHeight = (this._video.clientHeight - realHeight) / 2
              // const scaledWidth = this._video.clientWidth * this._scale
              // const scaledHeight = this._video.clientHeight * this._scale
              // const scaledWidthRange = (scaledWidth - this._video.clientWidth) / this._scale
              // const scaledHeightRange = (scaledHeight - this._video.clientHeight) / this._scale
              // const scaledWidthKoeff = this._video.clientWidth / scaledWidthRange
              // const scaledHeightKoeff = this._video.clientHeight / scaledHeightRange
              //
              // const videoX1 = this._originX / scaledWidthKoeff - stripWidth - this._prevX
              // const videoY1 = this._originY / scaledHeightKoeff - stripHeight - this._prevY
              // const videoX2 = videoX1 < 0 ? this._video.clientWidth - videoX1 : this._video.clientWidth * this._scale + videoX1
              // const videoY2 = videoY1 < 0 ? this._video.clientHeight - videoY1 : this._video.clientHeight * this._scale + videoY1
              // // const videoY2 = this._video.clientHeight - videoY1
              // const screenX1 = videoXKoeff * videoX1
              // const screenY1 = videoYKoeff * videoY1
              // const screenX2 = videoXKoeff * videoX2
              // const screenY2 = videoYKoeff * videoY2
              // const screenWidth = screenX2 - screenX1
              // const screenHeight = screenY2 - screenY1
              // // console.dir(videoX)
              // if (this._video.clientWidth / this._video.clientHeight > k) {
              //
              // } else {
              //
              // }
              canvas.height = this._video.clientHeight
              canvas.width = this._video.clientWidth
              const ctx = canvas.getContext('2d')
              // if (this._scale === 1) {
              //   this._originX = 0
              //   this._originY = 0
              // }
              // ctx.translate(-this._originX, -this._originY)
              // ctx.scale(this._scale, this._scale)
              ctx.drawImage(this._video, 0, 0, canvas.width, canvas.height)
              // ctx.drawImage(this._video, screenX1, screenY1, screenWidth, screenHeight, 0, 0, canvas.width, canvas.height)
              const href = canvas.toDataURL('image/jpeg', 1.0)
              const link = document.createElement('a')
              link.href = href
              link.download = `${this._camID}-${new Date().getTime()}-snapshot.jpeg`
              this._container.appendChild(link)
              link.click()
              this._container.removeChild(link)
            })
            this._controls.appendChild(this._snapshot)
          }
          /* if (cyb) {
              this._cycle = document.createElement('button')
              this._cycle.className = 'mse-cycle'
              this._cycling = false
              if (options.cycleTime) {
                  const int = parseInt(options.cycleTime)
                  if (int < 2) {
                      this._cycleTime = 2000
                  } else if (int > 10) {
                      this._cycleTime = 10000
                  } else {
                      this._cycleTime = int * 1000
                  }
              } else {
                  this._cycleTime = 2000
              }
              this._cycle.addEventListener('click', (event) => {
                  if (!this._cycling) {
                      this._namespaces = []
                      this._cycleIndex = 0
                      const videoPlayers = window.videoPlayers
                      for (let i = 0 i < videoPlayers.length i++) {
                          this._namespaces.push(videoPlayers[i].namespace)
                          if (videoPlayers[i] !== this) {
                              videoPlayers[i].disabled = true
                          } else {
                              this._cycleIndex = i
                          }
                      }
                      if (this._namespaces.length < 2) {
                          this._callback(null, 'unable to cycle because namespaces < 2')
                          delete this._namespaces
                          delete this._cycleIndex
                          return
                      }
                      if (!this._playing) {
                          this.start()
                      }
                      if (this._startstop) {
                          this._startstop.classList.add('cycling')
                      }
                      this._cycle.classList.add('animated')
                      this._cycleInterval = setInterval(() => {
                          this._cycleIndex++
                          if (this._cycleIndex === this._namespaces.length) {
                              this._cycleIndex = 0
                          }
                          this.start(this._namespaces[this._cycleIndex])
                      }, this._cycleTime)
                      this._cycling = true
                  } else {
                      clearInterval(this._cycleInterval)
                      this._cycle.classList.remove('animated')
                      if (this._startstop) {
                          this._startstop.classList.remove('cycling')
                      }
                      this.start()
                      const videoPlayers = window.videoPlayers
                      for (let i = 0 i < videoPlayers.length i++) {
                          if (videoPlayers[i] !== this) {
                              videoPlayers[i].disabled = false
                          }
                      }
                      delete this._namespaces
                      delete this._cycleInterval
                      this._cycling = false
                  }
              })
              this._controls.appendChild(this._cycle)
          } */

          this._divTimeRange = document.createElement('div')
          this._divTimeRange.className = 'mse-timerange-container'

          this._timeRange = document.createElement('input')
          this._timeRange.className = 'mse-timerange'
          this._timeRange.type = 'range'
          this._timeRange.min = -60
          this._timeRange.max = 60
          this._timeRange.step = 1
          this._timeRange.value = 0

          this._divTimeRange.style.visibility = 'hidden'

          var mode = 'minutes'

          this._timeRange.addEventListener('wheel', (event) => {
            if (this._container.querySelector('.mse-tooltip')) {
              this._container.removeChild(this._container.querySelector('.mse-tooltip'))
              this._showingTooltip = null
            }
            var delta = event.deltaY || event.detail || event.wheelDelta
            if (delta > 0) {
              if (mode === 'days') {
                mode = 'months'
                this._timeRange.min = -12
                this._timeRange.max = 12
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
              if (mode === 'hours') {
                mode = 'days'
                this._timeRange.min = -31
                this._timeRange.max = 31
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
              if (mode === 'minutes') {
                mode = 'hours'
                this._timeRange.min = -24
                this._timeRange.max = 24
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
              if (mode === 'seconds') {
                mode = 'minutes'
                this._timeRange.min = -60
                this._timeRange.max = 60
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
            } else {
              if (mode === 'minutes') {
                mode = 'seconds'
                this._timeRange.min = -60
                this._timeRange.max = 60
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
              if (mode === 'hours') {
                mode = 'minutes'
                this._timeRange.min = -60
                this._timeRange.max = 60
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
              if (mode === 'days') {
                mode = 'hours'
                this._timeRange.min = -24
                this._timeRange.max = 24
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
              if (mode === 'months') {
                mode = 'days'
                this._timeRange.min = -31
                this._timeRange.max = 31
                this._timeRange.step = 1
                this._timeRange.value = 0
              }
            }
            this._tooltipElem = document.createElement('div')
            this._tooltipElem.className = 'mse-tooltip'
            var archiveDate = new Date(Date.parse(this._inputDateTime.value))
            if (mode === 'months') {
              archiveDate.setMonth(archiveDate.getMonth() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-<b>' +  this.addZero(archiveDate.getMonth() + 1) + '</b>-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'days') {
              archiveDate.setDate(archiveDate.getDate() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-<b>' + this.addZero(archiveDate.getDate()) + '</b> ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'hours') {
              archiveDate.setHours(archiveDate.getHours() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' <b>' + this.addZero(archiveDate.getHours()) + '</b>:' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'minutes') {
              archiveDate.setMinutes(archiveDate.getMinutes() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':<b>' + this.addZero(archiveDate.getMinutes()) + '</b>:' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'seconds') {
              archiveDate.setSeconds(archiveDate.getSeconds() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':<b>' + this.addZero(archiveDate.getSeconds()) + '</b>'
            }
            this._container.appendChild(this._tooltipElem)

            var coords = event.target.getBoundingClientRect()
            var left = coords.left + (event.target.offsetWidth - this._tooltipElem.offsetWidth) / 2
            var top = coords.top - this._tooltipElem.offsetHeight - 5

            this._tooltipElem.style.left = left + 'px'
            this._tooltipElem.style.top = top + 'px'
            this._showingTooltip = this._tooltipElem

            setTimeout(() => {
              if (this._container.querySelector('.mse-tooltip')) {
                this._container.removeChild(this._container.querySelector('.mse-tooltip'))
                this._showingTooltip = null
              }
            }, 500)
          })

          this._timeRange.addEventListener('mousedown', (event) => {
            if (this._container.querySelector('.mse-tooltip')) {
              this._container.removeChild(this._container.querySelector('.mse-tooltip'))
              this._showingTooltip = null
            }
            this._tooltipElem = document.createElement('div')
            this._tooltipElem.className = 'mse-tooltip'
            var archiveDate = new Date(Date.parse(this._inputDateTime.value))
            if (mode === 'months') {
              archiveDate.setMonth(archiveDate.getMonth() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-<b>' +  this.addZero(archiveDate.getMonth() + 1) + '</b>-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'days') {
              archiveDate.setDate(archiveDate.getDate() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-<b>' + this.addZero(archiveDate.getDate()) + '</b> ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'hours') {
              archiveDate.setHours(archiveDate.getHours() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' <b>' + this.addZero(archiveDate.getHours()) + '</b>:' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'minutes') {
              archiveDate.setMinutes(archiveDate.getMinutes() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':<b>' + this.addZero(archiveDate.getMinutes()) + '</b>:' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'seconds') {
              archiveDate.setSeconds(archiveDate.getSeconds() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':<b>' + this.addZero(archiveDate.getSeconds()) + '</b>'
            }
            this._container.appendChild(this._tooltipElem)

            var coords = event.target.getBoundingClientRect()
            var left = coords.left + (event.target.offsetWidth - this._tooltipElem.offsetWidth) / 2
            var top = coords.top - this._tooltipElem.offsetHeight - 5

            this._tooltipElem.style.left = left + 'px'
            this._tooltipElem.style.top = top + 'px'
            this._showingTooltip = this._tooltipElem
          })

          this._timeRange.addEventListener('input', (event) => {
            if (this._showingTooltip) {
              var archiveDate = new Date(Date.parse(this._inputDateTime.value))
              if (mode === 'months') {
                archiveDate.setMonth(archiveDate.getMonth() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-<b>' +  this.addZero(archiveDate.getMonth() + 1) + '</b>-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'days') {
                archiveDate.setDate(archiveDate.getDate() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-<b>' + this.addZero(archiveDate.getDate()) + '</b> ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'hours') {
                archiveDate.setHours(archiveDate.getHours() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' <b>' + this.addZero(archiveDate.getHours()) + '</b>:' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'minutes') {
                archiveDate.setMinutes(archiveDate.getMinutes() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':<b>' + this.addZero(archiveDate.getMinutes()) + '</b>:' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'seconds') {
                archiveDate.setSeconds(archiveDate.getSeconds() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':<b>' + this.addZero(archiveDate.getSeconds()) + '</b>'
              }
            }
          })

          this._timeRange.addEventListener('mouseup', (event) => {
            if (this._showingTooltip) {
              this._showingTooltip.innerHTML = this._showingTooltip.innerHTML.replace(new RegExp('<b>', 'g'), '')
              this._showingTooltip.innerHTML = this._showingTooltip.innerHTML.replace(new RegExp('</b>', 'g'), '')
              this._inputDateTime.value = this._showingTooltip.innerHTML
              this._timeRange.value = 0
              this._namespace = this._options.namespace + `/${this._camID}?from=${this.setArchiveTime(this._inputDateTime.value)}&login=${this._login}&password=${this._password}`
              this._container.removeChild(this._showingTooltip)
              this._showingTooltip = null
              if (!this._playing) {
                this._startpause.hidden = true
                this._video.load()
              }
              this.start()
            }
          })

          this._timeRange.addEventListener('touchstart', (event) => {
            if (this._container.querySelector('.mse-tooltip')) {
              this._container.removeChild(this._container.querySelector('.mse-tooltip'))
              this._showingTooltip = null
            }
            this._tooltipElem = document.createElement('div')
            this._tooltipElem.className = 'mse-tooltip'
            var archiveDate = new Date(Date.parse(this._inputDateTime.value))
            if (mode === 'months') {
              archiveDate.setMonth(archiveDate.getMonth() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-<b>' +  this.addZero(archiveDate.getMonth() + 1) + '</b>-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'days') {
              archiveDate.setDate(archiveDate.getDate() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-<b>' + this.addZero(archiveDate.getDate()) + '</b> ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'hours') {
              archiveDate.setHours(archiveDate.getHours() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' <b>' + this.addZero(archiveDate.getHours()) + '</b>:' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'minutes') {
              archiveDate.setMinutes(archiveDate.getMinutes() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':<b>' + this.addZero(archiveDate.getMinutes()) + '</b>:' + this.addZero(archiveDate.getSeconds())
            } else if (mode === 'seconds') {
              archiveDate.setSeconds(archiveDate.getSeconds() + parseInt(this._timeRange.value))
              this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':<b>' + this.addZero(archiveDate.getSeconds()) + '</b>'
            }
            this._container.appendChild(this._tooltipElem)

            var coords = event.target.getBoundingClientRect()
            var left = coords.left + (event.target.offsetWidth - this._tooltipElem.offsetWidth) / 2
            var top = coords.top - this._tooltipElem.offsetHeight - 5

            this._tooltipElem.style.left = left + 'px'
            this._tooltipElem.style.top = top + 'px'
            this._showingTooltip = this._tooltipElem
          })

          this._timeRange.addEventListener('touchmove', (event) => {
            if (this._showingTooltip) {
              var archiveDate = new Date(Date.parse(this._inputDateTime.value))
              if (mode === 'months') {
                archiveDate.setMonth(archiveDate.getMonth() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-<b>' +  this.addZero(archiveDate.getMonth() + 1) + '</b>-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'days') {
                archiveDate.setDate(archiveDate.getDate() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-<b>' + this.addZero(archiveDate.getDate()) + '</b> ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'hours') {
                archiveDate.setHours(archiveDate.getHours() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' <b>' + this.addZero(archiveDate.getHours()) + '</b>:' + this.addZero(archiveDate.getMinutes()) + ':' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'minutes') {
                archiveDate.setMinutes(archiveDate.getMinutes() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':<b>' + this.addZero(archiveDate.getMinutes()) + '</b>:' + this.addZero(archiveDate.getSeconds())
              } else if (mode === 'seconds') {
                archiveDate.setSeconds(archiveDate.getSeconds() + parseInt(this._timeRange.value))
                this._tooltipElem.innerHTML = archiveDate.getFullYear() + '-' +  this.addZero(archiveDate.getMonth() + 1) + '-' + this.addZero(archiveDate.getDate()) + ' ' + this.addZero(archiveDate.getHours()) + ':' + this.addZero(archiveDate.getMinutes()) + ':<b>' + this.addZero(archiveDate.getSeconds()) + '</b>'
              }
            }
          })

          this._timeRange.addEventListener('touchend', (event) => {
            if (this._showingTooltip) {
              this._showingTooltip.innerHTML = this._showingTooltip.innerHTML.replace(new RegExp('<b>', 'g'), '')
              this._showingTooltip.innerHTML = this._showingTooltip.innerHTML.replace(new RegExp('</b>', 'g'), '')
              this._inputDateTime.value = this._showingTooltip.innerHTML
              this._timeRange.value = 0
              this._namespace = this._options.namespace + `/${this._camID}?from=${this.setArchiveTime(this._inputDateTime.value)}&login=${this._login}&password=${this._password}`
              this._container.removeChild(this._showingTooltip)
              this._showingTooltip = null
              if (!this._playing) {
                this._startpause.hidden = true
                this._video.load()
              }
              this.start()
            }
          })

          this._divTimeRange.appendChild(this._timeRange)
          this._controls.appendChild(this._divTimeRange)

          if (arc) {
            this._archive = document.createElement('button')
            this._archive.className = 'mse-archive'

            this._archive.addEventListener('click', (event) => {
              if (!this._archiveControl.hidden && this._statusInfo.innerHTML === 'Архив') {
                this._divTimeRange.style.visibility = 'hidden'
                this._namespace = this._options.namespace + `/${this._camID}?login=${this._login}&password=${this._password}`
                if (!this._startpause.hidden) {
                  this._startpause.hidden = true
                  this._video.load()
                }
                this.start()
              }
              this._archiveControl.hidden = !this._archiveControl.hidden

              if (self._archiveControl.hidden && !self._inputZoom.checked && self._options.ipptz && self._playing) {
                self._inputPTZ.disabled = false
                self._tooglePTZ.classList.remove('disabled')
              }
              // this._divTimeRange.style.visibility = this._divTimeRange.style.visibility == 'hidden' ? 'visible' : 'hidden'
              // this._divTimeRange.hidden = !this._divTimeRange.hidden
              // this._archiveControl.style.left = `${event.currentTarget.offsetLeft - 250}px`
              // this._archiveControl.style.left = '82vw'//`${event.currentTarget.offsetLeft - 250}px`
              // `${event.currentTarget.offsetTop - 300}px`

              // this._timeRange.style.left = `${event.currentTarget.offsetLeft - 300}px`
              // this._archiveControl.style.top = `${event.currentTarget.offsetTop + 5}px`
              this._dateNow = new Date()
              this._dateNow = this._dateNow.getFullYear() + '-' + this.addZero(this._dateNow.getMonth() + 1) + '-' + this.addZero(this._dateNow.getDate()) + ' ' + this.addZero(this._dateNow.getHours()) + ':' + this.addZero(this._dateNow.getMinutes()) + ':' + this.addZero(this._dateNow.getSeconds())
              // this._inputDateTime.setAttribute('value', this._dateNow)
            })

            this._controls.appendChild(this._archive)
            //this._archiveControl = document.createElement('div')
            //this._archiveControl.className = 'mse-archive-control'
            //this._archiveControl.hidden = true



            /*this._inputDateTime = document.createElement('input')
                    this._inputDateTime.setAttribute('type', 'datetime-local')
					this._inputDateTime.className = 'mse-datetime-local'
                    this._inputDateTime.setAttribute('step', '1')*/

            this._archiveControl = document.createElement('div')
            this._archiveControl.className = 'mse-archive-control' //'input-append date'
            this._archiveControl.hidden = true

            this._inputDateTime = document.createElement('input')
            this._inputDateTime.className = 'form-control datetimepicker'
            this._inputDateTime.placeholder = 'Выберите дату'
            this._inputDateTime.style.height = this._container.offsetWidth / 80 + 'px'
            this._inputDateTime.style.fontSize = this._container.offsetWidth / 100 + 'px'


            this._inputDateTime.addEventListener('click', (event) => {
              event.stopPropagation()
			  this._inputDateTime.readOnly = true
            })
			
			this._inputDateTime.addEventListener('blur', (event) => {
			  this._inputDateTime.readOnly = false
            })
            
            //this._inputDateTime.type = 'text'



            //this._archiveControl.appendChild(this._inputDateTime)
            //this._controls.appendChild(this._archiveControl)
            //this._controls.appendChild(this._archiveControl)
            $(".mse-archive").before(this._archiveControl)

            /*this._inputDateTime.addEventListener('click', (event) => {
              if (this._container.querySelector('.bootstrap-datetimepicker-widget')) {
                this._datetimePickerWidget = this._container.querySelector('.bootstrap-datetimepicker-widget')
                this._datetimePickerWidget.style.transform = 'scale(' + this._container.offsetWidth / window.screen.width + ')'
              }
            })*/

            let timeOut
            var self = this

            /*this._inputDateTime.addEventListener('change', (event) => {
						alert(123)
                        clearTimeout(timeOut)
                        timeOut = setTimeout(function () {
                            // this._removeSocketEvents()
                            // this._socket.close()
                            const time = self._inputDateTime.value
							//console.log(time)
                            if(!time) {
                                self._namespace = `live/${self._camID}?login=${self._login}&password=${self._password}`
                            } else {
                                const dt = self.setArchiveTime(time)
								//alert(dt)
                                self._namespace = `live/${self._camID}?from=${dt}&login=${self._login}&password=${self._password}`
                            }
                            self.start()
                        }, 2000)
                    })*/

            $(this._archiveControl).on("dp.change", (event) => {
              clearTimeout(timeOut)
              timeOut = setTimeout(function() {
                // this._removeSocketEvents()
                // this._socket.close()
                const time = self._inputDateTime.value
                //console.log(time)
                if (!time) {
                  self._divTimeRange.style.visibility = 'hidden'
                  self._namespace = self._options.namespace + `/${self._camID}?login=${self._login}&password=${self._password}`
                } else {
                  const dt = self.setArchiveTime(time)
                  self._divTimeRange.style.visibility = 'visible'
                  self._namespace = self._options.namespace + `/${self._camID}?from=${dt}&login=${self._login}&password=${self._password}`
                }
                if (!self._archiveControl.hidden) {
                  self._inputPTZ.checked = false
                  self._inputPTZ.disabled = true
                  self._tooglePTZ.classList.add('disabled')
                  self._triangleUp.hidden = true
                  self._triangleDown.hidden = true
                  self._triangleLeft.hidden = true
                  self._triangleRight.hidden = true
                }
                if (self._playing) {
                  self._inputZoom.disabled = false
                  self._toogleZoom.classList.remove('disabled')
                }
                self.start()
              }, 2000)
            })

            this._archiveControl.appendChild(this._inputDateTime)

            this._archiveControl.addEventListener("DOMNodeInserted", (event) => {
              if (event.target.nodeName === 'DIV' && event.target.className.includes('bootstrap-datetimepicker-widget')) {
                var scale = this._container.offsetWidth / window.screen.width
                event.target.style.transformOrigin = '100% 100%'
                event.target.style.transform = 'scale(' + scale + ')'
              }
            })

            $('.datetimepicker').datetimepicker({
              format: 'YYYY-MM-DD HH:mm:ss',
              widgetPositioning: {
                horizontal: 'right',
                vertical: 'top',
              }
            })
          }
          if (snd) {
            this._sound = document.createElement('button')
            this._sound.className = 'mse-sound'

            this._soundControls = document.createElement('div')
            this._soundControls.className = 'mse-sound-controls'
            this._soundControls.hidden = true

            this._soundControl = document.createElement('input')
            this._soundControl.className = 'mse-sound-control mse-timerange'
            this._soundControl.setAttribute('type', 'range')
            this._soundControl.setAttribute('min', '0')
            this._soundControl.setAttribute('max', '100')
            this._soundControl.setAttribute('value', '0')
            this._soundControl.setAttribute('step', '1')

            this._soundControl.addEventListener('input', (event) => {
              if (this._video.muted) {
                this._video.muted = false
              }
              this._video.volume = this._soundControl.value / 100
            })

            this._sound.addEventListener('mouseenter', (event) => {
              this._soundControls.hidden = false
              //this._soundControl.style.left = `${event.currentTarget.offsetLeft}px`
            })

            this._sound.addEventListener('mouseleave', (event) => {
              this._soundControls.hidden = true
            })

            this._soundControls.appendChild(this._soundControl)
            this._sound.appendChild(this._soundControls)
            this._controls.appendChild(this._sound)
          }
          if (qlt) {
            this._qualityContainer = document.createElement('div')
            this._qualityContainer.className = 'mse-quality-container'
            this._qualitySelect = document.createElement('select')
            this._qualitySelect.className = 'mse-quality-select'

            this._qualitySelect.addEventListener('change', (event) => {
              this._profile = event.target.value
              this._socket.send('{"init":{"track":"' + this._profile + '"}}')
            })

            this._qualityButton = document.createElement('button')
            this._qualityButton.className = 'mse-quality-button'
            this._qualityContainer.appendChild(this._qualitySelect)
            this._qualityContainer.appendChild(this._qualityButton)
            this._controls.appendChild(this._qualityContainer)
          }
          if (stt) {
            this._settings = document.createElement('button')
            this._settings.className = 'mse-settings'

            this._settingsControl = document.createElement('div')
            this._settingsControl.className = 'mse-settings-control'
            this._settingsControl.style.visibility = 'hidden'
            this._settingsControl.addEventListener('click', (event) => {
              event.stopPropagation()
            })

            /*					Цифровой зум				*/

            this._labelZoom = document.createElement('div')
            this._labelZoom.className = 'mse-label'
            this._labelZoom.innerHTML = 'Цифровой zoom:'

            this._toogleZoom = document.createElement('label')
            this._toogleZoom.className = 'switch'
            //this._toogleZoom.style.transformOrigin = '100% 0'
            //this._toogleZoom.style.transform = 'scale(' + this._container.offsetWidth / window.screen.width + ')'
            this._toogleZoom.style.height = this._container.offsetWidth / 80 + 'px'
            this._toogleZoom.style.width = this._container.offsetWidth / 38.4 + 'px'

            this._inputZoom = document.createElement('input')
            this._inputZoom.type = 'checkbox'

            this._inputZoom.addEventListener('click', (event) => {
              if (this._inputZoom.checked) {
                this._inputPTZ.checked = false
                this._inputPTZ.disabled = true
                this._tooglePTZ.classList.add('disabled')
              } else if (!this._inputZoom.checked && this._archiveControl.hidden && this._options.ipptz && this._playing) {
                this._inputPTZ.disabled = false
                this._tooglePTZ.classList.remove('disabled')
              }
            })

            this._spanZoom = document.createElement('span')
            this._spanZoom.className = 'slider round'

            this._toogleZoom.appendChild(this._inputZoom)
            this._toogleZoom.appendChild(this._spanZoom)

            /* Поворот камер */

            this._triangleUp = document.createElement('div')
            this._triangleUp.id = 'triangle-up'
            // this._triangleUp.style.opacity = 0
            this._triangleUp.hidden = true

            this._triangleDown = document.createElement('div')
            this._triangleDown.id = 'triangle-down'
            // this._triangleDown.style.opacity = 0
            this._triangleDown.hidden = true

            this._triangleLeft = document.createElement('div')
            this._triangleLeft.id = 'triangle-left'
            // this._triangleLeft.style.opacity = 0
            this._triangleLeft.hidden = true

            this._triangleRight = document.createElement('div')
            this._triangleRight.id = 'triangle-right'
            // this._triangleRight.style.opacity = 0
            this._triangleRight.hidden = true

            this._triangleUp.addEventListener('click', (event) => {
              var xhr = new XMLHttpRequest()
              this._offsetY = -200
              this._offsetX = 0
              this.sendQueryAll(this, xhr).then(result => {
                this.move(this, xhr, 'TiltTo')
              })
            })

            this._triangleDown.addEventListener('click', (event) => {
              var xhr = new XMLHttpRequest()
              this._offsetY = 200
              this._offsetX = 0
              this.sendQueryAll(this, xhr).then(result => {
                this.move(this, xhr, 'TiltTo')
              })
            })

            this._triangleLeft.addEventListener('click', (event) => {
              var xhr = new XMLHttpRequest()
              this._offsetX = -500
              this._offsetY = 0
              this.sendQueryAll(this, xhr).then(result => {
                this.move(this, xhr, 'PanTo')
              })
            })

            this._triangleRight.addEventListener('click', (event) => {
              var xhr = new XMLHttpRequest()
              this._offsetX = 500
              this._offsetY = 0
              this.sendQueryAll(this, xhr).then(result => {
                this.move(this, xhr, 'PanTo')
              })
            })

            this._container.appendChild(this._triangleUp)
            this._container.appendChild(this._triangleDown)
            this._container.appendChild(this._triangleLeft)
            this._container.appendChild(this._triangleRight)

            this._labelPTZ = document.createElement('div')
            this._labelPTZ.className = 'mse-label'
            this._labelPTZ.innerHTML = 'Поворот камеры:'

            this._labelProfile = document.createElement('div')
            this._labelProfile.className = 'mse-label'
            this._labelProfile.innerHTML = 'Профиль:'

            this._selectProfile = document.createElement('select')
            this._selectProfile.className = 'mse-archive-control'
            this._selectProfile.setAttribute('style', 'float: right; border-radius: 0.6vw; outline: none; color: rgba(0,0,0,0.9);')

            this._selectProfile.addEventListener('change', (event) => {
              this._profile = event.target.value
              this._socket.send('{"init":{"track":"' + this._profile + '"}}')
              // this.stop()
              // this.start()
            })

            this._labelProfile.appendChild(this._selectProfile)

            // this._selectProfile.appendChild(this._profileOption1)
            // this._selectProfile.appendChild(this._profileOption2)

            this._tooglePTZ = document.createElement('label')
            this._tooglePTZ.className = 'switch'

            //this._tooglePTZ.style.transformOrigin = '100% 0'
            //this._tooglePTZ.style.transform = 'scale(' + this._container.offsetWidth / window.screen.width + ')'
            this._tooglePTZ.style.height = this._container.offsetWidth / 80 + 'px'
            this._tooglePTZ.style.width = this._container.offsetWidth / 38.4 + 'px'

            this._inputPTZ = document.createElement('input')
            this._inputPTZ.type = 'checkbox'

            if (!this._options.ipptz) {
              this._inputPTZ.disabled = true
              this._tooglePTZ.classList.add('disabled')
            }

            this._inputPTZ.addEventListener('click', (event) => {
              if (this._inputPTZ.checked) {
                this._inputZoom.checked = false
                this._inputZoom.disabled = true
                this._toogleZoom.classList.add('disabled')
              } else {
                this._inputZoom.disabled = false
                this._toogleZoom.classList.remove('disabled')
              }
              if (this._triangleUp.hidden && this._triangleDown.hidden && this._triangleLeft.hidden && this._triangleRight.hidden) {
                this._triangleUp.hidden = false
                this._triangleDown.hidden = false
                this._triangleLeft.hidden = false
                this._triangleRight.hidden = false
              } else {
                this._triangleUp.hidden = true
                this._triangleDown.hidden = true
                this._triangleLeft.hidden = true
                this._triangleRight.hidden = true
              }
            })

            this._spanPTZ = document.createElement('span')
            this._spanPTZ.className = 'slider round'

            this._tooglePTZ.appendChild(this._inputPTZ)
            this._tooglePTZ.appendChild(this._spanPTZ)

            /*				Выгрузка архива					*/

            this._downloadArchive = document.createElement('button')
            this._downloadArchive.className = 'mse-settings-button'
            this._downloadArchive.innerHTML = 'Выгрузка архива'
            this._downloadArchive.style.fontSize = this._container.offsetWidth / 100 + 'px'

            this._coverDiv = document.createElement('div')
            this._coverDiv.id = 'cover-div'

            this._downloadArchiveDiv = document.createElement('div')
            this._downloadArchiveDiv.id = 'download-archive-div'
            this._downloadArchiveDiv.style.fontSize = this._container.offsetWidth / 113 + 'px'

            this._downloadArchiveDiv.addEventListener('click', (event) => {
              event.stopPropagation()
            })

            this._coverDiv.addEventListener('click', (event) => {
              event.stopPropagation()
            })

            this._labelFirstDate = document.createElement('div')
            this._labelFirstDate.className = 'mse-archive-label'
            this._labelFirstDate.innerHTML = 'Начальная дата:'
            this._labelFirstDate.style.fontSize = this._container.offsetWidth / 113 + 'px'

            this._firstDate = document.createElement('div')
            this._firstDate.className = 'mse-archive-download-control'

            this._firstDateInput = document.createElement('input')
			this._firstDateInput.placeholder = 'Выберите дату'
            this._firstDateInput.className = 'form-control archive-form-control first-date'
            this._firstDateInput.style.height = this._container.offsetWidth / 80 + 'px'
            this._firstDateInput.style.fontSize = this._container.offsetWidth / 112 + 'px'
            this._firstDateInput.style.width = this._container.offsetWidth / 9.6 + 'px'
            
            // this._firstDateInput.required = true

            this._labelLastDate = document.createElement('div')
            this._labelLastDate.className = 'mse-archive-label'
            this._labelLastDate.innerHTML = 'Конечная дата:'
            this._labelLastDate.style.fontSize = this._container.offsetWidth / 100 + 'px'

            this._lastDate = document.createElement('div')
            this._lastDate.className = 'mse-archive-download-control'

            this._lastDateInput = document.createElement('input')
			this._lastDateInput.placeholder = 'Выберите дату'
            this._lastDateInput.className = 'form-control archive-form-control last-date'
            this._lastDateInput.style.height = this._container.offsetWidth / 80 + 'px'
            this._lastDateInput.style.fontSize = this._container.offsetWidth / 112 + 'px'
            this._lastDateInput.style.width = this._container.offsetWidth / 9.6 + 'px'
            // this._lastDateInput.required = true

			this._firstDateInput.addEventListener('click', (event) => {
			  event.stopPropagation()
			  this._firstDateInput.readOnly = true
            })
			
			this._lastDateInput.addEventListener('click', (event) => {
			  event.stopPropagation()
			  this._lastDateInput.readOnly = true
            })
			
			this._firstDateInput.addEventListener('blur', (event) => {
			  this._firstDateInput.readOnly = false
            })
			
			this._lastDateInput.addEventListener('blur', (event) => {
			  this._lastDateInput.readOnly = false
            })
			
            //this._firstDate.appendChild(this._firstDateInput)
            this._labelFirstDate.appendChild(this._firstDateInput)
            //this._lastDate.appendChild(this._lastDateInput)
            this._labelLastDate.appendChild(this._lastDateInput)

            $(this._labelFirstDate).on('dp.change', (event) => {
              this._canDownload = true
              this._firstDateInput.style.border = ''
            })

            $(this._labelLastDate).on('dp.change', (event) => {
              this._canDownload = true
              this._lastDateInput.style.border = ''
            })

            this._preparing = document.createElement('div')
            this._preparing.className = 'mse-prepare-label'
            this._preparing.innerHTML = 'Подготовка: '

            this._progressBar = document.createElement('div')
            this._progressBar.className = 'mse-prepare-label'

            this._labelFirstDate.addEventListener("DOMNodeInserted", (event) => {
              if (event.target.nodeName === 'DIV' && event.target.className.includes('bootstrap-datetimepicker-widget')) {
                var scale = this._container.offsetWidth / window.screen.width
                event.target.style.transformOrigin = '100% 0'
                event.target.style.transform = 'scale(' + scale + ')'
                event.target.style.color = '#333'
              }
            })

            this._labelLastDate.addEventListener("DOMNodeInserted", (event) => {
              if (event.target.nodeName === 'DIV' && event.target.className.includes('bootstrap-datetimepicker-widget')) {
                var scale = this._container.offsetWidth / window.screen.width
                event.target.style.transformOrigin = '100% 0'
                event.target.style.transform = 'scale(' + scale + ')'
                event.target.style.color = '#333'
              }
            })

            this._downloadArchive.addEventListener('click', (event) => {
              this._canDownload = true
              this._preparing.hidden = true
              this._progressBar.hidden = true
              this._container.appendChild(this._coverDiv)
              this._container.appendChild(this._downloadArchiveDiv)

              $('.first-date').datetimepicker({
                format: 'YYYY-MM-DD HH:mm:ss',
                widgetPositioning: {
                  horizontal: 'right',
                  vertical: 'bottom'
                }
                //debug: true
              })
              $('.last-date').datetimepicker({
                format: 'YYYY-MM-DD HH:mm:ss',
                widgetPositioning: {
                  horizontal: 'right',
                  vertical: 'bottom'
                }
                //debug: true
              })

            })

            this._buttonsDiv = document.createElement('div')
            this._buttonsDiv.className = 'archive-buttons'
            //this._buttonsDiv.style.transform = 'scale(' + this._container.offsetWidth / window.screen.width + ')'

            this._downloadButton = document.createElement('button')
            this._downloadButton.className = 'mse-archive-button'
            this._downloadButton.innerHTML = 'Выгрузить архив'
            this._downloadButton.style.fontSize = this._container.offsetWidth / 100 + 'px'

            this._cancelButton = document.createElement('button')
            this._cancelButton.className = 'mse-archive-button'
            this._cancelButton.innerHTML = 'Отмена'
            this._cancelButton.style.fontSize = this._container.offsetWidth / 100 + 'px'

            this._downloadButton.addEventListener('click', (event) => {
              if (this._firstDateInput.value && this._lastDateInput.value) {
                let dateFrom = new Date(this._firstDateInput.value)
                let dateTo = new Date(this._lastDateInput.value)

                if (dateFrom > dateTo) {
                  this._firstDateInput.style.border = '2px solid red'
                } else {
                  dateFrom = dateFrom.toISOString()
                  dateTo = dateTo.toISOString()

                  var xhr = new XMLHttpRequest()
                  this._preparing.hidden = false
                  this._progressBar.hidden = false
                  this.downloadArchive(this, xhr, dateFrom, dateTo)
                }
              } else {
                if (!this._firstDateInput.value) {
                  this._firstDateInput.style.border = '2px solid red'
                }
                if (!this._lastDateInput.value) {
                  this._lastDateInput.style.border = '2px solid red'
                }
              }
            })

            this._cancelButton.addEventListener('click', (event) => {
              this._container.removeChild(this._coverDiv)
              this._container.removeChild(this._downloadArchiveDiv)
              this._preparing.hidden = true
              this._progressBar.innerHTML = ''
              this._preparing.innerHTML = 'Подготовка: '
              this._progressBar.hidden = true
              this._canDownload = false
            })

            this._buttonsDiv.appendChild(this._downloadButton)
            this._buttonsDiv.appendChild(this._cancelButton)

            this._downloadArchiveDiv.appendChild(this._labelFirstDate)
            //this._downloadArchiveDiv.appendChild(this._firstDate)
            this._downloadArchiveDiv.appendChild(this._labelLastDate)
            //this._downloadArchiveDiv.appendChild(this._lastDate)
            this._downloadArchiveDiv.appendChild(this._preparing)
            this._downloadArchiveDiv.appendChild(this._progressBar)
            this._downloadArchiveDiv.appendChild(this._buttonsDiv)

            this._settingsControl.appendChild(this._labelZoom)
            this._labelZoom.appendChild(this._toogleZoom)
            //this._settingsControl.appendChild(this._toogleZoom)
            this._settingsControl.appendChild(this._labelPTZ)
            //this._settingsControl.appendChild(this._tooglePTZ)
            this._labelPTZ.appendChild(this._tooglePTZ)

            // this._settingsControl.appendChild(this._labelProfile)

            this._settingsControl.appendChild(this._downloadArchive)

            if (!this._options.iparchive) {
              this._downloadArchive.hidden = true
            }

            this._container.appendChild(this._settingsControl)

            this._settings.addEventListener('click', (event) => {
              if (this._settingsControl.style.visibility === 'hidden') {
                this._settingsControl.style.visibility = 'visible'
              } else {
                this._settingsControl.style.visibility = 'hidden'
              }
              event.stopPropagation()
            })
            this._controls.appendChild(this._settings)
          }
          if (fub) {
            this._fullscreen = document.createElement('button')
            this._fullscreen.className = 'mse-fullscreen'

            this._fullscreen.addEventListener('click', (event) => {
              if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (this._container.requestFullscreen) {
                  this._container.requestFullscreen()
                } else if (this._container.msRequestFullscreen) {
                  this._container.msRequestFullscreen()
                } else if (this._container.mozRequestFullScreen) {
                  this._container.mozRequestFullScreen()
                } else if (this._container.webkitRequestFullscreen) {
                  this._container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
                }
              } else {
                if (document.exitFullscreen) {
                  document.exitFullscreen()
                } else if (document.msExitFullscreen) {
                  document.msExitFullscreen()
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen()
                } else if (document.webkitExitFullscreen) {
                  document.webkitExitFullscreen()
                }
              }
            })
            this._controls.appendChild(this._fullscreen)
          }
        }
      }      
    }

    addZero (i) {
      if (i < 10) {
        i = '0' + i
      }
      return i
    }

    get namespace() {
      return this._namespace || null
    }

    set namespace(value) {
      this._namespace = value
    }

    /** @return {boolean} */
    get disabled() {
      if (!this._container) {
        return false
      }
      return this._container.classList.contains('disabled')
    }

    /** @param {boolean} bool */
    set disabled(bool) {
      if (!this._container) {
        return
      }
      if (bool === true) {
        if (this._container.classList.contains('disabled')) {
          return
        }
        this._container.classList.add('disabled')
        this.stop()
      } else {
        if (!this._container.classList.contains('disabled')) {
          return
        }
        this._container.classList.remove('disabled')
        this.start()
      }
    }

    ////////////////////////// public methods ////////////////////////////

    mediaInfo() {
      let str = `******************\n`
      str += `namespace : ${this._namespace}\n`
      if (this._video) {
        str += `video.paused : ${this._video.paused}\nvideo.currentTime : ${this._video.currentTime}\nvideo.src : ${this._video.src}\n`
        if (this._sourceBuffer.buffered.length) {
          str += `buffered.length : ${this._sourceBuffer.buffered.length}\nbuffered.end(0) : ${this._sourceBuffer.buffered.end(0)}\nbuffered.start(0) : ${this._sourceBuffer.buffered.start(0)}\nbuffered size : ${this._sourceBuffer.buffered.end(0) - this._sourceBuffer.buffered.start(0)}\nlag : ${this._sourceBuffer.buffered.end(0) - this._video.currentTime}\n`
        }
      }
      str += `******************\n`
      // console.info(str)
    }

    togglePlay() {
      if (this._playing === true) {
        this._play.hidden = false
        if (this._container.querySelector('.mse-loader')) {
          this._container.removeChild(this._loader)
        }
        this.stop()
      } else {
        //this._play.hidden = true
        this.start()
      }
      return this
    }

    togglePlayArchive() {
      if (this._playing) {
        this._play.hidden = true
        this._startpause.hidden = false
        if (this._container.querySelector('.mse-loader')) {
          this._container.removeChild(this._loader)
        }
        this.pause()
      } else {
        this._startpause.hidden = true
        if (this._namespace.indexOf('from=') !== -1 && this._statusInfo) {
          this._video.load()
          var pausedTime = this._pausedTime //document.querySelector(".mse-datetime-controls").innerHTML
          pausedTime = pausedTime.replace(new RegExp(' '), '-')
          this._namespace = this._options.namespace + `/${this._camID}?from=${pausedTime}&login=${this._login}&password=${this._password}`
          this.start()
        }
      }
      return this
    }

    start(namespace) {
      if (!namespace) {
        namespace = this._namespace
      }
      //todo maybe pass namespace as parameter to start(namespace) to accommodate cycling feature
      if (this._playing) {
        this.stop()
      }
      if (!this._container.querySelector('.mse-loader')) {
        this._loader = document.createElement('div')
        this._loader.className = 'mse-loader'
        this._turquoise = document.createElement('div')
        this._turquoise.className = 'mse-turquoise'
        this._green = document.createElement('div')
        this._green.className = 'mse-green'
        this._blue = document.createElement('div')
        this._blue.className = 'mse-blue'
        this._loader.appendChild(this._turquoise)
        this._loader.appendChild(this._green)
        this._loader.appendChild(this._blue)
        this._container.appendChild(this._loader)
        if (this._inputDateTime) {
          this._inputDateTime.disabled = true
        }
        this._loader.style.transform = 'translate(-50%, -50%) scale(' + this._container.offsetWidth / window.screen.width + ')'
      }
      this._playing = true
      this._play.hidden = true
      if (this._datetime_info) {
        this._datetime_info.hidden = false
      }
      if (this._statusInfo) {
        this._statusInfo.hidden = false
      }
      if (this._camid_info) {
        this._camid_info.hidden = false
        // this._camid_info.innerHTML = this._camID
      }
      // this._socket = this._io(`${this._ip}/${namespace}`, {transports: ['websocket'], forceNew: false})
      this._socket = new WebSocket(`ws://${this._ip}${namespace}`)
      // console.dir(namespace)
      // this._socket = new WebSocket(`ws://192.168.10.22:3000/live/cam%20156?login=admin&password=fulladmin`)
      this._addSocketEvents()
      /*if (this._startstop) {
        this._startstop.disabled = false
      }*/
      if (namespace.indexOf('from=') !== -1 && this._statusInfo) {
        this._statusInfo.innerHTML = 'Архив'
      } else if (this._statusInfo) {
        this._statusInfo.innerHTML = ''
      }
      if (this._statusInfo.innerHTML == 'Архив') {
        if (this._startstop) {
          this._startstop.classList.add('mse-pause-archive')
          this._startstop.classList.remove('mse-start')
          this._startstop.classList.remove('mse-stop')
          // this._startstop.disabled = true
        }
      } else {
        if (this._startstop) {
          this._startstop.classList.add('mse-stop')
          this._startstop.classList.remove('mse-start')
          this._startstop.classList.remove('mse-pause-archive')
          // this._startstop.disabled = true
        }
      }
      if (this._inputZoom) {
        this._inputZoom.disabled = false
      }
      if (this._toogleZoom) {
        this._toogleZoom.classList.remove('disabled')
      }
      if (this._archiveControl && this._archiveControl.hidden && !this._inputZoom.checked && this._options.ipptz && this._playing) {
        this._inputPTZ.disabled = false
        this._tooglePTZ.classList.remove('disabled')
        this._inputPTZ.click()
      }
      if (this._video) {
        this._video.style.transform = ''
      }
      this._prevX = 1
      this._prevY = 1
      this._newX = 1
      this._newY = 1
      this._scale = 1
      return this
    }

    pause() {
      if (this._startstop) {
        this._startstop.classList.add('mse-start')
        this._startstop.classList.remove('mse-pause-archive')
        //this._startstop.disabled = true
      }
      this._playing = false

      if (this._video) {
        this._removeVideoEvents()
        this._video.pause()
        this._video.removeAttribute('src')
        //this._video.src = ''//todo: not sure if NOT removing this will cause memory leak
        //this._video.load()
      }
      if (this._socket) {
        this._removeSocketEvents()
        if (this._socket.connected) {
          this._socket.disconnect()
        }
        this._socket.close()
        delete this._socket
      }
      if (this._mediaSource) {
        this._removeMediaSourceEvents()
        if (this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length) {
          this._mediaSource.removeSourceBuffer(this._sourceBuffer)
        }
        delete this._mediaSource
      }
      if (this._sourceBuffer) {
        this._removeSourceBufferEvents()
        if (this._sourceBuffer.updating) {
          this._sourceBuffer.abort()
        }
        delete this._sourceBuffer
      }
      /*if (this._startstop) {
        this._startstop.disabled = false
      }*/
      if (this._datetime_info) {
        this._datetime_info.hidden = true
      }
      if (this._statusInfo) {
        this._statusInfo.hidden = true
      }
      if (this._camid_info) {
        this._camid_info.hidden = true
        this._camid_info.innerHTML = ''
      }
      return this
    }

    /*pause() {
		if (this._playing === true) {
			if (this._video.paused) {
				if (this._namespace.indexOf('from=') !== -1 && this._statusInfo) {
					var pausedTime = document.querySelector(".mse-datetime-controls").innerHTML
					//console.dir(pausedTime)
					pausedTime = pausedTime.replace(new RegExp(' '), '-')
					this._namespace = `live/${this._camID}?from=${pausedTime}`
					this.start()
				}
				else {
					this._video.play()
				}
				//this._startpause.classList.remove('mse-pause')
				//this._startpause.classList.add('mse-pause')
				this._startpause.hidden = true
				//lert(1)
			} else {
				this._video.pause()
				//this._startpause.classList.add('mse-pause')
				//this._startpause.classList.remove('mse-pause')
				//this._startpause.classList.add('mse-start')
				this._startpause.hidden = false
			}
		}
	}*/

    stop() {
      if (this._startstop) {
        this._startstop.classList.add('mse-start')
        this._startstop.classList.remove('mse-stop')
        //this._startstop.disabled = true
      }
      this._playing = false
      if (this._video) {
        this._removeVideoEvents()
        this._video.pause()
        this._video.removeAttribute('src')
        //this._video.src = ''//todo: not sure if NOT removing this will cause memory leak
        this._video.load()
      }
      if (this._mimeTimeout) {
        clearTimeout(this._mimeTimeout)
      }
      if (this._socket) {
        this._removeSocketEvents()
        if (this._socket.connected) {
          this._socket.disconnect()
        }
        this._socket.close()
        delete this._socket
      }
      if (this._mediaSource) {
        this._removeMediaSourceEvents()
        if (this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length) {
          this._mediaSource.removeSourceBuffer(this._sourceBuffer)
        }
        delete this._mediaSource
      }
      if (this._sourceBuffer) {
        this._removeSourceBufferEvents()
        if (this._sourceBuffer.updating) {
          this._sourceBuffer.abort()
        }
        delete this._sourceBuffer
      }
      /*if (this._startstop) {
        this._startstop.disabled = false
      }*/
      if (this._datetime_info) {
        this._datetime_info.hidden = true
        this._datetime_info.innerHTML = ''
      }
      if (this._statusInfo) {
        this._statusInfo.hidden = true
        this._statusInfo.innerHTML = ''
      }
      if (this._camid_info) {
        this._camid_info.hidden = true
        this._camid_info.innerHTML = ''
      }
      if (this._mime) {
        this._mime = undefined
      }
      if (this._settingsControl) {
        this._triangleUp.hidden = true
        this._triangleDown.hidden = true
        this._triangleLeft.hidden = true
        this._triangleRight.hidden = true
        this._inputPTZ.checked = false
        this._inputZoom.checked = false
        this._inputPTZ.disabled = true
        this._inputZoom.disabled = true
        this._tooglePTZ.classList.add('disabled')
        this._toogleZoom.classList.add('disabled')
        this._settingsControl.style.visibility = 'hidden'
      }
      if (this._inputDateTime) {
        this._inputDateTime.disabled = false
      }
      this._firstInit = false
      return this
    }

    destroy() {
      // todo: possibly strip control buttons and other layers added around video player
      return this
    }

    // video element events

    _onVideoError(event) {
      this._callback(`video error ${event.type}`)
    }

    _onVideoLoadedData(event) {
      this._callback(null, `video loaded data ${event.type}`)
      if ('Promise' in window) {
        this._video.play()
          .then(() => {
            this._startOffset = (this._container.offsetWidth - this._video.clientWidth) / 2
            this._prevX += this._startOffset
            //this._video.style.left = this._startOffset + 'px'
            /*if (this._container.offsetWidth > this._container.offsetHeight) {
              this._video.style.height = '100%'
            } else {
              this._video.style.width = '100%'
            }*/
            // this._callback(null, 'play promise fulfilled')
            // todo remove "click to play" poster
          })
          .catch((error) => {
            this._callback(error)
            // todo add "click to play" poster
          })
      } else {
        this._video.play()
        this._startOffset = (this._container.offsetWidth - this._video.clientWidth) / 2
        this._prevX += this._startOffset
        //this._video.style.left = this._startOffset + 'px'
       /*if (this._container.offsetWidth > this._container.offsetHeight) {
          this._video.style.height = '100%'
        } else {
          this._video.style.width = '100%'
        }*/
      }
    }

    _addVideoEvents() {
      if (!this._video) {
        return
      }

      this.onVideoError = this._onVideoError.bind(this)
      this._video.addEventListener('error', this.onVideoError, {
        capture: true,
        passive: true,
        once: true
      })

      this.onVideoLoadedData = this._onVideoLoadedData.bind(this)
      this._video.addEventListener('loadeddata', this.onVideoLoadedData, {
        capture: true,
        passive: true,
        once: true
      })

      this._callback(null, 'added video events')
    }

    _removeVideoEvents() {
      if (!this._video) {
        return
      }

      this._video.removeEventListener('error', this.onVideoError, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onVideoError

      this._video.removeEventListener('loadeddata', this.onVideoLoadedData, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onVideoLoadedData

      this._callback(null, 'removed video events')
    }

    ///////////////////// media source events ///////////////////////////

    _onMediaSourceClose(event) {
      this._callback(null, `media source close ${event.type}`)
    }

    _onMediaSourceOpen(event) {
      URL.revokeObjectURL(this._video.src)
      this._mediaSource.duration = Number.POSITIVE_INFINITY
      this._sourceBuffer = this._mediaSource.addSourceBuffer(this._mime)
      this._sourceBuffer.mode = 'sequence'
      this._addSourceBufferEvents()
      this._sourceBuffer.appendBuffer(this._init)
      //this._video.setAttribute('poster', 'data:image/svg+xmlbase64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE2MCIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBtZWRpYSBzZWdtZW50czwvdGV4dD48L2c+PC9zdmc+')
      //this.onSegment = this._onSegment.bind(this)
      //this._socket.addEventListener('segment', this.onSegment, {capture: true, passive: true, once: false})
      // if (!this._video.paused) {
      this._socket.send('segment')
      // }
      //this._video.muted = true
    }

    _addMediaSourceEvents() {
      if (!this._mediaSource) {
        return
      }

      this.onMediaSourceClose = this._onMediaSourceClose.bind(this)
      this._mediaSource.addEventListener('sourceclose', this.onMediaSourceClose, {
        capture: true,
        passive: true,
        once: true
      })

      this.onMediaSourceOpen = this._onMediaSourceOpen.bind(this)
      this._mediaSource.addEventListener('sourceopen', this.onMediaSourceOpen, {
        capture: true,
        passive: true,
        once: true
      })
    }

    _removeMediaSourceEvents() {
      if (!this._mediaSource) {
        return
      }

      this._mediaSource.removeEventListener('sourceclose', this.onMediaSourceClose, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onMediaSourceClose

      this._mediaSource.removeEventListener('sourceopen', this.onMediaSourceOpen, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onMediaSourceOpen
    }

    ///////////////////// source buffer events /////////////////////////

    _onSourceBufferError(event) {
      this._callback(`sourceBufferError ${event.type}`)
    }

    _onSourceBufferUpdateEnd(event) {
      //cant do anything to sourceBuffer if it is updating
      if (this._sourceBuffer.updating) {
        return
      }
      // if has last segment pending, append it
      if (this._lastSegment) {
        // this._callback(null, 'using this._lastSegment')
        this._sourceBuffer.appendBuffer(this._lastSegment)
        delete this._lastSegment
        return
      }
      // check if buffered media exists
      if (!this._sourceBuffer.buffered.length) {
        return
      }
      const currentTime = this._video.currentTime
      const start = this._sourceBuffer.buffered.start(0)
      const end = this._sourceBuffer.buffered.end(0)
      const past = currentTime - start

      // console.log('UP:', currentTime, ' [', start, ',', end, '] ', past, '\n')
      // todo play with numbers and make dynamic or user configurable
      if (past > 20 && currentTime < end) {
        this._sourceBuffer.remove(start, currentTime - 4)
      }
      // todo
      if (currentTime < start) {
        this._video.currentTime = start
      }
    }

    _addSourceBufferEvents() {
      if (!this._sourceBuffer) {
        return
      }
      this.onSourceBufferError = this._onSourceBufferError.bind(this)
      this._sourceBuffer.addEventListener('error', this.onSourceBufferError, {
        capture: true,
        passive: true,
        once: true
      })

      this.onSourceBufferUpdateEnd = this._onSourceBufferUpdateEnd.bind(this)
      this._sourceBuffer.addEventListener('updateend', this.onSourceBufferUpdateEnd, {
        capture: true,
        passive: true,
        once: false
      })
    }

    _removeSourceBufferEvents() {
      if (!this._sourceBuffer) {
        return
      }

      this._sourceBuffer.removeEventListener('error', this.onSourceBufferError, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onSourceBufferError

      this._sourceBuffer.removeEventListener('updateend', this.onSourceBufferUpdateEnd, {
        capture: true,
        passive: true,
        once: false
      })
      delete this.onSourceBufferUpdateEnd
    }

    // socket.io events

    _onSocketConnect (event) {
      console.log('onSocketConnect', event)
      if (this._container.querySelector('.mse-error-message')) {
        this._container.removeChild(this._errorMessage)
        // this._container.removeChild(this._loader)
        if (this._controls) {
          this._controls.style.visibility = 'visible'
        }
      }
      // this._callback(null, 'socket connect')
      // this._video.setAttribute('poster', 'data:image/svg+xmlbase64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE5NiIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBtaW1lIHR5cGU8L3RleHQ+PC9nPjwvc3ZnPg==')
      // this.onMime = this._onMime.bind(this)
      // this._socket.addEventListener('mime', this.onMime, {capture: true, passive: true, once: true})
      this._socket.send('info')
      this._mimeTimeout = setTimeout(() => {
        if (!this._mime) {
          this._callback('no video')
          if (!this._container.querySelector('.mse-error-message')) {
            this._errorMessage = document.createElement('div')
            this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
            this._errorMessage.className = 'mse-error-message'
            this._errorMessage.innerHTML = 'Нет видео'
            this._container.appendChild(this._errorMessage)
          }
          if (!this._container.querySelector('.mse-loader')) {
            this._loader = document.createElement('div')
            this._loader.className = 'mse-loader'
            this._turquoise = document.createElement('div')
            this._turquoise.className = 'mse-turquoise'
            this._green = document.createElement('div')
            this._green.className = 'mse-green'
            this._blue = document.createElement('div')
            this._blue.className = 'mse-blue'
            this._loader.appendChild(this._turquoise)
            this._loader.appendChild(this._green)
            this._loader.appendChild(this._blue)
            this._container.appendChild(this._loader)
            this._loader.style.transform = 'translate(-50%, -50%) scale(' + this._container.offsetWidth / window.screen.width + ')'
          }
          this._play.hidden = true
          if (this._controls) {
            this._controls.style.visibility = 'hidden'
          }
          if (this._divTimeRange) {
            this._divTimeRange.style.visibility = 'hidden'
          }
          this.stop()
          setTimeout(() => {
            this.start()
          }, 5000)
        }
      }, 5000)
    }

    _onSocketDisconnect (event) {
      this._callback(null, `socket disconnect "${event}"`)
      if (!this._container.querySelector('.mse-error-message')) {
        this._errorMessage = document.createElement('div')
        this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
        this._errorMessage.className = 'mse-error-message'
        this._errorMessage.innerHTML = 'Нет видео'
        this._container.appendChild(this._errorMessage)
      }
      if (!this._container.querySelector('.mse-loader')) {
        this._loader = document.createElement('div')
        this._loader.className = 'mse-loader'
        this._turquoise = document.createElement('div')
        this._turquoise.className = 'mse-turquoise'
        this._green = document.createElement('div')
        this._green.className = 'mse-green'
        this._blue = document.createElement('div')
        this._blue.className = 'mse-blue'
        this._loader.appendChild(this._turquoise)
        this._loader.appendChild(this._green)
        this._loader.appendChild(this._blue)
        this._container.appendChild(this._loader)
        this._loader.style.transform = 'translate(-50%, -50%) scale(' + this._container.offsetWidth / window.screen.width + ')'
      }
      this._play.hidden = true
      if (this._controls) {
        this._controls.style.visibility = 'hidden'
        this._divTimeRange.style.visibility = 'hidden'
      }
      this.stop()
      this._timerReconnect = setTimeout(() => {
        this.start()
      }, 5000)
    }

    _onSocketError (event) {
      this._callback(`socket error "${event}"`)
      // const keys = Object.keys(event)
      // for (let k in keys) {
      //   // console.log(k)
      //   // console.log(keys[k])
      // }
      if (!this._container.querySelector('.mse-error-message')) {
        this._errorMessage = document.createElement('div')
        this._errorMessage.style.fontSize = this._container.offsetWidth / 100 + 'px'
        this._errorMessage.className = 'mse-error-message'
        this._errorMessage.innerHTML = 'Нет видео'
        this._container.appendChild(this._errorMessage)
      }
      if (!this._container.querySelector('.mse-loader')) {
        this._loader = document.createElement('div')
        this._loader.className = 'mse-loader'
        this._turquoise = document.createElement('div')
        this._turquoise.className = 'mse-turquoise'
        this._green = document.createElement('div')
        this._green.className = 'mse-green'
        this._blue = document.createElement('div')
        this._blue.className = 'mse-blue'
        this._loader.appendChild(this._turquoise)
        this._loader.appendChild(this._green)
        this._loader.appendChild(this._blue)
        this._container.appendChild(this._loader)
        this._loader.style.transform = 'translate(-50%, -50%) scale(' + this._container.offsetWidth / window.screen.width + ')'
      }
      this._play.hidden = true
      if (this._controls) {
        this._controls.style.visibility = 'hidden'
        this._divTimeRange.style.visibility = 'hidden'
      }
      this.stop()
      this._timerReconnect = setTimeout(() => {
        this.start()
      }, 5000)
    }

    _onMessage(event) {
      // console.log ('onMessage:', event)
      // приводим ответ от сервера в пригодный вид

      // Проверяем, что плеер не стоит на паузе и что это не инициализации (видео запускается только после
      // инициализации, иначе this._video.paused всегда вернет true)
      if (!this._video.paused || (!(event.data instanceof Blob) /*&& JSON.parse(event.data).type === 'info'*/)) {
        var self = this
        if (event.type === 'message') {
          var data = event.data
          if (typeof data === 'string') {
            // проверяем тип события и выбираем, что делать
            var msg = JSON.parse(data)
            switch (msg.type) {
              case 'track':
                // console.log("onMime", msg.data)
                this.onMime(msg.data)
                break
              case 'info':
                // console.log("onInfo", msg.data)
                this.onInfo(msg.data)
                break
              case 'initialization':
                if (!this._firstInit) {
                  this.onBlob = this.onInit
                }
                // this.onInit(msg.data)
                break
              case 'segment':
                // this._video.text = 'segment'
                // if (!this._video.paused) {
                if (this._datetime_info) {
                  this._datetime_info.innerHTML = msg.time
                }
                this._pausedTime = msg.time
                this.onBlob = this.onSegment
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
            // console.log('blob', event.data)
            // var type = new Uint8Array(data, 0, 16)
            // console.log('blob:', type)

            // TODO
            // controll
            // var video = new Blob([new Uint8Array(arrayBuffer)], { type: "video/ogg" })

            // var test = new Uint8Array(data, 0, 16)

            var fileReader = new FileReader()
            fileReader.onload = (e) => {
              self.onBlob(e.target.result)
            }
            fileReader.readAsArrayBuffer(event.data)
            // console.log('onBlob')

            /* var buffer = new Buffer(ab.byteLength)
            var view = new Uint8Array(ab)
            for (var i = 0 i < buffer.length ++i) {
                buffer[i] = view[i]
            }
            return buffer */
          }
        } else {
          console.log('event type:', message.type)
        }
      }
    }

    onInfo(data) {
      if (this._camid_info) {
        this._camid_info.innerHTML = data.name
      }
      while (this._qualitySelect.firstChild) {
        this._qualitySelect.removeChild(this._qualitySelect.firstChild);
      }
      this._profile = data.tracks[0].name;
      data.tracks.forEach(track => {
        const option = document.createElement('option')
        option.innerHTML = track.name
        option.setAttribute('value', track.name)
        if (track.name === this._profile) {
          option.selected = true
        }
        // this._selectProfile.appendChild(option)
        this._qualitySelect.appendChild(option)
      })
      // this._profile = data.tracks[0].name
      this._socket.send('{"init":{"track":"' + this._profile + '"}}')
    }

    onMime(data) {
      console.log("onMime", data['mime'])
      this._profile = data['name']
      this._mime = data['mime']

      // if (!MediaSource.isTypeSupported(this._mime)) {
      //   // image - mime type not supported
      //   this._video.setAttribute('poster', 'data:image/svg+xmlbase64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE3NyIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+bWltZSB0eXBlIG5vdCBzdXBwb3J0ZWQ8L3RleHQ+PC9nPjwvc3ZnPg==')
      //   this._callback(`unsupported mime "${this._mime}"`)
      //   return
      // }
      // this._video.setAttribute('poster', 'data:image/svg+xmlbase64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE4NiIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBpbml0IHNlZ21lbnQ8L3RleHQ+PC9nPjwvc3ZnPg==')
      // this.onInit = this._onInit.bind(this)
      // this._socket.addEventListener('initialization', this.onInit, {capture: true, passive: true, once: true})
      this._socket.send('initialization')
      this._video.play()
    }

    onInit(data) {
      this._firstInit = true
      this._init = data
      this._mediaSource = new MediaSource()
      this._addMediaSourceEvents()
      this._addVideoEvents()
      this._video.src = URL.createObjectURL(this._mediaSource)
      if (this._container.querySelector('.mse-loader')) {
        this._container.removeChild(this._loader)
        
        if (this._inputDateTime) {
          this._inputDateTime.disabled = false
        }
      }
    }

    onSegment(data) {
      if (this._sourceBuffer.buffered.length) {

        // console.log(this._sourceBuffer.buffered.length)
        // console.log(this._video.currentTime)
        // console.log(this._sourceBuffer.buffered.end(0))

        // console.log(this._sourceBuffer.buffered.end(this._sourceBuffer.buffered.length - 1))

        const lag = this._sourceBuffer.buffered.end(this._sourceBuffer.buffered.length - 1) - this._video.currentTime
        // console.log('lag ' + lag)
        if (lag >= 2) {
          /* try {
               this._sourceBuffer.remove(this._sourceBuffer.buffered.start(0), this._sourceBuffer.buffered.end(0))
           } catch (err){
               console.log(err)
           } */
          this._video.currentTime = this._sourceBuffer.buffered.end(this._sourceBuffer.buffered.length - 1) - 2
          this._sourceBuffer.remove(this._sourceBuffer.buffered.start(0), this._video.currentTime)
        }
      }
      if (this._sourceBuffer.updating) {
        // console.log('buffer updating')
        this._lastSegment = data
      } else {
        // console.log('delete buffer')
        delete this._lastSegment
        try {
          this._sourceBuffer.appendBuffer(data)
        } catch (error) {
          // console.log('buffer error')
          this._sourceBuffer.remove(this._sourceBuffer.buffered.start(0), this._sourceBuffer.buffered.end(0))
        }
      }
    }

    _addSocketEvents() {
      if (!this._socket) {
        return
      }
      // this.onSocketConnect = this._onSocketConnect.bind(this)
      // this._socket.addEventListener('connect', this.onSocketConnect, {capture: true, passive: true, once: true})
      // this.onSocketDisconnect = this._onSocketDisconnect.bind(this)
      // this._socket.addEventListener('disconnect', this.onSocketDisconnect, {capture: true, passive: true, once: true})
      // this.onSocketError = this._onSocketError.bind(this)
      // this._socket.addEventListener('error', this.onSocketError, {capture: true, passive: true, once: true})
      this.onSocketConnect = this._onSocketConnect.bind(this)
      this._socket.addEventListener('open', this.onSocketConnect, {
        capture: true,
        passive: true,
        once: true
      })

      this.onSocketDisconnect = this._onSocketDisconnect.bind(this)
      this._socket.addEventListener('close', this.onSocketDisconnect, {
        capture: true,
        passive: true,
        once: true
      })

      this.onSocketError = this._onSocketError.bind(this)
      this._socket.addEventListener('error', this.onSocketError, {
        capture: true,
        passive: true,
        once: true
      })

      this.onMessage = this._onMessage.bind(this)
      this._socket.addEventListener('message', this.onMessage, {
        capture: true,
        passive: true,
        once: false
      })

    }

    _removeSocketEvents() {
      if (!this._socket) {
        return
      }

      this._socket.removeEventListener('open', this.onSocketConnect, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onSocketConnect

      this._socket.removeEventListener('close', this.onSocketDisconnect, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onSocketDisconnect

      this._socket.removeEventListener('error', this.onSocketError, {
        capture: true,
        passive: true,
        once: true
      })
      delete this.onSocketError

      this._socket.addEventListener('message', this.onMessage, {
        capture: true,
        passive: true,
        once: false
      })
      delete this.onMessage

      delete this.onMime
      delete this.onInit
      delete this.onSegment

      /* this._socket.removeEventListener('mime', this.onMime, {capture: true, passive: true, once: true})
          delete this.onMime
          this._socket.removeEventListener('initialization', this.onInit, {capture: true, passive: true, once: true})
          delete this.onInit
          this._socket.removeEventListener('segment', this.onSegment, {capture: true, passive: true, once: false})
          delete this.onSegment */
    }

    setArchiveTime(time) {
      let startTime = new Date(time)
      let endTime = new Date(time)
      const timeZoneOffset = startTime.getTimezoneOffset() / 60

      startTime.setHours(startTime.getHours() - timeZoneOffset)
      endTime.setHours(endTime.getHours() - timeZoneOffset)
      endTime.setMinutes(endTime.getMinutes() + 5)

      return this.formatTime(startTime)
    }

    formatTime(time) {
      time = time.toISOString()
      time = time.substr(0, time.length - 5)
      time = time.replace(new RegExp('-', 'g'), '.')
      time = time.replace('T', '-')
      return time
    }
  }
  return VideoPlayer
})

/* (function mse (window) {
  let host = '192.168.10.22:3000' // '62.69.14.245:3000'//window.location.host//'192.168.10.22:3000'// //

  // get query params from url
  // const urlParams = new URLSearchParams(window.location.search)
  // const autoLogin = urlParams.has('auto_logon')
  // const login = urlParams.get('login')
  // const password = urlParams.get('password')
  // const command = urlParams.get('command')
  // const camID = urlParams.get('cam_id')
  // const monitorID = urlParams.get('monitor_id')
  // const transport = urlParams.get('transport')

  const urlParams = new URLSearchParams(window.location.search)

  const autoLogin = false
  const login = urlParams.get('login')
  const password = urlParams.get('password')
  const command = null
  const camID = urlParams.get('cam_id')
  const monitorID = null
  const transport = null

  // DateTime format: dd-MM-yy'T'HH:mm:ss
  // Video server require the following: yyyy.MM.dd-HH:mm:ss
  var timeGet = urlParams.get('time')
  // let timeGet = null
  if (timeGet) {
    // timeGet = timeGet.replace(new RegExp('-', 'g'), '.').replace('\'T\'', '-')
    const yyyy = `20${timeGet.slice(6, 8)}`
    const MM = timeGet.slice(3, 5)
    const dd = timeGet.slice(0, 2)
    timeGet = `${yyyy}.${MM}.${dd}-${timeGet.slice(9, timeGet.length)}`
    // alert(timeGet)
  }

  // get all video elements on page
  const videos = document.getElementsByTagName('video')

  // array to keep reference to newly created VideoPlayers, maybe could be a keyed object
  // const videoPlayers = []

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]

    // const label = video.getElementsByTagName('label')[0]
    // video.get
    // only grab video elements that deliberately have data-namespace attribute
    // if (video.dataset.namespace) {
    // if (i === 0) {
    const videoPlayer = new VideoPlayer({
      video: video,
      ip: host ? host : video.dataset.ip, // video.dataset.ip ? video.dataset.ip : host,
      ipPTZ: video.dataset.ipptz ? video.dataset.ipptz : host,
      // namespace: video.dataset.namespace,
      camID: camID,
      namespace: `live`, // timeGet ? `live/${camID}?from=${timeGet}&login=${login}&password=${password}` : `live/${camID}?login=${login}&password=${password}`,
      controls: video.dataset.controls,
      login: login,
      password: password,
      time: timeGet || null,
      autoplay: true
    })
    // if (navigator.userAgent.match(/Android|iPhone|iPod|iPad|BlackBerry|Opera Mini|IEMobile/i)) {
    //  videoPlayer._startstop.classList.add('mse-start')
    //    videoPlayer._startstop.classList.remove('mse-stop')
    //} else if (video.autoplay && videoPlayer._namespace) {
    //    videoPlayer.start()
    //} 

    // }
    // else {
    //     const videoPlayer = new VideoPlayer({video: video, ip: video.dataset.ip, namespace: video.dataset.namespace, controls: video.dataset.controls})
    //     if (video.autoplay) {
    //         videoPlayer.start()
    //     }
    //  }
    // videoPlayers.push(videoPlayer)
    // }
  }

  // make videoPlayers accessible
  // window.videoPlayers = videoPlayers
})(window) */

// todo steps for creation of video player
// script is loaded at footer so that it can run after html is ready on page
// verify that socket.io is defined in window
// iterate each video element that has custom data-namespace attributes that we need
// initiate socket to get information from server
// first request codec string to test against browser and then feed first into source
// then request init-segment to feed
// then request media segments until we run into pause, stop, close, error, buffer not ready, etc
// change poster on video element based on current status, error, not ready, etc
