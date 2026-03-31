import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getAccessToken } from './storage';

export type OrderRealtimeEvent = {
  type: 'created' | 'status_changed' | 'assigned' | string;
  orderId: string;
  status: string;
  stallId: string;
  officeId: string;
  deliveryBoyId: string | null;
};

type Listener = (evt: OrderRealtimeEvent) => void;

function resolveHubUrl() {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://billtracestall.billtraceinfotech.com/api/v1';
  let origin = apiBaseUrl;
  try {
    const u = new URL(apiBaseUrl);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    origin = apiBaseUrl.replace(/\/+$/, '').replace(/\/api\/v\d+\/?$/, '');
  }
  return origin.replace(/\/+$/, '') + '/hubs/orders';
}

class RealtimeClient {
  private connection: HubConnection | null = null;
  private listeners = new Set<Listener>();
  private starting: Promise<void> | null = null;

  onOrderEvent(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start() {
    if (this.connection && this.connection.state !== 'Disconnected') {
      return;
    }
    if (this.starting) {
      return this.starting;
    }

    const token = (await getAccessToken()) ?? '';
    if (!token) {
      return;
    }

    const url = resolveHubUrl();
    const conn = new HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: async () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
      .build();

    conn.on('orderEvent', (evt: OrderRealtimeEvent) => {
      for (const l of this.listeners) {
        l(evt);
      }
    });

    this.connection = conn;
    this.starting = conn
      .start()
      .catch(() => {})
      .finally(() => {
        this.starting = null;
      });

    return this.starting;
  }

  async stop() {
    this.starting = null;
    const conn = this.connection;
    this.connection = null;
    if (!conn) return;
    try {
      await conn.stop();
    } catch {
    }
  }
}

export const realtime = new RealtimeClient();
