import { PixelRatio, StyleSheet, View } from 'react-native';

import { useScreenDimensions } from '@/hooks/use-screen-dimensions';

/** A PAL Workbench screen is 256 lines tall (non-interlaced). */
const SCANLINES = 256;
/** How dark the gap between two scanlines is. */
const SCANLINE_DARKNESS = 0.18;
/** Corner radius of the tube, as a fraction of the shorter screen side. */
const CORNER_RADIUS = 0.045;

/**
 * Makes the screen look like a Commodore 1084S: dark gaps between
 * scanlines, a tube that darkens toward its rounded corners, and a faint
 * reflection on the glass. Drawn on top of everything and ignores touches,
 * so it changes nothing about layout or focus.
 */
export function CrtOverlay() {
  const { width, height } = useScreenDimensions();

  // Snap the line pitch to whole device pixels so every line looks the same.
  const pitch = Math.max(
    2 / PixelRatio.get(),
    PixelRatio.roundToNearestPixel(height / SCANLINES),
  );
  const radius = Math.round(Math.min(width, height) * CORNER_RADIUS);
  // Black bezel around the tube: a border that sits off-screen, so only its
  // rounded inner edge shows in the corners.
  const bezel = radius * 2;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            experimental_backgroundImage: `linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0, 0, 0, ${SCANLINE_DARKNESS}) 50%, rgba(0, 0, 0, ${SCANLINE_DARKNESS}) 100%)`,
            experimental_backgroundSize: `100% ${pitch}px`,
            experimental_backgroundRepeat: 'repeat',
          },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            experimental_backgroundImage: [
              // Glass reflection, upper left.
              'radial-gradient(ellipse at 28% 18%, rgba(255, 255, 255, 0.07) 0%, transparent 45%)',
              // Tube gets darker toward the edges.
              'radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.32) 100%)',
            ].join(', '),
          },
        ]}
      />
      <View
        style={{
          position: 'absolute',
          left: -bezel,
          top: -bezel,
          width: width + bezel * 2,
          height: height + bezel * 2,
          borderWidth: bezel,
          borderRadius: radius + bezel,
          borderColor: '#000',
          boxShadow: `inset 0 0 ${radius}px ${radius / 4}px rgba(0, 0, 0, 0.45)`,
        }}
      />
    </View>
  );
}
