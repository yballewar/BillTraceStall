import { PropsWithChildren } from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';

export function Button(
  props: PropsWithChildren<{
    onPress?: () => void;
    disabled?: boolean;
    variant?: Variant;
    style?: ViewStyle;
    size?: 'sm' | 'md' | 'lg';
  }>
) {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';

  return (
    <TouchableOpacity
      onPress={props.disabled ? undefined : props.onPress}
      activeOpacity={0.85}
      style={[styles.base, variantStyles[variant], sizeStylesContainer[size], props.disabled ? styles.disabled : null, props.style]}
    >
      <Text style={[styles.text, variantText[variant], sizeStyles[size], props.disabled ? styles.textDisabled : null]}>
        {props.children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
  },
  text: { fontWeight: '700' },
  disabled: { opacity: 0.5 },
  textDisabled: { color: colors.textMuted },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
  success: { backgroundColor: colors.success, borderColor: colors.success },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.borderStrong,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
};

const variantText: Record<Variant, { color: string }> = {
  primary: { color: colors.white },
  secondary: { color: colors.text },
  success: { color: colors.white },
  danger: { color: colors.white },
  ghost: { color: colors.text },
  outline: { color: colors.primary },
};

const sizeStylesContainer = {
  sm: { paddingVertical: 8, paddingHorizontal: 14 } as ViewStyle,
  md: { paddingVertical: 14, paddingHorizontal: 20 } as ViewStyle,
  lg: { paddingVertical: 16, paddingHorizontal: 24 } as ViewStyle,
};

const sizeStyles = {
  sm: { fontSize: tokens.text.sm },
  md: { fontSize: tokens.text.md },
  lg: { fontSize: tokens.text.lg },
};
