import { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';

type Edge = 'top' | 'bottom' | 'left' | 'right';

export function Screen(
  props: PropsWithChildren<{ padded?: boolean; style?: ViewStyle; edges?: Edge[]; safeBackgroundColor?: string }>
) {
  const padded = props.padded ?? true;
  const edges = props.edges ?? ['top', 'bottom', 'left', 'right'];
  const safeBg = props.safeBackgroundColor ?? colors.bg;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: safeBg }]} edges={edges}>
      <View style={[styles.body, { backgroundColor: safeBg }, padded ? styles.padded : null, props.style]}>
        <Image source={require('../../assets/web/GLSSimage.png')} style={styles.bgGlass} resizeMode="contain" />
        {props.children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
  padded: { padding: tokens.space.xl },
  bgGlass: {
    position: 'absolute',
    right: -20,
    bottom: 20,
    width: 180,
    height: 360,
    opacity: 0.16,
  },
});
