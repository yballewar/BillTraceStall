import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../../services/api';
import { Badge, Button, Card, Input, Screen, colors, tokens, typography } from '../../../ui';

type Row = {
  date: string;
  billAmount: number;
  cash: number;
  credit: number;
};

type Response = {
  month: string;
  rows: Row[];
  totals: { billAmount: number; cash: number; credit: number };
};

function nowYearMonth() {
  const d = new Date();
  return { year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0') };
}

function toInt(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function TeaStallReportMonthlySummaryScreen({ navigation }: any) {
  const init = nowYearMonth();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
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
    try {
      const { data } = await api.get<Response>('stall/report/day-wise-summary', { params: { year: toInt(year), month: toInt(month) } });
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
              <Text style={[typography.h3, { color: colors.text, letterSpacing: -0.3 }]}>Sale Summary</Text>
              <Text style={[typography.caption, { marginTop: 4, color: colors.textMuted }]}>Day-wise report • {data?.month ?? `${year}-${month}`}</Text>
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

        {!loading && (
        <Card variant="elevated" style={{ flex: 1, overflow: 'hidden', borderRadius: tokens.radius.lg, ...tokens.shadow.md, shadowColor: colors.black, width: Dimensions.get('window').width * 0.96, alignSelf: 'center' }}>
          <View style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h4, { color: colors.text }]}>Day Wise Report</Text>
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
                data={data?.rows ?? []}
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
                    !loading ? (
                      <View style={{ padding: tokens.space.xxl, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>No data for this period</Text>
                        <Text style={[typography.faint, { marginTop: tokens.space.xs }]}>Try a different month</Text>
                      </View>
                    ) : null
                  }
                ListFooterComponent={
                  data?.totals ? (
                    <View style={{ flexDirection: 'row', borderTopWidth: 2, borderTopColor: GRID_BORDER, backgroundColor: TOTALS_BG, paddingVertical: 1 }}>
                      <View style={[totalsCellBase, { width: COL_DATE }]}>
                        <Text style={[typography.label, { color: colors.text, fontWeight: '800', fontSize: tokens.text.sm }]}>Total</Text>
                      </View>
                      <View style={[totalsCellBase, { width: COL_NUM }]}>
                        <Text style={[typography.label, { textAlign: 'right', color: colors.text, fontWeight: '800', fontSize: tokens.text.sm }]}>{Math.round(data.totals.billAmount)}</Text>
                      </View>
                      <View style={[totalsCellBase, { width: COL_NUM }]}>
                        <Text style={[typography.label, { textAlign: 'right', color: colors.success, fontWeight: '800', fontSize: tokens.text.sm }]}>{Math.round(data.totals.cash)}</Text>
                      </View>
                      <View style={[totalsCellBase, { width: COL_NUM, borderRightWidth: 0 }]}>
                        <Text style={[typography.label, { textAlign: 'right', color: colors.warning, fontWeight: '800', fontSize: tokens.text.sm }]}>{Math.round(data.totals.credit)}</Text>
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
