import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';

const SPRITE = require('@/assets/images/boing-ball.png');
/** Spin frames in the sprite sheet (one checker period). */
const FRAMES = 16;
const SPIN_FPS = 20;
/** Seconds per hop. */
const HOP_PERIOD = 1.1;

/**
 * The Amiga Boing ball: hops along the bottom of the screen, turning
 * around (and reversing its spin) when it hits either side.
 */
export function BoingBall() {
  const { width } = useScreenDimensions();
  const { scale, spacing } = useAmigaMetrics();
  const size = Math.round(56 * scale);

  const config = useSharedValue({ maxX: 0, speed: 0, hop: 0 });
  const x = useSharedValue(0);
  const dir = useSharedValue(1);
  const time = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    config.value = { maxX: Math.max(0, width - size), speed: 180 * scale, hop: 110 * scale };
  }, [config, width, size, scale]);

  useFrameCallback(({ timeSincePreviousFrame }) => {
    // Clamp so a dropped frame doesn't make the ball jump.
    const dt = Math.min(timeSincePreviousFrame ?? 0, 50) / 1000;
    const { maxX, speed } = config.value;
    let next = x.value + dir.value * speed * dt;
    if (next >= maxX) {
      next = maxX;
      dir.value = -1;
    } else if (next <= 0) {
      next = 0;
      dir.value = 1;
    }
    x.value = next;
    time.value += dt;
    spin.value = (spin.value + dir.value * SPIN_FPS * dt + FRAMES) % FRAMES;
  });

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      {
        translateY:
          -config.value.hop * Math.abs(Math.sin((Math.PI * time.value) / HOP_PERIOD)),
      },
    ],
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -Math.floor(spin.value) * size }],
  }));

  return (
    <View pointerEvents="none" style={[styles.track, { bottom: spacing.three }]}>
      <Animated.View style={[{ width: size, height: size }, ballStyle]}>
        <View
          style={[
            styles.shadow,
            { width: size, height: size, borderRadius: size / 2, left: size * 0.3 },
          ]}
        />
        <View style={[styles.frame, { width: size, height: size }]}>
          <Animated.View style={sheetStyle}>
            <Image source={SPRITE} style={{ width: size * FRAMES, height: size }} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  shadow: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  frame: {
    overflow: 'hidden',
  },
});
