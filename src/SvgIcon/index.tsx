import { Suspense, lazy, type SVGProps, type LazyExoticComponent, type ComponentType } from 'react';
import type { IconName } from '../meta';

const icons: Record<IconName, LazyExoticComponent<ComponentType>> = {
    /** >>
     * Dynamically add icon imports here in the format:
     *
     *  ZoomOutMap: lazy(() => import('../ZoomOutMap').then(({ SvgZoomOutMap }) => ({ default: SvgZoomOutMap }))),
     << */
};

/**
 * Do not use in a production setting. This is for development and demo purposes only.
 * Icons should be imported directly. `import { SvgWork } from '@bspk/icons/Work';`
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
    return (
        <Suspense>
            <Svg {...props} />
        </Suspense>
    );
}

SvgIcon.bspkName = 'Icon';

export { SvgIcon };
