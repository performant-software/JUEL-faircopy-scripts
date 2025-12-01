#!/usr/bin/env node

import { mergeFiles, mergeImages } from "../scripts/pdf.mjs";
import { MERGE_INPUT_PATH, MERGE_OUTPUT_PATH, argOptions, FD_ITEM_MODEL_ID, FD_MEDIA_MODEL_ID, FD_ITEM_MEDIA_REL_ID, FD_XML_ID_FIELD_UUID, DO_BASE_URL } from "../scripts/constants.mjs";
import { parseArgs } from "node:util";
import fs from 'fs';
import AdmZip from "adm-zip";

const main = async (options) => {
    const timestamp = new Date().toISOString().slice(0, 19);
    const outputPath = `${MERGE_OUTPUT_PATH}/${timestamp}`;
    fs.mkdirSync(outputPath);
    try {
        await mergeFiles(MERGE_INPUT_PATH, outputPath);
        await mergeImages(MERGE_INPUT_PATH, outputPath);
    } catch (error) {
        console.log(error);
    }
    if (options.createCSVs) {
        //in this case we're going to create fairdata CSVs for importing
        const pdfs = fs.readdirSync(outputPath).filter((f) => (f.endsWith('.pdf')));
        let items = `project_model_id,uuid,name,${FD_XML_ID_FIELD_UUID}\n`;
        let media = 'project_model_id,uuid,name,url\n';
        let relationships = 'project_model_relationship_id,uuid,primary_record_uuid,primary_record_type,related_record_uuid,related_record_type\n';
        for (const f of pdfs) {
            const itemUUID = crypto.randomUUID();
            const mediaUUID = crypto.randomUUID();
            const relUUID = crypto.randomUUID();
            const xmlId = f.slice(0, -4);
            const filename = xmlId.replaceAll('_', ' ');
            const mediaURL = DO_BASE_URL + '/' + encodeURIComponent(timestamp) + '/' + encodeURIComponent(f);
            items += FD_ITEM_MODEL_ID + ',' + itemUUID + ',"' + filename + '",' + xmlId + '\n';
            media += FD_MEDIA_MODEL_ID + ',' + mediaUUID + ',"' + filename + '","' + mediaURL + '"\n';
            relationships += FD_ITEM_MEDIA_REL_ID + ',' + relUUID + ',' + itemUUID + ',CoreDataConnector::Item,' + mediaUUID + ',CoreDataConnector::MediaContent\n';
        }
        items = items.trim();
        media = media.trim();
        relationships = relationships.trim();
        fs.mkdirSync(`csvs/${timestamp}`, { recursive: true });
        fs.writeFileSync(`csvs/${timestamp}/items.csv`, items);
        fs.writeFileSync(`csvs/${timestamp}/media_contents.csv`, media);
        fs.writeFileSync(`csvs/${timestamp}/relationships.csv`, relationships);
        const zip = new AdmZip();
        zip.addLocalFolder(`csvs/${timestamp}`);
        zip.writeZip(`csvs/${timestamp}/import.zip`)
        console.info(`Run the following command from the root folder to upload your documents to Digital Ocean:`);
        console.info(`rclone copy ${outputPath} digitalOcean:juel-box/processed/${timestamp} -P`);
    }
}

const options = parseArgs(argOptions).values;

main(options);