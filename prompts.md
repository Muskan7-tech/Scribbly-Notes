# Scribbly Notes — project notes

## Task 1 scope

Build a small, offline-first notes page using plain HTML, CSS, and JavaScript.

## Current behavior

- Type a note into the editor and see it update immediately in the notebook preview.
- The preview uses horizontal notebook rules and a single readable handwriting-style system font stack.
- The character count updates as the note changes.
- Move between blank notebook pages, switch between ruled and unruled paper, and export the current page as a PNG.
- Import selectable text from PDFs using the locally bundled PDF.js reader. Scanned pages need OCR and are not converted to text.
- The app makes no API requests and needs no account or internet connection.

## Current notebook behavior

- Notes are wrapped to the available page width and split after 24 lines.
- Page controls move through the generated pages, and the indicator shows the current page and total page count.
- Export PNG downloads one tall image containing every page, with each page labeled (for example, “Page 1 of 3”).
- The handwritten appearance still uses one locally available system font stack; it does not simulate natural handwriting variation.

## Design boundaries

Keep the handwriting treatment and paper appearance simple. Do not add multiple handwriting styles or natural text variation yet.

## Implementation notes

- `index.html` contains the page structure and accessible labels.
- `style.css` contains the responsive layout and notebook appearance.
- `script.js` copies editor text to the preview with `textContent` on each input event.
- The handwriting appearance uses locally available system fonts, so no font download is required.
- PDF.js is bundled locally in `vendor/`; its license is included beside the library.
- Run the folder through a local web server for PDF.js worker support (for example, `python -m http.server 8000`). The app and PDF files stay on the device.
