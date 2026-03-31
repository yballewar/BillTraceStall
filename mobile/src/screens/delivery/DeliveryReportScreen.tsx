import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';

type OfficeRow = {
  id: string;
  name: string;
  address: string;
  phone: string;
  contactPerson: string;
};

type ItemRow = {
  orderId: string;
  menuItemId: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
  amount: number;
};

type OrderRow = {
  id: string;
  status: string;
  orderTime: string;
  office: OfficeRow;
  items: ItemRow[];
  amount: number;
};

type SummaryItemRow = {
  menuItemId: string;
  itemName: string;
  category: string;
  quantity: number;
  amount: number;
};

type SummaryOfficeRow = {
  officeId: string;
  officeName: string;
  phone: string;
  orders: number;
  amount: number;
};

type ReportResponse = {
  date: string;
  totalOrders: number;
  totalAmount: number;
  orders: OrderRow[];
  summary: {
    byItem: SummaryItemRow[];
    byOffice: SummaryOfficeRow[];
  };
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isValidDateKey(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

export function DeliveryReportScreen() {
  const [date, setDate] = useState(todayKey());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportResponse | null>(null);

  const canLoad = useMemo(() => isValidDateKey(date), [date]);

  const load = useCallback(async () => {
    if (!canLoad) {
      setError('Enter date as YYYY-MM-DD');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ReportResponse>('delivery/delivered-report', {
        params: { date: date.trim() },
      });
      setData(data);
    } catch (e: any) {
      setData(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [canLoad, date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent(() => {
      if (date.trim() !== todayKey()) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        load();
      }, 250);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [date, load]);

  const totalOrders = data?.totalOrders ?? 0;
  const totalAmount = data?.totalAmount ?? 0;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Delivered Report</Text>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8 }}
        />
        <TouchableOpacity
          onPress={load}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#111827', borderRadius: 8, backgroundColor: '#111827' }}
        >
          <Text style={{ color: '#fff' }}>Load</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ color: 'crimson' }}>{error}</Text> : null}

      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12 }}>
        <Text style={{ fontWeight: '700' }}>Summary</Text>
        <Text style={{ marginTop: 6, color: '#111827' }}>Orders: {totalOrders}</Text>
        <Text style={{ color: '#111827' }}>Amount: {Math.round(totalAmount)}</Text>
      </View>

      <Text style={{ fontWeight: '700' }}>Delivered Orders</Text>
      <FlatList
        data={data?.orders ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 6 }}>
            <Text style={{ fontWeight: '700' }}>{item.office.name}</Text>
            <Text style={{ color: '#111827' }}>Phone: {item.office.phone}</Text>
            <Text style={{ color: '#6b7280' }}>{new Date(item.orderTime).toLocaleString()}</Text>
            <Text style={{ marginTop: 4, fontWeight: '700' }}>Amount: {Math.round(item.amount)}</Text>
            <View style={{ marginTop: 6 }}>
              {item.items.map((i) => (
                <Text key={`${item.id}-${i.menuItemId}`} style={{ color: '#111827' }}>
                  {i.itemName} • {i.quantity} x {Math.round(i.price)}
                </Text>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>No delivered orders.</Text> : null}
      />

      <Text style={{ fontWeight: '700' }}>Items Summary</Text>
      <FlatList
        data={data?.summary?.byItem ?? []}
        keyExtractor={(i) => i.menuItemId}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12 }}>
            <Text style={{ fontWeight: '700' }}>{item.itemName}</Text>
            <Text style={{ color: '#6b7280' }}>{item.category}</Text>
            <Text style={{ marginTop: 6, color: '#111827' }}>Qty: {item.quantity}</Text>
            <Text style={{ color: '#111827' }}>Amount: {Math.round(item.amount)}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>No items.</Text> : null}
      />
    </View>
  );
}

