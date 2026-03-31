import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Badge, Button, Card, Input, Screen, colors, tokens, typography } from '../../ui';

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

const statColors = [
  { bg: colors.infoSoft, border: colors.info, text: colors.infoDark },
  { bg: colors.purpleSoft, border: colors.purple, text: colors.purpleDark },
  { bg: colors.successSoft, border: colors.success, text: colors.successDark },
  { bg: colors.warningSoft, border: colors.warning, text: colors.warningDark },
];

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
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={{ backgroundColor: colors.white }}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ flex: 1, backgroundColor: design.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
          <View style={{ backgroundColor: design.hero, paddingTop: 24, paddingBottom: 38, paddingHorizontal: tokens.space.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: 'rgba(204,149,87,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="cafe" size={28} color={design.brownLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: colors.white, letterSpacing: -0.4 }} numberOfLines={1}>
                  {profile?.stallName ?? 'Tea Stall Dashboard'}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: design.textMuted }} numberOfLines={1}>
                  {profile?.uniqueCode ? `Code: ${profile.uniqueCode}` : 'Dashboard'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={loading ? undefined : load}
                style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="refresh" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            {profile ? (
              <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge tone="info">{monthLabel}</Badge>
                <Badge tone={profile.isApproved ? 'success' : 'warning'}>{profile.isApproved ? 'Approved' : 'Pending'}</Badge>
              </View>
            ) : (
              <View style={{ marginTop: 14, alignItems: 'flex-start' }}>
                <Badge tone="info">{monthLabel}</Badge>
              </View>
            )}
          </View>

          <ScrollView
            contentContainerStyle={{
              backgroundColor: colors.white,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              marginTop: -24,
              paddingTop: tokens.space.lg,
              paddingHorizontal: tokens.space.xl,
              paddingBottom: tokens.space.xxxl,
              gap: 14,
            }}
          >
            <Card variant="elevated" style={{ gap: tokens.space.sm, paddingVertical: 18, borderRadius: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    const next = shiftMonth(year, month, -1);
                    setYear(next.year);
                    setMonth(next.month);
                  }}
                >
                  Prev
                </Button>
                <Badge tone="info">{monthLabel}</Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    const next = shiftMonth(year, month, 1);
                    setYear(next.year);
                    setMonth(next.month);
                  }}
                >
                  Next
                </Button>
              </View>
            </Card>

            {loading ? <ActivityIndicator color={colors.primary} /> : null}
            {error ? (
              <View style={{ alignItems: 'flex-start' }}>
                <Badge tone="danger">{error}</Badge>
              </View>
            ) : null}

            {needCreate ? (
              <Card variant="elevated" style={{ gap: tokens.space.lg, borderRadius: 18 }}>
                <Badge tone="warning">Create Profile</Badge>
                <Text style={typography.h4}>Create Tea Stall Profile</Text>
                <Text style={typography.faint}>Create your stall profile once to access dashboard.</Text>
                <Input label="Stall Name" placeholder="Stall name" value={stallName} onChangeText={setStallName} />
                <Input label="Address" placeholder="Address" value={address} onChangeText={setAddress} />
                <Input label="City" placeholder="City" value={city} onChangeText={setCity} />
                <Input label="State" placeholder="State" value={state} onChangeText={setState} />
                <Input label="Pincode" placeholder="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
                <Button onPress={createStall} disabled={loading}>
                  Create
                </Button>
              </Card>
            ) : null}

            {data ? (
              <View style={{ gap: tokens.space.lg }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
              {[
                { label: 'Offices', value: data.counts.offices, ...statColors[0] },
                { label: 'Menu Items', value: data.counts.menuItems, ...statColors[1] },
                { label: 'Delivery Boys', value: data.counts.deliveryBoys, ...statColors[2] },
                { label: 'Total', value: `₹${Math.round(data.totalAmount)}`, ...statColors[3] },
              ].map((s, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: s.bg,
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: tokens.space.md,
                    borderWidth: 1,
                    borderColor: s.border,
                  }}
                >
                  <Text style={[typography.faint, { fontSize: 10 }]}>{s.label}</Text>
                  <Text style={[typography.body, { fontSize: tokens.text.sm, fontWeight: '800', color: s.text }]}>{s.value}</Text>
                </View>
              ))}
            </View>

            <Card variant="elevated" style={{ gap: 6, paddingTop: 0, borderRadius: 18 }}>
              <Text style={[typography.h4, { marginTop: 0 }]}>Orders</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                <View style={{ flex: 1, minWidth: '48%' }}>
                  <Badge tone="neutral" style={{ alignSelf: 'stretch' }}>Total: {data.counts.orders}</Badge>
                </View>
                <View style={{ flex: 1, minWidth: '48%' }}>
                  <Badge tone="success" style={{ alignSelf: 'stretch' }}>Delivered: {data.counts.delivered}</Badge>
                </View>
                <View style={{ flex: 1, minWidth: '48%' }}>
                  <Badge tone="warning" style={{ alignSelf: 'stretch' }}>Pending: {data.counts.pending}</Badge>
                </View>
                <View style={{ flex: 1, minWidth: '48%' }}>
                  <Badge tone="danger" style={{ alignSelf: 'stretch' }}>Cancelled: {data.counts.cancelled}</Badge>
                </View>
              </View>
            </Card>

            <Card variant="elevated" style={{ gap: 6, borderRadius: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={typography.h4}>Latest Orders</Text>
                <Badge tone="info">{pendingOrders.length}</Badge>
              </View>
              {pendingOrders.length === 0 ? (
                <Text style={typography.faint}>No new orders.</Text>
              ) : (
                pendingOrders.map((o) => {
                  const total = (o.items ?? []).reduce((sum, it) => sum + it.quantity * it.price, 0);
                  return (
                    <Card key={o.id} variant="outlined" style={{ gap: 3, marginTop: 3 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }} numberOfLines={1}>
                          {o.office.name}
                        </Text>
                        <Badge tone="success">₹{Math.round(total)}</Badge>
                      </View>
                      <Text style={typography.faint}>{new Date(o.orderTime).toLocaleString()}</Text>
                      <Text style={{ color: colors.textMuted, fontWeight: '600' }} numberOfLines={2}>
                        {(o.items ?? []).map((i) => `${i.itemName}(${i.quantity})`).join(', ')}
                      </Text>
                    </Card>
                  );
                })
              )}
            </Card>
          </View>
        ) : null}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}
