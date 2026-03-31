import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../../services/api';

type OrderItemRow = {
  menuItemId: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
  amount: number;
};

type OrderRow = {
  id: string;
  orderTime: string;
  office: { id: string; name: string; phone: string; address: string };
  paymentReceived: boolean;
  paymentMode: string;
  amount: number;
  items: OrderItemRow[];
};

type Response = {
  date: string;
  deliveryBoy: { id: string | null; name: string; phone: string };
  totalOrders: number;
  totalAmount: number;
  orders: OrderRow[];
};

export function TeaStallReportDeliveryOrdersScreen({ route, navigation }: any) {
  const date = String(route?.params?.date ?? '');
  const deliveryBoyId = route?.params?.deliveryBoyId ?? null;
  const name = String(route?.params?.name ?? 'Delivery');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Response | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Response>('stall/report/daily/delivery-orders', {
        params: { date, deliveryBoyId: deliveryBoyId || undefined },
      });
      setData(data);
    } catch (e: any) {
      setData(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [date, deliveryBoyId]);

  useEffect(() => {
    load();
  }, [load]);

  const header = useMemo(() => {
    return (
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>{name}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ fontWeight: '700' }}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#6b7280' }}>{date}</Text>
        {data ? (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 4 }}>
            <Text style={{ fontWeight: '700' }}>Summary</Text>
            <Text>Orders: {data.totalOrders}</Text>
            <Text style={{ fontWeight: '700' }}>Amount: {Math.round(data.totalAmount)}</Text>
          </View>
        ) : null}
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={{ color: 'crimson' }}>{error}</Text> : null}
      </View>
    );
  }, [data, date, error, loading, name, navigation]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={data?.orders ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>{item.office.name}</Text>
              <Text style={{ fontWeight: '700' }}>{Math.round(item.amount)}</Text>
            </View>
            <Text style={{ color: '#6b7280' }}>{new Date(item.orderTime).toLocaleString()}</Text>
            <Text style={{ color: '#6b7280' }}>{item.office.phone}</Text>
            <Text style={{ color: '#111827' }}>Payment: {item.paymentReceived ? `Received (${item.paymentMode})` : 'Pending (Credit)'}</Text>
            <View style={{ marginTop: 6, gap: 2 }}>
              {item.items.map((i) => (
                <Text key={`${item.id}-${i.menuItemId}`} style={{ color: '#111827' }}>
                  {i.itemName} • {i.quantity}
                </Text>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={!loading && !error ? <Text style={{ paddingTop: 16 }}>No orders.</Text> : null}
      />
    </View>
  );
}

