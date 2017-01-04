/* global Helper */

class DifferenceImage {

    get timePassed() {
        return this.endTime - this.startTime;
    }

    get fps() {
        return this.fillWithZeros(~~(1000 / this.timePassed), 4);
    }

    get firstFrame() {
        return this.chosenTime / 1000;
    }

    get secondFrame() {
        return (this.chosenTime + this.offset) / 1000;
    }

    constructor(canvasBefore, canvasAfter, videoId, canvasDifference, tolerance, timeSlider, offsetId) {

        this.toleranceInput = document.getElementById(tolerance);
        this.tolerance = parseInt(this.toleranceInput.value, 10);

        this.offsetInput = document.getElementById(offsetId);
        this.offset = parseInt(this.offsetInput.value, 10);

        this.controls = document.getElementById(timeSlider);
        this.rangeSlider = this.controls.querySelector("input");
        this.timeSlider = this.controls.querySelector("label");

        this.canvasBefore = document.getElementById(canvasBefore);
        this.canvasAfter = document.getElementById(canvasAfter);
        this.canvasDifference = document.getElementById(canvasDifference);
        this.video = document.getElementById(videoId);
        this.video2 = document.createElement("video");
        this.container = this.canvasBefore.parentElement.parentElement;
        this.debugContainer = document.createElement("p");
        this.debugContainer.classList.add("debug", "col-sm-12", "text-center");
        this.container.parentElement.appendChild(this.debugContainer);
        this.ctxBefore = this.canvasBefore.getContext('2d');
        this.ctxAfter = this.canvasAfter.getContext('2d');
        this.ctxDifference = this.canvasDifference.getContext('2d');

        this.frameUpdateRequired = false;

        this.chosenTime = 0;

        this.resizeTimeout = null;

        this.init(this.video.getAttribute("data-src"));
    }

    init(videoUrl) {
        this.bindEvents();
        this.video.src = videoUrl;
        this.video2.src = videoUrl;
        this.startDebugInterval();
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

        Helper.addListener(this.video, "loadeddata", () => {
            this.resize();
            this.video.currentTime = this.firstFrame;
            this.video2.currentTime = this.secondFrame;
            this.frameUpdateRequired = true;
            this.draw();
        });

        Helper.addListener(this.video, "seeked", () => {
            this.renderVideoFramesToCanvas(this.ctxBefore, this.video);
            this.frameUpdateRequired = true;
        });

        Helper.addListener(this.video2, "seeked", () => {
            this.renderVideoFramesToCanvas(this.ctxAfter, this.video2);
            this.frameUpdateRequired = true;
        });

        Helper.addListener(this.rangeSlider, "input", (e) => {
            this.changeTimeStamp(this.timeSlider, e.target.value);
            this.video.currentTime = this.firstFrame;
            this.video2.currentTime = this.secondFrame;
        });

        Helper.addListener(this.toleranceInput, "change", (e) => {
            this.tolerance = parseInt(e.target.value, 10);
            this.frameUpdateRequired = true;
        });

        Helper.addListener(this.offsetInput, "change", (e) => {
            this.offset = parseInt(e.target.value, 10);
            this.video2.currentTime = this.secondFrame;
        });

    }

    changeTimeStamp(element, percentage) {
        const seconds = this.video.duration * parseFloat(percentage);
        this.chosenTime = seconds * 1000;
        element.innerHTML = this.formatTime(this.chosenTime);
    }

    formatTime(seconds) {
        const time = new Date(seconds);
        const m = this.fillWithZeros(time.getMinutes(), 2);
        const s = this.fillWithZeros(time.getSeconds(), 2);
        return `${m}:${s}`;
    }

    draw() {
        if (this.frameUpdateRequired) {
            this.start();
            this.calculateDifference();
            this.stop();
        }
        this.frameUpdateRequired = false;
        window.requestAnimFrame(this.draw.bind(this));
    }

    calculateDifference() {

        this.ctxDifference.clearRect(0, 0, this.canvasDifference.width, this.canvasDifference.height);

        const before = this.ctxBefore.getImageData(0, 0, this.ctxBefore.width, this.ctxBefore.height);
        const after = this.ctxAfter.getImageData(0, 0, this.ctxAfter.width, this.ctxAfter.height);

        const diffFrame = new ImageData(before.width, before.height);

        for (let y = 0; y < diffFrame.height; y++) {
            for (let x = 0; x < diffFrame.width; x++) {
                const xIndex = x * 4;
                const i = y * diffFrame.width * 4 + xIndex;

                const grayBefore = DifferenceImage.normalizeGray(before.data[i], before.data[i + 1], before.data[i + 2]);
                const grayAfter = DifferenceImage.normalizeGray(after.data[i], after.data[i + 1], after.data[i + 2]);

                const diff = Math.abs(grayBefore - grayAfter);

                diffFrame.data[i + 0] = diffFrame.data[i + 1] = diffFrame.data[i + 2] = (diff >= this.tolerance) ? diff : 0;
                diffFrame.data[i + 3] = before.data[i + 3];
            }
        }

        this.ctxDifference.putImageData(diffFrame, 0, 0);
        this.ctxDifference.drawImage(this.canvasDifference, 0, 0);
    }

    startDebugInterval() {
        setInterval(this.updateFps.bind(this), 500);
    }

    updateFps() {
        this.debugContainer.innerHTML = `${this.fillWithZeros(this.timePassed, 4)} ms | ${this.fps} FPS`;
    }

    fillWithZeros(num, zeros) {
        return ((Array(zeros).join(0)) + num).substr(-zeros, zeros);
    }

    renderVideoFramesToCanvas(ctx, frame) {
        ctx.clearRect(0, 0, ctx.width, ctx.height);
        ctx.drawImage(frame, 0, 0, ctx.width, ctx.height);
        this.frameUpdateRequired = true;
    }

    resize() {
        const style = window.getComputedStyle(this.canvasBefore.parentElement);
        let w = parseInt(style.width, 10) - parseInt(style.paddingLeft, 10) - parseInt(style.paddingRight, 10);
        let h = (w / this.video.clientWidth) * this.video.clientHeight;

        this.canvasDifference.width = this.canvasBefore.width = this.canvasAfter.width = this.ctxBefore.width = this.ctxAfter.width = w;
        this.canvasDifference.height = this.canvasBefore.height = this.canvasAfter.height = this.ctxBefore.height = this.ctxAfter.height = h;
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

let videoInstance1 = new DifferenceImage('canvas1', 'canvas2', 'video1', 'canvas3', 'tolerance1', 'timeslider1', 'offset1');

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
