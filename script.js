// Split the full note into notebook pages with at most 24 visible lines each.
const noteInput = document.querySelector("#note-input");
const notePreview = document.querySelector("#note-preview");
const characterCount = document.querySelector("#character-count");
const pageIndicator = document.querySelector("#page-indicator");
const previousPageButton = document.querySelector("#previous-page");
const nextPageButton = document.querySelector("#next-page");
const notebook = document.querySelector(".notebook");
const pdfInput = document.querySelector("#pdf-input");
const pdfStatus = document.querySelector("#pdf-status");

const LINES_PER_PAGE = 24;
let pages = [[]];
let currentPage = 0;

function getWrappedLines(text) {
  const style = getComputedStyle(notePreview);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = style.font;
  const maxWidth = Math.max(1, notePreview.clientWidth);
  const lines = [];

  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    if (paragraph === "") {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else if (!line && context.measureText(word).width > maxWidth) {
        // Break an unusually long word so it still fits on the notebook page.
        let part = "";
        for (const character of word) {
          if (part && context.measureText(part + character).width > maxWidth) {
            lines.push(part);
            part = character;
          } else {
            part += character;
          }
        }
        line = part;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }

  return lines.length ? lines : [""];
}

function updatePreview() {
  const wrappedLines = getWrappedLines(noteInput.value);
  pages = [];
  for (let index = 0; index < wrappedLines.length; index += LINES_PER_PAGE) {
    pages.push(wrappedLines.slice(index, index + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([""]);
  currentPage = Math.min(currentPage, pages.length - 1);

  const pageText = pages[currentPage].join("\n");
  notePreview.textContent = pageText;
  notePreview.classList.toggle("is-empty", noteInput.value.length === 0);
  pageIndicator.textContent = `Page ${currentPage + 1} of ${pages.length}`;
  previousPageButton.disabled = currentPage === 0;
  nextPageButton.disabled = currentPage === pages.length - 1;

  const count = noteInput.value.length;
  characterCount.textContent = `${count} ${count === 1 ? "character" : "characters"}`;
}

noteInput.addEventListener("input", updatePreview);
previousPageButton.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage -= 1;
    updatePreview();
  }
});
nextPageButton.addEventListener("click", () => {
  if (currentPage < pages.length - 1) {
    currentPage += 1;
    updatePreview();
  }
});
window.addEventListener("resize", updatePreview);

function setPaperStyle(ruled) {
  notebook.classList.toggle("unruled", !ruled);
  document.querySelector("#ruled-button").classList.toggle("is-selected", ruled);
  document.querySelector("#unruled-button").classList.toggle("is-selected", !ruled);
  document.querySelector("#ruled-button").setAttribute("aria-pressed", String(ruled));
  document.querySelector("#unruled-button").setAttribute("aria-pressed", String(!ruled));
}

document.querySelector("#ruled-button").addEventListener("click", () => setPaperStyle(true));
document.querySelector("#unruled-button").addEventListener("click", () => setPaperStyle(false));

// Export one tall PNG with notebook sheets stacked vertically and labeled by page.
document.querySelector("#export-button").addEventListener("click", () => {
  const width = 1000;
  const pageHeight = 900;
  const pageGap = 28;
  const paperX = 40;
  const paperWidth = width - paperX * 2;
  const firstLineY = 112;
  const lineHeight = 30;
  const textX = paperX + 105;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = pageHeight * pages.length + pageGap * (pages.length + 1);
  context.fillStyle = "#eeeae1";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.textBaseline = "top";

  pages.forEach((pageLines, pageIndex) => {
    const top = pageGap + pageIndex * (pageHeight + pageGap);

    // A soft shadow and warm paper edge make every exported sheet distinct.
    context.shadowColor = "rgba(51, 48, 39, 0.16)";
    context.shadowBlur = 12;
    context.shadowOffsetY = 4;
    context.fillStyle = "#fffefa";
    context.fillRect(paperX, top, paperWidth, pageHeight);
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;

    context.fillStyle = "#819087";
    context.font = '14px "Segoe UI", sans-serif';
    context.fillText(`SCRIBBLY NOTES  ·  PAGE ${pageIndex + 1} OF ${pages.length}`, paperX + 32, top + 36);

    if (!notebook.classList.contains("unruled")) {
      context.strokeStyle = "#dce7e2";
      context.lineWidth = 1;
      for (let row = 0; row < LINES_PER_PAGE; row += 1) {
        const y = top + firstLineY + 16 + row * lineHeight;
        context.beginPath();
        context.moveTo(paperX + 20, y);
        context.lineTo(paperX + paperWidth - 20, y);
        context.stroke();
      }
      context.strokeStyle = "#e8b9b0";
      context.beginPath();
      context.moveTo(paperX + 82, top + 20);
      context.lineTo(paperX + 82, top + pageHeight - 20);
      context.stroke();
    }

    context.fillStyle = "#35463e";
    context.font = '22px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
    pageLines.forEach((line, lineIndex) => {
      context.fillText(line, textX, top + firstLineY + lineIndex * lineHeight);
    });
  });

  const link = document.createElement("a");
  link.download = `scribbly-notes-${pages.length}-page${pages.length === 1 ? "" : "s"}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

pdfInput.addEventListener("change", async () => {
  const file = pdfInput.files[0];
  if (!file) return;
  if (!window.pdfjsLib) {
    pdfStatus.textContent = "The offline PDF reader is not bundled yet, so this PDF was not changed.";
    return;
  }
  pdfStatus.textContent = "Reading PDF text…";
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("vendor/pdf.worker.js", document.baseURI).href;
    const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    const extractedPages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      extractedPages.push(content.items.map((item) => `${item.str}${item.hasEOL ? "\n" : " "}`).join("").trim());
    }
    noteInput.value = extractedPages.join("\n\n");
    currentPage = 0;
    updatePreview();
    pdfStatus.textContent = `Imported selectable PDF text, now laid out across ${pages.length} notebook page${pages.length === 1 ? "" : "s"}.`;
  } catch (error) {
    pdfStatus.textContent = "Could not read this PDF. It may be damaged, encrypted, or contain scanned images.";
  }
});

updatePreview();
