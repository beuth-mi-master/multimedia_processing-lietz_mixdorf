/* global Helper */

class DrawElement {

    constructor(canvasId, elemId, cb) {
        this.canvas = document.getElementById(canvasId);
        this.element = document.getElementById(elemId);
        this.isVideo = this.element instanceof HTMLVideoElement;
        this.container = this.canvas.parentElement;
        this.ctx = this.canvas.getContext('2d');
        this.frameUpdateRequired = false;
        this.cb = cb;
        this.init();
    }

    init() {
        this.bindEvents();
        this.element.src = this.element.getAttribute("data-src");
    }

    bindEvents() {
        Helper.addListener(window, "resize orientationchange", () => {
            this.resize();
            this.frameUpdateRequired = true;
        });
        if (this.isVideo) {
            Helper.addListener(this.element, "canplay", () => {
                this.frameUpdateRequired = true;
            });
            Helper.addListener(this.element, "playing", () => {
                this.frameUpdateRequired = true;
            });
        }
        Helper.addListener(this.element, (this.isVideo) ? "loadeddata" : "load", () => {
            this.resize();
            this.frameUpdateRequired = true;
            this.draw();
        });
    }

    videoIsNotPlaying() {
        return this.element.paused;
    }

    draw() {
        if (this.frameUpdateRequired) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (!this.isVideo || this.videoIsNotPlaying()) {
                this.frameUpdateRequired = false;
            }
            this.renderVideoFrameToCanvas();
            const frame = this.cb(this.getImageData());
            this.putImageData(frame);
        }
        window.requestAnimFrame(() => this.draw());
    }

    getImageData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    putImageData(frame) {
        return this.ctx.putImageData(frame, 0, 0);
    }

    renderVideoFrameToCanvas() {
        this.ctx.drawImage(this.element, 0, 0, this.canvas.width, this.canvas.height);
    }

    resize() {
        this.canvas.width = this.ctx.width = this.element.clientWidth;
        this.canvas.height = this.ctx.height = this.element.clientHeight;
    }

}

class Filter {
    constructor(frame, filterType = Filter.NORMAL) {
        this.rawData = frame;
        this.data = this.filterImage(filterType, frame, Array.prototype.slice.call(arguments, 2));
    }

    filterImage(filter, image) {
        var args = [image];
        for (var i = 2; i < arguments.length; i++) {
            arguments[i].forEach((arg) => {
                args.push(arg);
            });
        }
        return filter.apply(null, args);
    }

}


Filter.NORMAL = (frame) => {
    return frame;
};

Filter.BLUR = (frame, weights = [0, 0, 0, 0, 1, 0, 0, 0, 0]) => {
    for (let i = 0; i < frame.data.length; i += 4) {
        const rChannel = i + 0,
            gChannel = i + 1,
            bChannel = i + 2;

        const aggregatedPixels = Helper.getSurroundingPixels(i, frame);

        const addedWeigths = aggregatedPixels.map((color, i) => {
            return color.map((colorChannel) => {
                return colorChannel * weights[i];
            });
        });

        const mixedColor = addedWeigths.reduce((a, b) => {
            return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
        }, [0, 0, 0]);

        frame.data[rChannel] = mixedColor[0];
        frame.data[gChannel] = mixedColor[1];
        frame.data[bChannel] = mixedColor[2];
    }
    return frame;
};

this.drawImage = new DrawElement('canvas2', 'image1', (frame) => {
    const filteredFrame = new Filter(frame, Filter.BLUR, [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9], "t");
    return filteredFrame.data;
});


this.drawVideo = new DrawElement('canvas1', 'video1', (frame) => {
    const filteredFrame = new Filter(frame, Filter.BLUR, [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9], "t");
    return filteredFrame.data;
});


window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
