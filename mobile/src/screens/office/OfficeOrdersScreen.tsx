import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { getSelectedOfficeId } from '../../services/storage';
import { realtime } from '../../services/realtime';
import { Badge, Button, Card, Screen, showAlert, colors, tokens, typography } from '../../ui';

type OfficeRow = {
  id: string;
  name: string;
  address: string;
  phone: string;
  contactPerson: string;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  orderTime: string;
  amount: number;
  office: OfficeRow;
  paymentReceived: boolean;
  paymentMode: string;
};

type OrdersResponse = { items: OrderRow[] };

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

export function OfficeOrdersScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOfficeId, setSelectedOfficeIdState] = useState<string | null>(null);
  const [items, setItems] = useState<OrderRow[]>([]);

  const loadSelectedOfficeId = useCallback(async () => {
    const id = await getSelectedOfficeId();
    setSelectedOfficeIdState(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<OrdersResponse>('office/orders', {
        params: { officeId: selectedOfficeId || undefined },
      });
      setItems(data.items ?? []);
    } catch (e: any) {
      setItems([]);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  }, [selectedOfficeId]);

  useFocusEffect(
    useCallback(() => {
      loadSelectedOfficeId();
    }, [loadSelectedOfficeId])
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent((evt) => {
      if (selectedOfficeId && evt.officeId !== selectedOfficeId) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        load();
      }, 150);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [load, selectedOfficeId]);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View style={{ gap: tokens.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.h3}>Orders</Text>
          <View style={{ flexDirection: 'row', gap: tokens.space.sm }}>
            <Button variant="ghost" onPress={load} disabled={loading}>
              Refresh
            </Button>
            <Button
              onPress={() => {
                if (!selectedOfficeId) {
                  showAlert('Select stall', 'Please select a stall from Stalls tab first.');
                  return;
                }
                navigation.navigate('OfficePlaceOrder', { officeId: selectedOfficeId });
              }}
            >
              New Order
            </Button>
          </View>
        </View>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('OfficeOrderDetails', { orderId: item.id })} activeOpacity={0.85}>
              <Card style={{ gap: tokens.space.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                    {displayStatus(item.status)}
                  </Text>
                  <Badge tone={item.paymentReceived ? 'success' : 'warning'}>{item.paymentReceived ? 'Paid' : 'Pending'}</Badge>
                </View>

                <Text style={typography.caption}>#{item.orderNumber}</Text>
                <Text style={{ color: colors.textMuted, fontWeight: '700' }}>{new Date(item.orderTime).toLocaleString()}</Text>
                <Text style={{ color: colors.text, fontWeight: '800' }}>
                  Payment: {item.paymentReceived ? `Received (${item.paymentMode || 'Cash'})` : 'Pending (Credit)'}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Amount</Text>
                  <Text style={{ color: colors.text, fontWeight: '900' }}>{Math.round(item.amount)}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={!loading ? <Text style={typography.faint}>No orders.</Text> : null}
        />
      </View>
    </Screen>
  );
}
