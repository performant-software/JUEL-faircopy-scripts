import mammoth from "mammoth";
import fs from "fs";
import { DOMParser } from "linkedom";
import { processIIIF } from "./iiif.mjs";
import {
  PB_MARKER_DEFAULT,
  TEISTRING_DEFAULT,
  xml_dict,
  FD_BASE_PATH,
  FD_PROJECT_ID,
  FD_XML_ID_FIELD_UUID
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
  try {
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
    //if the HTML contains elements we don't want to deal with, return an error message and abort processing
    if (text.includes("<table") || text.includes("<ol") || text.includes("<ul")) {
      console.error(
        `File ${file} contains invalid structures (tables or lists); please edit the file and try again.`
      );
      return false;
    }
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
      if (improvedPage) {
        improvedPages.push(improvedPage);
      }
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
  } catch (error) {
    console.log(error)
  }
};

const insertNode = (document, parentNode, childNode) => {
  const childCopy = document.importNode(childNode);
  const newChild = parentNode.appendChild(childCopy);
  for (const grandchild of childNode.childNodes) {
    insertNode(document, newChild, grandchild);
  }
};

export const createTEI = async (options) => {
  let { xmlid, title, transcription, uuid, manifest, name, fairdataID } = options;
  //if there's a uuid column, then we're working with a fairdata spreadsheet
  if (uuid) {
    try {
      //in this case we need to find the data from the API
      const relatedMedia = await fetch(`${FD_BASE_PATH}/core_data/public/v1/items/${uuid}/media_contents?project_ids=${FD_PROJECT_ID}`).then(res => res.json());
      if (!relatedMedia.media_contents) {
        throw new Error(`Something went wrong fetching media for document ${uuid}`)
      }
      if (!relatedMedia.media_contents.length) {
        throw new Error(`No related media found for document ${uuid}`)
      }
      const mediaRecord = relatedMedia.media_contents[0];
      manifest = mediaRecord.manifest_url;
      title = name || title || mediaRecord.name;
    } catch (error) {
      console.log(error);
      return;
    }
  }
  xmlid ||= options[FD_XML_ID_FIELD_UUID];
  transcription ||= `${xmlid}.docx`;
  fairdataID ||= uuid;
  console.log(`Processing document ${xmlid}...`);
  const facsString = await processIIIF({
    manifest,
    fairdataID,
    title
  });
  let teiString = facsString;
  if (transcription) {
    try {
      const withTrans = await processTranscription(transcription, facsString);
      if (withTrans) {
        teiString = withTrans;
      }
    } catch (error) {
      console.log(error);
    }
  }
  teiString && fs.writeFileSync(`TEI/${xmlid}.xml`, teiString);
};
