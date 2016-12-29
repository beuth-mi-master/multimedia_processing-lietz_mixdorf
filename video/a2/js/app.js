/* global Helper */

class DrawElement {

    get timePassed() {
        return this.endTime - this.startTime;
    }

    constructor(canvasId, elemId, timeupdateInterval = 0, isActive = false, cb) {
        this.canvas = document.getElementById(canvasId);
        this.element = document.getElementById(elemId);
        this.isVideo = this.element instanceof HTMLVideoElement;
        this.container = this.canvas.parentElement;
        this.debugContainer = document.createElement("p");
        this.debugContainer.classList.add("debug", "col-sm-12", "text-center");
        this.container.parentElement.appendChild(this.debugContainer);
        this.ctx = this.canvas.getContext('2d');
        this.frameUpdateRequired = false;
        this.isActive = isActive;
        this.cb = cb;
        this.timeupdateInterval = timeupdateInterval;
        this.resizeTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        let src = this.element.getAttribute("data-src");
        if (src === "camera") {
            let _element = this.element;
            function handleCameraVideo(stream) {
                _element.src = window.URL.createObjectURL(stream);
            }
            function errorCameraVideo(e) {
                console.log(e);
            }
            navigator.getUserMedia({video: true}, handleCameraVideo, errorCameraVideo);
        } else {
            this.element.src = src;
        }
    }

    start() {
        this.startTime = Date.now();
    }

    stop() {
        this.endTime = Date.now();
    }

    bindEvents() {
        Helper.addListener(window, "resize orientationchange", () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
            this.resizeTimeout = setTimeout(() => {
                this.resize();
                this.frameUpdateRequired = true;
            }, 500);
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
        if (this.frameUpdateRequired && this.isActive) {
            this.start();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (!this.isVideo || this.videoIsNotPlaying()) {
                this.frameUpdateRequired = false;
            }
            this.renderVideoFrameToCanvas();
            const frame = this.cb(this.getImageData());
            this.putImageData(frame);
            this.stop();
            this.debugContainer.innerHTML = `rendered in ${this.timePassed} ms`;
        }
        if (this.timeupdateInterval === 0) {
            window.requestAnimFrame(() => this.draw());
        } else {
            window.setTimeout(() => this.draw(), this.timeupdateInterval);
        }
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
    constructor(filter = Filter.NORMAL) {
        this.filter = filter;
        this.args = this.prepareArgs(Array.prototype.slice.call(arguments, 1));
    }

    prepareArgs() {
        var args = [null];
        for (var i = 0; i < arguments.length; i++) {
            arguments[i].forEach((arg) => {
                args.push(arg);
            });
        }
        return args;
    }

    filterImage(image) {
        this.args[0] = image;
        return this.filter.apply(null, this.args);
    }

    static getPixelColor(index, frame, offset, indices) {
        const [offsetX, offsetY] = offset;
        const x = (index % (frame.width * 4)) + (offsetX * 4);
        const y = Math.floor(index / (frame.width * 4)) + offsetY;
        if (x < 0 || y < 0 || x > (frame.width * 4) || y > frame.height) {
            return null;
        } else {
            const pos = y * frame.width * 4 + x;
            const data = [];
            for (let i = 0; i < indices.length; i++) {
                data[i] = frame.data[pos + indices[i]];
            }
            return data;
        }
    }

    static getSurroundingPixels(i, frame, indices = [0, 1, 2, 3]) {
        return [
            Filter.getPixelColor(i, frame, [-1, -1], indices),
            Filter.getPixelColor(i, frame, [0, -1], indices),
            Filter.getPixelColor(i, frame, [1, -1], indices),
            Filter.getPixelColor(i, frame, [-1, 0], indices),
            Filter.getPixelColor(i, frame, [0, 0], indices),
            Filter.getPixelColor(i, frame, [1, 0], indices),
            Filter.getPixelColor(i, frame, [-1, 1], indices),
            Filter.getPixelColor(i, frame, [0, 1], indices),
            Filter.getPixelColor(i, frame, [1, 1], indices)
        ];
    }

    static normalizeGray(r, g, b) {
        return r * 0.3 + g * 0.59 + b * 0.11;
    }

    static sum(data) {
        return data.reduce((a, b) => {
            return a + b;
        }, 0);
    }

    static sumColor(data) {
        return data.reduce((a, b) => {
            return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
        }, [0, 0, 0, 0]);
    }

    static addWeightToChannel(data, weights) {
        return data.map((color, j) => {
            const currentWeight = weights[j];
            if (!color || currentWeight === 0) {
                return 0;
            }
            return color[0] * currentWeight;
        });
    }

    static addWeightToColor(data, weights) {
        return data.map((color, j) => {
            const currentWeight = weights[j];
            if (!color || currentWeight === 0) {
                return [0, 0, 0, 0];
            }
            return [color[0] * currentWeight, color[1] * currentWeight, color[2] * currentWeight, color[3] * currentWeight];
        });
    }

    static combinePrewitt(vertical, horizontal) {
        const prewitt = new ImageData(vertical.width, vertical.height);
        for (let i = 0; i < prewitt.data.length; i += 4) {
            const color = Math.ceil(Math.sqrt(vertical.data[i] * vertical.data[i] + horizontal.data[i] * horizontal.data[i]));
            prewitt.data[i + 0] = color;
            prewitt.data[i + 1] = color;
            prewitt.data[i + 2] = color;
            prewitt.data[i + 3] = 255;
        }
        return prewitt;
    }

}


Filter.NORMAL = (frame) => {
    return frame;
};

Filter.GRAYSCALE = (frame) => {
    const newFrame = new ImageData(frame.width, frame.height);
    for (let i = 0; i < frame.data.length; i += 4) {
        const rChannel = i + 0,
            gChannel = i + 1,
            bChannel = i + 2,
            aChannel = i + 3;

        const average = Filter.normalizeGray(frame.data[rChannel], frame.data[gChannel], frame.data[bChannel]);

        newFrame.data[rChannel] = average;
        newFrame.data[gChannel] = average;
        newFrame.data[bChannel] = average;
        newFrame.data[aChannel] = frame.data[aChannel];

    }
    return newFrame;
};

Filter.SEPIA = (frame) => {
    const newFrame = new ImageData(frame.width, frame.height);
    for (let i = 0; i < frame.data.length; i += 4) {
        const rChannel = i + 0,
            gChannel = i + 1,
            bChannel = i + 2,
            aChannel = i + 3;

        const average = Filter.normalizeGray(frame.data[rChannel], frame.data[gChannel], frame.data[bChannel]);

        newFrame.data[rChannel] = average + 100;
        newFrame.data[gChannel] = average + 50;
        newFrame.data[bChannel] = average;
        newFrame.data[aChannel] = frame.data[aChannel];

    }
    return newFrame;
};

Filter.BLUR = (frame, weights = [0, 0, 0, 0, 1, 0, 0, 0, 0]) => {
    const newFrame = new ImageData(frame.width, frame.height);
    const sumOfWeigths = Filter.sum(weights);
    for (let i = 0; i < frame.data.length; i += 4) {
        const rChannel = i + 0,
            gChannel = i + 1,
            bChannel = i + 2,
            aChannel = i + 3;

        // get all neighboors
        const aggregatedPixels = Filter.getSurroundingPixels(i, frame, [0, 1, 2, 3]);

        // add weigths to channels
        const addedWeigths = Filter.addWeightToColor(aggregatedPixels, weights);

        // sum up all weighted colors
        const mixedColor = Filter.sumColor(addedWeigths);

        // divide by sum of weigths to normalize
        newFrame.data[rChannel] = mixedColor[0] / sumOfWeigths;
        newFrame.data[gChannel] = mixedColor[1] / sumOfWeigths;
        newFrame.data[bChannel] = mixedColor[2] / sumOfWeigths;
        newFrame.data[aChannel] = mixedColor[3] / sumOfWeigths;
    }
    return newFrame;
};

Filter.PREWITT = (frame, weights = [0, 0, 0, 0, 1, 0, 0, 0, 0]) => {
    const newFrame = new ImageData(frame.width, frame.height);
    for (let i = 0; i < frame.data.length; i += 4) {
        const rChannel = i + 0,
            gChannel = i + 1,
            bChannel = i + 2,
            aChannel = i + 3;

        const indices = [0];

        // get all neighboors
        const aggregatedPixels = Filter.getSurroundingPixels(i, frame, indices);

        // add weigths to channels
        const addedWeigths = Filter.addWeightToChannel(aggregatedPixels, weights);

        // sum up all weighted colors
        const mixedColor = Filter.sum(addedWeigths);

        newFrame.data[rChannel] = mixedColor;
        newFrame.data[gChannel] = mixedColor;
        newFrame.data[bChannel] = mixedColor;
        newFrame.data[aChannel] = 255;

    }
    return newFrame;
};

let drawItems = [
    new DrawElement('canvas1', 'imageElement', 0, true, normal),
    new DrawElement('canvas2', 'videoElement', 0, false, normal),
    new DrawElement('canvas3', 'cameraElement', 0, false, normal)
];

let currentFilter = normal;
let currentSource = drawItems[0];

const _GRAYSCALE_FILTER = new Filter(Filter.GRAYSCALE);
const _SEPIA_FILTER = new Filter(Filter.SEPIA);
const _BLUR_FILTER = new Filter(Filter.BLUR, [5, 5, 5, 5, 1, 5, 5, 5, 5]);
const _GAUSS_FILTER = new Filter(Filter.BLUR, [1, 2, 1, 2, 4, 2, 1, 2, 1]);
const _PREWITT_VERTICAL = new Filter(Filter.PREWITT, [-1, 0, 1, -1, 0, 1, -1, 0, 1]);
const _PREWITT_HORIZONTAL = new Filter(Filter.PREWITT, [-1, -1, -1, 0, 0, 0, 1, 1, 1]);

function prewitt(frame) {
    const greyscale = _GRAYSCALE_FILTER.filterImage(frame);
    const prewittVertical = _PREWITT_VERTICAL.filterImage(greyscale);
    const prewittHorizontal = _PREWITT_HORIZONTAL.filterImage(greyscale);
    return Filter.combinePrewitt(prewittVertical, prewittHorizontal);
}

function grayscale(frame) {
    return _GRAYSCALE_FILTER.filterImage(frame);
}

function blur(frame) {
    return _BLUR_FILTER.filterImage(frame);
}

function sepia(frame) {
    return _SEPIA_FILTER.filterImage(frame);
}

function gauss(frame) {
    return _GAUSS_FILTER.filterImage(frame);
}

function normal(frame) {
    return Filter.NORMAL(frame);
}

function redraw() {
    currentSource.cb = currentFilter;
    currentSource.frameUpdateRequired = true;
}

const filterDropdown = document.getElementById("filter");
Helper.addListener(filterDropdown, "change", () => {
    switch (filterDropdown.value) {
        case "Graustufen":
            currentFilter = grayscale;
            break;
        case "Sepia":
            currentFilter = sepia;
            break;
        case "Weichzeichnung (Mittelwert)":
            currentFilter = blur;
            break;
        case "Weichzeichnung (Gauss)":
            currentFilter = gauss;
            break;
        case "Kantendetektion (Prewitt)":
            currentFilter = prewitt;
            break;
        default:
            currentFilter = normal;
            break;
    }
    redraw();
});

const imageSection = document.getElementById("image");
const videoSection = document.getElementById("video");
const cameraSection = document.getElementById("camera");

let activeSection = imageSection;
const inputDropdown = document.getElementById("input");
Helper.addListener(inputDropdown, "change", () => {
    currentSource.isActive = false;
    Helper.hide(activeSection);
    switch (inputDropdown.value) {
        case "Video":
            drawItems[2].element.pause();
            currentSource = drawItems[1];
            activeSection = videoSection;
            break;
        case "Kamera":
            drawItems[1].element.pause();
            currentSource = drawItems[2];
            activeSection = cameraSection;
            break;
        default:
            drawItems[1].element.pause();
            drawItems[2].element.pause();
            currentSource = drawItems[0];
            activeSection = imageSection;
            break;
    }
    Helper.show(activeSection);
    currentSource.resize();
    currentSource.isActive = true;
    redraw();
});

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
