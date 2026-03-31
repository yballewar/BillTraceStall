import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { DatePickerModal } from '../../components/DatePickerModal';
import { realtime } from '../../services/realtime';
import { Badge, Button, Card, Screen, showAlert, colors, tokens, typography } from '../../ui';

type Row = {
  id: string;
  date: string;
  time: string;
  status: string;
  createdOrderId?: string | null;
  createdOrderNumber?: string | null;
  deliveryBoy: { id: string; name: string; phone: string };
  amount: number;
  items: { menuItemId: string; itemName: string; category: string; quantity: number; price: number; amount: number }[];
};

type Response = {
  date: string;
  items: Row[];
};

type OrderPayment = {
  paymentReceived: boolean;
  paymentMode: string;
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function OfficeDeliveriesScreen() {
  const [date, setDate] = useState(todayKey());
  const [dateOpen, setDateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Response | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [payment, setPayment] = useState<OrderPayment | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Response>('office/scheduled/pending', { params: { date } });
      setData(data);
    } catch (e: any) {
      setData(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent(() => {
      if (date !== todayKey()) return;
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

  useEffect(() => {
    let active = true;
    (async () => {
      setPayment(null);
      if (!selected?.createdOrderId) return;
      setPaymentLoading(true);
      try {
        const { data } = await api.get<any>(`office/orders/${selected.createdOrderId}`);
        if (!active) return;
        setPayment({
          paymentReceived: Boolean(data?.paymentReceived),
          paymentMode: String(data?.paymentMode ?? ''),
        });
      } catch {
        if (!active) return;
        setPayment(null);
      } finally {
        if (!active) return;
        setPaymentLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selected?.createdOrderId]);

  const approve = async (id: string) => {
    if (workingId) return;
    setWorkingId(id);
    try {
      await api.post(`office/scheduled/deliveries/${id}/approve`, {});
      await load();
      showAlert('Approved', 'Delivery approved.');
    } catch (e: any) {
      showAlert('Approve failed', String(e?.response?.data?.error ?? e?.message ?? 'Failed'));
    } finally {
      setWorkingId(null);
    }
  };

  const reject = async (id: string) => {
    if (workingId) return;
    setWorkingId(id);
    try {
      await api.post(`office/scheduled/deliveries/${id}/reject`, {});
      await load();
      showAlert('Rejected', 'Delivery rejected.');
    } catch (e: any) {
      showAlert('Reject failed', String(e?.response?.data?.error ?? e?.message ?? 'Failed'));
    } finally {
      setWorkingId(null);
    }
  };

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View style={{ gap: tokens.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.h3}>Deliveries</Text>
          <Button variant="ghost" onPress={load} disabled={loading}>
            Refresh
          </Button>
        </View>

        <TouchableOpacity onPress={() => setDateOpen(true)} activeOpacity={0.85}>
          <Card style={{ gap: tokens.space.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.h3}>{date}</Text>
              <Badge tone="info">Date</Badge>
            </View>
            <Text style={typography.faint}>Tap to change date</Text>
          </Card>
        </TouchableOpacity>

        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

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
          renderItem={({ item }) => {
            const pending = item.status === 'PendingApproval';
            const tone = pending ? 'warning' : item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'neutral';
            return (
              <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.85}>
                <Card style={{ gap: tokens.space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                      {item.time}
                    </Text>
                    <Badge tone={tone as any}>{item.status}</Badge>
                    <Text style={{ color: colors.text, fontWeight: '900' }}>{Math.round(item.amount)}</Text>
                  </View>

                  <Text style={{ color: colors.textMuted, fontWeight: '700' }} numberOfLines={1}>
                    {item.deliveryBoy.name} • {item.deliveryBoy.phone}
                  </Text>

                  {item.createdOrderNumber ? (
                    <Text style={typography.faint}>Order: #{item.createdOrderNumber}</Text>
                  ) : item.createdOrderId ? (
                    <Text style={typography.faint}>Order: {item.createdOrderId}</Text>
                  ) : null}

                  <View style={{ gap: 2 }}>
                    {item.items.slice(0, 2).map((i) => (
                      <Text key={`${item.id}-${i.menuItemId}`} style={{ color: colors.textFaint, fontWeight: '700' }}>
                        {i.itemName} • {i.quantity}
                      </Text>
                    ))}
                    {item.items.length > 2 ? <Text style={typography.faint}>Tap to view all items</Text> : null}
                  </View>

                  {pending ? (
                    <View style={{ flexDirection: 'row', gap: tokens.space.sm, marginTop: tokens.space.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button variant="secondary" disabled={workingId !== null} onPress={() => approve(item.id)}>
                          {workingId === item.id ? 'Working...' : 'Approve'}
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button variant="danger" disabled={workingId !== null} onPress={() => reject(item.id)}>
                          {workingId === item.id ? 'Working...' : 'Reject'}
                        </Button>
                      </View>
                    </View>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={!loading ? <Text style={typography.faint}>No deliveries.</Text> : null}
        />
      </View>

      <Modal transparent visible={selected !== null} animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: 16, justifyContent: 'center' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: tokens.radius.md, padding: tokens.space.md, gap: tokens.space.md, maxHeight: '85%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.h3}>Delivery Details</Text>
              <Button variant="ghost" onPress={() => setSelected(null)}>
                Close
              </Button>
            </View>

            {selected ? (
              <View style={{ gap: tokens.space.md }}>
                <Card style={{ gap: tokens.space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.text, fontWeight: '900' }}>
                      {selected.date} {selected.time}
                    </Text>
                    <Text style={{ color: colors.text, fontWeight: '900' }}>{Math.round(selected.amount)}</Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontWeight: '800' }}>Status: {selected.status}</Text>
                  <Text style={{ color: colors.textMuted, fontWeight: '700' }}>
                    {selected.deliveryBoy.name} • {selected.deliveryBoy.phone}
                  </Text>
                  {selected.createdOrderNumber ? (
                    <Text style={{ color: colors.textFaint, fontWeight: '700' }}>Order: #{selected.createdOrderNumber}</Text>
                  ) : selected.createdOrderId ? (
                    <Text style={{ color: colors.textFaint, fontWeight: '700' }}>Order: {selected.createdOrderId}</Text>
                  ) : null}
                  {selected.createdOrderId ? (
                    <Text style={{ color: colors.text, fontWeight: '800' }}>
                      Payment:{' '}
                      {paymentLoading
                        ? 'Loading...'
                        : payment
                          ? payment.paymentReceived
                            ? `Received (${payment.paymentMode || 'Cash'})`
                            : 'Pending (Credit)'
                          : 'Pending (Credit)'}
                    </Text>
                  ) : null}
                </Card>

                <Text style={typography.h3}>Items</Text>
                <FlatList
                  data={selected.items}
                  keyExtractor={(i) => `${selected.id}-${i.menuItemId}`}
                  contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
                  renderItem={({ item }) => (
                    <Card>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: '900' }} numberOfLines={1}>
                            {item.itemName}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontWeight: '700' }} numberOfLines={1}>
                            {item.category}
                          </Text>
                        </View>
                        <Text style={{ width: 60, textAlign: 'right', fontWeight: '900', color: colors.text }}>{item.quantity}</Text>
                        <Text style={{ width: 90, textAlign: 'right', fontWeight: '900', color: colors.text }}>{Math.round(item.amount)}</Text>
                      </View>
                    </Card>
                  )}
                  ListEmptyComponent={<Text style={typography.faint}>No items.</Text>}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
