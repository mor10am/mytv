import { Text, type TextProps } from 'react-native';

import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';

/** Bold monospace text, standing in for the Topaz font. */
export function AmigaText({ style, ...rest }: TextProps) {
  const { fontSize } = useAmigaMetrics();
  return (
    <Text
      style={[
        { fontFamily: 'monospace', fontWeight: '700', fontSize, color: Amiga.black },
        style,
      ]}
      {...rest}
    />
  );
}
