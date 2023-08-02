import { RateStore } from "./store.js";
import { delegate, getUrlHash, insertHTML } from "./utils.js";

const Rates = new RateStore("enhanced-rates");

const RateApp = {
  elements: {
    headerButton: document.querySelector('[data-rate="add-header"]'),
    sectionButton: document.querySelector('[data-rate="add-section"]'),
    rowButtons: document.querySelectorAll('[data-rate="add-row"]'),
    headers: document.querySelector('[data-rate="headers"]'),
    sections: document.querySelector('[data-rate="sections"]'),
  },

  init() {
    Rates.addEventListener("save", RateApp.render);
    RateApp.filter = getUrlHash();

    // Syncs the two windows/tabs
    window.addEventListener("hashchange", () => {
      RateApp.filter = getUrlHash();
      RateApp.render();
    });

    RateApp.render();
    RateApp.bindRateEvents();
  },
  // Event listeners
  rateHeaderEvent(event, selector, handler) {
    delegate(RateApp.elements.headers, selector, event, (e) => {
      let el = e.target.closest("[data-id]");
      handler(Rates.getHeader(el.dataset.id), el, e);
    });
  },
  rateSectionEvent(event, selector, handler) {
    delegate(RateApp.elements.sections, selector, event, (e) => {
      let el = e.target.closest("[data-id]");
      handler(Rates.getSection(el.dataset.id), el, e);
    });
  },
  rateRowEvent(event, selector, handler) {
    // Add the proper logic to handle multiple add row buttons
    delegate(RateApp.elements.sections, selector, event, (e) => {
      let el = e.target.closest(".section");
      handler(Rates.getRow(el.dataset.id), el, e);
    });
  },

  // Envent binding
  bindRateEvents() {
    // Remove event
    RateApp.rateHeaderEvent("click", "[data-rate='remove-header']", (rate) => {
      Rates.removeHeader(rate);
    });
    RateApp.rateSectionEvent(
      "click",
      "[data-rate='remove-section']",
      (section) => {
        Rates.removeSection(section);
      }
    );
    RateApp.rateRowEvent("click", "[data-rate='remove-row']", (row) => {
      Rates.removeRow(row);
    });

    // Adding events
    this.elements.headerButton.addEventListener("click", () =>
      Rates.addHeader()
    );
    this.elements.sectionButton.addEventListener("click", () =>
      Rates.addSection()
    );
    // Rates.rateRowEvent("click", "[data-rate='add-row']", (section, el) => {
    //   Rates.addRow(section, el);
    // });
  },

  // TODO: Remove this after release
  renderDataPreview() {
    const el = document.getElementById("data-preview");
    el.innerText = JSON.stringify(Rates.rates, null, 2);
  },

  // The year input will have two buttons on the sides to increase or decrease the year
  // The year input will have a placeholder with the current year
  // We must validate that the year is 4 digits long
  createYearInput(label, value) {
    const yearInput = document.createElement("div");
    yearInput.className = "year-input h-10 w-32";
    yearInput.innerHTML = `
      <label for="year-input" class="w-full text-slate-700 text-sm font-semibold">${label}</label>
        <div class="flex flex-row h-10 w-full rounded-lg relative bg-transparent mt-1">
          <button data-rate="decrease-year" class="flex items-center justify-center bg-slate-200 text-slate-400 hover:text-slate-500 hover:bg-slate-300 h-full w-20 rounded-l cursor-pointer outline-none">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"></path></svg>
          </button>
          <input data-id="year-input" pattern="[0-9]{4}" type="number" value="${value}" class="py-2 px-4 text-slate-700 outline-none focus:outline-none w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
          <button data-rate="increase-year" class="flex items-center justify-center bg-slate-200 text-slate-400 hover:text-slate-400 hover:bg-slate-300 h-full w-20 rounded-r cursor-pointer">
            <svg stroke="currentColor" fill="currentColor" t="1551322312294" class="h-4 w-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><defs></defs><path d="M474 152m8 0l60 0q8 0 8 8l0 704q0 8-8 8l-60 0q-8 0-8-8l0-704q0-8 8-8Z"></path><path d="M168 474m8 0l672 0q8 0 8 8l0 60q0 8-8 8l-672 0q-8 0-8-8l0-60q0-8 8-8Z"></path></svg>
          </button>
        </div>
    `;

    // Direct reference to the inpu;t
    const yearInputElement = yearInput.querySelector("[data-id='year-input']");

    yearInput
      .querySelector('[data-rate="increase-year"]')
      .addEventListener("click", () => {
        yearInputElement.value = parseInt(yearInputElement.value) + 1;
      });

    yearInput
      .querySelector('[data-rate="decrease-year"]')
      .addEventListener("click", () => {
        yearInputElement.value = parseInt(yearInputElement.value) - 1;
      });

    return yearInput;
  },

  // Element creation
  createHeader(header) {
    const headerElement = document.createElement("div");
    headerElement.dataset.id = header.id;
    headerElement.className = "header relative flex flex-col";

    // We must use pointer-events: none on the svg; to allow the click event
    // to pass through to the svg element
    insertHTML(
      headerElement,
      `<input type="text" data-rate="header-input" class="p-0.5 rounded border w-52" name="headers" required>
        <button
         class="absolute -top-2 -right-2 p-1 text-white bg-slate-300 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
         data-rate="remove-header" 
         data-id="${header.id}">
             <svg fill="#000000" class="pointer-events-none h-2 w-2 fill-white -z-0"  id="x" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 460.775 460.775" xml:space="preserve">
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
            </svg>
         </button>
      `
    );
    headerElement.querySelector('[data-rate="header-input"]').value =
      header.name;
    return headerElement;
  },
  createRow(row) {
    const rowElement = document.createElement("div");
    rowElement.className = "flex relative hover:bg-slate-200 p-1";
    rowElement.dataset.id = row.id;

    // Rows cell will equal the length of the headers array + 1
    // The + 1 is for the first cell which will be the month term
    const rowFragment = document.createDocumentFragment();

    const monthCell = document.createElement("div");
    monthCell.className = "cell";
    monthCell.dataset.id = 0;
    monthCell.textContent = row.month;
    rowFragment.appendChild(monthCell);

    for (let i = 0; i < Rates.rates.headers.length + 1; i++) {
      const cellElement = document.createElement("input");
      cellElement.className = "p-0.5 mr-4 rounded border w-52";
      cellElement.dataset.id = i + 1;
      cellElement.value = "Placeholder";
      rowFragment.appendChild(cellElement);
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

  createSection(section) {
    const sectionElement = document.createElement("div");
    sectionElement.className =
      "section p-4 bg-slate-100 rounded flex flex-col gap-y-4 relative";
    sectionElement.dataset.id = section.id;

    const rows = section.rows.map((row) => this.createRow(row));

    const startYearInput = RateApp.createYearInput(
      "Starting Year",
      section.startingYear
    );
    const endYearInput = RateApp.createYearInput(
      "Ending Year",
      section.endingYear
    );

    insertHTML(
      sectionElement,
      `<div data-rate="section-range" class='flex gap-x-4 relative mb-4'>
        </div>
        <button
         class="absolute -top-2 -right-2 p-1 text-white bg-slate-300 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
        id="remove-section"
         data-rate="remove-section" 
         data-id="${section.id}">
             <svg fill="#000000" class="pointer-events-none h-2 w-2 fill-white -z-0"   xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 460.775 460.775" xml:space="preserve">
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
            </svg>
         </button>
        <div> 
            <p class='p-1 rounded w-52'> Months </p>
        </div>
        </div>  
        <div class="section-rows">
        ${rows.map((row) => row.outerHTML).join("")}
        </div>

        <div class='ml-auto'>
            <button
                type="button"
                data-rate="add-row"
                class="w-52 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
            Add Row
          </button>
        </div>
        `
    );

    sectionElement
      .querySelector("[data-rate='section-range']")
      .appendChild(startYearInput);
    sectionElement
      .querySelector("[data-rate='section-range']")
      .appendChild(endYearInput);

    return sectionElement;
  },

  render() {
    console.log("Rendering...");
    RateApp.renderDataPreview();
    RateApp.elements.headers.replaceChildren(
      ...Rates.rates.headers.map((header) => {
        return RateApp.createHeader(header);
      })
    );
    RateApp.elements.sections.replaceChildren(
      ...Rates.rates.sections.map((section) => {
        return RateApp.createSection(section);
      })
    );
  },
};

RateApp.init();
