import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { Badge, Button, Card, Screen, showAlert, colors, tokens, typography } from '../../ui';

type OfficeRow = {
  officeName: string;
  address: string;
  phone: string;
  contactPerson: string;
};

type Row = {
  id: string;
  orderNumber: string;
  status: number | string;
  orderTime: string;
  office: OfficeRow;
};

function formatStatus(s: number | string) {
  if (typeof s === 'string') return s;
  switch (s) {
    case 1:
      return 'Pending';
    case 2:
      return 'Delivered';
    case 3:
      return 'Cancelled';
    case 4:
      return 'Ready';
    case 5:
      return 'Preparing';
    case 6:
      return 'Pickup';
    default:
      return String(s);
  }
}

export function DeliveryAvailableScreen({ route }: any) {
  const routeInitialTab = (route?.params?.initialTab as 'New' | 'My' | undefined) ?? undefined;
  const [loading, setLoading] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [marking, setMarking] = useState<{ orderId: string; action: 'pickup' | 'delivered' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'New' | 'My'>('New');
  const [availableItems, setAvailableItems] = useState<Row[]>([]);
  const [myItems, setMyItems] = useState<Row[]>([]);

  useEffect(() => {
    if (routeInitialTab === 'New' || routeInitialTab === 'My') {
      setTab(routeInitialTab);
    }
  }, [routeInitialTab]);

  const loadAvailable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Row[]>('delivery/available');
      setAvailableItems(data ?? []);
    } catch (e: any) {
      setAvailableItems([]);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Row[]>('delivery/today');
      setMyItems(data ?? []);
    } catch (e: any) {
      setMyItems([]);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    if (tab === 'New') {
      await loadAvailable();
      return;
    }
    await loadMy();
  }, [loadAvailable, loadMy, tab]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      return;
    }, [load])
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent((evt) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const type = String(evt.type || '');
        const st = String(evt.status || '').toLowerCase();
        const isReadyUnassigned = type === 'status_changed' && st === 'ready' && !evt.deliveryBoyId;

        if (isReadyUnassigned) {
          loadAvailable();
          if (tab === 'New') return;
        }

        if (type === 'assigned') {
          loadAvailable();
          loadMy();
          return;
        }

        if (tab === 'New') {
          loadAvailable();
          return;
        }
        loadMy();
      }, 150);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [loadAvailable, loadMy, tab]);

  const accept = async (orderId: string) => {
    if (acceptingOrderId) return;
    setAcceptingOrderId(orderId);
    setError(null);
    try {
      await api.post('delivery/accept', { orderId });
      await loadAvailable();
      showAlert('Accepted', 'Order assigned to you.');
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Accept failed');
      setError(msg);
      showAlert('Accept failed', msg);
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const markPickup = async (orderId: string) => {
    if (marking) return;
    setMarking({ orderId, action: 'pickup' });
    setError(null);
    try {
      await api.post('delivery/mark-pickup', { orderId });
      await loadMy();
      showAlert('Pickup', 'Order marked as pickup.');
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Mark pickup failed');
      setError(msg);
      showAlert('Mark pickup failed', msg);
    } finally {
      setMarking(null);
    }
  };

  const markDelivered = async (orderId: string, paymentReceived: boolean) => {
    if (marking) return;
    setMarking({ orderId, action: 'delivered' });
    setError(null);
    try {
      await api.post('delivery/mark-delivered', {
        orderId,
        paymentReceived,
        paymentMode: paymentReceived ? 'Cash' : 'Credit',
      });
      await loadMy();
      showAlert('Delivered', 'Order marked as delivered.');
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Mark delivered failed');
      setError(msg);
      showAlert('Mark delivered failed', msg);
    } finally {
      setMarking(null);
    }
  };

  const confirmDelivered = (orderId: string) => {
    showAlert('Payment', 'Payment received?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'No (Credit)', onPress: () => markDelivered(orderId, false) },
      { text: 'Yes (Cash)', onPress: () => markDelivered(orderId, true) },
    ]);
  };

  const newVisible = useMemo(() => {
    return [...availableItems].sort((a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime());
  }, [availableItems]);

  const myVisible = useMemo(() => {
    return myItems
      .filter((i) => {
        const st = formatStatus(i.status);
        return st !== 'Delivered' && st !== 'Cancelled';
      })
      .sort((a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime());
  }, [myItems]);

  const statusColor = (s: string) =>
    s === 'Delivered' ? colors.success : s === 'Pickup' ? colors.warning : s === 'Ready' ? colors.info : colors.primary;
  const tabConfig = [
    { key: 'New' as const, label: 'New Orders', count: availableItems.length, color: colors.info },
    { key: 'My' as const, label: 'My Orders', count: myVisible.length, color: colors.success },
  ];

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: '2%' }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.xl, gap: tokens.space.md }}>
        <Card variant="gradientBorder" style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '120%', marginHorizontal: '-10%' }}>
          <View>
            <Text style={[typography.h3, { color: colors.text, marginBottom: 2 }]}>Delivery Orders</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {tab === 'New' ? `${availableItems.length} available` : `${myVisible.length} in progress`}
            </Text>
          </View>
          <Button variant="ghost" size="sm" onPress={load} disabled={loading}>
            Refresh
          </Button>
        </Card>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tabConfig.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: tab === t.key ? t.color : colors.borderStrong,
                borderRadius: tokens.radius.lg,
                backgroundColor: tab === t.key ? t.color + '20' : colors.surface,
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Text style={{ color: tab === t.key ? t.color : colors.textMuted, fontWeight: '700', fontSize: tokens.text.sm }} numberOfLines={1}>
                {t.label}
              </Text>
              <View style={{ backgroundColor: tab === t.key ? t.color + '40' : colors.bgSecondary, borderRadius: tokens.radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.key ? t.color : colors.textMuted }}>{t.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <Card variant="outlined" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger, padding: tokens.space.md }}>
            <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>
          </Card>
        ) : null}

        <FlatList
            data={tab === 'New' ? newVisible : myVisible}
            keyExtractor={(i) => i.id}
            style={{ width: '120%', marginHorizontal: '-10%' }}
            contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
            renderItem={({ item }) => {
              const st = formatStatus(item.status);
              const accent = statusColor(st);
              return (
                <Card variant="elevated" style={{ gap: tokens.space.sm, borderLeftWidth: 4, borderLeftColor: accent, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>
                        {item.office.officeName}
                      </Text>
                      <Text style={[typography.caption, { marginTop: 2 }]}>#{item.orderNumber} • {new Date(item.orderTime).toLocaleString()}</Text>
                    </View>
                    <Badge
                      tone={tab === 'New' ? 'info' : st === 'Delivered' ? 'success' : st === 'Pickup' ? 'warning' : 'neutral'}
                    >
                      {tab === 'New' ? 'New' : st}
                    </Badge>
                  </View>

                  <View style={{ gap: 4, paddingVertical: tokens.space.xs, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={[typography.bodySmall, { color: colors.textMuted }]} numberOfLines={2}>
                      {item.office.address}
                    </Text>
                    <Text style={[typography.caption, { color: colors.info }]}>{item.office.phone}</Text>
                  </View>

                  {tab === 'New' ? (
                    <Button variant="primary" size="sm" disabled={!!acceptingOrderId} onPress={() => accept(item.id)}>
                      {acceptingOrderId === item.id ? 'Accepting…' : 'Accept Order'}
                    </Button>
                  ) : st === 'Ready' ? (
                    <Button variant="secondary" size="sm" disabled={!!marking} onPress={() => markPickup(item.id)}>
                      {marking?.orderId === item.id && marking.action === 'pickup' ? 'Working…' : 'Mark Pickup'}
                    </Button>
                  ) : st === 'Pickup' ? (
                    <Button variant="primary" size="sm" disabled={!!marking} onPress={() => confirmDelivered(item.id)}>
                      {marking?.orderId === item.id && marking.action === 'delivered' ? 'Working…' : 'Mark Delivered'}
                    </Button>
                  ) : null}
                </Card>
              );
            }}
            ListHeaderComponent={
              loading ? (
                <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <Card variant="outlined" style={{ padding: tokens.space.xxl, alignItems: 'center', marginTop: tokens.space.lg }}>
                  <Text style={[typography.h4, { color: colors.textMuted, marginBottom: tokens.space.sm }]}>
                    {tab === 'New' ? 'No new orders' : 'No orders today'}
                  </Text>
                  <Text style={[typography.faint, { textAlign: 'center' }]}>
                    {tab === 'New' ? 'New orders will appear here when ready for delivery.' : 'Your assigned orders will show up here.'}
                  </Text>
                </Card>
              ) : null
            }
          />
      </View>
    </Screen>
  );
}
