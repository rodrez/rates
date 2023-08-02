import { createSignal, createMemo, createEffect } from "./signal.js";
import { RateStore } from "./store.js";
import { delegate, getUrlHash, insertHTML, removeFromArray } from "./utils.js";

// State manager

// This is the main format, we will follow
let data = {
  headers: [],
  termSections: {},
};

const [rateData, setRateData] = createSignal(data);

const displayData = createMemo(() => {
  return JSON.stringify(rateData(), null, 2);
});

const Rates = new RateStore("rates");

const handleInputChange = (name, value) => {
  // Add logic here to update headers on input change
};

// Keeps track of changes
createEffect(() => {
  let preview = document.getElementById("data-preview");
  preview.textContent = JSON.stringify(rateData(), null, 2);
  console.log("My data is", displayData());
});

const inputClass =
  "w-52 pl-1 block rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6";

/**
 * FIX: This doesn't feel right, since it would probably
 * be better to pass the full data that will be updated.
 * For example: Now we simply pass a row and that row is
 * added to the array of rows of the given section.
 *
 * What sounds cleaner to me at least in my head, is that
 * we could pass the already updated full rows to the function
 * and the function simply replaces the full array of rows instead
 * of appending the row. This way we don't need to add a lot
 * of additional logic to handle row/term deletes.
 */

function updateRateValue(sectionID, data, type = "term") {
  const termSection = rateData().termSections[sectionID];
  const termSections = rateData().termSections;
  if (!termSection) return;

  let field = type === "term" ? { term: data } : { rows: data || [] };

  setRateData({
    ...rateData(),
    termSections: {
      ...termSections,
      [sectionID]: {
        ...termSection,
        ...field,
      },
    },
  });
}

// Get the number for the next rate
function getNextSectionNumber(object) {
  return Object.keys(object).length + 1;
}

function getNextNumber(sectionID) {
  return rateData().termSections[sectionID].rows.length - 1 || 0;
}

function removeHeader(data, e) {
  // Before deleting a header, we grab the index of the header. We need this
  // index to delete the elements in the rows that correspond to the index.
  let headerName = e.target.previousElementSibling.innerText.trim();
  let headerIndex = -1;
  // Removes the header by name
  for (const header of data.headers) {
    if (header === headerName) {
      headerIndex = removeFromArray(data.headers, headerName);
    }
  }

  // Removes the data points from all row at the index of the header
  for (const id of Object.keys(data.termSections)) {
    let termSection = data.termSections[id];
    for (const row of termSection.rows) {
      removeFromArray(row, headerIndex, true);
    }
  }
}

/**
 * Generates a single row based on the provided data.
 * @param {string} sectionID - The ID of the section to which the row belongs.
 * @param {Array} rowData - The data for the row.
 * @param {number} rowNumber - The number of the row.
 * @returns {HTMLDivElement|null} - The generated row element, or null if the row already exists.
 */
function createSingleRow(
  sectionID,
  rowData = {
    id: "",
    cells: ["Placeholder 1", "Placeholder 2", "Placeholder 3"],
  }
) {
  const rows = rateData().termSections[sectionID].rows;
  const lastRow = rows[rows.length - 1];
  const rowID = lastRow?.id + 1 || 1;
  rowData.id = rowID;

  rows.push(rowData);

  // Updates the state, not the DOM
  updateRateValue(sectionID, rows, "rows");

  const rowIdx = getNextNumber(sectionID);
  // This is the actual positional index
  const rowElementID = `${sectionID}-row-${rowIdx}`;

  // Check if the row already exists
  const row = document.createElement("div");
  row.className = "flex gap-x-4 items-center rate-row";
  row.id = rowElementID;
  row.setAttribute("data-rate", rowElementID);

  rowData.cells.forEach((cellValue) => {
    const cell = createCell(cellValue, inputClass);
    row.append(cell);
  });

  const deleteBtn = createDeleteButton(() =>
    removeRowFromSection(sectionID, rowIdx)
  );

  row.append(deleteBtn);

  return row;
}

/**
 * Creates a cell element with the given value.
 * @param {string} value - The value for the cell.
 * @returns {HTMLElement} - The created cell element.
 */
function createCell(value, className) {
  const cell = document.createElement("input");
  cell.value = value;
  cell.className = className;
  return cell;
}

/**
 * Creates a delete button element.
 * @returns {HTMLButtonElement} - The created delete button element.
 */
function createDeleteButton(onClick, className) {
  const deleteBtn = document.createElement("button");
  deleteBtn.className =
    className ||
    "text-sm font-semibold bg-red-400 px-2 h-7 rounded-md text-white";
  deleteBtn.innerText = "Delete";
  if (onClick) {
    deleteBtn.addEventListener("click", () => onClick());
  }
  return deleteBtn;
}

function createSingleSection(
  term = "9999-9999",
  sectionParent = "#rate-sections"
) {
  const newSectionNumber = getNextSectionNumber(rateData().termSections);
  const rateSectionID = "rate-section-" + newSectionNumber;

  rateData().termSections = {
    ...rateData().termSections,
    [rateSectionID]: {
      term: term,
      rows: [],
    },
  };

  const sectionContainer = createSectionContainer(rateSectionID);

  const termContainer = createTermContainer(rateSectionID, term, inputClass);
  sectionContainer.append(termContainer);

  const rowElements = createSingleRow(rateSectionID);
  const addRowBtn = createAddRowButton(rateSectionID, sectionContainer);
  sectionContainer.append(rowElements, addRowBtn);

  const parentElement = document.querySelector(sectionParent);
  parentElement.append(sectionContainer);
}

/**
 * Creates a section container element.
 * @param {string} rateSection - The rate section ID.
 * @returns {HTMLDivElement} - The created section container element.
 */
function createSectionContainer(rateSection) {
  const sectionContainer = document.createElement("div");
  sectionContainer.className =
    "mt-3 bg-gray-100 flex flex-col space-y-2 p-3 rounded-md";
  sectionContainer.id = rateSection;
  sectionContainer.setAttribute("data-rate", rateSection);
  return sectionContainer;
}

/**
 * Creates a term container element.
 * @param {string} rateSectionID - The rate section ID.
 * @param {string} termValue - The value of the term input.
 * @returns {HTMLDivElement} - The created term container element.
 */
function createTermContainer(rateSectionID, termValue, inputClass, labelClass) {
  const termContainer = document.createElement("div");
  termContainer.id = `${rateSectionID}-term`;
  termContainer.className = "flex flex-col gap-y-2";

  const termLabel = document.createElement("label");
  termLabel.htmlFor = "term-input";
  termLabel.innerText = "Term " + rateSectionID;
  termLabel.className = labelClass;

  const termInput = document.createElement("input");
  termInput.className = inputClass;
  termInput.value = termValue;

  termContainer.append(termLabel, termInput);
  return termContainer;
}

/**
 * Creates an "Add Row" button element.
 * @param {string} rateSection - The rate section ID.
 * @param {HTMLDivElement} sectionContainer - The section container element.
 * @returns {HTMLButtonElement} - The created "Add Row" button element.
 */
function createAddRowButton(rateSection, sectionContainer) {
  const addRowBtn = document.createElement("button");
  addRowBtn.className = "bg-blue-400 p-1 h-8 rounded-md text-white w-52";
  addRowBtn.id = rateSection + "-add-row-btn";
  addRowBtn.addEventListener("click", () => {
    // addRowToSection(rateSection);
    const row = createSingleRow(rateSection);
    sectionContainer.insertBefore(row, addRowBtn);
  });
  addRowBtn.innerText = "Add Row";
  return addRowBtn;
}

function removeRowFromSection(sectionID, rowIndex) {
  if (rateData().termSections.hasOwnProperty(sectionID)) {
    // If the last row will be deleted we remove the whole section
    const parent = document.getElementById(sectionID);
    // We use 3 here because including the last row to
    // be deleted we have the addRowBtn, and the term as
    // the remaining elements
    if (parent.children.length === 3) {
      parent.remove();
      return;
    }

    const sectionRows = rateData().termSections[sectionID].rows;
    const rowID = `${sectionID}-row-${rowIndex}`;

    // Since splice returns the removed value, we just use
    // sectionRows which was mutated by splice
    sectionRows.splice(rowIndex, 1);
    updateRateValue(sectionID, sectionRows, "rows");
    document.getElementById(rowID).remove();
  } else {
    console.error(`Section '${sectionID}' does not exist.`);
  }
}

const createSectionButton = document.querySelector(
  '[data-rate="create-new-section"]'
);

createSectionButton.addEventListener("click", () => {
  createSingleSection();
});

// Use this when the functionality it is working properly
const RateApp = {
  core: {
    headerList: document.querySelector('[data-rate="rate-headers"]'),
    sectionList: document.querySelector('[data-rate="rate-sections"]'),
    addHeaderButton: document.querySelector('[data-rate="add-heder"]'),
  },
  init() {
    // Triggers
    Rates.addEventListener("save", RateApp.render);
    RateApp.bindEvents();
    RateApp.render();
    RateApp.filter = getUrlHash();
  },
  rateEvent(event, selector, handler) {
    delegate(RateApp.core.headerList, selector, event, (e) => {
      let el = e.target.closest("[data-id]");
      handler(el.dataset.id);
    });
  },
  bindEvents() {
    RateApp.rateEvent("click", "[data-rate='remove-header']", (header) => {
      Rates.removeHeader(header);
    });

    // Instead of using rateEvent,
    // we can attach the listener directly, instead of delegating
    const addHeaderButton = document.querySelector('[data-rate="add-header"]');
    addHeaderButton.addEventListener("click", () => Rates.addHeader());
  },
  createRateRow(row) {
    const li = document.createElement("li");
    li.dataset.id = row.id;
    insertHTML(li, ``);
  },
  addHeader(header = { id: Date.now(), name: "header" }) {
    const headerContainer = document.createElement("div");
    headerContainer.dataset.id = header.id;
    headerContainer.className = "w-52 flex gap-x-2 items-center relative";

    const headerElement = `
                <input data-rate="header-input"/>
                <button 
                    data-rate='remove-header'
                    class="text-xs h-5 w-5 flex items-center justify-center bg-red-400 absolute -top-2 -right-2 rounded-md text-white"> 
                    <svg 
                        class="h-2 w-2 fill-white stroke-2"
                        version="1.1" 
                        id="delete-header-icon" 
                        xmlns="http://www.w3.org/2000/svg" 
                        xmlns:xlink="http://www.w3.org/1999/xlink" 
                        viewBox="0 0 460.775 460.775" 
                        xml:space="preserve">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier"> 
                                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55 l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719 c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"></path> 
                            </g>
                     </svg>
                </button>
        `;
    insertHTML(headerContainer, headerElement);
    headerContainer.querySelector('[data-rate="header-input"]').value =
      header.name;
    headerContainer.querySelector('[data-rate="header-input"]').className =
      inputClass;

    return headerContainer;
  },
  addSection() {
    const sectionElement = ``;
    insertHTML(RateApp.core.sectionList, sectionElement);
  },
  render() {
    // Render the ui here
    RateApp.core.headerList.replaceChildren(
      ...Rates.rates.headers.map((header) => RateApp.addHeader(header))
    );
    RateApp.addSection();
  },
};

const s = document.querySelector('[data-rate="rate-sections"]');

s.addEventListener("click", (e) => console.log("clicked: ", e));

// This should initiate the whole thing
RateApp.init();
