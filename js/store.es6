import { uuid, validate } from "./utils.es6";

export const RateStore = class extends EventTarget {
    /**
     * Constructs a new RateStore instance and initializes it with rates from local storage.
     *
     * @param {string} localStorageKey - The key used to retrieve and store rates in the local storage.
     */
    constructor(localStorageKey) {
        super();
        this.localStorageKey = localStorageKey;
        this._readStorage();

        // Handles rates updated in a different window
        window.addEventListener(
            "storage",
            () => {
                this._readStorage();
                this._save();
            },
            false,
        );
        // Getters
        this.getHeader = (id) =>
            this.rates.headers.find((header) => header.id === id);
        this.getSection = (id) =>
            this.rates.yearRanges.find((yearRange) => yearRange.id === id);
        this.getRow = (yearRangeId, rowId) => {
            const yearRange = this.rates.yearRanges.find(
                (yearRange) => yearRange.id === yearRangeId,
            );
            return yearRange.rows.filter((row) => row.id === rowId);
        };
    }
    /**
     * Reads the rates from local storage and sets them to the instance.
     * Initializes rates if not found in storage.
     * @private
     */
    _readStorage() {
        const num = (this.rates && this?.rates.headers.length + 1) || 1;
        const headers = (this.rates && this.rates.headers) || [
            { id: uuid(), name: "Tier " + num },
        ];
        const data =
            window.localStorage.getItem(this.localStorageKey) ||
            JSON.stringify({
                headers: [
                    {
                        id: uuid(),
                        name: "Tier" + num,
                        error: null,
                    },
                ],
                yearRanges: [
                    {
                        id: uuid(),
                        startingYear: {
                            value: "2021",
                            error: null,
                        },
                        endingYear: {
                            value: "2021",
                            error: null,
                        },
                        rows: [this._createRow(headers)],
                    },
                ],
                focusedInput: { id: null, position: null },
            });
        this.rates = JSON.parse(data);
    }
    /**
     * Saves the rates to local storage and dispatches a save event.
     * @private
     */
    _save(dispatchEvent = true) {
        window.localStorage.setItem(
            this.localStorageKey,
            JSON.stringify(this.rates),
        );
        if (dispatchEvent) {
            this.dispatchEvent(new CustomEvent("save"));
        }
    }
    _createRow(headers) {
        const rowID = uuid();
        const local_headers = headers || this.rates.headers;
        return {
            id: rowID,
            months: "12 months",
            cells: local_headers.map((_, i) => ({
                id: uuid(),
                value: "Placeholder" + (i + 1),
                error: null,
            })),
        };
    }

    // Mutators
    /**
     * Adds a new header to the rates.
     */
    addHeader() {
        const num = (this.rates && this.rates.headers.length + 1) || 1;
        this.rates.headers.push({
            id: uuid(),
            name: "Tier " + num,
        });

        // Add a new cell to each row
        this.rates.yearRanges.forEach((yearRange) => {
            yearRange.rows.forEach((row) => {
                row.cells.push({
                    id: uuid(),
                    value: "Placeholder" + row.cells.length,
                });
            });
        });

        this._save();
    }
    /**
     * Adds a new yearRange to the rates.
     */
    addSection(currentYear) {
        const yearRangeLength = this.rates.yearRanges.length;
        let lastSection;
        let lastEndingYear = new Date().getFullYear() - 1;
        if (yearRangeLength) {
            lastSection =
                this.rates.yearRanges[this.rates.yearRanges.length - 1];
            lastEndingYear = lastSection.endingYear.value;
        }
        this.rates.yearRanges.push({
            id: uuid(),
            startingYear: {
                value: lastEndingYear - 1,
                error: null,
            },
            endingYear: {
                value: 2006,
                error: null,
            },
            rows: [this._createRow()],
        });

        this._save();
    }
    /**
     * Adds a new row to a specified yearRange in the rates.
     *
     * @param {string} yearRangeID - The ID of the yearRange to which the row should be added.
     * @returns {object} The newly added row.
     */
    addRow(yearRangeID) {
        const yearRange = this.rates.yearRanges.find(
            (s) => s.id === yearRangeID,
        );
        const row = this._createRow();
        yearRange.rows.push(row);

        this._save();
        return row;
    }

    setFocusedInput(inputID, cursorPosition) {
        this.rates.focusedInput = { id: inputID, position: cursorPosition };
        // We don't need to dispatch event because it would be crazy to render
        // the whole page just because the focused input changed.
        this._save(false);
    }

    /**
     * Removes a yearRange with the specified ID from the rates.
     *
     * @param {object} params - Object containing the ID of the yearRange to be removed.
     * @param {string} params.id - ID of the yearRange to be removed.
     */
    removeSection({ id }) {
        this.rates.yearRanges = this.rates.yearRanges.filter(
            (rate) => rate.id !== id,
        );
        this._save();
    }

    /**
     * Removes a header with the specified ID from the rates.
     *
     * @param {object} params - Object containing the ID of the header to be removed.
     * @param {string} params.id - ID of the header to be removed.
     */
    removeHeader({ id }) {
        // find the position of the header in the headers array
        const index = this.rates.headers.findIndex(
            (header) => header.id === id,
        );
        // remove the header from the headers array
        this.rates.headers.splice(index, 1);

        // remove the header from the cells of all rows
        this.rates.yearRanges.forEach((yearRange) => {
            yearRange.rows.forEach((row) => {
                row.cells.splice(index, 1);
            });
        });
        this._save();
    }

    /**
     * Removes a row with the specified ID from the specified yearRange in the rates.
     *
     * @param {string} yearRangeID - The ID of the yearRange from which the row should be removed.
     * @param {string} rowID - The ID of the row to be removed.
     */
    removeRow(yearRangeID, rowID) {
        const yearRange = this.rates.yearRanges.find(
            (s) => s.id === yearRangeID,
        );
        yearRange.rows = yearRange.rows.filter((row) => row.id !== rowID);
        this._save();
    }

    /**
     * Updates the name of a header with the specified ID.
     *
     * @param {string} id - ID of the header to be updated.
     * @param {string} name - New name for the header.
     */
    updateHeader(id, name) {
        const header = this.rates.headers.find((h) => h.id === id);

        let status = validate({ value: name, cellType: "header" });

        if (status.isValid === false) {
            header.error = status.message;
            this._save(false);
            return;
        }

        header.name = name;
        this._save();
    }
    updateYear(yearRangeID, year, type) {
        const yearRange = this.rates.yearRanges.find(
            (s) => s.id === yearRangeID,
        );
        const yearRangeIndex = this.rates.yearRanges.findIndex(
            (s) => s.id === yearRangeID,
        );

        // If endingYear is the type, we need to update the next yearRange startingYear
        // to be the same as the endingYear - 1 of the current yearRange.
        // We ignore it if the current yearRange is the last yearRange.
        if (
            type === "endingYear" &&
            yearRangeIndex < this.rates.yearRanges.length - 1
        ) {
            const nextSection = this.rates.yearRanges[yearRangeIndex + 1];
            nextSection.startingYear.value = year - 1;
        }

        // EndingYear cannot be more than startingYear.
        if (type === "endingYear" && year >= yearRange.startingYear.value) {
            yearRange[type].value = year;
            yearRange.endingYear.error = `Ending Year must be less than ${yearRange.startingYear.value}.`;
            this._save();
            return;
        }

        yearRange[type].value = year;
        yearRange[type].error = "";
        this._save();
    }
    /**
     * Updates the value of a cell with the specified IDs.
     *
     * @param {string} yearRangeID - ID of the yearRange containing the cell.
     * @param {string} rowID - ID of the row containing the cell.
     * @param {string} cellID - ID of the cell to be updated.
     * @param {*} value - New value for the cell.
     */
    updateCell(yearRangeID, rowID, cellID, value) {
        const yearRange = this.rates.yearRanges.find(
            (s) => s.id === yearRangeID,
        );
        const row = yearRange.rows.find((r) => r.id === rowID);
        const cell = row.cells.find((c) => c.id === cellID);

        // If the cellID contains month, update the month name instead
        // of the cell value
        if (cellID.includes("month")) {
            row.months = value;
            this._save();
            return;
        }

        if (cell === undefined) {
            throw new Error(`Cell with ID ${cellID} not found.`);
        }

        // update existing cell
        cell.value = value;

        this._save();
    }
};
