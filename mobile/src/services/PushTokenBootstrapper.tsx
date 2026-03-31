import { useEffect, useRef } from 'react';
import { useAppSelector } from '../redux/hooks';
import { api } from './api';
import { registerForPushNotificationsAsync } from './pushNotifications';

export function PushTokenBootstrapper() {
  const status = useAppSelector((s) => s.auth.status);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      hasRunRef.current = false;
      return;
    }

    if (hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;

    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          return;
        }

        await api.post('device/push-token', { pushToken: token });
      } catch {
      }
    })();
  }, [status]);

  return null;
}

