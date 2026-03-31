import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { Badge, Button, Card, Input, Screen, colors, tokens, typography } from '../../ui';

type OfficeRow = {
  id?: string;
  name?: string;
  officeName?: string;
  address: string;
  phone: string;
  contactPerson: string;
};

type ItemRow = { itemName: string; quantity: number; price: number; amount?: number };

type Row = {
  id: string;
  orderNumber: string;
  status: number | string;
  orderTime: string;
  office: OfficeRow;
  items?: ItemRow[];
  amount?: number;
};

type DeliveredReportResponse = {
  date: string;
  totalOrders: number;
  totalAmount: number;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    orderTime: string;
    office: { id?: string; name?: string; officeName?: string; address: string; phone: string; contactPerson: string };
    items: ItemRow[];
    amount: number;
  }>;
};

function orderAmount(row: Row): number {
  if (row.amount != null) return row.amount;
  if (row.items?.length) return row.items.reduce((s, i) => s + (i.amount ?? i.quantity * i.price), 0);
  return 0;
}

function officeTitle(o: OfficeRow) {
  return o.officeName ?? o.name ?? '';
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

export function DeliveryTodayScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Row | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<DeliveredReportResponse>('delivery/delivered-report', { params: { date: todayKey() } });
      setItems((data?.orders ?? []).map((o) => ({ ...o, status: o.status })));
    } catch (e: any) {
      setItems([]);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        load();
      }, 150);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [load]);

  const delivered = useMemo(() => {
    return items
      .filter((i) => formatStatus(i.status) === 'Delivered')
      .sort((a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime());
  }, [items]);

  const filteredDelivered = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return delivered;
    return delivered.filter(
      (o) =>
        officeTitle(o.office).toLowerCase().includes(term) ||
        (o.office.phone && o.office.phone.replace(/\D/g, '').includes(term.replace(/\D/g, '')))
    );
  }, [delivered, searchQuery]);

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: '2%' }}>
      <View style={{ gap: tokens.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.h3}>Today Delivered</Text>
          <Badge tone="success">Delivered</Badge>
        </View>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        {delivered.length > 5 ? (
          <Input
            label="Search office or phone"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Type office name or mobile number..."
            autoCapitalize="none"
          />
        ) : null}

        <FlatList
          data={filteredDelivered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setSelectedOrder(item)}>
              <Card style={{ gap: tokens.space.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                    {officeTitle(item.office)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(orderAmount(item))}</Text>
                    <Badge tone="success">Delivered</Badge>
                  </View>
                </View>
                <Text style={typography.faint}>{new Date(item.orderTime).toLocaleString()}</Text>
                <Text style={typography.caption}>#{item.orderNumber}</Text>
                <Text style={{ color: colors.textMuted, fontWeight: '700' }} numberOfLines={2}>
                  {item.office.address}
                </Text>
                <Text style={{ color: colors.textFaint, fontWeight: '700' }}>{item.office.phone}</Text>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={typography.faint}>
                {searchQuery.trim() ? 'No orders match your search.' : 'No delivered orders today.'}
              </Text>
            ) : null
          }
        />

      <Modal transparent visible={!!selectedOrder} animationType="fade" onRequestClose={() => setSelectedOrder(null)}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: tokens.space.lg, justifyContent: 'center' }} onPress={() => setSelectedOrder(null)}>
          <View style={{ backgroundColor: colors.surface, borderRadius: tokens.radius.xl, maxHeight: '90%', borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...(Platform.OS === 'android' ? { elevation: 16 } : { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 28, shadowColor: '#000' }) }} onStartShouldSetResponder={() => true}>
            {selectedOrder ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: tokens.space.lg, paddingBottom: tokens.space.md, backgroundColor: colors.success + '18', borderBottomWidth: 2, borderBottomColor: colors.success }}>
                  <View>
                    <Text style={[typography.h3, { color: colors.text }]}>Order Details</Text>
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>#{selectedOrder.orderNumber}</Text>
                  </View>
                  <Button variant="ghost" size="sm" onPress={() => setSelectedOrder(null)}>Close</Button>
                </View>
                <ScrollView
                  style={{ maxHeight: 400 }}
                  showsVerticalScrollIndicator={true}
                  scrollEventThrottle={16}
                  nestedScrollEnabled={true}
                  bounces={true}
                  contentContainerStyle={{ padding: tokens.space.lg, paddingTop: tokens.space.md, paddingBottom: tokens.space.xl }}
                >
                  <Card variant="elevated" style={{ gap: tokens.space.sm, marginBottom: tokens.space.md, borderLeftWidth: 4, borderLeftColor: colors.success }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{officeTitle(selectedOrder.office)}</Text>
                      <Badge tone="success">Delivered</Badge>
                    </View>
                    <Text style={typography.faint}>{new Date(selectedOrder.orderTime).toLocaleString()}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(orderAmount(selectedOrder))}</Text>
                    </View>
                  </Card>

                  <Text style={[typography.label, { color: colors.textMuted, marginBottom: tokens.space.xs }]}>Office</Text>
                  <Card variant="outlined" style={{ gap: tokens.space.xs, marginBottom: tokens.space.md, padding: tokens.space.md }}>
                    <Text style={typography.body}>{officeTitle(selectedOrder.office)}</Text>
                    {selectedOrder.office.contactPerson ? <Text style={[typography.bodySmall, { color: colors.textMuted }]}>Contact: {selectedOrder.office.contactPerson}</Text> : null}
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={3}>{selectedOrder.office.address}</Text>
                    <Text style={[typography.body, { color: colors.info }]}>{selectedOrder.office.phone}</Text>
                  </Card>

                  <Text style={[typography.label, { color: colors.textMuted, marginBottom: tokens.space.xs }]}>Order Items</Text>
                  {selectedOrder.items?.length ? (
                    <Card variant="elevated" style={{ gap: tokens.space.sm, marginBottom: tokens.space.sm }}>
                      {selectedOrder.items.map((i, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: selectedOrder.items && idx < selectedOrder.items.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                          <Text style={typography.body} numberOfLines={1}>{i.itemName} × {i.quantity}</Text>
                          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>₹{Math.round((i.amount ?? i.quantity * i.price))}</Text>
                        </View>
                      ))}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: tokens.space.sm, marginTop: 4, borderTopWidth: 2, borderTopColor: colors.border }}>
                        <Text style={[typography.h4, { color: colors.text }]}>Total</Text>
                        <Text style={[typography.h4, { color: colors.success, fontWeight: '800' }]}>₹{Math.round(orderAmount(selectedOrder))}</Text>
                      </View>
                    </Card>
                  ) : (
                    <Card variant="outlined" style={{ padding: tokens.space.lg, alignItems: 'center' }}>
                      <Text style={typography.faint}>No item details available.</Text>
                    </Card>
                  )}
                </ScrollView>
              </>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
      </View>
    </Screen>
  );
}
