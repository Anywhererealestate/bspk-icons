import { execSync } from 'child_process';
import fs from 'fs';
import { ANYWHERE_PATH, ICON_SIZE, MATERIAL_PATH } from './build-config';
export const MATERIAL_SOURCE_PATH = '../material-design-icons/symbols/web';

const MATERIAL_ICONS_LIST = 'assets/material-icons.txt';

function processMaterialList() {
    execSync(`rm -rf assets/material && mkdir -p assets/material`);

    // path checks
    [MATERIAL_SOURCE_PATH, MATERIAL_PATH, ANYWHERE_PATH].forEach((path) => {
        if (!fs.existsSync(path)) {
            throw new Error(`path does not exist: ${path}`);
        }
    });

    const allExistingMaterialIcons = fs
        .readdirSync(MATERIAL_SOURCE_PATH, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name.toLowerCase());

    const allExistingAnywhereIcons = fs
        .readdirSync(ANYWHERE_PATH)
        .flatMap((file) => (file.endsWith('.svg') && file.replace('.svg', '')) || []);

    // validated material icons
    const bespokeMaterialIcons = fs
        .readFileSync(MATERIAL_ICONS_LIST, 'utf-8')
        .split('\n')
        // filter out non-exisiting icons && remove anywhere icon duplicates
        .flatMap((line) => {
            const originalName = line.split('\t')[0];
            let iconName = originalName.trim().replace(/ /g, '_').toLowerCase();

            if (!allExistingMaterialIcons.includes(iconName)) iconName = iconName.replace(/_fill$/, '');

            if (!allExistingMaterialIcons.includes(iconName)) {
                console.error(`Icon "${iconName}" not found in material source`);
                return [];
            }

            if (allExistingAnywhereIcons.includes(iconName)) {
                console.warn(`Icon "${iconName}" already exists in anywhere`);
                return [];
            }

            return iconName;
        })
        // remove duplicates
        .filter((icon, index, arr) => arr.findIndex((i) => i === icon) === index && icon);

    bespokeMaterialIcons.sort();

    bespokeMaterialIcons.forEach((icon) => {
        const iconPath = `${MATERIAL_SOURCE_PATH}/${icon}/materialsymbolsrounded/` + `${icon}_${ICON_SIZE}px.svg`;

        const iconPathFilled =
            `${MATERIAL_SOURCE_PATH}/${icon}/materialsymbolsrounded/` + `${icon}_fill1_${ICON_SIZE}px.svg`;

        if (!fs.existsSync(iconPath)) throw new Error(`icon not found: ${icon} / ${icon}`);

        const code = fs.readFileSync(iconPath, 'utf-8');

        fs.writeFileSync(`${MATERIAL_PATH}/${icon}.svg`, code);

        if (fs.existsSync(iconPathFilled)) {
            const codeFilled = fs.readFileSync(iconPathFilled, 'utf-8');
            fs.writeFileSync(`${MATERIAL_PATH}/${icon}_fill.svg`, codeFilled);
        }
    });
}

processMaterialList();

/** Copyright 2025 Anywhere Real Estate - CC BY 4.0 */
