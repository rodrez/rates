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
    } else {
      console.error("Trying to delegate event to non-matching selector");
    }
  });
}

const insertHTML = (element, html) =>
  element.insertAdjacentHTML("afterbegin", html);

const replaceHTML = (element, html) => {
  element.replaceChildren();
  insertHTML(element, html);
};

export {
  debounce,
  delegate,
  getUrlHash,
  insertHTML,
  removeFromArray,
  replaceHTML,
  textMatchPattern,
};
