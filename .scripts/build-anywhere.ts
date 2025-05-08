// rename all icons in the assets/anywhere folder -
// 1. all lowercase
// 2. remove spaces
// 3. remove Type=

import fs from 'fs';

fs.readdirSync('assets/anywhere').forEach((file) => {
    if (file.endsWith('.svg')) {
        const newName = file
            .toLowerCase()
            .replace(/^type=/g, '')
            .replace(/ /g, '_');
        fs.renameSync(`assets/anywhere/${file}`, `assets/anywhere/${newName}`);
    }
});

/** Copyright 2025 Anywhere Real Estate - CC BY 4.0 */
