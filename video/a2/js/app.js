/* global Helper */

class DrawElement {

    get timePassed() {
        return this.endTime - this.startTime;
    }

    get fps() {
        return this.fillWithZeros(~~(1000 / this.timePassed));
    }

    constructor(canvasId, elemId, isActive = false, cb) {
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
                console.error(e);
            }
            navigator.getUserMedia({video: true}, handleCameraVideo, errorCameraVideo);
        } else {
            this.element.src = src;
        }
        this.startDebugInteral();
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
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (!this.isVideo || this.videoIsNotPlaying()) {
                this.frameUpdateRequired = false;
            }
            this.renderVideoFrameToCanvas();
            this.start();
            const frame = this.cb(this.getImageData());
            this.stop();
            this.ctx.putImageData(frame, 0, 0);
        }
        window.requestAnimFrame(this.draw.bind(this));
    }

    startDebugInteral() {
        setInterval(this.updateFps.bind(this), 500);
    }

    updateFps() {
        this.debugContainer.innerHTML = `${this.fillWithZeros(this.timePassed)} ms | ${this.fps} FPS`;
    }

    fillWithZeros(num) {
        return ("0000" + num).substr(-4, 4);
    }

    getImageData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
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

    static getColor(x, y, frame, offsetX, offsetY, channel = 0) {
        const xIndex = x + offsetX * 4,
            yIndex = y + offsetY,
            rowSize = frame.width * 4,
            colSize = frame.height * 4;
        if (xIndex < 0 || yIndex < 0 || xIndex > rowSize || yIndex > colSize) {
            return 0;
        }
        const index = yIndex * rowSize + xIndex;
        return frame.data[index + channel];
    }

    static normalizeGray(r, g, b) {
        return r * 0.3 + g * 0.59 + b * 0.11;
    }

}


Filter.NORMAL = (frame) => {
    return frame;
};

Filter.GRAYSCALE = (frame) => {
    const newFrame = new ImageData(frame.width, frame.height);
    for (let i = 0; i < frame.data.length; i += 4) {
        const average = Filter.normalizeGray(frame.data[i], frame.data[i + 1], frame.data[i + 2]);
        newFrame.data[i] = newFrame.data[i + 1] = newFrame.data[i + 2] = average;
        newFrame.data[i + 3] = frame.data[i + 3];
    }
    return newFrame;
};



Filter.SEPIA = (frame) => {
    const newFrame = new ImageData(frame.width, frame.height);
    for (let i = 0; i < frame.data.length; i += 4) {
        const average = Filter.normalizeGray(frame.data[i], frame.data[i + 1], frame.data[i + 2]);
        newFrame.data[i] = average + 50;
        newFrame.data[i + 1] = average + 25;
        newFrame.data[i + 2] = average;
        newFrame.data[i + 3] = frame.data[i + 3];
    }
    return newFrame;
};

Filter.BLUR = (frame, weights = [0, 0, 0, 0, 1, 0, 0, 0, 0]) => {
    const newFrame = new ImageData(frame.width, frame.height);
    for (let y = 0; y < frame.height; y++) {
        for (let x = 0; x < frame.width; x++) {

            const xIndex = x * 4;

            const i = y * frame.width * 4 + xIndex;

            for (let c = 0; c < 3; c++) {
                newFrame.data[i + c] = (Filter.getColor(xIndex, y, frame, -1, -1, c) * weights[0] + Filter.getColor(xIndex, y, frame, 0, -1, c) * weights[1] + Filter.getColor(xIndex, y, frame, 1, -1, c) * weights[2] +
                                       Filter.getColor(xIndex, y, frame, -1, 0, c) * weights[3] + Filter.getColor(xIndex, y, frame, 0, 0, c) * weights[4] + Filter.getColor(xIndex, y, frame, 1, 0, c) * weights[5] +
                                       Filter.getColor(xIndex, y, frame, -1, 1, c) * weights[6] + Filter.getColor(xIndex, y, frame, 0, 1, c) * weights[7] + Filter.getColor(xIndex, y, frame, 1, 1, c) * weights[8]);
            }

            newFrame.data[i + 3] = frame.data[i + 3];
        }
    }
    return newFrame;
};

Filter.PREWITT = (frame) => {
    const newFrame = new ImageData(frame.width, frame.height);
    for (let y = 0; y < frame.height; y++) {
        for (let x = 0; x < frame.width; x++) {

            const xIndex = x * 4;

            const i = y * frame.width * 4 + xIndex;

            let topLeft = Filter.getColor(xIndex, y, frame, -1, -1);
            const topMid = Filter.getColor(xIndex, y, frame, 0, -1);
            const topRight = Filter.getColor(xIndex, y, frame, 1, -1);

            const midLeft = Filter.getColor(xIndex, y, frame, -1, 0);
            const midRight = Filter.getColor(xIndex, y, frame, 1, 0);

            const bottomLeft = Filter.getColor(xIndex, y, frame, -1, 1);
            const bottomMid = Filter.getColor(xIndex, y, frame, 0, 1);
            const bottomRight = Filter.getColor(xIndex, y, frame, 1, 1);

            topLeft *= -1;

            const sumLR = topLeft + topRight + midLeft * -1 + midRight + bottomLeft * -1 + bottomRight;
            const sumTB = topLeft + bottomLeft + topMid * -1 + bottomMid + topRight * -1 + bottomRight;

            const sum = Math.sqrt(sumLR * sumLR + sumTB * sumTB);

            newFrame.data[i + 0] = newFrame.data[i + 1] = newFrame.data[i + 2] = sum;
            newFrame.data[i + 3] = 255;
        }
    }
    return newFrame;
};

let drawItems = [
    new DrawElement('canvas1', 'imageElement', true, normal),
    new DrawElement('canvas2', 'videoElement', false, normal),
    new DrawElement('canvas3', 'cameraElement', false, normal)
];

let currentFilter = normal;
let currentSource = drawItems[0];

const _GRAYSCALE_FILTER = new Filter(Filter.GRAYSCALE);
const _SEPIA_FILTER = new Filter(Filter.SEPIA);
const _MEAN_FILTER = new Filter(Filter.BLUR, [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9]);
const _PREWITT_FILTER = new Filter(Filter.PREWITT);
const _GAUSS_FILTER = new Filter(Filter.BLUR, [0.077847, 0.123317, 0.077847, 0.123317, 0.195346, 0.123317, 0.077847, 0.123317, 0.077847]);

function prewitt(frame) {
    const greyscale = _GRAYSCALE_FILTER.filterImage(frame);
    return _PREWITT_FILTER.filterImage(greyscale);
}

function grayscale(frame) {
    return _GRAYSCALE_FILTER.filterImage(frame);
}

function mean(frame) {
    return _MEAN_FILTER.filterImage(frame);
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
            currentFilter = mean;
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
