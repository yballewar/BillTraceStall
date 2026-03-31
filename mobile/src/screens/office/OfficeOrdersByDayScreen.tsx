import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { getSelectedOfficeId } from '../../services/storage';
import { DatePickerModal } from '../../components/DatePickerModal';
import { Badge, Button, Card, Screen, colors, tokens, typography } from '../../ui';

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  orderTime: string;
  amount: number;
  paymentReceived: boolean;
  paymentMode: string;
};

type OrderDetails = {
  id: string;
  orderNumber: string;
  status: string;
  orderTime: string;
  paymentReceived: boolean;
  paymentMode: string;
  office: { id: string; name: string; address: string; phone: string; contactPerson: string };
  stall: { id: string; stallName: string; uniqueCode: string } | null;
  items: { id: string; itemName: string; category: string; quantity: number; price: number; amount: number }[];
  amount: number;
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function OfficeOrdersByDayScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const initialDate = String(route?.params?.date ?? todayKey());
  const [date, setDate] = useState(initialDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<OrderRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getSelectedOfficeId();
      setSelectedOfficeId(id);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!selectedOfficeId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<any>('office/orders-by-date', { params: { officeId: selectedOfficeId, date } });
      const rows = (data?.items ?? []) as any[];
      setItems(
        rows.map((i) => ({
          id: String(i.id),
          orderNumber: String(i.orderNumber ?? ''),
          status: String(i.status),
          orderTime: String(i.orderTime),
          amount: Number(i.amount ?? 0) || 0,
          paymentReceived: Boolean(i.paymentReceived),
          paymentMode: String(i.paymentMode ?? ''),
        }))
      );
      setTotalAmount(Number(data?.totalAmount ?? 0) || 0);
    } catch (e: any) {
      setItems([]);
      setTotalAmount(0);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [date, selectedOfficeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    (async () => {
      setDetails(null);
      setDetailsError(null);
      if (!selectedOrderId) return;
      setDetailsLoading(true);
      try {
        const { data } = await api.get<OrderDetails>(`office/orders/${selectedOrderId}`);
        if (!active) return;
        setDetails(data);
      } catch (e: any) {
        if (!active) return;
        setDetails(null);
        setDetailsError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load order'));
      } finally {
        if (!active) return;
        setDetailsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedOrderId]);

  const header = useMemo(() => {
    return (
      <View style={{ gap: tokens.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.h3}>Daily Orders</Text>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            Back
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

        <Button variant="secondary" onPress={load} disabled={loading}>
          Refresh
        </Button>

        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

        <Card style={{ gap: tokens.space.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={typography.h3}>Summary</Text>
            <Badge tone="neutral">{items.length} orders</Badge>
          </View>
          <Text style={typography.muted}>Amount</Text>
          <Text style={typography.h2}>{Math.round(totalAmount)}</Text>
        </Card>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}
      </View>
    );
  }, [date, dateOpen, error, items.length, load, loading, navigation, totalAmount]);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: 24 }}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedOrderId(item.id)} activeOpacity={0.85}>
            <Card style={{ gap: tokens.space.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                  {item.status}
                </Text>
                <Badge tone={item.paymentReceived ? 'success' : 'warning'}>{item.paymentReceived ? 'Paid' : 'Pending'}</Badge>
                <Text style={{ color: colors.text, fontWeight: '900' }}>{Math.round(item.amount)}</Text>
              </View>
              <Text style={typography.caption}>#{item.orderNumber}</Text>
              <Text style={typography.faint}>{new Date(item.orderTime).toLocaleString()}</Text>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                Payment: {item.paymentReceived ? `Received (${item.paymentMode || 'Cash'})` : 'Pending (Credit)'}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && !error ? <Text style={typography.faint}>No orders.</Text> : null}
      />

      <Modal transparent visible={selectedOrderId !== null} animationType="fade" onRequestClose={() => setSelectedOrderId(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: 16, justifyContent: 'center' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: tokens.radius.md, padding: tokens.space.md, gap: tokens.space.md, maxHeight: '85%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.h3}>Order Details</Text>
              <Button variant="ghost" onPress={() => setSelectedOrderId(null)}>
                Close
              </Button>
            </View>

            {detailsLoading ? <ActivityIndicator /> : null}
            {detailsError ? (
              <View style={{ alignItems: 'flex-start' }}>
                <Badge tone="danger">{detailsError}</Badge>
              </View>
            ) : null}

            {details ? (
              <View style={{ gap: tokens.space.md }}>
                <Card style={{ gap: tokens.space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.text, fontWeight: '900' }}>{details.status}</Text>
                    <Text style={{ color: colors.text, fontWeight: '900' }}>{Math.round(details.amount)}</Text>
                  </View>
                  <Text style={typography.caption}>#{details.orderNumber}</Text>
                  <Text style={typography.faint}>{new Date(details.orderTime).toLocaleString()}</Text>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>
                    Payment: {details.paymentReceived ? `Received (${details.paymentMode || 'Cash'})` : 'Pending (Credit)'}
                  </Text>
                  {details.stall ? <Text style={typography.faint}>Stall: {details.stall.stallName}</Text> : null}
                </Card>

                <Card style={{ gap: tokens.space.xs }}>
                  <Text style={typography.h3}>Office</Text>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>{details.office.name}</Text>
                  <Text style={typography.faint}>{details.office.phone}</Text>
                  <Text style={typography.faint} numberOfLines={1}>
                    {details.office.address}
                  </Text>
                </Card>

                <Text style={typography.h3}>Items</Text>
                <FlatList
                  data={details.items}
                  keyExtractor={(i) => i.id}
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
