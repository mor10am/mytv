import { PixelRatio } from 'react-native';

import { useScreenDimensions } from '@/hooks/use-screen-dimensions';

/** Sizes for the Workbench look, scaled to the screen. */
export function useAmigaMetrics() {
  const { scale, spacing } = useScreenDimensions();
  return {
    scale,
    spacing,
    /** Width of one "pixel" line in bevels and outlines. */
    line: Math.max(1, PixelRatio.roundToNearestPixel(1.5 * scale)),
    /** Size of window gadgets and the height of title bars. */
    gadget: Math.round(22 * scale),
    fontSize: 14 * scale,
  };
}
