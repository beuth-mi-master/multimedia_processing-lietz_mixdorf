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

    get duration() {
        return this.video.duration * 1000;
    }

    get offset() {
        return parseInt(this.offsetInput.value, 10);
    }

    constructor(canvasBefore, canvasAfter, videoId, canvasDifference, timeSlider, offsetId, cutId, plotId) {

        this.offsetInput = document.getElementById(offsetId);
        this.cutButton = document.getElementById(cutId);

        this.plot = document.getElementById(plotId);

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
        this.video.parentElement.appendChild(this.debugContainer);
        this.ctxBefore = this.canvasBefore.getContext('2d');
        this.ctxAfter = this.canvasAfter.getContext('2d');
        this.ctxDifference = this.canvasDifference.getContext('2d');

        this.frameUpdateRequired = false;
        this.chosenTime = 0;
        this.resizeTimeout = null;
        this.cutCb = null;

        this.seeked1 = false;
        this.seeked2 = false;

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

    createDiffStorage() {
        const size = Math.ceil(this.duration / this.offset);
        return new Array(size);
    }

    findCuts(diff, firstFrame, secondFrame) {
        this.storage[this.frameProcessed] = [diff, firstFrame, secondFrame];
        this.frameProcessed++;
    }

    processNextFrame() {
        this.chosenTime += this.offset;
        this.video.currentTime = this.firstFrame;
        this.video2.currentTime = this.secondFrame;
    }

    createPoint(x, y) {
        const w = this.plot.clientWidth / (this.duration / this.offset);
        return `<circle cx="${x * w}" cy="${Math.abs(y - this.plot.clientHeight)}" r="0.1" fill="black" />`;
    }

    seekDone() {
        if (this.cutCb) {
            const diff = this.calculateDifference();
            this.cutCb(diff, this.firstFrame, this.secondFrame);
            if (this.chosenTime <= this.duration) {
                this.processNextFrame();
                this.plot.innerHTML += this.createPoint(this.frameProcessed, diff);
            } else {
                this.cutCb = null;
                this.cutButton.classList.remove("working");
            }
        } else {
            this.frameUpdateRequired = true;
        }
        this.movePlotLine(this.chosenTime / this.duration);
        this.seeked1 = this.seeked2 = false;
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

        Helper.addListener(this.cutButton, "click", () => {
            if (this.cutButton.classList.contains("working")) {
                this.cutButton.classList.remove("working");
                this.cutCb = null;
            } else {
                this.cutButton.classList.add("working");
                this.plot.innerHTML = `<line id="line" x1="0" y1="0" x2="0" y2="${this.plot.clientHeight}" stroke="red" stroke-width="0.5" />`;
                this.chosenTime = 0;
                this.frameProcessed = 0;
                this.storage = this.createDiffStorage();
                this.cutCb = this.findCuts;
                this.processNextFrame();
            }
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
            this.seeked1 = true;
            if (this.seeked1 && this.seeked2) {
                this.seekDone();
            }
        });

        Helper.addListener(this.video2, "seeked", () => {
            this.renderVideoFramesToCanvas(this.ctxAfter, this.video2);
            this.seeked2 = true;
            if (this.seeked1 && this.seeked2) {
                this.seekDone();
            }
        });

        Helper.addListener(this.rangeSlider, "input", (e) => {
            this.changeTimeStamp(this.timeSlider, e.target.value);
            this.video.currentTime = this.firstFrame;
            this.video2.currentTime = this.secondFrame;
            this.movePlotLine(e.target.value);
        });

        Helper.addListener(this.offsetInput, "change", () => {
            this.video2.currentTime = this.secondFrame;
        });

    }

    movePlotLine(p) {
        let line = Helper.find("#line", this.plot);
        if (line) {
            const time = this.plot.clientWidth * p;
            line.setAttribute("x1", time);
            line.setAttribute("x2", time);
        }
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
            this.calculateDifference();
        }
        this.frameUpdateRequired = false;
        window.requestAnimFrame(this.draw.bind(this));
    }

    calculateDifference() {

        this.start();

        let score = 0;

        this.ctxDifference.clearRect(0, 0, this.canvasDifference.width, this.canvasDifference.height);

        const before = this.ctxBefore.getImageData(0, 0, this.ctxBefore.width, this.ctxBefore.height);
        const after = this.ctxAfter.getImageData(0, 0, this.ctxAfter.width, this.ctxAfter.height);

        const diffFrame = new ImageData(before.width, before.height);

        for (let y = 0; y < diffFrame.height; y++) {
            for (let x = 0; x < diffFrame.width; x++) {
                const i = y * diffFrame.width * 4 + (x * 4);

                const grayBefore = DifferenceImage.normalizeGray(before.data[i], before.data[i + 1], before.data[i + 2]);
                const grayAfter = DifferenceImage.normalizeGray(after.data[i], after.data[i + 1], after.data[i + 2]);

                const diff = grayBefore - grayAfter;
                score += Math.abs(diff);
                diffFrame.data[i + 0] = diffFrame.data[i + 1] = diffFrame.data[i + 2] = diff / 2 + 128;
                diffFrame.data[i + 3] = 255;
            }
        }

        this.ctxDifference.putImageData(diffFrame, 0, 0);

        this.stop();

        return score / (diffFrame.height * diffFrame.width);
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
    }

    resize() {
        const style = window.getComputedStyle(this.canvasBefore.parentElement);
        let w = parseInt(style.width, 10) - parseInt(style.paddingLeft, 10) - parseInt(style.paddingRight, 10);
        let h = parseInt((w / this.video.clientWidth) * this.video.clientHeight, 10);

        this.canvasDifference.width = this.canvasBefore.width = this.canvasAfter.width = this.ctxBefore.width = this.ctxAfter.width = w;
        this.canvasDifference.height = this.canvasBefore.height = this.canvasAfter.height = this.ctxBefore.height = this.ctxAfter.height = h;

        this.plot.setAttribute("viewBox", `0 0 ${w} ${h}`);
        this.plot.style.width = `${w}px`;
        this.plot.style.height = `${h}px`;

        let plotText = Helper.find("#text", this.plot);
        if (plotText) {
            plotText.setAttribute("x", this.plot.clientWidth / 2);
            plotText.setAttribute("y", this.plot.clientHeight / 2);
        }
    }

    static normalizeGray(r, g, b) {
        return r * 0.3 + g * 0.59 + b * 0.11;
    }

}

let videoInstance1 = new DifferenceImage(
    'canvas1',
    'canvas2',
    'video1',
    'canvas3',
    'timeslider1',
    'offset1',
    'cut',
    'plot1');

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
