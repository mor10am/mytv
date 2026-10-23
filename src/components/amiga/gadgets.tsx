import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { Bevel } from '@/components/amiga/bevel';
import { Amiga } from '@/constants/amiga';
import { useAmigaMetrics } from '@/hooks/use-amiga-metrics';

/** Decorative window gadgets. They look like buttons but are not focusable. */

function Gadget({ children }: { children?: React.ReactNode }) {
  const { gadget } = useAmigaMetrics();
  return (
    <Bevel style={[styles.gadget, { width: gadget, height: gadget }]}>{children}</Bevel>
  );
}

function Box({
  left,
  top,
  size,
  fill,
}: {
  left: DimensionValue;
  top: DimensionValue;
  size: DimensionValue;
  fill: string;
}) {
  const { line } = useAmigaMetrics();
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderWidth: line,
        borderColor: Amiga.black,
        backgroundColor: fill,
      }}
    />
  );
}

export function CloseGadget() {
  return (
    <Gadget>
      <Box left="35%" top="35%" size="30%" fill={Amiga.white} />
    </Gadget>
  );
}

export function ZoomGadget() {
  return (
    <Gadget>
      <Box left="18%" top="18%" size="64%" fill="transparent" />
      <Box left="18%" top="18%" size="34%" fill={Amiga.white} />
    </Gadget>
  );
}

export function DepthGadget() {
  return (
    <Gadget>
      <Box left="14%" top="14%" size="46%" fill={Amiga.black} />
      <Box left="40%" top="40%" size="46%" fill={Amiga.white} />
    </Gadget>
  );
}

export function SizeGadget() {
  return (
    <Gadget>
      <Box left="18%" top="18%" size="64%" fill="transparent" />
      <Box left="50%" top="50%" size="32%" fill={Amiga.white} />
    </Gadget>
  );
}

export function ArrowGadget({ direction }: { direction: 'up' | 'down' | 'back' | 'forward' }) {
  const { gadget } = useAmigaMetrics();
  return (
    <Gadget>
      <Ionicons name={`caret-${direction}`} size={gadget * 0.6} color={Amiga.black} />
    </Gadget>
  );
}

const styles = StyleSheet.create({
  gadget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
