import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Badge, Screen } from '../../ui';

type StallProfile = {
  id: string;
  stallName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  uniqueCode: string;
  isApproved: boolean;
};

type DashboardResponse = {
  month: number;
  year: number;
  stall: { id: string; stallName: string; uniqueCode: string; isApproved: boolean };
  counts: {
    offices: number;
    menuItems: number;
    deliveryBoys: number;
    orders: number;
    delivered: number;
    pending: number;
    preparing?: number;
    cancelled: number;
  };
  totalAmount: number;
};

type OrderItemRow = {
  orderId: string;
  menuItemId: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
};

type StallOrderRow = {
  id: string;
  status: string;
  orderTime: string;
  office: { id: string; name: string; contactPerson: string; phone: string; address: string };
  deliveryBoyId: string | null;
  items: OrderItemRow[];
};

type StallOrdersResponse = { items: StallOrderRow[] };

function shiftMonth(year: number, month: number, delta: number) {
  const idx = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(idx / 12);
  const nextMonth = (idx % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

const C = {
  page: '#FFFFFF',
  header: '#5b2e08',
  title: '#d6a064',
  white: '#FFFFFF',
  body: '#f6f3ef',
  textDark: '#4e2d0f',
  muted: '#7b5e45',
  chip: '#c99359',
  stat: '#5f3008',
  orderCard: '#5f3008',
  latestWrap: '#c79052',
  success: '#34b266',
  borderSoft: 'rgba(96,53,14,0.14)',
};

export function TeaStallDashboardScreen() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [needCreate, setNeedCreate] = useState(false);
  const [profile, setProfile] = useState<StallProfile | null>(null);
  const [pendingOrders, setPendingOrders] = useState<StallOrderRow[]>([]);

  const [stallName, setStallName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const monthLabel = `${year}-${String(month).padStart(2, '0')}`;
  const design = useMemo(
    () => ({
      card: '#552D0A',
      hero: '#3E2723',
      brownLight: '#CC9557',
      textMuted: 'rgba(255,255,255,0.8)',
    }),
    []
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await api.get<StallProfile>('stall/profile');
      setProfile(p.data);
      setNeedCreate(false);

      const res = await api.get<DashboardResponse>('stall/dashboard', { params: { month, year } });
      setData(res.data);

      try {
        const orders = await api.get<StallOrdersResponse>('stall/orders', { params: { status: 'Pending' } });
        setPendingOrders((orders.data.items ?? []).slice(0, 10));
      } catch {
        setPendingOrders([]);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setNeedCreate(true);
        setProfile(null);
        setData(null);
        setPendingOrders([]);
        setError(null);
        return;
      }
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Failed to load');
      setError(msg);
      setProfile(null);
      setData(null);
      setPendingOrders([]);
      setNeedCreate(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month, year]);

  const createStall = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('stall/create', { stallName, address, city, state, pincode });
      setStallName('');
      setAddress('');
      setCity('');
      setState('');
      setPincode('');
      await load();
    } catch (e: any) {
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Create failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={loading ? undefined : load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>{loading ? 'LOADING' : 'REFRESH'}</Text>
        </TouchableOpacity>
        <Image source={require('../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Image source={require('../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />

        <View style={styles.dateWrap}>
          <Text style={styles.sectionLabel}>DATE</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              onPress={() => {
                const next = shiftMonth(year, month, -1);
                setYear(next.year);
                setMonth(next.month);
              }}
            >
              <Text style={styles.monthArrow}>‹ Prev</Text>
            </TouchableOpacity>
            <View style={styles.monthChip}>
              <Text style={styles.monthChipText}>{monthLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const next = shiftMonth(year, month, 1);
                setYear(next.year);
                setMonth(next.month);
              }}
            >
              <Text style={styles.monthArrow}>Next ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="cafe-outline" size={20} color={C.chip} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stallName}>{profile?.stallName ?? 'Billtrace'}</Text>
            <Text style={styles.stallCode}>{profile?.uniqueCode ? `Code: ${profile.uniqueCode}` : 'Code: --'}</Text>
          </View>
          {profile ? <Badge tone={profile.isApproved ? 'success' : 'warning'}>{profile.isApproved ? 'Approved' : 'Pending'}</Badge> : null}
        </View>

        {error ? (
          <View style={{ marginBottom: 8 }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        {loading ? <ActivityIndicator color={C.stat} style={{ marginVertical: 8 }} /> : null}

        {needCreate ? (
          <View style={styles.createWrap}>
            <Text style={styles.createTitle}>Create Tea Stall Profile</Text>
            <TextInput value={stallName} onChangeText={setStallName} placeholder="Stall Name" placeholderTextColor="#9f8f81" style={styles.createInput} />
            <TextInput value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor="#9f8f81" style={styles.createInput} />
            <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#9f8f81" style={styles.createInput} />
            <TextInput value={state} onChangeText={setState} placeholder="State" placeholderTextColor="#9f8f81" style={styles.createInput} />
            <TextInput value={pincode} onChangeText={setPincode} placeholder="Pincode" placeholderTextColor="#9f8f81" style={styles.createInput} keyboardType="number-pad" />
            <TouchableOpacity onPress={createStall} style={styles.createBtn} disabled={loading}>
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {data ? (
          <>
            <View style={styles.statsGrid}>
              {[
                { icon: 'business-outline', label: 'Offices:', value: data.counts.offices },
                { icon: 'fast-food-outline', label: 'Menu Items:', value: data.counts.menuItems },
                { icon: 'bicycle-outline', label: 'Delivery Boys:', value: data.counts.deliveryBoys },
                { icon: 'cash-outline', label: 'Total:', value: `₹${Math.round(data.totalAmount)}` },
              ].map((s) => (
                <View key={s.label} style={styles.statPill}>
                  <Ionicons name={s.icon as any} size={16} color={C.chip} />
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.ordersCard}>
              <Text style={styles.ordersTitle}>Orders</Text>
              <View style={styles.ordersGrid}>
                <Text style={styles.ordersCell}>Total: {data.counts.orders}</Text>
                <Text style={styles.ordersCell}>Delivered: {data.counts.delivered}</Text>
                <Text style={styles.ordersCell}>Pending: {data.counts.pending}</Text>
                <Text style={styles.ordersCell}>Cancelled: {data.counts.cancelled}</Text>
              </View>
            </View>

            <View style={styles.latestWrap}>
              <Text style={styles.latestTitle}>Latest Orders</Text>
              {pendingOrders.length === 0 ? (
                <Text style={{ color: C.textDark, fontWeight: '600' }}>No new orders.</Text>
              ) : (
                pendingOrders.slice(0, 3).map((o) => {
                  const total = (o.items ?? []).reduce((sum, it) => sum + it.quantity * it.price, 0);
                  return (
                    <View key={o.id} style={styles.latestItem}>
                      <View style={styles.latestHead}>
                        <Text style={styles.latestOffice} numberOfLines={1}>
                          {o.office.name}
                        </Text>
                        <Text style={styles.latestAmt}>₹{Math.round(total)}</Text>
                      </View>
                      <Text style={styles.latestTime}>{new Date(o.orderTime).toLocaleString()}</Text>
                      <Text style={styles.latestDesc} numberOfLines={2}>
                        {(o.items ?? []).map((i) => `${i.itemName} (${i.quantity})`).join(', ')}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: C.page, flex: 1 },
  header: {
    backgroundColor: C.header,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 26,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTitle: { fontSize: 40, fontWeight: '900', color: C.title, marginBottom: 16 },
  refreshBtn: {
    borderWidth: 1.6,
    borderColor: C.title,
    borderRadius: 18,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  refreshText: { color: C.title, fontSize: 20, fontWeight: '800' },
  kettle: { position: 'absolute', right: -24, bottom: -8, width: 220, height: 170, opacity: 0.92 },
  body: {
    flex: 1,
    backgroundColor: C.body,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -12,
  },
  bodyContent: { padding: 16, paddingBottom: 28 },
  glass: { position: 'absolute', right: -22, top: 52, width: 190, height: 380, opacity: 0.4 },
  dateWrap: { marginTop: 6, marginBottom: 12 },
  sectionLabel: { textAlign: 'center', color: '#b98a52', fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthArrow: { color: '#b98a52', fontSize: 14, fontWeight: '800' },
  monthChip: { backgroundColor: '#dbd8d4', paddingHorizontal: 22, paddingVertical: 7, borderRadius: 10 },
  monthChipText: { color: C.textDark, fontWeight: '800', fontSize: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.header, alignItems: 'center', justifyContent: 'center' },
  stallName: { color: C.textDark, fontSize: 34, fontWeight: '900' },
  stallCode: { color: C.muted, fontSize: 24, fontWeight: '600', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statPill: {
    width: '48%',
    backgroundColor: C.stat,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: { color: '#d8c0a5', fontSize: 15, fontWeight: '700' },
  statValue: { color: C.title, fontSize: 15, fontWeight: '900', marginLeft: 'auto' },
  ordersCard: { backgroundColor: C.orderCard, borderRadius: 22, padding: 14, marginBottom: 14 },
  ordersTitle: { color: C.title, fontSize: 32, fontWeight: '900', marginBottom: 10 },
  ordersGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  ordersCell: { width: '50%', color: C.white, fontSize: 14, fontWeight: '700', paddingVertical: 6 },
  latestWrap: { backgroundColor: C.latestWrap, borderRadius: 22, padding: 14 },
  latestTitle: { color: C.textDark, fontSize: 34, fontWeight: '900', marginBottom: 10 },
  latestItem: { backgroundColor: C.orderCard, borderRadius: 14, padding: 12 },
  latestHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  latestOffice: { color: C.white, fontSize: 18, fontWeight: '800', flex: 1, marginRight: 8 },
  latestAmt: { color: C.success, fontSize: 20, fontWeight: '900' },
  latestTime: { color: '#d5b796', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  latestDesc: { color: C.white, fontSize: 14, fontWeight: '700' },
  createWrap: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.borderSoft,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginBottom: 14,
  },
  createTitle: { color: C.textDark, fontSize: 16, fontWeight: '800', marginBottom: 2 },
  createInput: { backgroundColor: '#efe7df', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.textDark },
  createBtn: { backgroundColor: C.chip, borderRadius: 12, paddingVertical: 11, marginTop: 4 },
  createBtnText: { color: C.textDark, textAlign: 'center', fontWeight: '800', fontSize: 15 },
});
