import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { api } from '../../../services/api';
import { getAccessToken, getSelectedOfficeId } from '../../../services/storage';
import { Badge, Button, Card, Input, Screen, colors, showAlert, tokens, typography } from '../../../ui';

const Stack = createNativeStackNavigator();

type MenuItem = {
  title: string;
  subtitle: string;
  route: string;
  color: string;
  icon: string;
};

function nowYearMonth() {
  const d = new Date();
  return { year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0') };
}

function toInt(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

const resolvedBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5191/api/v1';

async function openReportPdf(path: string, params: Record<string, string | number | null | undefined>) {
  const token = await getAccessToken();
  if (!token) {
    showAlert('Login required', 'Please login again.');
    return;
  }
  const base = resolvedBaseUrl.replace(/\/+$/, '');
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    query.set(k, String(v));
  });
  query.set('access_token', token);
  const url = `${base}/${path.replace(/^\/+/, '')}?${query.toString()}`;
  await Linking.openURL(url);
}

function OfficeReportMenuScreen({ navigation }: any) {
  const items: MenuItem[] = [
    { title: 'Day Wise Order List', subtitle: 'Date | Stall Name | Amount', route: 'OfficeReportDayWiseOrders', color: colors.info, icon: 'D' },
    { title: 'Item Wise Sale', subtitle: 'Date | Item Name | Quantity | Amount', route: 'OfficeReportItemWiseSale', color: colors.purple, icon: 'I' },
    { title: 'Pending Payment List', subtitle: 'Stall Name | Month Bill | Amount', route: 'OfficeReportPendingPayments', color: colors.warning, icon: 'P' },
    { title: 'Paid Payment List', subtitle: 'Stall Name | Month Bill | Amount', route: 'OfficeReportPaidPayments', color: colors.success, icon: '₹' },
  ];

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: 0 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ backgroundColor: colors.primary, paddingTop: 28, paddingBottom: 32, paddingHorizontal: tokens.space.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5 }}>Reports</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>Office reports</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.space.xl, paddingTop: tokens.space.lg, gap: 12 }} showsVerticalScrollIndicator={false}>
          {items.map((m) => (
            <TouchableOpacity
              key={m.title}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(m.route)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: tokens.space.md, borderRadius: 16, gap: 16 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: m.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: m.color }}>{m.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                  {m.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                  {m.subtitle}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: m.color, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

function OfficeReportDayWiseOrdersScreen({ navigation }: any) {
  const init = nowYearMonth();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stallName, setStallName] = useState('');
  const [rows, setRows] = useState<{ date: string; amount: number }[]>([]);

  const canLoad = useMemo(() => {
    const y = toInt(year);
    const m = toInt(month);
    return y >= 2000 && y <= 2100 && m >= 1 && m <= 12;
  }, [month, year]);

  useEffect(() => {
    (async () => {
      const id = await getSelectedOfficeId();
      setSelectedOfficeId(id);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!canLoad) {
      setError('Enter valid year/month');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<any>('office/dashboard', { params: { year: toInt(year), month: toInt(month), officeId: selectedOfficeId } });
      setStallName(String(data?.office?.stallName ?? ''));
      const items = (data?.days ?? []) as any[];
      setRows(items.map((d) => ({ date: String(d.Date ?? ''), amount: Number(d.TotalAmount ?? 0) || 0 })));
    } catch (e: any) {
      setRows([]);
      setStallName('');
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [canLoad, month, selectedOfficeId, year]);

  useEffect(() => {
    load();
  }, [load]);

  const COL_DATE = 110;
  const COL_STALL = 170;
  const COL_AMT = 100;
  const GRID_WIDTH = COL_DATE + COL_STALL + COL_AMT;
  const GRID_HEADER_BG = '#EEF2FF';
  const GRID_HEADER_TEXT = '#4338CA';
  const GRID_BORDER = '#E0E7FF';
  const ROW_ALT = '#FAFAFA';

  const cellBase = { paddingVertical: 14, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: GRID_BORDER, justifyContent: 'center' as const };
  const headerCellBase = { ...cellBase, paddingVertical: 13 };
  const headerCellText = [typography.label, { color: GRID_HEADER_TEXT, letterSpacing: 0.5, fontSize: tokens.text.xs, fontWeight: '700' as const }];
  const rowCellText = [typography.bodySmall, { color: colors.text, fontSize: (tokens.text.sm as number) - 4 }];
  const numText = { textAlign: 'right' as const, fontWeight: '700' as const };

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: 8, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.lg, gap: tokens.space.md }}>
        <Card variant="gradientBorder" style={{ paddingVertical: tokens.space.lg, paddingHorizontal: tokens.space.xl, borderRadius: tokens.radius.lg, borderWidth: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text, letterSpacing: -0.3 }]}>Day Wise Orders</Text>
              <Text style={[typography.caption, { marginTop: 4, color: colors.textMuted }]}>{stallName ? `Stall: ${stallName}` : 'Orders summary'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: tokens.radius.md, backgroundColor: colors.surface }}>
              <Text style={[typography.label, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: tokens.space.sm, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Month" value={month} onChangeText={setMonth} keyboardType="numeric" placeholder="01-12" />
          </View>
          <Button variant="primary" size="sm" onPress={load} disabled={loading || !canLoad} style={{ marginBottom: 2 }}>
            {loading ? 'Loading' : 'Load'}
          </Button>
        </View>

        <Button
          variant="secondary"
          size="sm"
          disabled={loading || !canLoad}
          onPress={() => openReportPdf('office/report/day-wise.pdf', { year: toInt(year), month: toInt(month), officeId: selectedOfficeId })}
        >
          Export PDF
        </Button>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        <Card variant="elevated" style={{ flex: 1, overflow: 'hidden', borderRadius: tokens.radius.lg, ...tokens.shadow.md, shadowColor: colors.black }}>
          <View style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h4, { color: colors.text }]}>Report</Text>
              <Badge tone="info">{`${year}-${month}`}</Badge>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ minWidth: GRID_WIDTH, flex: 1 }}>
              <View style={{ flexDirection: 'row', backgroundColor: GRID_HEADER_BG, borderBottomWidth: 2, borderBottomColor: GRID_BORDER }}>
                <View style={[headerCellBase, { width: COL_DATE }]}>
                  <Text style={headerCellText}>Date</Text>
                </View>
                <View style={[headerCellBase, { width: COL_STALL }]}>
                  <Text style={headerCellText}>Stall Name</Text>
                </View>
                <View style={[headerCellBase, { width: COL_AMT, borderRightWidth: 0 }]}>
                  <Text style={[...headerCellText, { textAlign: 'right' }]}>Amount</Text>
                </View>
              </View>

              <FlatList
                data={rows}
                keyExtractor={(i, index) => `${i.date || 'row'}-${index}`}
                contentContainerStyle={{ paddingBottom: tokens.space.lg }}
                renderItem={({ item, index }) => (
                  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: GRID_BORDER, backgroundColor: index % 2 === 0 ? colors.white : ROW_ALT }}>
                    <View style={[cellBase, { width: COL_DATE }]}>
                      <Text style={rowCellText}>{item.date}</Text>
                    </View>
                    <View style={[cellBase, { width: COL_STALL }]}>
                      <Text style={rowCellText}>{stallName}</Text>
                    </View>
                    <View style={[cellBase, { width: COL_AMT, borderRightWidth: 0 }]}>
                      <Text style={[...rowCellText, numText]}>{Math.round(item.amount)}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={!loading && !error ? <Text style={[typography.faint, { padding: tokens.space.lg }]}>No data.</Text> : null}
              />
            </View>
          </ScrollView>
        </Card>
      </View>
    </Screen>
  );
}

function OfficeReportItemWiseSaleScreen({ navigation }: any) {
  const init = nowYearMonth();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ key: string; date: string; itemName: string; category: string; qty: number; amount: number }[]>([]);

  const canLoad = useMemo(() => {
    const y = toInt(year);
    const m = toInt(month);
    return y >= 2000 && y <= 2100 && m >= 1 && m <= 12;
  }, [month, year]);

  useEffect(() => {
    (async () => {
      const id = await getSelectedOfficeId();
      setSelectedOfficeId(id);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!canLoad) {
      setError('Enter valid year/month');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<any>('office/item-wise', { params: { year: toInt(year), month: toInt(month), officeId: selectedOfficeId } });
      const days = (data?.days ?? []) as any[];
      const next: { key: string; date: string; itemName: string; category: string; qty: number; amount: number }[] = [];
      for (const d of days) {
        const date = String(d.Date ?? '');
        const items = (d.Items ?? []) as any[];
        for (const it of items) {
          const itemName = String(it.ItemName ?? '');
          const category = String(it.Category ?? '');
          next.push({
            key: `${date}-${itemName}-${category}`,
            date,
            itemName,
            category,
            qty: Number(it.Qty ?? 0) || 0,
            amount: Number(it.Amount ?? 0) || 0,
          });
        }
      }
      setRows(next);
    } catch (e: any) {
      setRows([]);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [canLoad, month, selectedOfficeId, year]);

  useEffect(() => {
    load();
  }, [load]);

  const COL_DATE = 110;
  const COL_ITEM = 190;
  const COL_QTY = 80;
  const COL_AMT = 100;
  const GRID_WIDTH = COL_DATE + COL_ITEM + COL_QTY + COL_AMT;
  const GRID_HEADER_BG = '#EEF2FF';
  const GRID_HEADER_TEXT = '#4338CA';
  const GRID_BORDER = '#E0E7FF';
  const ROW_ALT = '#FAFAFA';

  const cellBase = { paddingVertical: 14, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: GRID_BORDER, justifyContent: 'center' as const };
  const headerCellBase = { ...cellBase, paddingVertical: 13 };
  const headerCellText = [typography.label, { color: GRID_HEADER_TEXT, letterSpacing: 0.5, fontSize: tokens.text.xs, fontWeight: '700' as const }];
  const rowCellText = [typography.bodySmall, { color: colors.text, fontSize: (tokens.text.sm as number) - 4 }];
  const numText = { textAlign: 'right' as const, fontWeight: '700' as const };

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: 8, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.lg, gap: tokens.space.md }}>
        <Card variant="gradientBorder" style={{ paddingVertical: tokens.space.lg, paddingHorizontal: tokens.space.xl, borderRadius: tokens.radius.lg, borderWidth: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text, letterSpacing: -0.3 }]}>Item Wise Sale</Text>
              <Text style={[typography.caption, { marginTop: 4, color: colors.textMuted }]}>Date wise items</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: tokens.radius.md, backgroundColor: colors.surface }}>
              <Text style={[typography.label, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: tokens.space.sm, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Month" value={month} onChangeText={setMonth} keyboardType="numeric" placeholder="01-12" />
          </View>
          <Button variant="primary" size="sm" onPress={load} disabled={loading || !canLoad} style={{ marginBottom: 2 }}>
            {loading ? 'Loading' : 'Load'}
          </Button>
        </View>

        <Button
          variant="secondary"
          size="sm"
          disabled={loading || !canLoad}
          onPress={() => openReportPdf('office/report/item-wise.pdf', { year: toInt(year), month: toInt(month), officeId: selectedOfficeId })}
        >
          Export PDF
        </Button>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        <Card variant="elevated" style={{ flex: 1, overflow: 'hidden', borderRadius: tokens.radius.lg, ...tokens.shadow.md, shadowColor: colors.black }}>
          <View style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h4, { color: colors.text }]}>Report</Text>
              <Badge tone="info">{`${year}-${month}`}</Badge>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ minWidth: GRID_WIDTH, flex: 1 }}>
              <View style={{ flexDirection: 'row', backgroundColor: GRID_HEADER_BG, borderBottomWidth: 2, borderBottomColor: GRID_BORDER }}>
                <View style={[headerCellBase, { width: COL_DATE }]}>
                  <Text style={headerCellText}>Date</Text>
                </View>
                <View style={[headerCellBase, { width: COL_ITEM }]}>
                  <Text style={headerCellText}>Item Name</Text>
                </View>
                <View style={[headerCellBase, { width: COL_QTY }]}>
                  <Text style={[...headerCellText, { textAlign: 'right' }]}>Qty</Text>
                </View>
                <View style={[headerCellBase, { width: COL_AMT, borderRightWidth: 0 }]}>
                  <Text style={[...headerCellText, { textAlign: 'right' }]}>Amount</Text>
                </View>
              </View>

              <FlatList
                data={rows}
                keyExtractor={(i) => i.key}
                contentContainerStyle={{ paddingBottom: tokens.space.lg }}
                renderItem={({ item, index }) => (
                  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: GRID_BORDER, backgroundColor: index % 2 === 0 ? colors.white : ROW_ALT }}>
                    <View style={[cellBase, { width: COL_DATE }]}>
                      <Text style={rowCellText}>{item.date}</Text>
                    </View>
                    <View style={[cellBase, { width: COL_ITEM }]}>
                      <Text style={rowCellText} numberOfLines={1}>
                        {item.itemName}
                      </Text>
                    </View>
                    <View style={[cellBase, { width: COL_QTY }]}>
                      <Text style={[...rowCellText, numText]}>{Math.round(item.qty)}</Text>
                    </View>
                    <View style={[cellBase, { width: COL_AMT, borderRightWidth: 0 }]}>
                      <Text style={[...rowCellText, numText]}>{Math.round(item.amount)}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={!loading && !error ? <Text style={[typography.faint, { padding: tokens.space.lg }]}>No data.</Text> : null}
              />
            </View>
          </ScrollView>
        </Card>
      </View>
    </Screen>
  );
}

function OfficeReportPaymentsListScreen({ navigation, mode }: any) {
  const init = nowYearMonth();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stallName, setStallName] = useState('');
  const [amount, setAmount] = useState(0);

  const canLoad = useMemo(() => {
    const y = toInt(year);
    const m = toInt(month);
    return y >= 2000 && y <= 2100 && m >= 1 && m <= 12;
  }, [month, year]);

  useEffect(() => {
    (async () => {
      const id = await getSelectedOfficeId();
      setSelectedOfficeId(id);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!canLoad) {
      setError('Enter valid year/month');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<any>('office/payments', { params: { year: toInt(year), month: toInt(month), officeId: selectedOfficeId } });
      setStallName(String(data?.office?.stallName ?? ''));
      const totalPaid = Number(data?.totalPaid ?? 0) || 0;
      const balance = Number(data?.balance ?? 0) || 0;
      setAmount(mode === 'paid' ? totalPaid : balance);
    } catch (e: any) {
      setStallName('');
      setAmount(0);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [canLoad, mode, month, selectedOfficeId, year]);

  useEffect(() => {
    load();
  }, [load]);

  const COL_STALL = 190;
  const COL_MONTH = 110;
  const COL_AMT = 110;
  const GRID_WIDTH = COL_STALL + COL_MONTH + COL_AMT;
  const GRID_HEADER_BG = '#EEF2FF';
  const GRID_HEADER_TEXT = '#4338CA';
  const GRID_BORDER = '#E0E7FF';

  const cellBase = { paddingVertical: 14, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: GRID_BORDER, justifyContent: 'center' as const };
  const headerCellBase = { ...cellBase, paddingVertical: 13 };
  const headerCellText = [typography.label, { color: GRID_HEADER_TEXT, letterSpacing: 0.5, fontSize: tokens.text.xs, fontWeight: '700' as const }];
  const rowCellText = [typography.bodySmall, { color: colors.text, fontSize: (tokens.text.sm as number) - 4 }];
  const numText = { textAlign: 'right' as const, fontWeight: '700' as const };

  const title = mode === 'paid' ? 'Paid Payments' : 'Pending Payments';
  const emptyLabel = mode === 'paid' ? 'No paid payments.' : 'No pending payments.';

  const showRow = amount > 0 && stallName;

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: 8, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.lg, gap: tokens.space.md }}>
        <Card variant="gradientBorder" style={{ paddingVertical: tokens.space.lg, paddingHorizontal: tokens.space.xl, borderRadius: tokens.radius.lg, borderWidth: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text, letterSpacing: -0.3 }]}>{title}</Text>
              <Text style={[typography.caption, { marginTop: 4, color: colors.textMuted }]}>Stall wise</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: tokens.radius.md, backgroundColor: colors.surface }}>
              <Text style={[typography.label, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: tokens.space.sm, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Month" value={month} onChangeText={setMonth} keyboardType="numeric" placeholder="01-12" />
          </View>
          <Button variant="primary" size="sm" onPress={load} disabled={loading || !canLoad} style={{ marginBottom: 2 }}>
            {loading ? 'Loading' : 'Load'}
          </Button>
        </View>

        <Button
          variant="secondary"
          size="sm"
          disabled={loading || !canLoad}
          onPress={() =>
            openReportPdf(mode === 'paid' ? 'office/report/paid-payments.pdf' : 'office/report/pending-payments.pdf', {
              year: toInt(year),
              month: toInt(month),
              officeId: selectedOfficeId,
            })
          }
        >
          Export PDF
        </Button>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        <Card variant="elevated" style={{ flex: 1, overflow: 'hidden', borderRadius: tokens.radius.lg, ...tokens.shadow.md, shadowColor: colors.black }}>
          <View style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h4, { color: colors.text }]}>Report</Text>
              <Badge tone="info">{`${year}-${month}`}</Badge>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ minWidth: GRID_WIDTH, flex: 1 }}>
              <View style={{ flexDirection: 'row', backgroundColor: GRID_HEADER_BG, borderBottomWidth: 2, borderBottomColor: GRID_BORDER }}>
                <View style={[headerCellBase, { width: COL_STALL }]}>
                  <Text style={headerCellText}>Stall Name</Text>
                </View>
                <View style={[headerCellBase, { width: COL_MONTH }]}>
                  <Text style={headerCellText}>Month Bill</Text>
                </View>
                <View style={[headerCellBase, { width: COL_AMT, borderRightWidth: 0 }]}>
                  <Text style={[...headerCellText, { textAlign: 'right' }]}>Amount</Text>
                </View>
              </View>

              {showRow ? (
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: GRID_BORDER, backgroundColor: colors.white }}>
                  <View style={[cellBase, { width: COL_STALL }]}>
                    <Text style={rowCellText}>{stallName}</Text>
                  </View>
                  <View style={[cellBase, { width: COL_MONTH }]}>
                    <Text style={rowCellText}>{`${year}-${month}`}</Text>
                  </View>
                  <View style={[cellBase, { width: COL_AMT, borderRightWidth: 0 }]}>
                    <Text style={[...rowCellText, numText]}>{Math.round(amount)}</Text>
                  </View>
                </View>
              ) : !loading && !error ? (
                <Text style={[typography.faint, { padding: tokens.space.lg }]}>{emptyLabel}</Text>
              ) : null}
            </View>
          </ScrollView>
        </Card>
      </View>
    </Screen>
  );
}

function OfficeReportPendingPaymentsScreen(props: any) {
  return <OfficeReportPaymentsListScreen {...props} mode="pending" />;
}

function OfficeReportPaidPaymentsScreen(props: any) {
  return <OfficeReportPaymentsListScreen {...props} mode="paid" />;
}

export function OfficeReportNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OfficeReportMenu" component={OfficeReportMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OfficeReportDayWiseOrders" component={OfficeReportDayWiseOrdersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OfficeReportItemWiseSale" component={OfficeReportItemWiseSaleScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OfficeReportPendingPayments" component={OfficeReportPendingPaymentsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OfficeReportPaidPayments" component={OfficeReportPaidPaymentsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
