import { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';
import { typography } from './typography';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'default' | 'destructive';
};

export type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

type InternalState = AlertOptions | null;

let currentAlert: InternalState = null;
const listeners: Array<(a: InternalState) => void> = [];

function notify() {
  listeners.forEach((l) => l(currentAlert));
}

export function showAlert(titleOrOpts: string | AlertOptions, message?: string, buttons?: AlertButton[]) {
  const opts: AlertOptions =
    typeof titleOrOpts === 'string'
      ? { title: titleOrOpts, message: message ?? '', buttons }
      : titleOrOpts;

  if (!opts.buttons || opts.buttons.length === 0) {
    opts.buttons = [{ text: 'OK', style: 'default' }];
  }

  currentAlert = opts;
  notify();
}

export function SweetAlertRoot() {
  const [alert, setAlert] = useState<InternalState>(null);

  useEffect(() => {
    listeners.push(setAlert);
    return () => {
      const i = listeners.indexOf(setAlert);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  const close = (onPress?: () => void) => {
    currentAlert = null;
    notify();
    onPress?.();
  };

  const handleButton = (btn: AlertButton) => {
    close();
    btn.onPress?.();
  };

  if (!alert) return null;

  const btns = alert.buttons ?? [{ text: 'OK', style: 'default' }];

  return (
    <Modal transparent visible={true} animationType="fade" onRequestClose={() => handleButton(btns[0])}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => (btns.some((b) => b.style === 'cancel') ? handleButton(btns.find((b) => b.style === 'cancel')!) : undefined)}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>!</Text>
            </View>
            <Text style={styles.title}>{alert.title}</Text>
            {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}
            <View style={[styles.buttons, btns.length >= 3 && styles.buttonsColumn]}>
              {btns.map((btn, i) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleButton(btn)}
                    style={[
                      styles.btn,
                      isDestructive && styles.btnDanger,
                      isCancel && styles.btnGhost,
                      btns.length > 1 && styles.btnMulti,
                      btns.length >= 3 && styles.btnFullWidth,
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isDestructive && styles.btnTextDanger,
                        isCancel && styles.btnTextGhost,
                      ]}
                      numberOfLines={1}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.space.xl,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.xl,
    padding: tokens.space.xxl,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...(Platform.OS === 'android'
      ? { elevation: 8 }
      : {
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 24,
          shadowColor: '#000',
        }),
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.space.lg,
  },
  icon: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: tokens.space.sm,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: tokens.space.xl,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: tokens.space.sm,
    width: '100%',
    justifyContent: 'center',
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMulti: {
    flex: 1,
  },
  btnFullWidth: {
    width: '100%',
    flex: undefined,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  btnText: {
    fontSize: tokens.text.md,
    fontWeight: '700',
    color: colors.white,
  },
  btnTextDanger: {
    color: colors.white,
  },
  btnTextGhost: {
    color: colors.text,
  },
});
