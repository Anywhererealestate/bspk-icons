export type IconType = 'material' | 'country' | 'anywhere' | 'brand';

export type IconMeta = {
    name: IconName;
    type: IconType;
    variantFill?: IconName;
    variantUnfilled?: IconName;
    title: string;
    alias?: string;
};

/** Copyright 2025 Anywhere Real Estate - CC BY 4.0 */
