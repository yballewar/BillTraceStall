import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../../services/api';
import { Badge, Button, Card, Input, Screen, colors, tokens, typography } from '../../../ui';

type OfficeRow = {
  date: string;
  officeId: string;
  officeName: string;
  cashAmount: number;
  creditAmount: number;
  amount: number;
};

type Response = {
  month: string;
  rows: OfficeRow[];
  totals?: { billAmount: number; cash: number; credit: number };
};

function nowYearMonth() {
  const d = new Date();
  return { year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0') };
}

function toInt(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function TeaStallReportOfficeSummaryMonthScreen({ navigation }: any) {
  const init = nowYearMonth();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [officeSearch, setOfficeSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Response | null>(null);

  const COL_DATE = 81;
  const COL_NUM = 78;
  const GRID_WIDTH = COL_DATE + COL_NUM * 3;

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
    setSelectedOfficeId('');
    try {
      const { data } = await api.get<Response>('stall/report/office-wise-summary', { params: { year: toInt(year), month: toInt(month) } });
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

  const offices = useMemo(() => {
    const list = data?.rows ?? [];
    const byId = new Map<string, { officeId: string; officeName: string }>();
    list.forEach((r) => {
      if (!byId.has(r.officeId)) byId.set(r.officeId, { officeId: r.officeId, officeName: r.officeName });
    });
    const arr = Array.from(byId.values());
    const term = officeSearch.trim().toLowerCase();
    if (!term) return arr;
    return arr.filter((o) => o.officeName.toLowerCase().includes(term));
  }, [data, officeSearch]);

  const rows = useMemo(() => {
    if (!selectedOfficeId) return [];
    const list = data?.rows ?? [];
    return list
      .filter((r) => r.officeId === selectedOfficeId)
      .map((r) => ({
        date: r.date,
        billAmount: r.amount,
        cash: r.cashAmount,
        credit: r.creditAmount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, selectedOfficeId]);

  const totals = useMemo(() => {
    return rows.reduce(
      (s, r) => ({ billAmount: s.billAmount + r.billAmount, cash: s.cash + r.cash, credit: s.credit + r.credit }),
      { billAmount: 0, cash: 0, credit: 0 }
    );
  }, [rows]);

  const selectedOfficeName = useMemo(() => offices.find((o) => o.officeId === selectedOfficeId)?.officeName ?? '', [offices, selectedOfficeId]);

  const GRID_HEADER_BG = '#EEF2FF';
  const GRID_HEADER_TEXT = '#4338CA';
  const GRID_BORDER = '#E0E7FF';
  const ROW_ALT = '#FAFAFA';
  const TOTALS_BG = '#F5F3FF';

  const cellBase = { paddingVertical: 14, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: GRID_BORDER, justifyContent: 'center' as const };
  const headerCellBase = { ...cellBase, paddingVertical: 13 };
  const totalsCellBase = { ...cellBase, paddingVertical: 13 };
  const headerCellText = [typography.label, { color: GRID_HEADER_TEXT, letterSpacing: 0.5, fontSize: tokens.text.xs, fontWeight: '700' as const }];
  const rowCellText = [typography.bodySmall, { color: colors.text, fontSize: (tokens.text.sm as number) - 4 }];
  const numText = { textAlign: 'right' as const, fontWeight: '600' as const };

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: 8, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.lg, gap: tokens.space.md }}>
        <Card variant="gradientBorder" style={{ paddingVertical: tokens.space.lg, paddingHorizontal: tokens.space.xl, borderRadius: tokens.radius.lg, borderWidth: 0, width: Dimensions.get('window').width * 1.01, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text, letterSpacing: -0.3 }]}>Office Wise Summary</Text>
              <Text style={[typography.caption, { marginTop: 4, color: colors.textMuted }]} numberOfLines={2}>
                {data?.month ?? `${year}-${month}`}{selectedOfficeName ? ` • ${selectedOfficeName}` : ' • Select office'}
              </Text>
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

        {!loading && data && (
          <View style={{ gap: tokens.space.sm }}>
            <Input label="Select Office" value={officeSearch} onChangeText={setOfficeSearch} placeholder="Search office name" />
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 100 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {offices.map((o) => (
                  <TouchableOpacity
                    key={o.officeId}
                    onPress={() => setSelectedOfficeId(o.officeId)}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: tokens.radius.md,
                      borderWidth: 2,
                      borderColor: selectedOfficeId === o.officeId ? colors.primary : colors.borderStrong,
                      backgroundColor: selectedOfficeId === o.officeId ? colors.primary + '20' : colors.surface,
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: selectedOfficeId === o.officeId ? colors.primary : colors.text }} numberOfLines={1}>
                      {o.officeName}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            {offices.length === 0 && <Text style={[typography.faint, { paddingVertical: tokens.space.sm }]}>No offices found. Try Load first.</Text>}
          </View>
        )}

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: tokens.space.xxxl }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.bodySmall, { marginTop: tokens.space.md, color: colors.textMuted }]}>Loading report…</Text>
          </View>
        ) : null}

        {error ? (
          <Card variant="outlined" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger, padding: tokens.space.md, borderRadius: tokens.radius.lg }}>
            <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>
          </Card>
        ) : null}

        {!loading && selectedOfficeId && (
          <Card variant="elevated" style={{ flex: 1, overflow: 'hidden', borderRadius: tokens.radius.lg, ...tokens.shadow.md, shadowColor: colors.black, width: Dimensions.get('window').width * 0.96, alignSelf: 'center' }}>
            <View style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{selectedOfficeName}</Text>
                <Badge tone="info">{data?.month ?? `${year}-${month}`}</Badge>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ minWidth: GRID_WIDTH, flex: 1 }}>
                <View style={{ flexDirection: 'row', backgroundColor: GRID_HEADER_BG, borderBottomWidth: 2, borderBottomColor: GRID_BORDER }}>
                  <View style={[headerCellBase, { width: COL_DATE }]}>
                    <Text style={headerCellText}>Date</Text>
                  </View>
                  <View style={[headerCellBase, { width: COL_NUM }]}>
                    <Text style={[...headerCellText, { textAlign: 'right' }]}>Bill Amount</Text>
                  </View>
                  <View style={[headerCellBase, { width: COL_NUM }]}>
                    <Text style={[...headerCellText, { textAlign: 'right' }]}>Cash</Text>
                  </View>
                  <View style={[headerCellBase, { width: COL_NUM, borderRightWidth: 0 }]}>
                    <Text style={[...headerCellText, { textAlign: 'right' }]}>Credit</Text>
                  </View>
                </View>

                <FlatList
                  data={rows}
                  keyExtractor={(i) => i.date}
                  contentContainerStyle={{ paddingBottom: tokens.space.lg }}
                  renderItem={({ item, index }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        borderBottomWidth: 1,
                        borderBottomColor: GRID_BORDER,
                        backgroundColor: index % 2 === 0 ? colors.white : ROW_ALT,
                      }}
                    >
                      <View style={[cellBase, { width: COL_DATE }]}>
                        <Text style={rowCellText}>{item.date}</Text>
                      </View>
                      <View style={[cellBase, { width: COL_NUM }]}>
                        <Text style={[...rowCellText, numText, { color: colors.text }]}>{Math.round(item.billAmount)}</Text>
                      </View>
                      <View style={[cellBase, { width: COL_NUM }]}>
                        <Text style={[...rowCellText, numText, { color: colors.success }]}>{Math.round(item.cash)}</Text>
                      </View>
                      <View style={[cellBase, { width: COL_NUM, borderRightWidth: 0 }]}>
                        <Text style={[...rowCellText, numText, { color: colors.warning }]}>{Math.round(item.credit)}</Text>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={{ padding: tokens.space.xxl, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>No data for this office</Text>
                    </View>
                  }
                  ListFooterComponent={
                    rows.length > 0 ? (
                      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderTopColor: GRID_BORDER, backgroundColor: TOTALS_BG, paddingVertical: 13 }}>
                        <View style={[totalsCellBase, { width: COL_DATE }]}>
                          <Text style={[typography.label, { color: colors.text, fontWeight: '800', fontSize: tokens.text.sm }]}>Total</Text>
                        </View>
                        <View style={[totalsCellBase, { width: COL_NUM }]}>
                          <Text style={[typography.label, { textAlign: 'right', color: colors.text, fontWeight: '800', fontSize: tokens.text.sm }]}>{Math.round(totals.billAmount)}</Text>
                        </View>
                        <View style={[totalsCellBase, { width: COL_NUM }]}>
                          <Text style={[typography.label, { textAlign: 'right', color: colors.success, fontWeight: '800', fontSize: tokens.text.sm }]}>{Math.round(totals.cash)}</Text>
                        </View>
                        <View style={[totalsCellBase, { width: COL_NUM, borderRightWidth: 0 }]}>
                          <Text style={[typography.label, { textAlign: 'right', color: colors.warning, fontWeight: '800', fontSize: tokens.text.sm }]}>{Math.round(totals.credit)}</Text>
                        </View>
                      </View>
                    ) : null
                  }
                />
              </View>
            </ScrollView>
          </Card>
        )}
      </View>
    </Screen>
  );
}
