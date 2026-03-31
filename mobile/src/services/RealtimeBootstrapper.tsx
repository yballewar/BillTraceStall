import { useEffect } from 'react';
import { useAppSelector } from '../redux/hooks';
import { realtime } from './realtime';

export function RealtimeBootstrapper() {
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (status === 'authenticated') {
      realtime.start();
      return () => {
        realtime.stop();
      };
    }
    realtime.stop();
    return;
  }, [status]);

  return null;
}

