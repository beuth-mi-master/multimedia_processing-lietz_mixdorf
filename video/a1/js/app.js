/* global Helper */

class ColorFilter {

    constructor(elemId, videoId, w, h, cb) {
        this.element = document.getElementById(elemId);
        this.video = document.getElementById(videoId);
        this.aspectRatio = h / w;
        this.container = this.element.parentElement;
        this.ctx = this.element.getContext('2d');
        this.frameUpdateRequired = false;
        this.isGrayScale = false;
        this.isSepia = false;
        this.backgrounds = [null, "../assets/wolke.png", "../assets/berlin.png"];
        this.background = 0;
        this.cb = cb;
        this.brightness = {
            r: 0,
            g: 0,
            b: 0
        };
        this.greyScaleLuminosity = {
            r: 0.2126,
            g: 0.7152,
            b: 0.0722
        };
        this.sepiaEffect = {
            r: 100,
            g: 50,
            b: 0
        };
        this.chromakeyValues = {
            r: [20, 68],
            g: [35, 105],
            b: [90, 190]
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.resize();
        this.frameUpdateRequired = true;
        this.draw();
        this.frameUpdateRequired = false;
    }

    bindEvents() {
        Helper.addListener(window, "resize orientationchange", this.resize.bind(this));
        Helper.addListener(this.video, "play", this.playHandler.bind(this));
        Helper.addListener(this.video, "pause", this.pauseHandler.bind(this));
        Helper.addListener(this.video, "canplay", () => {
            this.frameUpdateRequired = true;
            setTimeout(() => {
                if (!this.videoIsPlaying) {
                    this.frameUpdateRequired = false;
                }
            }, 100);
        });
    }

    videoIsPlaying() {
        return !this.video.paused;
    }

    playHandler() {
        this.frameUpdateRequired = true;
    }

    pauseHandler() {
        this.frameUpdateRequired = false;
    }

    setBrightness({r = 0, b = 0, g = 0}) {
        this.brightness = {r, g, b};
    }

    draw() {
        if (this.frameUpdateRequired) {
            this.renderVideoFrameToCanvas();
            let frame = this.getImageData();

            frame = this.cb(frame, this);

            this.putImageData(frame);
        }
        window.requestAnimFrame(() => this.draw());
    }

    getImageData() {
        return this.ctx.getImageData(0, 0, this.element.width, this.element.height);
    }

    putImageData(frame) {
        return this.ctx.putImageData(frame, 0, 0);
    }

    renderVideoFrameToCanvas() {
        this.ctx.drawImage(this.video, 0, 0, this.element.width, this.element.height);
    }

    resize() {
        this.element.width = this.ctx.width = this.video.clientWidth;
        this.element.height = this.ctx.height = this.video.clientHeight;
    }

}

class Application {

    constructor() {
        this.colorFilter = new ColorFilter('canvas1', 'video1', 480, 272, (frame, _instance) => {
            for (let i = 0; i < frame.data.length; i += 4) {
                const rChannel = i + 0,
                    gChannel = i + 1,
                    bChannel = i + 2;
                frame.data[rChannel] += _instance.brightness.r;
                frame.data[gChannel] += _instance.brightness.g;
                frame.data[bChannel] += _instance.brightness.b;

                if (_instance.isGrayScale || _instance.isSepia) {
                    const average = frame.data[rChannel] * _instance.greyScaleLuminosity.r + frame.data[gChannel] * _instance.greyScaleLuminosity.g + frame.data[bChannel] * _instance.greyScaleLuminosity.b;
                    frame.data[rChannel] = average;
                    frame.data[gChannel] = average;
                    frame.data[bChannel] = average;
                    if (_instance.isSepia) {
                        frame.data[rChannel] += _instance.sepiaEffect.r;
                        frame.data[gChannel] += _instance.sepiaEffect.g;
                        frame.data[bChannel] += _instance.sepiaEffect.b;
                    }
                }
            }
            return frame;
        });

        this.exercise1(this);

        this.chromakey = new ColorFilter('canvas2', 'video2', 720, 404, (frame, _instance) => {
            const currentBg = _instance.backgrounds[_instance.background];
            const bg = (currentBg === null) ? "none" : `url(${currentBg})`;
            _instance.element.style.backgroundImage = bg;
            for (let i = 0; i < frame.data.length; i += 4) {
                const rChannel = i + 0,
                    gChannel = i + 1,
                    bChannel = i + 2,
                    aChannel = i + 3;
                const r = frame.data[rChannel],
                    g = frame.data[gChannel],
                    b = frame.data[bChannel];

                if ((r > _instance.chromakeyValues.r[0] && r < _instance.chromakeyValues.r[1]) && (g > _instance.chromakeyValues.g[0] && g < _instance.chromakeyValues.g[1]) && (b > _instance.chromakeyValues.b[0] && b < _instance.chromakeyValues.b[1])) {
                    frame.data[aChannel] = 0;
                }
            }
            return frame;
        });

        this.exercise3(this);

        this.exercise4(this);

    }

    exercise1(_app) {
        const elemBrightness = document.getElementById('brightness');

        let globalBrightness = elemBrightness.value;

        const elemRBrightness = document.getElementById('rbrightness');
        const elemGBrightness = document.getElementById('gbrightness');
        const elemBBrightness = document.getElementById('bbrightness');

        const elemInputFilter = document.querySelectorAll('input[name=filter]');

        elemInputFilter.forEach(elem => {
            Helper.addListener(elem, 'change', updateFilter.bind(elem));
        });

        Helper.addListener(elemBrightness, 'input', () => {
            const intensity = parseInt(elemBrightness.value, 10);
            const deltaIntensity = intensity - globalBrightness;
            elemRBrightness.value = parseInt(elemRBrightness.value, 10) + deltaIntensity;
            elemGBrightness.value = parseInt(elemGBrightness.value, 10) + deltaIntensity;
            elemBBrightness.value = parseInt(elemBBrightness.value, 10) + deltaIntensity;
            changeChannel();
            globalBrightness = intensity;
        });

        Helper.addListener(elemRBrightness, 'input change', changeChannel);
        Helper.addListener(elemGBrightness, 'input change', changeChannel);
        Helper.addListener(elemBBrightness, 'input change', changeChannel);

        function changeChannel() {
            _app.colorFilter.frameUpdateRequired = true;
            _app.colorFilter.setBrightness({
                r: parseInt(elemRBrightness.value, 10),
                g: parseInt(elemGBrightness.value, 10),
                b: parseInt(elemBBrightness.value, 10)
            });
            if (!_app.colorFilter.videoIsPlaying()) {
                setTimeout(() => {
                    _app.colorFilter.frameUpdateRequired = false;
                }, 10);
            }
        }

        function updateFilter() {
            _app.colorFilter.frameUpdateRequired = true;
            const filterActive = parseInt(document.querySelector('input[name=filter]:checked').value, 10);
            switch (filterActive) {
                case 1:
                    _app.colorFilter.isGrayScale = false;
                    _app.colorFilter.isSepia = true;
                    break;
                case 2:
                    _app.colorFilter.isGrayScale = true;
                    _app.colorFilter.isSepia = false;
                    break;
                default:
                    _app.colorFilter.isGrayScale = false;
                    _app.colorFilter.isSepia = false;
                    break;
            }
            if (!_app.colorFilter.videoIsPlaying()) {
                setTimeout(() => {
                    _app.colorFilter.frameUpdateRequired = false;
                }, 10);
            }
        }
    }

    exercise3(_app) {
        const elemBgFilter = document.querySelectorAll('input[name=bg]');
        elemBgFilter.forEach(elem => {
            Helper.addListener(elem, 'change', updateBg.bind(elem));
        });

        const cRmin = document.getElementById('chromaRMin');
        const cRmax = document.getElementById('chromaRMax');
        const cGmin = document.getElementById('chromaGMin');
        const cGmax = document.getElementById('chromaGMax');
        const cBmin = document.getElementById('chromaBMin');
        const cBmax = document.getElementById('chromaBMax');

        const elemInputChroma = document.querySelectorAll('#chroma input');
        elemInputChroma.forEach(elem => {
            Helper.addListener(elem, 'input', updateChroma.bind(elem));
        });

        function updateChroma() {
            const rmin = parseInt(cRmin.value, 10);
            const rmax = parseInt(cRmax.value, 10);
            const gmin = parseInt(cGmin.value, 10);
            const gmax = parseInt(cGmax.value, 10);
            const bmin = parseInt(cBmin.value, 10);
            const bmax = parseInt(cBmax.value, 10);

            _app.chromakey.chromakeyValues = {
                r: [rmin, rmax],
                g: [gmin, gmax],
                b: [bmin, bmax]
            };

            redrawCanvas(_app.chromakey);

        }

        function updateBg() {
            _app.chromakey.frameUpdateRequired = true;
            const bgActive = parseInt(document.querySelector('input[name=bg]:checked').value, 10);
            _app.chromakey.background = bgActive;
            if (!_app.chromakey.videoIsPlaying()) {
                setTimeout(() => {
                    _app.chromakey.frameUpdateRequired = false;
                }, 50);
            }
        }
    }

    exercise4(_app) {
        const cameraStartButton = document.getElementById('cameraStart');
        const cameraStopButton = document.getElementById('cameraStop');

        Helper.addListener(cameraStartButton, 'click', startCamera);

        Helper.addListener(cameraStopButton, 'click', stopCamera);

        function startCamera() {
            navigator.getUserMedia({video: true, audio: true}, (localMediaStream) => {
                var videos = document.querySelectorAll('video');
                videos.forEach((video) => {
                    video.src = window.URL.createObjectURL(localMediaStream);
                });
            }, (e) => {
                console.error("Could not start video!", e);
            });
        }

        function stopCamera() {
            var videos = document.querySelectorAll('video');
            videos.forEach((video) => {
                video.src = video.getAttribute("data-src");
                _app.chromakey.frameUpdateRequired = false;
                _app.colorFilter.frameUpdateRequired = false;
            });
        }
    }

}

function redrawCanvas(application) {
    application.frameUpdateRequired = true;
    if (!application.videoIsPlaying()) {
        setTimeout(() => {
            application.frameUpdateRequired = false;
        }, 50);
    }
}

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
