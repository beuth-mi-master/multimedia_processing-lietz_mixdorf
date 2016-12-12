/* global Helper */

class ColorFilter {

    constructor(elemId, videoId, w, h) {
        this.element = document.getElementById(elemId);
        this.video = document.getElementById(videoId);
        this.aspectRatio = h / w;
        this.container = this.element.parentElement;
        this.ctx = this.element.getContext('2d');
        this.frameUpdateRequired = false;
        this.brightness = {
            r: 0,
            g: 0,
            b: 0
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
            for (let i = 0; i < frame.data.length; i += 4) {

                const rChannel = i + 0,
                    gChannel = i + 1,
                    bChannel = i + 2;

                frame.data[rChannel] += this.brightness.r;
                frame.data[gChannel] += this.brightness.g;
                frame.data[bChannel] += this.brightness.b;

            }

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
        this.colorFilter = new ColorFilter('canvas1', 'video1', 630, 576);
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
