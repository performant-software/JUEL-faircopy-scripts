import fs from "fs";
import { padStart } from "pdf-lib";
import { PDFDocument } from "pdf-lib";
import PDFMerger from "pdf-merger-js";
import { FD_BASE_PATH, FD_PROJECT_ID, IMAGE_OUTPUT } from "./constants.mjs";

var merger = new PDFMerger();

const tempPath = "_temp"

export const mergeImages = async (sourcePath, destPath) => {
    //make a temp folder for the single page pdfs
    fs.mkdirSync(tempPath, { recursive: true })
    const files = fs
        .readdirSync(sourcePath, { recursive: true })
        .filter((f) => f.includes(".jpg"));

    let directories = {};

    let numImages = 0;

    for (const file of files) {
        try {
            const pathSegments = file.split("/");
            const fileName = pathSegments[pathSegments.length - 1];
            const filePath = pathSegments.slice(0, -1).join("/");
            directories[filePath] ||= [];
            directories[filePath].push(fileName);
            numImages += 1;
        } catch (error) {
            console.log(`Error processing folder ${fileName}: ${error}`)
        }
    }
    const paths = Object.keys(directories);
    let done = 0;
    for (const localPath of paths) {
        try {
            const files = directories[localPath];
            for (const file of files) {
                const fullPath = sourcePath + "/" + localPath + "/" + file;
                if (fullPath.slice(-4) === ".jpg") {
                    const pdfDoc = await PDFDocument.create();
                    const imgBytes = fs.readFileSync(fullPath);
                    const jpgImage = await pdfDoc.embedJpg(imgBytes);
                    const page = pdfDoc.addPage();
                    const { width, height } = jpgImage.scaleToFit(page.getWidth(), page.getHeight());
                    page.drawImage(jpgImage, {
                        x: page.getWidth() / 2 - width / 2, // Center horizontally
                        y: page.getHeight() / 2 - height / 2, // Center vertically
                        width,
                        height,
                    });
                    const outputPath = tempPath + "/" + localPath;
                    const outputFile = tempPath + "/" + localPath + "/" + file.slice(0, -4) + ".pdf";
                    fs.mkdirSync(outputPath, { recursive: true });
                    const pdfBytes = await pdfDoc.save();
                    fs.writeFileSync(outputFile, pdfBytes);
                    done += 1;
                    if (done % 10 === 10 % 10) {
                        console.log(`${done} files saved...`);
                    }
                }
            }
        } catch (error) {
            console.log(`Error processing ${localPath}: ${error}`)
        }
    }
    try {
        await mergeFiles(tempPath, destPath);
    } catch (error) {
        console.log(error)
    } finally {
        fs.rmSync(tempPath, { recursive: true, force: true });
    }
}

export const mergeFiles = async (sourcePath, destPath) => {
    const files = fs
        .readdirSync(sourcePath, { recursive: true })
        .filter((f) => f.includes(".pdf"));

    let directories = {};

    for (const file of files) {
        const pathSegments = file.split("/");
        const fileName = pathSegments[pathSegments.length - 1];
        const filePath = pathSegments.slice(0, -1).join("/");
        directories[filePath] ||= [];
        directories[filePath].push(fileName);
    }

    const paths = Object.keys(directories);
    let done = 0;
    for (const localPath of paths) {
        const files = directories[localPath];
        const outputPath =
            destPath + "/" + localPath.split("/").slice(0, -1).join("/");
        const outputFile = destPath + "/" + localPath + ".pdf";
        for (const file of files) {
            const fullPath = sourcePath + "/" + localPath + "/" + file;
            if (fullPath.slice(-4) === ".pdf") {
                await merger.add(fullPath);
            }
        }
        fs.mkdirSync(outputPath, { recursive: true });
        await merger.save(outputFile);
        done += 1;
        if (done % 10 === 10 % 10) {
            console.log(`${done} files saved...`);
        }
        merger.reset();
    }
};

// script that takes a TEI document and downloads the images to a folder
export const extractImagesFromManifest = async (data) => {
    let { manifest, title, fairdataID } = data;
    if (!manifest && fairdataID) {
        try {
            //in this case we need to find the data from the API
            const relatedMedia = await fetch(`${FD_BASE_PATH}/core_data/public/v1/items/${fairdataID}/media_contents?project_ids=${FD_PROJECT_ID}`).then(res => res.json());
            if (!relatedMedia.media_contents) {
                throw new Error(`Something went wrong fetching media for document ${fairdataID}`)
            }
            if (!relatedMedia.media_contents.length) {
                throw new Error(`No related media found for document ${fairdataID}`)
            }
            const mediaRecord = relatedMedia.media_contents[0];
            manifest = mediaRecord.manifest_url;
            title = title || mediaRecord.name;
        } catch (error) {
            console.log(error);
            return;
        }
    }
    try {
        console.log(`Processing ${title || manifest}...`)
        const manifestData = await fetch(manifest).then(res => res.json());
        if (!manifestData || !manifestData.items) {
            throw new Error(`No pages found for manifest ${manifest}`)
        }
        title = title || manifestData.label?.en[0];
        fs.mkdirSync(`${IMAGE_OUTPUT}/${title}`, { recursive: true });
        let current = 1;
        for (const page of manifestData.items) {
            const pagefilename = 'f' + padStart(current.toString(), 3, '0') + '.jpg';
            const pageUrl = page.items[0].items[0].body.id;
            const img = await saveImageFromUrl(pageUrl, `${IMAGE_OUTPUT}/${title}/${pagefilename}`)
            if (!img) {
                break;
            }
            current += 1;
        }
    } catch (error) {
        console.log(error)
    }
}

const saveImageFromUrl = async (url, output) => {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Error fetching from ${url}`)
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(output, buffer);
        return true;
    } catch (error) {
        console.log(error)
    }
}