import { View, type ViewProps } from 'react-native';

import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';

type Props = ViewProps & {
  /** Pressed-in look: dark top-left, light bottom-right. */
  recessed?: boolean;
};

/** The classic 3D box: white top-left edge, black bottom-right edge. */
export function Bevel({ recessed, style, ...rest }: Props) {
  const { line } = useAmigaMetrics();
  const light = recessed ? Amiga.black : Amiga.white;
  const dark = recessed ? Amiga.white : Amiga.black;
  return (
    <View
      style={[
        {
          borderWidth: line,
          borderTopColor: light,
          borderLeftColor: light,
          borderBottomColor: dark,
          borderRightColor: dark,
        },
        style,
      ]}
      {...rest}
    />
  );
}
