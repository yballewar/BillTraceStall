import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';

type Totals = {
  totalOrders: number;
  totalQty: number;
  totalAmount: number;
  cashSale: number;
  creditSale: number;
};

type OfficeRow = {
  officeId: string;
  officeName: string;
  phone: string;
  orders: number;
  qty: number;
  amount: number;
  cashAmount: number;
  creditAmount: number;
};

type ItemRow = {
  menuItemId: string;
  itemName: string;
  category: string;
  qty: number;
  amount: number;
};

type DeliveryRow = {
  deliveryBoyId: string | null;
  name: string;
  phone: string;
  orders: number;
  saleAmount: number;
  cashCollected: number;
  creditAmount: number;
};

type ReportResponse = {
  date: string;
  totals: Totals;
  byOffice: OfficeRow[];
  byItem: ItemRow[];
  byDeliveryBoy: DeliveryRow[];
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

export function TeaStallReportScreen() {
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
      const { data } = await api.get<ReportResponse>('stall/report/daily', { params: { date: date.trim() } });
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

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Daily Report</Text>

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

      {data ? (
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 4 }}>
          <Text style={{ fontWeight: '700' }}>Totals</Text>
          <Text>Orders: {data.totals.totalOrders}</Text>
          <Text>Qty: {data.totals.totalQty}</Text>
          <Text style={{ fontWeight: '700' }}>Sale: {Math.round(data.totals.totalAmount)}</Text>
          <Text>Cash: {Math.round(data.totals.cashSale)}</Text>
          <Text>Credit: {Math.round(data.totals.creditSale)}</Text>
        </View>
      ) : null}

      <Text style={{ fontWeight: '700' }}>Office Wise Sale</Text>
      <FlatList
        data={data?.byOffice ?? []}
        keyExtractor={(i) => i.officeId}
        contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 4 }}>
            <Text style={{ fontWeight: '700' }}>{item.officeName}</Text>
            <Text style={{ color: '#6b7280' }}>{item.phone}</Text>
            <Text>Orders: {item.orders} • Qty: {item.qty}</Text>
            <Text style={{ fontWeight: '700' }}>Amount: {Math.round(item.amount)}</Text>
            <Text>Cash: {Math.round(item.cashAmount)} • Credit: {Math.round(item.creditAmount)}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>No data.</Text> : null}
      />

      <Text style={{ fontWeight: '700' }}>Item Wise Sale</Text>
      <FlatList
        data={data?.byItem ?? []}
        keyExtractor={(i) => i.menuItemId}
        contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 4 }}>
            <Text style={{ fontWeight: '700' }}>{item.itemName}</Text>
            <Text style={{ color: '#6b7280' }}>{item.category}</Text>
            <Text>Qty: {item.qty}</Text>
            <Text style={{ fontWeight: '700' }}>Amount: {Math.round(item.amount)}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>No data.</Text> : null}
      />

      <Text style={{ fontWeight: '700' }}>Delivery Boy Sale & Collection</Text>
      <FlatList
        data={data?.byDeliveryBoy ?? []}
        keyExtractor={(i) => String(i.deliveryBoyId ?? 'unassigned')}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 4 }}>
            <Text style={{ fontWeight: '700' }}>{item.name}</Text>
            {item.phone ? <Text style={{ color: '#6b7280' }}>{item.phone}</Text> : null}
            <Text>Orders: {item.orders}</Text>
            <Text style={{ fontWeight: '700' }}>Sale: {Math.round(item.saleAmount)}</Text>
            <Text>Collected: {Math.round(item.cashCollected)} • Credit: {Math.round(item.creditAmount)}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>No data.</Text> : null}
      />
    </View>
  );
}

