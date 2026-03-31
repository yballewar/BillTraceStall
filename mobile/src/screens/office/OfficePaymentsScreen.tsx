import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { getSelectedOfficeId } from '../../services/storage';
import { Badge, Button, Card, Screen, colors, tokens, typography } from '../../ui';

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  paymentGateway: string;
  transactionId?: string | null;
  createdAt: string;
  paidAt?: string | null;
};

type PaymentsResponse = {
  month: number;
  year: number;
  office: { id: string; officeName: string; stallId: string; stallName: string; stallCode: string };
  billTotal?: number;
  totalPaid: number;
  balance?: number;
  pendingOrders?: number;
  billStatus?: string;
  payments: PaymentRow[];
};

function shiftMonth(year: number, month: number, delta: number) {
  const idx = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(idx / 12);
  const nextMonth = (idx % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

export function OfficePaymentsScreen() {
  const navigation = useNavigation<any>();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<PaymentsResponse | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);

  const monthLabel = `${year}-${String(month).padStart(2, '0')}`;
  const todayLabel = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  useFocusEffect(
    useMemo(
      () => () => {
        (async () => {
          const id = await getSelectedOfficeId();
          setSelectedOfficeId(id);
        })();
      },
      []
    )
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<PaymentsResponse>('office/payments', {
          params: { month, year, officeId: selectedOfficeId || undefined },
        });
        if (!cancelled) {
          setPayload(data);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, selectedOfficeId, year]);

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View style={{ gap: tokens.space.md }}>
        <View style={{ gap: tokens.space.xs }}>
          <Text style={typography.h3}>{payload?.office?.stallName ?? 'Payments'}</Text>
          {payload?.office ? <Text style={typography.muted}>{payload.office.stallCode}</Text> : null}
        </View>

        <Card style={{ gap: tokens.space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="secondary"
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

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        {payload ? (
          <Card style={{ gap: tokens.space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.h3}>Summary</Text>
              {payload.billStatus ? <Badge tone="neutral">{payload.billStatus}</Badge> : <Badge tone="neutral">Month</Badge>}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={typography.muted}>Pending</Text>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{payload.billTotal ?? 0}</Text>
            </View>
            {payload.pendingOrders !== undefined ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.muted}>Pending Orders</Text>
                <Text style={{ color: colors.text, fontWeight: '900' }}>{payload.pendingOrders}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={typography.muted}>Paid</Text>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{payload.totalPaid}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={typography.muted}>Balance</Text>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{payload.balance ?? (payload.billTotal ?? 0) - payload.totalPaid}</Text>
            </View>
          </Card>
        ) : null}

        <TouchableOpacity onPress={() => navigation.navigate('OfficeOrdersByDay', { date: todayLabel })} activeOpacity={0.85}>
          <Card style={{ gap: tokens.space.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.h3}>Delivery Orders</Text>
              <Badge tone="info">{todayLabel}</Badge>
            </View>
            <Text style={typography.faint}>Tap to view delivered orders for the day</Text>
          </Card>
        </TouchableOpacity>

        <FlatList
          data={payload?.payments ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Card style={{ gap: tokens.space.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                  {item.status}
                </Text>
                <Badge tone={String(item.status || '').toLowerCase().includes('paid') ? 'success' : 'neutral'}>{item.paymentGateway}</Badge>
              </View>
              <Text style={typography.faint}>{item.paidAt ?? item.createdAt}</Text>
              {item.transactionId ? <Text style={typography.muted}>Txn: {item.transactionId}</Text> : null}
              <Text style={{ color: colors.text, fontWeight: '900', marginTop: tokens.space.xs }}>Amount: {item.amount}</Text>
            </Card>
          )}
          ListEmptyComponent={!loading ? <Text style={typography.faint}>No payments found.</Text> : null}
        />
      </View>
    </Screen>
  );
}
