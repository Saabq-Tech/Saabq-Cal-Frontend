// Google Picker lets the user pick an existing spreadsheet. Picking a file grants this
// app access to that file only, which is what the drive.file scope relies on.

let pickerApiPromise = null;

const loadPickerApi = () => {
  if (window.google?.picker) return Promise.resolve();
  if (pickerApiPromise) return pickerApiPromise;

  pickerApiPromise = new Promise((resolve, reject) => {
    const onGapiReady = () =>
      window.gapi.load("picker", { callback: resolve, onerror: reject });

    if (window.gapi?.load) {
      onGapiReady();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = onGapiReady;
    script.onerror = reject;
    document.body.appendChild(script);
  }).catch((error) => {
    pickerApiPromise = null;
    throw error;
  });

  return pickerApiPromise;
};

// The Cloud project number is the numeric prefix of the OAuth client ID.
const getAppId = (clientId) => clientId?.split("-")[0];

/**
 * Opens the Google Picker filtered to spreadsheets.
 * Resolves with { id, name, url } of the picked file, or null if cancelled.
 */
export const pickSpreadsheet = async ({ accessToken, clientId, locale }) => {
  await loadPickerApi();

  if (!document.getElementById("google-picker-z-index-override")) {
    const style = document.createElement("style");
    style.id = "google-picker-z-index-override";
    style.textContent = `
      .picker-dialog,
      .picker-dialog-bg,
      .picker-dialog-content {
        z-index: 2147483647 !important;
      }
    `;
    document.head.appendChild(style);
  }

  const { picker } = window.google;

  return new Promise((resolve) => {
    const view = new picker.DocsView(picker.ViewId.SPREADSHEETS)
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false)
      .setMode(picker.DocsViewMode.LIST);

    const builder = new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setAppId(getAppId(clientId))
      .setCallback((data) => {
        const action = data[picker.Response.ACTION];
        if (action === picker.Action.PICKED) {
          const doc = data[picker.Response.DOCUMENTS]?.[0];
          resolve(
            doc
              ? {
                  id: doc[picker.Document.ID],
                  name: doc[picker.Document.NAME],
                  url: doc[picker.Document.URL],
                }
              : null,
          );
        } else if (action === picker.Action.CANCEL) {
          resolve(null);
        }
      });

    const developerKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY;
    if (developerKey) builder.setDeveloperKey(developerKey);
    if (locale) builder.setLocale(locale);

    builder.build().setVisible(true);
  });
};
