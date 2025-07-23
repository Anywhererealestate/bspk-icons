/**
 *
 * This script performs cleanup tasks on SVG files in the assets directory.
 *
 * ts-node .scripts/cleanup.ts
 */
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CR = '<!-- Copyright 2025 Anywhere Real Estate - CC BY 4.0 -->' as const;

function rensureCopyrightOnSVGs() {
    const assetsPath = path.join(__dirname, '../assets');

    try {
        const files = fs.readdirSync(assetsPath, { recursive: true, encoding: 'utf8' });

        files.forEach((file) => {
            if (!file.endsWith('.svg') || file.startsWith('.')) return;

            // add <!-- Copyright 2025 Anywhere Real Estate - CC BY 4.0 --> to all SVG files
            const filePath = path.join(assetsPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');

            if (fileContent.includes(CR)) return;

            const updatedFileContent = fileContent.concat(`\n\n\n\n${CR}`).trim();

            fs.writeFileSync(filePath, updatedFileContent, 'utf8');
        });
    } catch (err) {
        console.error('Error processing files:', err);
    }
}

// look through assets/anywhere and rename all files which
// 1. use spaces and replace them with underscores
// 2. remove any characters that are not alphanumeric, underscore, dot, or dash
// 3. remove the prefix "Type=" if it exists
// if a file already exists with the new name delete the file to be renamed
function renameFiles() {
    const assetsPath = path.join(__dirname, '../assets/anywhere');

    try {
        const files = fs.readdirSync(assetsPath, { recursive: true, encoding: 'utf8' });

        files.forEach((file) => {
            if (file.startsWith('.')) return;

            let newFileName = file
                .replace(/ /g, '_')
                .replace(/^Type=/, '')
                .replace(/[^a-zA-Z0-9_.-]/g, '');

            const filePath = path.join(assetsPath, file);
            const newFilePath = path.join(assetsPath, newFileName);

            execSync(`mv -f "${filePath}" "${newFilePath}"`, { stdio: 'inherit' });
        });
    } catch (err) {
        console.error('Error renaming files:', err);
    }
}

// read meta and see if any icons have the Fill suffix and don't have a matching unfilled icon
function checkForMissingUnfilledIcons() {
    const metaPath = path.join(__dirname, '../meta.json');
    if (!fs.existsSync(metaPath)) {
        console.error('meta.json not found');
        return;
    }
    const metaContent = fs.readFileSync(metaPath, 'utf8');

    const meta = JSON.parse(metaContent);
    const missingIcons: string[] = [];
    meta.forEach((icon: { name: string; filled?: string }) => {
        if (icon.filled && !meta.some((i: { name: string }) => i.name === icon.name.replace(/Fill$/, ''))) {
            missingIcons.push(icon.name);
        }
    });

    if (missingIcons.length > 0) {
        console.warn('The following icons have a Fill suffix but no matching unfilled icon:');
        missingIcons.forEach((icon) => console.warn(`- ${icon}`));
    } else {
        console.log('No missing unfilled icons found.');
    }
}

checkForMissingUnfilledIcons();
