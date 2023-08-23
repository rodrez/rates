/**
 * @param {{}} options
 * @param {string} options.id
 * @param {string} [options.placeholder]
 * @param {string} [options.label]
 * @param {string} [options.name]
 * @param {string} [options.value]
 * @param {string} [options.className]
 * @param {string} [options.type]
 * @param {string} [options.leftElement]
 * @param {string} [options.rightElement]
 * @param {string} [options.ariaDescribedBy]
 * @param {string} [options.pattern]
 * @param {object} [options.dataset]
 * @returns {HTMLInputElement}
 * @description Creates an input element with the given options.
 * supports left and right elements (icons, text or other elements)
 */
function createInput(options = {}) {
    const {
        id = null,
        placeholder = "",
        label = null,
        name = null,
        value = null,
        className = null,
        type = "text",
        leftElement = null,
        rightElement = null,
        ariaDescribedBy = null,
        pattern = null,
        dataset = {},
    } = options;

    const baseClass =
        className ||
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6";

    const inputClassMap = {
        base: [baseClass, "pl-2"],
        leftElement: [baseClass, "pl-7"],
        rightElement: [baseClass, "pr-4 pl-2"],
        bothElements: [baseClass, "pl-7", "pr-4"],
    };

    function getClass() {
        if (leftElement && rightElement)
            return inputClassMap.bothElements.join(" ");
        if (leftElement) return inputClassMap.leftElement.join(" ");
        if (rightElement) return inputClassMap.rightElement.join(" ");
        return inputClassMap.base.join(" ");
    }

    const inputContainer = document.createElement("div");
    inputContainer.className = "w-24";

    if (label) {
        const labelElement = document.createElement("label");
        labelElement.setAttribute("for", id);
        labelElement.className =
            "block text-sm font-medium leading-6 text-gray-900";
        labelElement.textContent = label;
        inputContainer.appendChild(labelElement);
    }

    const relativeDiv = document.createElement("div");
    relativeDiv.className = "relative rounded-md shadow-sm";

    if (leftElement) {
        const leftDiv = document.createElement("div");
        leftDiv.className =
            "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3";
        leftDiv.innerHTML = `<span class="text-gray-500 sm:text-sm">${leftElement}</span>`;
        relativeDiv.appendChild(leftDiv);
    }

    const inputElement = document.createElement("input");

    inputElement.setAttribute("data-id", id);
    for (let key in dataset) {
        if (dataset.hasOwnProperty(key)) {
            inputElement.setAttribute(`data-${key}`, dataset[key]);
        }
    }
    inputElement.setAttribute("type", type);

    if (name) {
        inputElement.setAttribute("name", name);
    }
    if (value) {
        inputElement.setAttribute("value", value);
    }
    if (pattern) {
        inputElement.setAttribute("pattern", pattern);
    }
    if (ariaDescribedBy) {
        inputElement.setAttribute("aria-describedby", ariaDescribedBy);
    }

    inputElement.setAttribute("placeholder", placeholder);
    inputElement.className = getClass();
    relativeDiv.appendChild(inputElement);

    if (rightElement) {
        const rightDiv = document.createElement("div");
        rightDiv.className =
            "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3";
        rightDiv.innerHTML = `<span class="text-gray-500 sm:text-sm">${rightElement}</span>`;
        relativeDiv.appendChild(rightDiv);
    }

    inputContainer.appendChild(relativeDiv);

    return inputContainer;
}

export {createInput};
