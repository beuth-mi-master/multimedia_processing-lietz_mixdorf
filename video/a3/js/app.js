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

    constructor(canvasBefore, canvasAfter, videoId, canvasDifference, timeSlider, offsetId, cutId, plotId, chapterId) {

        this.offsetInput = document.getElementById(offsetId);
        this.cutButton = document.getElementById(cutId);

        this.chapters = document.getElementById(chapterId);

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

        this.ctxPlot = this.plot.getContext('2d');
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
        return new Uint8Array(size);
    }

    findCuts(diff) {
        this.storage[this.frameProcessed] = diff;
        this.frameProcessed++;
    }

    processNextFrame() {
        this.chosenTime += this.offset;
        this.video.currentTime = this.firstFrame;
        this.video2.currentTime = this.secondFrame;
    }

    drawPlot(frames) {
        this.ctxPlot.clearRect(0, 0, this.ctxPlot.width, this.ctxPlot.height);

        this.lastX = 0;
        this.lastY = this.plot.clientHeight;

        for (let i = 0; i < frames; i++) {
            const w = this.plot.clientWidth / (this.duration / this.offset);
            const x2 = i * w;
            const y2 = Math.abs(this.storage[i] - this.plot.clientHeight);

            this.ctxPlot.beginPath();
            this.ctxPlot.strokeStyle = "black";
            this.ctxPlot.moveTo(this.lastX, this.lastY);
            this.ctxPlot.lineTo(x2, y2);
            this.ctxPlot.stroke();
            this.ctxPlot.closePath();

            this.lastX = x2;
            this.lastY = y2;
        }

        let time = this.plot.clientWidth * (this.chosenTime / this.duration);
        this.drawLine(time);
    }

    drawLine(time) {
        this.ctxPlot.beginPath();
        this.ctxPlot.strokeStyle = "red";
        this.ctxPlot.moveTo(time, 0);
        this.ctxPlot.lineTo(time, this.ctxPlot.height);
        this.ctxPlot.stroke();
        this.ctxPlot.closePath();
    }

    seekDone() {
        if (this.cutCb) {
            const diff = this.calculateDifference();
            this.cutCb(diff);
            if (this.chosenTime <= this.duration) {
                this.processNextFrame();
                this.drawPlot(this.frameProcessed);
            } else {
                this.cutDetectionDone();
            }
        } else {
            this.frameUpdateRequired = true;
        }
        this.seeked1 = this.seeked2 = false;
    }

    cutDetectionDone() {
        this.cutButton.classList.remove("working");
        this.cutCb = null;
        this.offsetInput.disabled = '';
        this.rangeSlider.disabled = '';
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
                this.cutDetectionDone();
            } else {
                this.cutButton.classList.add("working");
                this.offsetInput.disabled = 'disabled';
                this.rangeSlider.disabled = 'disabled';
                this.lastX = this.lastY = 0;
                this.ctxPlot.clearRect(0, 0, this.ctxPlot.width, this.ctxPlot.height);
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
            this.drawPlot(this.frameProcessed);
        });

        Helper.addListener(this.offsetInput, "change", () => {
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
                diffFrame.data[i + 0] = diffFrame.data[i + 1] = diffFrame.data[i + 2] = ~~(diff / 2 + 128);
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

        this.plot.width = this.ctxPlot.width = this.canvasDifference.width = this.canvasBefore.width = this.canvasAfter.width = this.ctxBefore.width = this.ctxAfter.width = w;
        this.plot.height = this.ctxPlot.height = this.canvasDifference.height = this.canvasBefore.height = this.canvasAfter.height = this.ctxBefore.height = this.ctxAfter.height = h;
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
    'cut1',
    'plot1',
    'chapters1'
);

let videoInstance2 = new DifferenceImage(
    'canvas4',
    'canvas5',
    'video2',
    'canvas6',
    'timeslider2',
    'offset2',
    'cut2',
    'plot2',
    'chapters2'
);

let videoInstance3 = new DifferenceImage(
    'canvas7',
    'canvas8',
    'video3',
    'canvas9',
    'timeslider3',
    'offset3',
    'cut3',
    'plot3',
    'chapters3'
);

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
