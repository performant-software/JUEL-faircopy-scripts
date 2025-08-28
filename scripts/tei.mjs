import mammoth from "mammoth";
import fs from "fs";
import { DOMParser } from "linkedom";
import { processIIIF } from "./iiif.mjs";
import {
  PB_MARKER_DEFAULT,
  TEISTRING_DEFAULT,
  xml_dict,
} from "./constants.mjs";

/**
 *
 * @param {string} file The full path to the transcription `.docx` file
 * @param {string} pbMarker A string that will be parsed as a page break in the HTML
 * @param {object} dict A dictionary of string replacements to convert HTML elements to valid TEI
 * @returns An xml string with the given transcription as a `sourceDoc` element
 */
const processTranscription = async (
  file,
  teiString = TEISTRING_DEFAULT,
  pbMarker = PB_MARKER_DEFAULT,
  dict = xml_dict
) => {
  const domParser = new DOMParser();
  const buffer = fs.readFileSync(`transcriptions/${file}`);
  let text = await mammoth
    .convertToHtml({ buffer: buffer })
    .then(function (result) {
      return result.value; // The generated HTML
      // var messages = result.messages; // Any messages, such as warnings during conversion
    })
    .catch(function (error) {
      console.error(error);
    });
  const pages = text.split(pbMarker);
  let improvedPages = [];
  for (const page of pages) {
    let pageCopy = page;
    // replace some html elements with TEI equivalents
    for (const key of Object.keys(dict)) {
      pageCopy = pageCopy.replaceAll(`<${key}`, `<${dict[key]}`);
      pageCopy = pageCopy.replaceAll(`</${key}`, `</${dict[key]}`);
    }
    // remove h2 and h3 elements added by LEO
    pageCopy = pageCopy.replaceAll("<h3>Transcript:</h3>", "");
    let improvedPage = "";
    const segs = pageCopy.split("<h2>");
    for (const seg of segs) {
      if (seg.length && seg.includes("</h2>")) {
        improvedPage += seg.split("</h2>")[1];
      } else {
        improvedPage += seg;
      }
    }
    improvedPages.push(improvedPage);
  }
  // replacing the syntax LEO uses for page breaks
  let xmlDom = domParser.parseFromString(teiString, "text/xml");
  let TEI = xmlDom.querySelector("TEI");
  let sourceDoc = TEI.appendChild(xmlDom.createElement("sourceDoc"));
  sourceDoc.setAttribute("xml:id", "transcription");
  const digits = improvedPages.length < 1000 ? 3 : 4;
  for (let i = 0; i < improvedPages.length; i++) {
    let surface = sourceDoc.appendChild(xmlDom.createElement("surface"));
    surface.setAttribute("facs", `#f${i.toString().padStart(digits, "0")}`);
    const content = domParser.parseFromString(improvedPages[i], "text/xml");
    const contentNodes = content.childNodes;
    for (const child of contentNodes) {
      insertNode(xmlDom, surface, child);
    }
  }
  return xmlDom.toString();
};

const insertNode = (document, parentNode, childNode) => {
  const childCopy = document.importNode(childNode);
  const newChild = parentNode.appendChild(childCopy);
  for (const grandchild of childNode.childNodes) {
    insertNode(document, newChild, grandchild);
  }
};

export const createTEI = async (options) => {
  const { xmlid, transcription } = options;
  console.log(`Processing document ${xmlid}...`);
  const facsString = await processIIIF(options);
  let teiString = facsString;
  if (transcription) {
    teiString = await processTranscription(transcription, facsString);
  }
  fs.writeFileSync(`TEI/${xmlid}.xml`, teiString);
};
