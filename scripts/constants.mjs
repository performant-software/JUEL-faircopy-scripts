export const argOptions = {
  options: {
    transcription: {
      type: "string",
      short: "t",
    },
    manifest: {
      type: "string",
      short: "m",
    },
    file: {
      type: "string",
      short: "f",
    },
    title: {
      type: "string",
      short: "n",
    },
    xmlid: {
      type: "string",
      short: "x",
    },
    fairdataID: {
      type: "string",
      short: "u",
    },
    mediaFairdataID: {
      type: "string",
      short: "p"
    }
  },
};

export const xml_dict = {
  "/strong": "/hi",
  strong: `hi rend="strong"`,
  "/sup": "/hi",
  sup: `hi rend="super"`,
  "/a": "/ref",
  "a href": `ref target`,
  "a id": "ref xml:id",
  "br />": "/line><line>",
  "/sub": "/hi",
  sub: `hi rend="sub"`,
  "/s": "/hi",
  s: `hi rend="line-through"`,
  "/em": "/hi",
  em: `hi rend="bold"`,
  "/p>": "/line>",
  "p>": "line/><line>",
};

export const PB_MARKER_DEFAULT =
  "<p>──────────────────────────────────────────────────────────────────────</p>";

export const TEISTRING_DEFAULT = `<TEI xmlns="http://www.tei-c.org/ns/1.0">
        <teiHeader>
          <fileDesc>
              <titleStmt>
                  <title>
                      <!-- Your Title Here -->
                  </title>
              </titleStmt>
              <publicationStmt>
                  <p></p>
              </publicationStmt>
              <sourceDesc>
                  <p></p>
              </sourceDesc>
          </fileDesc>
      </teiHeader>
    </TEI>
`;

export const MERGE_INPUT_PATH = "merging_input";

export const MERGE_OUTPUT_PATH = "merging_output";

export const FD_BASE_PATH = "https://app.coredata.cloud";

export const IMAGE_OUTPUT = "image_output";

export const FD_PROJECT_ID = 92;
