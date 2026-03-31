import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../../services/api';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { Badge, Button, Card, Screen, colors, tokens, typography } from '../../../ui';

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
  orderNumber: string;
  status: string;
  orderTime: string;
  office: OfficeRow;
  items: ItemRow[];
  amount: number;
  paymentReceived?: boolean;
  paymentMode?: string;
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
  cashCollected?: number;
  creditAmount?: number;
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

type TabKey = 'Summary' | 'Orders' | 'Items' | 'Collection';

export function DeliveryReportDailyScreen({ navigation, route }: any) {
  const initialTab: TabKey | undefined = route?.params?.initialTab;
  const [tab, setTab] = useState<TabKey>(initialTab ?? 'Summary');
  const [date, setDate] = useState(todayKey());
  const [dateOpen, setDateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportResponse | null>(null);

  const dateDisplay = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }, [date]);

  const canLoad = useMemo(() => isValidDateKey(date), [date]);

  const load = useCallback(async () => {
    if (!canLoad) {
      setError('Enter date as YYYY-MM-DD');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ReportResponse>('delivery/delivered-report', { params: { date: date.trim() } });
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

  const cashCollected = Number(data?.cashCollected ?? 0) || 0;
  const creditAmount = Number(data?.creditAmount ?? 0) || 0;
  const totalOrders = data?.totalOrders ?? 0;
  const totalAmount = data?.totalAmount ?? 0;

  const tabConfig = useMemo(
    () => [
      { key: 'Summary' as const, label: 'Summary', color: colors.success },
      { key: 'Orders' as const, label: 'Orders', color: colors.info },
      { key: 'Items' as const, label: 'Items', color: colors.purpleDark },
      { key: 'Collection' as const, label: 'Collection', color: colors.warningDark },
    ],
    []
  );

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: '2%' }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.xl, gap: tokens.space.md }}>
        <Card variant="gradientBorder" style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={typography.h3}>Daily Report</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{tab === 'Summary' ? 'Summary & office wise' : tab === 'Orders' ? 'Delivered orders' : tab === 'Items' ? 'Item wise summary' : 'Cash vs Credit'}</Text>
          </View>
          <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>Back</Button>
        </Card>

        <Card variant="elevated" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg }}>
          <TouchableOpacity onPress={() => setDateOpen(true)} activeOpacity={0.85} style={{ flex: 1 }}>
            <Text style={[typography.h4, { color: colors.text }]}>{dateDisplay}</Text>
            <Text style={[typography.caption, { marginTop: 2 }]}>Tap to change date</Text>
          </TouchableOpacity>
          <Button variant="primary" size="sm" onPress={load} disabled={loading || !canLoad}>Load</Button>
        </Card>

        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tabConfig.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 6,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: tab === t.key ? t.color : colors.borderStrong,
                borderRadius: tokens.radius.lg,
                backgroundColor: tab === t.key ? t.color + '20' : colors.surface,
              }}
            >
              <Text style={{ color: tab === t.key ? t.color : colors.textMuted, fontWeight: '700', fontSize: tokens.text.sm }} numberOfLines={1}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <Card variant="outlined" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger, padding: tokens.space.md }}>
            <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>
          </Card>
        ) : null}

        {tab === 'Summary' ? (
          <View style={{ gap: tokens.space.md, flex: 1 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
              {[
                { label: 'Orders', value: totalOrders, color: colors.info },
                { label: 'Amount', value: `₹${Math.round(totalAmount)}`, color: colors.success },
                { label: 'Cash', value: `₹${Math.round(cashCollected)}`, color: colors.successDark },
                { label: 'Credit', value: `₹${Math.round(creditAmount)}`, color: colors.warningDark },
              ].map((s, i) => (
                <Card key={i} variant="elevated" style={{ flex: 1, minWidth: '45%', padding: tokens.space.md, borderLeftWidth: 4, borderLeftColor: s.color }}>
                  <Text style={[typography.label, { color: colors.textMuted }]}>{s.label}</Text>
                  <Text style={[typography.h4, { color: s.color }]}>{s.value}</Text>
                </Card>
              ))}
            </View>

            <Text style={[typography.label, { color: colors.textMuted }]}>Office Wise</Text>
            <FlatList
              data={data?.summary?.byOffice ?? []}
              keyExtractor={(i) => i.officeId}
              contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
              ListHeaderComponent={loading ? <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /><Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text></View> : null}
              renderItem={({ item }) => (
                <Card variant="elevated" style={{ gap: tokens.space.sm, borderLeftWidth: 4, borderLeftColor: colors.info }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Text style={[typography.h4, { color: colors.text, flex: 1 }]} numberOfLines={1}>{item.officeName}</Text>
                    <Badge tone="info">{item.orders}</Badge>
                    <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
                  </View>
                  <Text style={typography.faint}>{item.phone}</Text>
                </Card>
              )}
              ListEmptyComponent={!loading ? <Card variant="outlined" style={{ padding: tokens.space.xxl, alignItems: 'center' }}><Text style={typography.faint}>No data for this date.</Text></Card> : null}
            />
          </View>
        ) : null}

        {tab === 'Collection' ? (
          <View style={{ gap: tokens.space.md, flex: 1 }}>
            <Card variant="elevated" style={{ gap: tokens.space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: tokens.space.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={typography.muted}>Cash Collected</Text>
                <Text style={[typography.h4, { color: colors.successDark }]}>₹{Math.round(cashCollected)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: tokens.space.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={typography.muted}>Credit</Text>
                <Text style={[typography.h4, { color: colors.warningDark }]}>₹{Math.round(creditAmount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.h4, { color: colors.text }]}>Total</Text>
                <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(totalAmount)}</Text>
              </View>
            </Card>

            <FlatList
              data={data?.orders ?? []}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
              ListHeaderComponent={loading ? <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /><Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text></View> : null}
              renderItem={({ item }) => (
                <Card variant="elevated" style={{ gap: tokens.space.sm, borderLeftWidth: 4, borderLeftColor: item.paymentReceived ? colors.success : colors.warning }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Text style={[typography.h4, { color: colors.text, flex: 1 }]} numberOfLines={1}>{item.office.name}</Text>
                    <Badge tone={item.paymentReceived ? 'success' : 'warning'}>{item.paymentReceived ? 'Paid' : 'Credit'}</Badge>
                    <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
                  </View>
                  <Text style={typography.caption}>#{item.orderNumber} • {new Date(item.orderTime).toLocaleString()}</Text>
                </Card>
              )}
              ListEmptyComponent={!loading ? <Card variant="outlined" style={{ padding: tokens.space.xxl, alignItems: 'center' }}><Text style={typography.faint}>No delivered orders.</Text></Card> : null}
            />
          </View>
        ) : null}

        {tab === 'Orders' ? (
          <FlatList
            data={data?.orders ?? []}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
            ListHeaderComponent={loading ? <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /><Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text></View> : null}
            renderItem={({ item }) => (
              <Card variant="elevated" style={{ gap: tokens.space.sm, borderLeftWidth: 4, borderLeftColor: colors.success }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{item.office.name}</Text>
                    <Text style={[typography.caption, { marginTop: 2 }]}>#{item.orderNumber} • {new Date(item.orderTime).toLocaleString()}</Text>
                  </View>
                  <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
                </View>
                <View style={{ gap: 4, paddingTop: tokens.space.xs, borderTopWidth: 1, borderTopColor: colors.border }}>
                  {item.items.slice(0, 4).map((i) => (
                    <Text key={`${item.id}-${i.menuItemId}`} style={typography.bodySmall}>{i.itemName} × {i.quantity}</Text>
                  ))}
                  {item.items.length > 4 ? <Text style={typography.faint}>+{item.items.length - 4} more</Text> : null}
                </View>
              </Card>
            )}
            ListEmptyComponent={!loading ? <Card variant="outlined" style={{ padding: tokens.space.xxl, alignItems: 'center' }}><Text style={typography.faint}>No delivered orders.</Text></Card> : null}
          />
        ) : null}

        {tab === 'Items' ? (
          <FlatList
            data={data?.summary?.byItem ?? []}
            keyExtractor={(i) => i.menuItemId}
            contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
            ListHeaderComponent={loading ? <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /><Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text></View> : null}
            renderItem={({ item }) => (
              <Card variant="elevated" style={{ gap: tokens.space.sm, borderLeftWidth: 4, borderLeftColor: colors.purple }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{item.itemName}</Text>
                    <Text style={[typography.faint]}>{item.category}</Text>
                  </View>
                  <Badge tone="info">{item.quantity}</Badge>
                  <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={!loading ? <Card variant="outlined" style={{ padding: tokens.space.xxl, alignItems: 'center' }}><Text style={typography.faint}>No items.</Text></Card> : null}
          />
        ) : null}
      </View>
    </Screen>
  );
}
