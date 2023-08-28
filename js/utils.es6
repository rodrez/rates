function removeFromArray(array, header) {
    const index = array.indexOf(header);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

function getUrlHash() {
    return document.location.hash.replace(/^#\//, "");
}

function debounce(func, delay) {
    let timerId;

    return function (...args) {
        clearTimeout(timerId);

        timerId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function textMatchPattern(text, pattern) {
    const regex = new RegExp(pattern);
    return regex.test(text);
}

function delegate(element, selector, event, handler) {
    element.addEventListener(event, (e) => {
        if (e.target.matches(selector)) {
            handler(e, element);
        }
    });
}

const insertHTML = (element, html) =>
    element.insertAdjacentHTML("afterbegin", html);

const replaceHTML = (element, html) => {
    element.replaceChildren();
    insertHTML(element, html);
};

const camelCase = (label) => {
    return label
        .split(" ")
        .map((word, index) => {
            if (index === 0) {
                return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join("");
};

// const uuid = () => crypto.randomUUID();
function uuid(){
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
const validate = ({ value, regex, cellType }) => {
    // If type is header, only allow (), + and -, and alphanumeric characters
    // If type is cell, only allow numbers
    let regexType = cellType === "header" ? /^[a-zA-Z0-9()+\-]+$/g : /[^0-9]/g;
    regex = regex ?? regexType;

    if (value.match(regex)) {
        return {
            isValid: false,
            message: value + " has invalid character(s).",
        };
    }
    return {
        isValid: true,
        message: value + " - is valid",
    };
};

export {
    camelCase,
    debounce,
    delegate,
    getUrlHash,
    insertHTML,
    removeFromArray,
    replaceHTML,
    textMatchPattern,
    uuid,
    validate,
};
