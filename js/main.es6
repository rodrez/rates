import { notify } from "./notify.es6";
import { RateStore } from "./store.es6";
import {
    camelCase,
    debounce,
    delegate,
    getUrlHash,
    insertHTML,
} from "./utils.es6";
import { createInput } from "./ui.es6";

const Rates = new RateStore("enhanced-rates");

const RateApp = {
    elements: {
        headerButton: document.querySelector('[data-rate="add-header"]'),
        yearRangeButton: document.querySelector('[data-rate="add-year-range"]'),
        updateRateButton: document.querySelector('[data-rate="update-rate"]'),
        // Must-have for posting data to Django
        csrfInput: document.querySelector('[name="csrfmiddlewaretoken"]'),
        headers: document.querySelector('[data-rate="headers"]'),
        yearRanges: document.querySelector('[data-rate="year-ranges"]'),
    },
    handlers: {
        cellInputChange: (_, ids, e) => {
            const cellId = e.target.dataset.id;
            const newValue = e.target.value;
            if (e.target.name.includes("Year")) {
                const yearType = e.target.name;
                const yearRangeID = ids.yearRange;
                const year = e.target.value;
                if (cellId === Rates.rates.focusedInput) {
                    return;
                }
                Rates.setFocusedInput(cellId, e.target.selectionStart);
                Rates.updateYear(yearRangeID, year, yearType);
                return;
            }

            const nearestRow = e.target.closest("[data-rate='rate-row']");

            if (cellId === Rates.rates.focusedInput) {
                return;
            }
            Rates.setFocusedInput(cellId, e.target.selectionStart);

            Rates.updateCell(
                ids.yearRange,
                nearestRow.dataset.id,
                cellId,
                newValue,
            );
        },
        headerInputChange: (_ids, _el, e) => {
            const headerId = e.target.dataset.id;
            const newValue = e.target.value;
            if (headerId === Rates.rates.focusedInput) {
                return;
            }
            Rates.setFocusedInput(headerId, e.target.selectionStart);
            Rates.updateHeader(headerId, newValue);
        },
    },

    init() {
        // Every time the store is updated, re-render the app
        Rates.addEventListener("save", RateApp.render);

        // Syncs windows/tabs
        RateApp.filter = getUrlHash();
        window.addEventListener("hashchange", () => {
            RateApp.filter = getUrlHash();
            RateApp.render();
        });

        RateApp.render();
        RateApp.bindRateEvents();
    },
    // Event listeners - some of these events can be simplified (header and section)
    rateHeaderEvent(event, selector, handler) {
        delegate(RateApp.elements.headers, selector, event, (e) => {
            let el = e.target.closest("[data-id]");
            handler(Rates.getHeader(el.dataset.id), el, e);
        });
    },
    rateSectionEvent(event, selector, handler) {
        delegate(RateApp.elements.yearRanges, selector, event, (e) => {
            let el = e.target.closest("[data-id]");
            handler(Rates.getSection(el.dataset.id), el, e);
        });
    },
    rateRowEvent(event, selector, handler) {
        // Add the proper logic to handle multiple add row buttons
        delegate(RateApp.elements.yearRanges, selector, event, (e) => {
            const ids = {
                yearRange: e.target.closest(".yearRange").dataset.id,
                row: e.target.closest("[data-id]").dataset.id,
            };
            handler(Rates.getRow(ids.yearRange, ids.row), ids, e);
        });
    },

    // Event binding
    bindRateEvents() {
        // Disable enter key, so it doesn't delete, yearRanges or rows
        document.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                e.preventDefault();
                return false;
            }
        });

        RateApp.rateHeaderEvent(
            "click",
            "[data-rate='remove-header']",
            (rate) => {
                Rates.removeHeader(rate);
            },
        );
        RateApp.rateHeaderEvent(
            "input",
            "[data-rate='header-input']",
            debounce(RateApp.handlers.headerInputChange, 800),
        );
        RateApp.rateSectionEvent(
            "click",
            "[data-rate='remove-yearRange']",
            (yearRange) => {
                Rates.removeSection(yearRange);
            },
        );
        RateApp.rateRowEvent("click", "[data-rate='remove-row']", (_, ids) => {
            Rates.removeRow(ids.yearRange, ids.row);
        });

        RateApp.rateRowEvent(
            "keyup",
            "[data-id]",
            debounce(RateApp.handlers.cellInputChange, 800),
        );

        // Adding events
        this.elements.headerButton.addEventListener("click", () =>
            Rates.addHeader(),
        );
        this.elements.yearRangeButton.addEventListener("click", () =>
            Rates.addSection(),
        );
        // Submitting the form
        this.elements.updateRateButton.addEventListener("click", (e) => {
            e.preventDefault();
            // Will issue a post request to the server with the current rates
            const rates = Rates.rates;

            const url = "/rates/";
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRFToken": this.elements.csrfInput.value,
                },
                body: JSON.stringify(rates),
            };
            fetch(url, options)
                .then((response) => {
                    if (response.ok) {
                        notify("success", "Rates updated successfully");
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        });
        // TODO:
        // This works fine, but it doesn't feel right, because I want to handle
        // this event in its own event, like the other ones
        delegate(
            RateApp.elements.yearRanges,
            '[data-rate="add-row"]',
            "click",
            (e) => {
                const yearRangeEl = e.target.closest(".yearRange");
                if (yearRangeEl) {
                    const newRow = Rates.addRow(yearRangeEl.dataset.id);
                    const newRowElement = RateApp.createRow(
                        newRow,
                        yearRangeEl.dataset.id,
                    );
                    yearRangeEl.appendChild(newRowElement);
                }
            },
        );

        document.addEventListener(
            "focus",
            (event) => {
                if (event.target.tagName === "INPUT") {
                    let lastFocusedInput = event.target.dataset.id;
                    if (lastFocusedInput === Rates.rates.focusedInput) {
                        return;
                    }
                    Rates.setFocusedInput(
                        lastFocusedInput,
                        event.target.selectionStart,
                    );
                }
            },
            true,
        );
    },

    // TODO: Remove this after release
    renderDataPreview() {
        const el = document.getElementById("data-preview");
        el.innerText = JSON.stringify(Rates.rates, null, 2);
    },

    createYearInput(label, data, yearRangeID) {
        const yearInput = document.createElement("div");
        yearInput.className = "year-input w-32";
        yearInput.innerHTML = `
        <div class=''>
          <label for="year-input" class="w-full text-slate-700 text-sm font-semibold">${label}</label>
          <div class="flex flex-row h-10 w-full rounded-lg relative bg-transparent mt-1">
              <button type='button' data-rate="decrease-year" class="flex items-center justify-center bg-slate-200 text-slate-400 hover:text-slate-500 hover:bg-slate-300 h-full w-20 rounded-l cursor-pointer outline-none">
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"></path></svg>
              </button>
              <input 
                     data-id=${label.toLowerCase().replace(" ", "-")}
                     pattern="[0-9]{4}" type="text" inputmode="numeric" 
                     value="${data.value}"
                     name="${camelCase(label)}" 
                     class="py-2 px-4 text-slate-700 outline-none focus:outline-none w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
              <button type='button' data-rate="increase-year" class="flex items-center justify-center bg-slate-200 text-slate-400 hover:text-slate-400 hover:bg-slate-300 h-full w-20 rounded-r cursor-pointer">
                <svg stroke="currentColor" fill="currentColor" class="h-4 w-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><defs></defs><path d="M474 152m8 0l60 0q8 0 8 8l0 704q0 8-8 8l-60 0q-8 0-8-8l0-704q0-8 8-8Z"></path><path d="M168 474m8 0l672 0q8 0 8 8l0 60q0 8-8 8l-672 0q-8 0-8-8l0-60q0-8 8-8Z"></path></svg>
              </button>
          </div>
            ${
                data.error
                    ? `<p class="text-red-500 text-xs italic overflow">${data.error}</p>`
                    : ""
            }
        </div>
    `;

        // Direct reference to the input
        const yearInputElement = yearInput.querySelector(
            "[data-id='year-input']",
        );

        yearInput
            .querySelector('[data-rate="increase-year"]')
            .addEventListener("click", () => {
                const year = parseInt(yearInputElement.value) + 1;
                yearInputElement.value = year;
                Rates.updateYear(yearRangeID, year, camelCase(label));
            });

        yearInput
            .querySelector('[data-rate="decrease-year"]')
            .addEventListener("click", () => {
                const year = parseInt(yearInputElement.value) - 1;
                yearInputElement.value = year;
                Rates.updateYear(yearRangeID, year, camelCase(label));
            });
        return yearInput;
    },

    // Element creation
    createHeader(header) {
        const headerElement = document.createElement("div");
        // headerElement.dataset.id = header.id;
        headerElement.className = "header relative flex flex-col";
        // We must use pointer-events: none on the svg; to allow the click event
        // to pass through to the button element
        const emptyInput = createInput({
            className: "hidden",
        });
        headerElement.appendChild(emptyInput);

        insertHTML(
            headerElement,
            `
            ${
                createInput({
                    id: header.id,
                    name: "header",
                    dataset: { rate: "header-input", id: header.id },
                    type: "tel", // "number" doesn't allow for setSelectionRange
                    pattern: "[0-9]*",
                }).outerHTML
            }
        <button
         class="absolute -top-2 -right-2 p-1 text-white bg-slate-300 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
         data-rate="remove-header" 
         data-id="${header.id}">
             <svg fill="#000000" class="pointer-events-none h-2 w-2 fill-white -z-0"  id="x" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 460.775 460.775" xml:space="preserve">
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
            </svg>
         </button>
      `,
        );
        headerElement.querySelector('[data-rate="header-input"]').value =
            header.name;
        return headerElement;
    },
    createRow(row, yearRangeID) {
        const rowElement = document.createElement("div");
        rowElement.className = "flex gap-x-4 relative hover:bg-slate-200 py-1";
        rowElement.dataset.id = row.id;
        rowElement.dataset.rate = "rate-row";

        // Rows cell will equal the length of the headers array + 1
        // The + 1 is for the first cell which will be the month term
        const rowFragment = document.createDocumentFragment();

        const monthSpan = document.createElement("span");
        const input = createInput({
            id: row.id + "-cell-month",
            value: row.months,
        });
        monthSpan.appendChild(input);
        rowFragment.appendChild(monthSpan);

        const yearRange = Rates.rates.yearRanges.find(
            (yearRange) => yearRange.id === yearRangeID,
        );
        const cells = yearRange.rows.find((r) => r.id === row.id).cells;

        for (let i = 0; i < cells.length; i++) {
            const cellDiv = document.createElement("div");
            const value = !cells[i].value.includes("Placeholder")
                ? cells[i].value
                : "";
            const rightElement = value
                ? "<b>%</b>"
                : "<b class='text-red-400'>%</b>";
            const input = createInput({
                label: "",
                name: "",
                value: value,
                placeholder: "99.99",
                id: cells[i].id,
                type: "tel",
                pattern: "[0-9]*",
                rightElement: rightElement,
            });
            cellDiv.appendChild(input);
            rowFragment.appendChild(cellDiv);
        }

        const removeRowButton = `
        <button
         class="absolute -top-2 -right-2 p-1 text-white bg-slate-300 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
         data-rate="remove-row" 
         data-id="${row.id}">
             <svg fill="#000000" class="pointer-events-none h-2 w-2 fill-white -z-0"  id="x" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 460.775 460.775" xml:space="preserve">
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
            </svg>
         </button>
    `;
        rowElement.insertAdjacentHTML("afterbegin", removeRowButton);

        // Append the DocumentFragment to the rowElement
        rowElement.appendChild(rowFragment);
        return rowElement;
    },

    createSection(yearRange) {
        const yearRangeElement = document.createElement("div");
        yearRangeElement.className =
            "yearRange p-4 bg-slate-100 rounded flex flex-col gap-y-4 relative";
        yearRangeElement.dataset.id = yearRange.id;

        const rows = yearRange.rows.map((row) =>
            this.createRow(row, yearRange.id),
        );

        const startYearInput = RateApp.createYearInput(
            "Starting Year",
            yearRange.startingYear,
            yearRange.id,
        );
        const endYearInput = RateApp.createYearInput(
            "Ending Year",
            yearRange.endingYear,
            yearRange.id,
        );

        insertHTML(
            yearRangeElement,
            `<div data-rate="yearRange-range" class='flex flex-wrap gap-x-4 gap-y-8 relative '>
        </div>
        <button
         class="absolute -top-2 -right-2 p-1 text-white bg-slate-300 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
        id="remove-yearRange"
         data-rate="remove-yearRange" 
         data-id="${yearRange.id}">
             <svg fill="#000000" class="pointer-events-none h-2 w-2 fill-white -z-0"   xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 460.775 460.775" xml:space="preserve">
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
            </svg>
         </button>
        </div>  
        <div class="yearRange-rows">
            <div class="px-1 flex gap-x-4">
            <p class='rounded w-24 text-slate-400'> Months </p>
        ${Rates.rates.headers
            .map((header) => {
                return `<p class='rounded w-24 text-slate-400'> ${header.name} </p>`;
            })
            .join("")}
            </div>
        ${rows.map((row) => row.outerHTML).join("")}
        </div>

        <div class=''>
            <button
                type="button"
                data-rate="add-row"
                class="w-52 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
            Add Row
          </button>
        </div>
        `,
        );

        yearRangeElement
            .querySelector("[data-rate='yearRange-range']")
            .appendChild(startYearInput);
        yearRangeElement
            .querySelector("[data-rate='yearRange-range']")
            .appendChild(endYearInput);

        return yearRangeElement;
    },
    focusInput() {
        const focusedInput = Rates.rates.focusedInput;
        const input = document.querySelector(`[data-id='${focusedInput.id}']`);

        if (!input) return;
        input.setSelectionRange(focusedInput.position, focusedInput.position);
        input.focus();
    },
    render() {
        console.log("Rendering...");
        RateApp.renderDataPreview();
        // This is not super efficient, but it's fine for now
        // An alternative would be to simply update what's changed
        // But that would require diffing the DOM, might look into this later.

        // So for now, we'll just re-render everything
        RateApp.elements.headers.replaceChildren(
            ...Rates.rates.headers.map((header) => {
                return RateApp.createHeader(header);
            }),
        );
        RateApp.elements.yearRanges.replaceChildren(
            ...Rates.rates.yearRanges.map((yearRange) => {
                return RateApp.createSection(yearRange);
            }),
        );

        // The first yearRange starting year will always be the value of the
        // latest-year input field, which is hidden in the jinja template
        const lastYear = document.getElementById("latest-year").value;
        const yearRange = Rates.rates.yearRanges[0];
        if (yearRange && yearRange.startingYear.value !== lastYear) {
            Rates.updateYear(yearRange.id, lastYear, "startingYear");
        }

        // focus on the last input
        // I know this is weird, but the ux should be better for
        // the user
        RateApp.focusInput();
    },
};

RateApp.init();

//TODO: Broke the updateCell needs fix
//TODO: Finish backend implementation - 90%
//TODO: Fix input focus to place cursor at the last position recorded
//TODO: Add functionality to paste blocks of excel
