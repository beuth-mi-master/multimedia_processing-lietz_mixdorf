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
        for (let property in css) {
            if (css[property]) {
                elem.style[property] = css[property];
            }
        }
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
        for (let i in a) {
            if (a[i] !== undefined && typeof cb === "function") {
                cb(a[i], i);
            }
        }
        return this;
    }
};
