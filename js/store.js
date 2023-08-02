export const RateStore = class extends EventTarget {
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
      false
    );
    // Getters
    this.getHeader = (id) =>
      this.rates.headers.find((header) => header.id === id);
    this.getSection = (id) =>
      this.rates.sections.find((sections) => sections.id === id);
  }

  _readStorage() {
    const num = (this.rates && this?.rates.headers.length + 1) || 1;
    const headers = (this.rates && this.rates.headers) || [
      { id: "id_" + Date, name: "Header " + num },
    ];
    const data =
      window.localStorage.getItem(this.localStorageKey) ||
      JSON.stringify({
        headers: [
          {
            id: "id_" + Date.now(),
            name: "Header " + num,
          },
        ],
        sections: [
          {
            id: "id_" + Date.now(),
            startingYear: "2021",
            endingYear: "2021",
            rows: [
              {
                id: "id_" + Date.now(),
                cells: headers.map((header, i) => ({
                  id: header.name,
                  cell: "Placeholder" + (i + 1),
                })),
              },
            ],
          },
        ],
      });
    this.rates = JSON.parse(data);
  }

  _save() {
    window.localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(this.rates)
    );
    this.dispatchEvent(new CustomEvent("save"));
  }

  // Mutators
  addHeader() {
    const num = (this.rates && this.rates.headers.length + 1) || 1;
    this.rates.headers.push({
      id: "id_" + Date.now(),
      name: "Header " + num,
    });

    this._save();
  }

  addSection() {
    const headers = this.rates.headers;
    this.rates.sections.push({
      id: "id_" + Date.now(),
      startingYear: "2021",
      endingYear: "2021",
      rows: [
        {
          id: "id_" + Date.now(),
          cells: headers.map((header, i) => ({
            id: header.name,
            cell: "Placeholder" + (i + 1),
          })),
        },
      ],
    });

    this._save();
  }

  addRow(sectionID) {
    const headers = this.rates.headers;
    const section = this.rates.sections.find((s) => s.id === sectionID);
    section.rows.push({
      id: "id_" + Date.now(),
      cells: headers.map((header, i) => ({
        id: header.name,
        cell: "Placeholder" + (i + 1),
      })),
    });

    this._save();
  }

  // Update the remove and update functions
  removeSection({ id }) {
    this.rates.sections = this.rates.sections.filter((rate) => rate.id !== id);
    this._save();
  }

  removeHeader({ id }) {
    this.rates.headers = this.rates.headers.filter(
      (header) => header.id !== id
    );
    this._save();
  }

  removeRow({ id }) {
    this.rates.sections.rows = this.rates.sections.rows.filter(
      (row) => row.id !== id
    );
    this._save();
  }

  updateRate(rate) {
    this.rates = this.rates.map((r) => (r.id === rate.id ? rate : r));
    this._save();
  }
};
