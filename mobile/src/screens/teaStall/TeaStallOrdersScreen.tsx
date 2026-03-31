import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { Badge, Screen, showAlert } from '../../ui';

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
  { key: 'Pending', label: 'New' },
  { key: 'Preparing', label: 'Preparing' },
  { key: 'Ready', label: 'Ready' },
  { key: 'Delivered', label: 'Delivered' },
] as const;

const C = {
  page: '#FFFFFF',
  header: '#5b2e08',
  title: '#d6a064',
  body: '#f2f0ed',
  textDark: '#4f2d0f',
  muted: '#7f6d5d',
  card: '#FFFFFF',
  tab: '#5f3008',
  tabOn: '#c99359',
  green: '#34b266',
  line: '#e7ddd4',
  action: '#6b3508',
};

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
    showAlert({
      title: 'Payment',
      message: 'Did you recieved the payment',
      variant: 'payment',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Not recieved (Cash)', onPress: () => updatePaymentStatus(orderId, false) },
        { text: 'Cash recieved', onPress: () => updatePaymentStatus(orderId, true) },
      ],
    });
  };

  const statusColor = (value: string) => {
    if (value === 'Pending') return '#8c4d0d';
    if (value === 'Preparing') return '#74522e';
    if (value === 'Ready') return '#2f8a5d';
    return '#6a675f';
  };

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ORDERS</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={loading ? undefined : load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>{loading ? 'LOADING' : 'REFRESH'}</Text>
        </TouchableOpacity>
        <Image source={require('../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>

      <View style={styles.body}>
        <Image source={require('../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />

        <View style={styles.tabGrid}>
          {statusTabs.map((t) => {
            const on = status === t.key;
            return (
              <TouchableOpacity key={t.key} onPress={() => setStatus(t.key)} style={[styles.tabBtn, on && styles.tabBtnOn]}>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? (
          <View style={{ marginBottom: 8 }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}
        {loading ? <ActivityIndicator color={C.action} style={{ marginVertical: 10 }} /> : null}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: 14, paddingBottom: 28 }}
          renderItem={({ item }) => {
            const summary = item.items.map((i) => `${i.itemName} ${i.quantity} x ₹${Math.round(i.price)}`).join('\n');
            return (
              <View style={styles.orderCard}>
                <View style={styles.cardTop}>
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusBadgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
                  </View>
                  <Text style={styles.amount}>₹{Math.round(amount(item.items))}</Text>
                </View>
                <Text style={styles.timeText}>{new Date(item.orderTime).toLocaleString()}</Text>
                <Text style={styles.officeText}>{item.office.name}</Text>
                <Text style={styles.addrText} numberOfLines={1}>
                  {item.office.address}
                </Text>

                <View style={styles.itemsBox}>
                  <Text style={styles.itemsText}>{summary}</Text>
                </View>

                {item.status === 'Pending' ? (
                  <TouchableOpacity disabled={!!marking} onPress={() => markPreparing(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>
                      {marking?.orderId === item.id && marking.action === 'preparing' ? 'Working...' : 'Mark as received'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {item.status === 'Preparing' ? (
                  <TouchableOpacity disabled={!!marking} onPress={() => markReady(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>
                      {marking?.orderId === item.id && marking.action === 'ready' ? 'Working...' : 'Mark as ready'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {item.status === 'Delivered' ? (
                  <TouchableOpacity disabled={updatingPayment !== null} onPress={() => confirmPaymentUpdate(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>
                      {updatingPayment?.orderId === item.id ? 'Working...' : 'Edit payment status'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No orders.</Text> : null}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  header: {
    backgroundColor: C.header,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTitle: { fontSize: 38, fontWeight: '900', color: C.title, marginBottom: 14 },
  refreshBtn: { borderWidth: 1.5, borderColor: C.title, borderRadius: 18, alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 6 },
  refreshText: { color: C.title, fontSize: 16, fontWeight: '800' },
  kettle: { position: 'absolute', right: -20, bottom: -10, width: 205, height: 158, opacity: 0.92 },
  body: {
    flex: 1,
    backgroundColor: C.body,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  glass: { position: 'absolute', right: -24, top: 110, width: 188, height: 470, opacity: 0.35 },
  tabGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 12 },
  tabBtn: {
    width: '48%',
    backgroundColor: C.tab,
    borderRadius: 16,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#5f3008',
  },
  tabBtnOn: { backgroundColor: C.tabOn, borderColor: '#c99359' },
  tabText: { color: '#dbc8b5', fontWeight: '800', fontSize: 15 },
  tabTextOn: { color: C.textDark },
  orderCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { backgroundColor: '#f0dfcb', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  statusBadgeText: { fontWeight: '900', fontSize: 14 },
  amount: { color: C.green, fontSize: 32, fontWeight: '900' },
  timeText: { color: C.muted, fontWeight: '600', marginBottom: 8, fontSize: 13 },
  officeText: { color: C.textDark, fontSize: 35, fontWeight: '900', marginBottom: 2 },
  addrText: { color: '#9d8a7a', fontSize: 14, marginBottom: 10, fontWeight: '600' },
  itemsBox: { backgroundColor: '#efe6dc', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12 },
  itemsText: { textAlign: 'center', color: C.textDark, fontWeight: '800', lineHeight: 22, fontSize: 14 },
  actionBtn: { backgroundColor: C.action, borderRadius: 22, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: C.title, fontWeight: '900', fontSize: 16 },
  emptyText: { color: '#8b7866', textAlign: 'center', paddingVertical: 22, fontWeight: '600' },
});
