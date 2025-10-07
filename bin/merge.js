#!/usr/bin/env node

import { mergeFiles, mergeImages } from "../scripts/pdf.mjs";
import { MERGE_INPUT_PATH, MERGE_OUTPUT_PATH } from "../scripts/constants.mjs";

const main = async () => {
    try {
        await mergeFiles(MERGE_INPUT_PATH, MERGE_OUTPUT_PATH);
        await mergeImages(MERGE_INPUT_PATH, MERGE_OUTPUT_PATH);
    } catch (error) {
        console.log(error);
    }
}

main();