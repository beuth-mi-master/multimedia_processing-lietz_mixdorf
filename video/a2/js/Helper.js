const Helper = {
    find(elementString = "*", element = null) {
        return (element || document).querySelector(elementString);
    },
    findAll(elementString = "*", element = null) {
        return (element || document).querySelectorAll(elementString);
    },
    show(elem) {
        elem.style.display = "";
        return this;
    },
    hide(elem) {
        elem.style.display = "none";
        return this;
    },
    css(elem, css) {
        for (const property in css) {
            if (css[property]) {
                elem.style[property] = css[property];
            }
        }
    },
    getPixelColor(index, frame, offset) {
        const [offsetX, offsetY] = offset;
        const x = index % frame.width + offsetX * 4;
        const y = Math.floor(index / frame.width) + offsetY * 4;
        if (x < 0 && y < 0) {
            return [0, 0, 0, 0];
        } else {
            const pos = (y * frame.width + x);
            return Array.prototype.slice.call(frame.data.subarray(pos, pos + 4));
        }
    },
    getSurroundingPixels(i, frame) {
        return [
            Helper.getPixelColor(i, frame, [-1, -1]),
            Helper.getPixelColor(i, frame, [0, -1]),
            Helper.getPixelColor(i, frame, [1, -1]),
            Helper.getPixelColor(i, frame, [-1, 0]),
            Helper.getPixelColor(i, frame, [0, 0]),
            Helper.getPixelColor(i, frame, [1, 0]),
            Helper.getPixelColor(i, frame, [-1, 1]),
            Helper.getPixelColor(i, frame, [0, 1]),
            Helper.getPixelColor(i, frame, [1, 1])
        ];
    },
    addListener(elem, bindTo, fn) {
        bindTo.split(" ").forEach((e) => elem.addEventListener(e, fn, false));
        return this;
    },
    clamp(v = 0, min = v, max = v) {
        return Math.min(Math.max(v, min), max);
    },
    loadImage(path, cb) {
        const img = new Image();
        img.onload = () => {
            if (cb && typeof cb === "function") {
                cb(img);
            }
        };
        img.src = path;
        return this;
    },
    forEach(a, cb) {
        for (const i in a) {
            if (a[i] !== undefined && typeof cb === "function") {
                cb(a[i], i);
            }
        }
        return this;
    }
};
