/**
 * This script generates the SVG icons and React components from the material-design-icons repository and custom icons
 * from the Bespoke Design System. The script is run by executing the command `npm run build` and `npm run build f` to
 * force the generation of the icon data.
 *
 * The script:
 * 1. reads the material folder to get the list of material icons to include.
 * 2. reads the country folder to get the list of country icons to include.
 * 3. reads the anywhere folder to get the list of custom icons to include.
 * 4. cleans up and optimizes the SVG code for each icon.
 * 5. generates the SVG files for each icon.
 * 6. generates the React components for each icon.
 * 7. generates the SvgIcon component which is a lazy loaded component that renders the icon.
 * 8. generates the meta/index.ts file which contains the icon metadata.
 * 9. generates the index.ts file which exports the IconType and IconMeta types.
 * 10. runs prettier on the generated files.
 * 11. compiles the TypeScript files.
 * 12. copies the generated JavaScript and TypeScript files to the root directory.
 * 13. removes the src directory.
 * 14. creates a placeholder file in the src directory.
 * 15. outputs the completion message.
 *
 * ts-node .scripts/build.ts
 */
import child_process, { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { optimize } from 'svgo';
import { transform } from '@svgr/core';
import { ICON_SIZE, COUNTRY_PATH, ANYWHERE_PATH, MATERIAL_PATH, BRAND_PATH } from './build-config';
import { IconMeta, IconType } from './build-types';

const exec = (...commands: string[]) =>
    commands.forEach((command) => child_process.execSync(command, { stdio: 'inherit' }));

export const makeComponentName = (fileName: string) => {
    return fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace('_fill1', 'Fill')
        .replace(new RegExp(`_${ICON_SIZE}px.svg$`), '')
        .replace(/.svg$/, '')
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/(^\w{1})|(\s+\w{1})/g, (l) => l.toUpperCase())
        .replace(/ /g, '');
};

type IconData = {
    name: string;
    code?: string;
    filled: boolean;
    type: IconType;
    optimized?: string;
    svg?: string;
};

const config: {
    path: string;
    type: IconType;
    nameFromFileName: (fileName: string) => string;
}[] = [
    {
        path: MATERIAL_PATH,
        type: 'material',
        nameFromFileName: makeComponentName,
    },
    {
        path: COUNTRY_PATH,
        type: 'country',
        nameFromFileName: (fileName) => {
            const match = fileName.match(/Shape=([^,]+), Country=([^,]+), Currency=([^\.]+).svg/);
            if (!match) return fileName;
            const [, shape, country] = match;
            return makeComponentName(shape + country);
        },
    },
    {
        path: ANYWHERE_PATH,
        type: 'anywhere',
        nameFromFileName: makeComponentName,
    },
    {
        path: BRAND_PATH,
        type: 'brand',
        nameFromFileName: makeComponentName,
    },
];

function getIconData(): IconData[] {
    let iconData = config.flatMap(({ path, nameFromFileName, type }) => {
        return fs.readdirSync(path).flatMap((file): IconData[] => {
            if (!file.endsWith('.svg')) return [];

            const code = fs.readFileSync(path + '/' + file, 'utf-8');
            const name = nameFromFileName(file);
            const filled = file.endsWith(' filled.svg') || file.endsWith(' fill.svg') || file.endsWith('_fill.svg');

            return [
                {
                    name,
                    code,
                    filled,
                    type,
                },
            ];
        });
    });

    iconData.sort((a, b) => a.name.localeCompare(b.name));

    iconData = iconData.filter((icon, index, arr) => {
        return !icon.filled || icon.code !== arr[index - 1]?.code;
    });

    return iconData;
}

function optimizeIcons(iconData: IconData[]) {
    if (iconData[0].optimized && process.argv[2] !== 'f') {
        console.log('\nskipping optimizing icons...');
        return;
    }

    console.log('\noptimizing icons...');

    iconData.forEach((icon) => {
        icon.optimized =
            icon.code &&
            optimize(icon.code, {
                multipass: true,
                plugins: [
                    'removeDimensions',
                    'cleanupIds',
                    'removeUselessDefs',
                    'removeDesc',
                    'removeTitle',
                    'removeMetadata',
                    'removeRasterImages',
                    'removeScriptElement',
                    'removeStyleElement',
                    'removeXMLNS',
                    'removeXMLProcInst',
                    'removeXlink',
                    icon.type !== 'country'
                        ? {
                              name: 'convertColors',
                              params: {
                                  currentColor: true,
                              },
                          }
                        : 'cleanupAttrs',
                    {
                        name: 'prefixIds',
                        params: {
                            prefix: 'Svg' + icon.name,
                        },
                    },
                ],
            }).data;

        if (icon.type === 'material') icon.optimized = icon.optimized?.replace('<svg', '<svg fill="currentColor"');

        icon.optimized = icon.optimized?.replace(
            '<svg ',
            `<svg data-bspk-name="${icon.name}"${icon.filled ? ' data-filled="true" ' : ' '}data-type="${icon.type}" xmlns="http://www.w3.org/2000/svg" `,
        );

        //
    });
}

function createSvgs(iconData: IconData[]) {
    console.log('\ngenerating SVGs...');

    iconData.forEach((icon) => {
        if (!icon.optimized) {
            console.log('no optimized code for', icon.type, icon.name);
            return;
        }

        const filePath = path.join('./dist/', icon.name + '.svg');

        fs.writeFileSync(filePath, icon.optimized.toString());
    });
}

function generateComponent(iconData: IconData[]) {
    console.log('\ngenerating react components...');

    iconData.sort((a, b) => a.name.localeCompare(b.name));

    iconData.forEach((icon) => {
        if (!icon.optimized) {
            console.log('no optimized code for', icon.type, icon.name);
            return;
        }
        const namedExport = `Svg${icon.name}`;

        const svgrOutput = transform.sync(
            icon.optimized,
            {
                plugins: ['@svgr/plugin-jsx'],
                typescript: true,
                exportType: 'named',
                namedExport,
            },
            { componentName: namedExport },
        );

        fs.writeFileSync(
            path.join('src', icon.name + '.tsx'),
            svgrOutput
                .replace('import * as React from "react";\n', '')
                .replace('export {', `${namedExport}.bspkName = 'Icon';\nexport {`)
                .replace('{...props}', '{...props} width={width}')
                .replace(
                    'props: SVGProps<SVGSVGElement>',
                    '{width = 24, ...props}: Omit<SVGProps<SVGSVGElement>,"height">',
                ),
        );
    });

    execSync(`mkdir -p ./src/SvgIcon`);

    fs.writeFileSync(
        path.join('src', 'SvgIcon/index.tsx'),
        `
import {
  Suspense,
  lazy,
  type SVGProps,
  type LazyExoticComponent,
  type ComponentType,
} from 'react';
import type { IconName } from '../meta';

const icons: Record<IconName, LazyExoticComponent<ComponentType>> = {
  ${iconData.map(({ name }) => `'${name}': lazy(() => import('../${name}').then(({ Svg${name} }) => ({ default: Svg${name} }))),`).join('\n')}
};

/**
 * Do not use in a production setting. This is for development and demo purposes only.
 * Icons should be imported directly. \`import { SvgWork } from '@bspk/icons/Work';\`
 *
 * @param name - The name of the icon to render.
 * @param ...props - SVGProps to pass to the icon.
 * @returns The lazy loaded icon SVG component.
 */
function SvgIcon({
  name,
  ...props
}: {
  name: IconName;
} & Omit<SVGProps<SVGSVGElement>, 'height'>) {
  const Svg = icons[name];
  props.width = props.width || 24;
  return ( <Suspense><Svg {...props} />
    </Suspense>);
}

SvgIcon.bspkName = 'Icon';

export { SvgIcon };
`,
    );

    fs.writeFileSync(path.join('src', 'index.ts'), fs.readFileSync(path.resolve(__dirname, 'build-types.ts'), 'utf-8'));

    execSync(`mkdir -p ./src/meta`);

    const iconNames = iconData.map((icon) => icon.name);

    const previousMeta: IconMeta[] = fs.existsSync(path.join('meta.json'))
        ? JSON.parse(fs.readFileSync(path.join('meta.json'), 'utf-8'))
        : [];

    const nextMeta = iconData.map((icon): IconMeta => {
        let title = icon.name.replace(/([a-z])([A-Z])/g, '$1 $2');

        if (icon.type === 'country') {
            title = title.replace(/^Flag /, 'Flag - ');
            title = title.replace(/^Symbol /, 'Symbol - ');
        }

        const variantFill =
            !icon.name.endsWith('Fill') && iconNames.includes(icon.name + 'Fill') ? icon.name + 'Fill' : undefined;

        const variantUnfilled =
            icon.name.endsWith('Fill') && iconNames.includes(icon.name.replace(/Fill$/, ''))
                ? icon.name.replace(/Fill$/, '')
                : undefined;

        const nextIcon: IconMeta = {
            name: icon.name,
            title,
            type: icon.type,
            variantFill,
            variantUnfilled,
        };

        if (icon.type === 'brand' || icon.type === 'country' || nextIcon.variantUnfilled) return nextIcon;

        nextIcon.alias = previousMeta.find((previousIcon) => previousIcon.name === icon.name)?.alias || nextIcon.title;

        return nextIcon;
    });

    // icons without aliases
    const missingAliases = nextMeta.filter((icon) => icon.alias === icon.title);

    if (missingAliases.length > 0) {
        console.warn(
            `\n\nIcons without aliases (${missingAliases.length}): \n${missingAliases.map((icon) => `\n- ${icon.name}`)}`,
        );
    } else {
        console.info('\n\nAll icons have aliases. :)');
    }

    fs.writeFileSync(
        path.join('src', 'meta/index.ts'),
        `import type { IconMeta } from '../';

export type IconName = '${iconData.map((icon) => icon.name).join("' | '")}';

export const meta: IconMeta[] = ${JSON.stringify(nextMeta)} as const;`,
    );

    fs.writeFileSync(path.join('meta.json'), JSON.stringify(nextMeta, null, 2));

    exec(
        `npx prettier --log-level silent --write ./src/*.tsx`,
        `npx prettier --log-level silent --write ./src/*.ts`,
        `npx prettier --log-level silent --write ./src/**/*.tsx`,
        `npx prettier --log-level silent --write ./src/**/*.ts`,
    );
}

(async () => {
    execSync('rm -rf ./src/* && mkdir -p ./src');

    // path checks
    [MATERIAL_PATH, COUNTRY_PATH, ANYWHERE_PATH].forEach((path) => {
        if (!fs.existsSync(path)) {
            throw new Error(`path does not exist: ${path}`);
        }
    });

    const iconData = getIconData();

    optimizeIcons(iconData);

    createSvgs(iconData);

    generateComponent(iconData);

    // compile the typescript files
    execSync(`npx tsc`, { stdio: 'inherit' });

    // copy the generated files to the root directory

    // execSync(`rm -rf src && mkdir -p src && touch ./src/index.ts`, { stdio: 'inherit' });

    console.log('\ngeneration complete!');
})();

/** Copyright 2025 Anywhere Real Estate - CC BY 4.0 */
