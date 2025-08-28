# faircopy-scripts

This is a workspace for creating valid TEI documents out of IIIF manifests and (optionally) corresponding translations in the form of `.docx` files. The basic usage is as follows:

- For each document you wish to process, you should collect the following information:
  - `manifest`: **Required.** A URL for the IIIF manifest containing the images of your document. If you are using FairData, this URL can be found by clicking "View IIIF" on the media record for your document.
  - `xmlid`: **Required.** The desired XML ID of the resulting TEI document.
  - `title`: The document title.
  - `fairdataID`: If relevant, the unique FairData identifier for the document. Note that unlike the manifest this should be found by navigating to the relevant record in the `Documents` model and copying the identifier from the upper right corner.
  - `transcription`: The full filename (including the `.docx` extension) of the transcription for the document. **This file should be placed in the `transcriptions` folder of this repo.**

## Processing a single file

If you have the above information for a single document, and you have uploaded the transcription file to the `transcriptions` folder of this repository, then you can process your document with the following command from the root folder of the repository:

```
node main.mjs -m <manifest url> -x <xmlid> -n <title> -u <fairdataID> -t <transcription>
```

Be sure to enclose your arguments in quotation marks if they contain spaces. For example, if you have a document called "My Excellent Archival Document" and you've uploaded the transcription file "MEAD Transcript.docx" to the `transcriptions` folder, your command might look like

```
node main.mjs -m https://someiiifserver.com/abc/manifest -x MY_EX_ARC -n "My Excellent Archival Document" -t "MEAD Transcript.docx"
```

If the processing finishes successfully, your TEI document will be generated with the name `<xmlid>.xml` in the `TEI` folder. You can then import that document into FairCopy for further editing and annotating.

## Processing multiple files

If you have multiple files you wish to process at once, create a CSV with columns `manifest, xmlid, title, fairdataID, transcription` and a row for each document you wish to process. Your CSV should have a header row. Upload the CSV into the `csvs` folder of this repository, and then run:

```
node main.mjs -f <filename>
```

where `filename` is the name of your CSV, including the extension `.csv`.
