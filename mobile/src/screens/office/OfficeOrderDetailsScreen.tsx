import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { Badge, Button, Card, Screen, showAlert, colors, tokens, typography } from '../../ui';

type OrderItemRow = {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
  amount: number;
};

type OfficeRow = {
  id: string;
  name: string;
  address: string;
  phone: string;
  contactPerson: string;
};

type StallRow = {
  id: string;
  stallName: string;
  uniqueCode: string;
} | null;

type OrderDetails = {
  id: string;
  orderNumber: string;
  status: string;
  orderTime: string;
  paymentReceived: boolean;
  paymentMode: string;
  office: OfficeRow;
  stall: StallRow;
  items: OrderItemRow[];
  amount: number;
};

function displayStatus(status: string) {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return 'New Order';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'pickup':
      return 'Pickup';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function OfficeOrderDetailsScreen({ route }: any) {
  const orderId: string = route.params.orderId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrderDetails | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<OrderDetails>(`office/orders/${orderId}`);
      setData(data);
    } catch (e: any) {
      setData(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load order'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent((evt) => {
      if (evt.orderId !== orderId) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        load();
      }, 150);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [load, orderId]);

  useEffect(() => {
    const t = setInterval(() => setNowTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  const cancelState = useMemo(() => {
    if (!data) return { canCancel: false, remainingMs: 0 };
    const st = (data.status || '').toLowerCase();
    const cancelable = st === 'pending' || st === 'preparing';
    const created = new Date(data.orderTime).getTime();
    const remainingMs = created + 2 * 60 * 1000 - Date.now();
    return { canCancel: cancelable && remainingMs > 0, remainingMs: Math.max(0, remainingMs) };
  }, [data, nowTick]);

  const cancelOrder = async () => {
    if (!data) return;
    if (!cancelState.canCancel) return;
    if (cancelling) return;
    setCancelling(true);
    setError(null);
    try {
      await api.post(`office/orders/${orderId}/cancel`);
      await load();
      showAlert('Cancelled', 'Order cancelled.');
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Cancel failed');
      setError(msg);
      showAlert('Cancel failed', msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View style={{ gap: tokens.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.h3}>Order</Text>
          <Button variant="ghost" size="sm" onPress={load} disabled={loading}>
            Refresh
          </Button>
        </View>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        {data ? (
          <View style={{ gap: tokens.space.md }}>
            <Card style={{ gap: tokens.space.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                  {displayStatus(data.status)}
                </Text>
                <Badge tone={data.status === 'Delivered' ? 'success' : data.status === 'Cancelled' ? 'danger' : data.status === 'Ready' ? 'info' : 'warning'}>
                  {data.status}
                </Badge>
              </View>
              <Text style={typography.caption}>#{data.orderNumber}</Text>
              <Text style={typography.faint}>{new Date(data.orderTime).toLocaleString()}</Text>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                Payment: {data.paymentReceived ? `Received (${data.paymentMode || 'Cash'})` : 'Pending (Credit)'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={typography.muted}>Amount</Text>
                <Text style={typography.h3}>{Math.round(data.amount)}</Text>
              </View>

              {cancelState.canCancel ? (
                <Text style={typography.caption}>Cancel available for {Math.ceil(cancelState.remainingMs / 1000)}s</Text>
              ) : null}

              {(data.status === 'Pending' || data.status === 'Preparing') ? (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={cancelling || !cancelState.canCancel}
                  onPress={() =>
                    showAlert('Cancel order', 'Cancel this order? (Allowed only within 2 minutes)', [
                      { text: 'No', style: 'cancel' },
                      { text: 'Yes, Cancel', onPress: cancelOrder },
                    ])
                  }
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              ) : null}
            </Card>

            <Card style={{ gap: tokens.space.xs }}>
              <Text style={typography.h3}>Office</Text>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{data.office.name}</Text>
              <Text style={typography.faint}>{data.office.address}</Text>
              <Text style={typography.faint}>{data.office.phone}</Text>
            </Card>

            {data.stall ? (
              <Card style={{ gap: tokens.space.xs }}>
                <Text style={typography.h3}>Stall</Text>
                <Text style={{ color: colors.text, fontWeight: '800' }}>{data.stall.stallName}</Text>
                <Text style={typography.faint}>Code: {data.stall.uniqueCode}</Text>
              </Card>
            ) : null}

            <Text style={typography.h3}>Items</Text>
            <FlatList
              data={data.items}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <Card style={{ gap: tokens.space.xs }}>
                  <Text style={{ color: colors.text, fontWeight: '900' }}>{item.itemName}</Text>
                  <Text style={typography.faint}>
                    {item.category} • Qty {item.quantity} • Price {Math.round(item.price)}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: '900' }}>Amount: {Math.round(item.amount)}</Text>
                </Card>
              )}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
