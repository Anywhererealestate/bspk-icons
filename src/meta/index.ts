export type IconType = 'material' | 'country' | 'anywhere' | 'brand';

export type IconMeta = {
    /**
     * The type of icon, e.g., 'material', 'country', 'anywhere', or 'brand'.
     */
    type: IconType;
    /**
     * The name of the icon, always in PascalCase.
     */
    name: string;
    /**
     * The title of the icon, typically in Title Case.
     */
    title: string;
    /**
     * The alias of the icon, if applicable used for internal mapping and searching.
     */
    alias?: string;
    /**
     * The name of the icon's filled variant, if applicable.
     */
    variantFill?: string;
    /**
     * The name of the icon's unfilled variant, if applicable.
     */
    variantUnfilled?: string;
};

export type IconName = '';

export const meta: IconMeta[] = [
    /**
     *
     */
] as const;
