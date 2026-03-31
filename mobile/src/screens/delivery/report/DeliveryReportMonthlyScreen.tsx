import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../../services/api';
import { Badge, Button, Card, Input, Screen, colors, tokens, typography } from '../../../ui';

type DayRow = {
  date: string;
  orders: number;
  amount: number;
  cashCollected: number;
  creditAmount: number;
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

type MonthlyReportResponse = {
  month: string;
  totalOrders: number;
  totalAmount: number;
  cashCollected: number;
  creditAmount: number;
  byDay: DayRow[];
  summary: {
    byOffice: SummaryOfficeRow[];
    byItem: SummaryItemRow[];
  };
};

type TabKey = 'Summary' | 'Day Wise' | 'Offices' | 'Items' | 'Collection';

function nowYearMonth() {
  const d = new Date();
  return { year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0') };
}

function toInt(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function DeliveryReportMonthlyScreen({ navigation }: any) {
  const init = nowYearMonth();
  const [tab, setTab] = useState<TabKey>('Summary');
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyReportResponse | null>(null);

  const canLoad = useMemo(() => {
    const y = toInt(year);
    const m = toInt(month);
    return y >= 2000 && y <= 2100 && m >= 1 && m <= 12;
  }, [month, year]);

  const load = useCallback(async () => {
    if (!canLoad) {
      setError('Enter valid year/month');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<MonthlyReportResponse>('delivery/monthly-report', { params: { year: toInt(year), month: toInt(month) } });
      setData(data);
    } catch (e: any) {
      setData(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [canLoad, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const tabConfig = useMemo(
    () => [
      { key: 'Summary' as const, label: 'Summary', color: colors.success },
      { key: 'Day Wise' as const, label: 'Day Wise', color: colors.info },
      { key: 'Offices' as const, label: 'Offices', color: colors.primary },
      { key: 'Items' as const, label: 'Items', color: colors.purpleDark },
      { key: 'Collection' as const, label: 'Collection', color: colors.warningDark },
    ],
    []
  );

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: '2%' }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.xl, gap: tokens.space.md }}>
        <Card
          variant="gradientBorder"
          style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0 }}
        >
          <View>
            <Text style={typography.h3}>{tab === 'Summary' ? 'Summary' : 'Monthly Report'}</Text>
            <Text style={typography.caption}>{data?.month ?? `${year}-${month}`}</Text>
          </View>
          <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>
            Back
          </Button>
        </Card>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Month" value={month} onChangeText={setMonth} keyboardType="numeric" placeholder="01-12" />
          </View>
          <View style={{ justifyContent: 'flex-end', paddingBottom: 2 }}>
            <Button variant="primary" size="sm" onPress={load} disabled={loading || !canLoad}>
              Load
            </Button>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {tabConfig.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: tab === t.key ? t.color : colors.borderStrong,
                borderRadius: 0,
                backgroundColor: tab === t.key ? t.color + '20' : colors.surface,
              }}
            >
              <Text style={{ color: tab === t.key ? t.color : colors.textMuted, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text>
          </View>
        ) : null}

        {error ? (
          <Card variant="outlined" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger, padding: tokens.space.md, borderRadius: 0 }}>
            <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>
          </Card>
        ) : null}

        {tab === 'Summary' ? (
          <View style={{ gap: tokens.space.md }}>
            <Card variant="elevated" style={{ gap: tokens.space.xs, borderRadius: 0 }}>
              <Text style={typography.h4}>Summary</Text>
              <Text style={typography.caption}>{data?.month ?? `${year}-${month}`}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.muted}>Orders</Text>
                <Text style={[typography.h4, { color: colors.text }]}>{data?.totalOrders ?? 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.muted}>Amount</Text>
                <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(data?.totalAmount ?? 0)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.muted}>Cash Collected</Text>
                <Text style={[typography.h4, { color: colors.successDark }]}>₹{Math.round(data?.cashCollected ?? 0)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.muted}>Credit</Text>
                <Text style={[typography.h4, { color: colors.warningDark }]}>₹{Math.round(data?.creditAmount ?? 0)}</Text>
              </View>
            </Card>
          </View>
        ) : null}

        {tab === 'Collection' ? (
          <Card variant="elevated" style={{ gap: tokens.space.xs, borderRadius: 0 }}>
            <Text style={typography.h4}>Collection</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={typography.muted}>Cash Collected</Text>
              <Text style={[typography.h3, { color: colors.successDark }]}>₹{Math.round(data?.cashCollected ?? 0)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={typography.muted}>Credit</Text>
              <Text style={[typography.h3, { color: colors.warningDark }]}>₹{Math.round(data?.creditAmount ?? 0)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={typography.muted}>Total</Text>
              <Text style={[typography.h3, { color: colors.text }]}>₹{Math.round(data?.totalAmount ?? 0)}</Text>
            </View>
          </Card>
        ) : null}

        {tab === 'Day Wise' ? (
          <FlatList
            data={data?.byDay ?? []}
            keyExtractor={(i) => i.date}
            contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: tokens.space.xxxl }}
            renderItem={({ item }) => (
              <Card variant="elevated" style={{ gap: tokens.space.xs, borderRadius: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[typography.h4, { color: colors.text }]}>{item.date}</Text>
                  <Badge tone="info">{item.orders}</Badge>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={typography.muted}>Amount</Text>
                  <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={typography.muted}>Cash</Text>
                  <Text style={[typography.h4, { color: colors.successDark }]}>₹{Math.round(item.cashCollected)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={typography.muted}>Credit</Text>
                  <Text style={[typography.h4, { color: colors.warningDark }]}>₹{Math.round(item.creditAmount)}</Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={!loading ? <Text style={typography.faint}>No data.</Text> : null}
          />
        ) : null}

        {tab === 'Offices' ? (
          <FlatList
            data={data?.summary?.byOffice ?? []}
            keyExtractor={(i) => i.officeId}
            contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: tokens.space.xxxl }}
            renderItem={({ item }) => (
              <Card variant="elevated" style={{ gap: tokens.space.xs, borderRadius: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                    {item.officeName}
                  </Text>
                  <Badge tone="info">{item.orders}</Badge>
                </View>
                <Text style={typography.faint}>{item.phone}</Text>
                <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
              </Card>
            )}
            ListEmptyComponent={!loading ? <Text style={typography.faint}>No data.</Text> : null}
          />
        ) : null}

        {tab === 'Items' ? (
          <FlatList
            data={data?.summary?.byItem ?? []}
            keyExtractor={(i) => i.menuItemId}
            contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: tokens.space.xxxl }}
            renderItem={({ item }) => (
              <Card variant="elevated" style={{ gap: tokens.space.xs, borderRadius: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                    {item.itemName}
                  </Text>
                  <Badge tone="info">{item.quantity}</Badge>
                </View>
                <Text style={typography.faint}>{item.category}</Text>
                <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
              </Card>
            )}
            ListEmptyComponent={!loading ? <Text style={typography.faint}>No items.</Text> : null}
          />
        ) : null}
      </View>
    </Screen>
  );
}
