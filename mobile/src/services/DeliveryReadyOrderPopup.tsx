import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '../redux/hooks';
import { api } from './api';
import { realtime } from './realtime';
import { getCurrentRouteName, navigate } from '../navigation/navigationRef';
import { colors, tokens, typography } from '../ui';

type PopupState = {
  orderId: string;
};

export function DeliveryReadyOrderPopup() {
  const role = useAppSelector((s) => s.auth.role);
  const authStatus = useAppSelector((s) => s.auth.status);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [accepting, setAccepting] = useState(false);
  const activeRef = useRef(true);
  const lastShownRef = useRef<string | null>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled = useMemo(() => authStatus === 'authenticated' && role === 'DeliveryBoy', [authStatus, role]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      activeRef.current = state === 'active';
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPopup(null);
      return;
    }

    const unsub = realtime.onOrderEvent((evt) => {
      if (evt.type !== 'status_changed') return;
      if (String(evt.status || '').toLowerCase() !== 'ready') return;
      if (evt.deliveryBoyId) return;
      if (!activeRef.current) return;

      const current = getCurrentRouteName();
      if (current === 'Order') return;

      if (lastShownRef.current === evt.orderId) return;
      lastShownRef.current = evt.orderId;
      setPopup({ orderId: evt.orderId });
    });

    return () => {
      unsub();
    };
  }, [enabled]);

  useEffect(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    if (!popup) {
      return;
    }
    autoHideTimerRef.current = setTimeout(() => {
      setPopup(null);
    }, 5000);
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    };
  }, [popup]);

  const accept = async () => {
    if (!popup) return;
    if (accepting) return;
    setAccepting(true);
    try {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
      await api.post('delivery/accept', { orderId: popup.orderId });
      setPopup(null);
      navigate('Order', { initialTab: 'My' });
    } catch {
      setAccepting(false);
    } finally {
      setAccepting(false);
    }
  };

  const cancel = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    setPopup(null);
  };

  return (
    <Modal transparent visible={popup !== null} animationType="fade" onRequestClose={cancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, justifyContent: 'center' }}>
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: tokens.radius.xl,
            padding: tokens.space.xl,
            gap: tokens.space.lg,
            borderWidth: 1,
            borderColor: colors.border,
            borderTopWidth: 4,
            borderTopColor: colors.info,
          }}
        >
          <Text style={[typography.h3, { color: colors.text }]}>Order Ready</Text>
          <Text style={[typography.faint, { color: colors.textMuted }]}>A new order is ready. Accept now?</Text>

          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
            <TouchableOpacity
              disabled={accepting}
              onPress={cancel}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                borderRadius: tokens.radius.lg,
                backgroundColor: colors.bgSecondary,
              }}
            >
              <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={accepting}
              onPress={accept}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: tokens.radius.lg,
                backgroundColor: colors.info,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {accepting ? <ActivityIndicator color="#fff" size="small" /> : null}
              <Text style={{ color: colors.white, fontWeight: '700' }}>{accepting ? 'Accepting...' : 'Accept'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
