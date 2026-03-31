import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { Badge, Button, Card, TeaShell, showAlert, colors, tokens, typography } from '../../ui';

type OfficeRow = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
};

type ItemRow = {
  orderId: string;
  menuItemId: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
};

type OrderRow = {
  id: string;
  status: string;
  orderTime: string;
  office: OfficeRow;
  deliveryBoyId: string | null;
  paymentReceived: boolean;
  paymentMode: string;
  items: ItemRow[];
};

type OrdersResponse = { items: OrderRow[] };

function amount(items: ItemRow[]) {
  return items.reduce((sum, i) => sum + i.quantity * i.price, 0);
}

const statusTabs = [
  { key: 'Pending', label: 'New', color: colors.warning },
  { key: 'Preparing', label: 'Preparing', color: colors.info },
  { key: 'Ready', label: 'Ready', color: colors.success },
  { key: 'Delivered', label: 'Delivered', color: colors.textMuted },
] as const;

export function TeaStallOrdersScreen() {
  const [status, setStatus] = useState<typeof statusTabs[number]['key']>('Pending');
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState<{ orderId: string; action: 'preparing' | 'ready' } | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState<{ orderId: string; action: 'cash' | 'credit' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<OrderRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<OrdersResponse>('stall/orders', { params: { status } });
      setItems(data.items ?? []);
    } catch (e: any) {
      setItems([]);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent((evt) => {
      if (timeout) clearTimeout(timeout);
      if (evt.type === 'created') {
        timeout = setTimeout(() => load(), 5000);
        return;
      }
      timeout = setTimeout(() => load(), 150);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [load]);

  const markPreparing = async (orderId: string) => {
    if (marking) return;
    setMarking({ orderId, action: 'preparing' });
    setError(null);
    try {
      await api.post(`stall/orders/${orderId}/preparing`);
      await load();
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Failed to mark preparing');
      setError(msg);
      showAlert('Mark preparing failed', msg);
    } finally {
      setMarking(null);
    }
  };

  const markReady = async (orderId: string) => {
    if (marking) return;
    setMarking({ orderId, action: 'ready' });
    setError(null);
    try {
      await api.post(`stall/orders/${orderId}/ready`);
      await load();
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Failed to mark ready');
      setError(msg);
      showAlert('Mark ready failed', msg);
    } finally {
      setMarking(null);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentReceived: boolean) => {
    if (updatingPayment) return;
    setUpdatingPayment({ orderId, action: paymentReceived ? 'cash' : 'credit' });
    setError(null);
    try {
      await api.post(`stall/orders/${orderId}/payment-status`, {
        paymentReceived,
        paymentMode: paymentReceived ? 'Cash' : 'Credit',
      });
      await load();
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Failed to update payment status');
      setError(msg);
      showAlert('Payment update failed', msg);
    } finally {
      setUpdatingPayment(null);
    }
  };

  const confirmPaymentUpdate = (orderId: string) => {
    showAlert('Payment', 'Payment received?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Not Received (Credit)', onPress: () => updatePaymentStatus(orderId, false) },
      { text: 'Cash Received', onPress: () => updatePaymentStatus(orderId, true) },
    ]);
  };

  return (
    <TeaShell title="Orders" subtitle="Track & update status" icon="receipt" rightAction={{ icon: 'refresh', onPress: load, disabled: loading }} scroll={false}>
      <View style={{ flex: 1, gap: tokens.space.lg }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {statusTabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setStatus(t.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 6,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: status === t.key ? t.color : colors.borderStrong,
                borderRadius: tokens.radius.lg,
                backgroundColor: status === t.key ? t.color + '25' : colors.surface,
              }}
            >
              <Text style={{ color: status === t.key ? t.color : colors.textMuted, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl }}
          renderItem={({ item }) => (
            <Card variant="elevated" style={{ gap: tokens.space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge tone={item.status === 'Pending' ? 'warning' : item.status === 'Preparing' ? 'info' : item.status === 'Ready' ? 'success' : 'neutral'}>
                  {item.status}
                </Badge>
                <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(amount(item.items))}</Text>
              </View>
              <Text style={typography.faint}>{new Date(item.orderTime).toLocaleString()}</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{item.office.name}</Text>
              <Text style={typography.muted} numberOfLines={2}>{item.office.address}</Text>
              {item.status === 'Delivered' ? (
                <Text style={[typography.bodySmall, { marginTop: 4 }]}>
                  Payment: {item.paymentReceived ? `Received (${item.paymentMode})` : 'Pending (Credit)'}
                </Text>
              ) : null}

              <View style={{ gap: 4, marginTop: tokens.space.xs }}>
                {item.items.map((i) => (
                  <Text key={`${item.id}-${i.menuItemId}`} style={typography.body}>
                    {i.itemName} • {i.quantity} x ₹{Math.round(i.price)}
                  </Text>
                ))}
              </View>

              {item.status === 'Pending' ? (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!!marking}
                  onPress={() => markPreparing(item.id)}
                >
                  {marking?.orderId === item.id && marking.action === 'preparing' ? 'Working...' : 'Mark Received'}
                </Button>
              ) : null}

              {item.status === 'Preparing' ? (
                <Button
                  variant="success"
                  size="sm"
                  disabled={!!marking}
                  onPress={() => markReady(item.id)}
                >
                  {marking?.orderId === item.id && marking.action === 'ready' ? 'Working...' : 'Mark Ready'}
                </Button>
              ) : null}

              {item.status === 'Delivered' ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updatingPayment !== null}
                  onPress={() => confirmPaymentUpdate(item.id)}
                >
                  {updatingPayment?.orderId === item.id ? 'Working...' : 'Edit Payment Status'}
                </Button>
              ) : null}
            </Card>
          )}
          ListEmptyComponent={!loading ? <Text style={typography.faint}>No orders.</Text> : null}
        />
      </View>
    </TeaShell>
  );
}
