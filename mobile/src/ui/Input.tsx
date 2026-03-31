import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';

export function Input(props: TextInputProps & { label?: string; error?: string | null }) {
  return (
    <View style={styles.container}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.textFaint}
        style={[styles.input, props.error ? styles.inputError : null, props.style]}
      />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.space.xs },
  label: {
    color: colors.textMuted,
    fontSize: tokens.text.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: tokens.text.md,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  error: {
    color: colors.danger,
    fontSize: tokens.text.sm,
    fontWeight: '600',
  },
});
