export function notify(
    type = "info",
    message = "Hi, I'm an alert",
    // delay = 5000,
) {
    const alertTypes = {
        success: "green",
        error: "red",
        warning: "yellow",
        info: "blue",
    };
    // fill-green-400, text-green-800, bg-green-50, hover:bg-green-100, focus:ring-green-600, focus:ring-offset-green-50
    // fill-red-400, text-red-800, bg-red-50, hover:bg-red-100, focus:ring-red-600, focus:ring-offset-red-50
    // fill-yellow-400, text-yellow-800, bg-yellow-50, hover:bg-yellow-100, focus:ring-yellow-600, focus:ring-offset-yellow-50
    // fill-blue-400, text-blue-800, bg-blue-50, hover:bg-blue-100, focus:ring-blue-600, focus:ring-offset-blue-50

    const body = document.querySelector("body");
    body.insertAdjacentHTML(
        "afterbegin",
        `
        <div id="rates-notify" class="notify w-96 fixed z-50 top-4 right-4 rounded-md bg-${alertTypes[type]}-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 fill-${alertTypes[type]}-400" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75
        0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-${alertTypes[type]}-800">
                ${message}
                </p>
            </div>
            <div class="ml-auto pl-3">
              <div class="-mx-1.5 -my-1.5">
                <button type="button" class="inline-flex rounded-md bg-${alertTypes[type]}-50 p-1.5 text-${alertTypes[type]}-500 hover:bg-${alertTypes[type]}-100 focus:outline-none focus:ring-2 focus:ring-${alertTypes[type]}-600 focus:ring-offset-2 focus:ring-offset-${alertTypes[type]}-50">
                  <span class="sr-only">Dismiss</span>
                  <svg class="h-5 w-5 fill-${alertTypes[type]}-400" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        `,
    );
}
