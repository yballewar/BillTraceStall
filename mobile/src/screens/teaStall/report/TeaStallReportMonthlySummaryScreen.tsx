import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../../services/api';
import { Badge, Screen } from '../../../ui';

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

  const GRID_HEADER_BG = '#c99359';
  const GRID_HEADER_TEXT = '#4f2d0f';
  const GRID_BORDER = '#8e5f32';
  const ROW_ALT = '#ffffff';
  const TOTALS_BG = '#f5ebdf';

  const cellBase = { paddingVertical: 14, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: GRID_BORDER, justifyContent: 'center' as const };
  const headerCellBase = { ...cellBase, paddingVertical: 13 };
  const totalsCellBase = { ...cellBase, paddingVertical: 13 };
  const headerCellText = [{ color: GRID_HEADER_TEXT, letterSpacing: 0.2, fontSize: 13, fontWeight: '800' as const }];
  const rowCellText = [{ color: '#4f2d0f', fontSize: 13 }];
  const numText = { textAlign: 'right' as const, fontWeight: '600' as const };

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sale summary</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>{loading ? 'LOADING' : 'REFRESH'}</Text>
        </TouchableOpacity>
        <Image source={require('../../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>
      <View style={styles.body}>
        <Image source={require('../../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />
        <Text style={styles.sectionTitle}>DAY WISE REPORT</Text>
        <View style={styles.filterWrap}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Year</Text>
            <TouchableOpacity style={styles.inputChip}><Text style={styles.inputText}>{year}</Text></TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Month</Text>
            <TouchableOpacity style={styles.inputChip}><Text style={styles.inputText}>{month}</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={load} disabled={loading || !canLoad} style={styles.loadBtn}><Text style={styles.loadBtnText}>Load</Text></TouchableOpacity>
        </View>
        {loading ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6b3508" />
            <Text style={{ marginTop: 8, color: '#7f6d5d' }}>Loading report...</Text>
          </View>
        ) : null}
        {error ? <Text style={{ color: '#c73939', marginBottom: 10 }}>{error}</Text> : null}
        {!loading && (
        <View style={styles.tableCard}>
          <View style={styles.tableHeadWrap}>
            <Text style={styles.tableTitle}>Day wise Report</Text>
            <Badge tone="warning">{data?.month ?? `${year}-${month}`}</Badge>
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
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      borderBottomWidth: 1,
                      borderBottomColor: GRID_BORDER,
                      backgroundColor: index % 2 === 0 ? '#fff' : ROW_ALT,
                    }}
                  >
                    <View style={[cellBase, { width: COL_DATE }]}>
                      <Text style={rowCellText}>{item.date}</Text>
                    </View>
                    <View style={[cellBase, { width: COL_NUM }]}>
                      <Text style={[...rowCellText, numText, { color: '#4f2d0f' }]}>{Math.round(item.billAmount)}</Text>
                    </View>
                    <View style={[cellBase, { width: COL_NUM }]}>
                      <Text style={[...rowCellText, numText, { color: '#35a760' }]}>{Math.round(item.cash)}</Text>
                    </View>
                    <View style={[cellBase, { width: COL_NUM, borderRightWidth: 0 }]}>
                      <Text style={[...rowCellText, numText, { color: '#4f2d0f' }]}>{Math.round(item.credit)}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', paddingVertical: 14, color: '#8f7b67' }}>No data for this period</Text> : null}
                ListFooterComponent={
                  data?.totals ? (
                    <View style={{ flexDirection: 'row', borderTopWidth: 2, borderTopColor: GRID_BORDER, backgroundColor: TOTALS_BG, paddingVertical: 1 }}>
                      <View style={[totalsCellBase, { width: COL_DATE }]}>
                        <Text style={{ color: '#4f2d0f', fontWeight: '800', fontSize: 13 }}>TOTAL</Text>
                      </View>
                      <View style={[totalsCellBase, { width: COL_NUM }]}>
                        <Text style={{ textAlign: 'right', color: '#4f2d0f', fontWeight: '800', fontSize: 13 }}>{Math.round(data.totals.billAmount)}</Text>
                      </View>
                      <View style={[totalsCellBase, { width: COL_NUM }]}>
                        <Text style={{ textAlign: 'right', color: '#35a760', fontWeight: '800', fontSize: 13 }}>{Math.round(data.totals.cash)}</Text>
                      </View>
                      <View style={[totalsCellBase, { width: COL_NUM, borderRightWidth: 0 }]}>
                        <Text style={{ textAlign: 'right', color: '#4f2d0f', fontWeight: '800', fontSize: 13 }}>{Math.round(data.totals.credit)}</Text>
                      </View>
                    </View>
                  ) : null
                }
              />
            </View>
          </ScrollView>
        </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#5b2e08', paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  headerTitle: { fontSize: 40, fontWeight: '900', color: '#d6a064', marginBottom: 14 },
  refreshBtn: { borderWidth: 1.5, borderColor: '#d6a064', borderRadius: 18, alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 6 },
  refreshText: { color: '#d6a064', fontSize: 16, fontWeight: '800' },
  kettle: { position: 'absolute', right: -22, bottom: -8, width: 205, height: 158, opacity: 0.92 },
  body: { flex: 1, backgroundColor: '#f2f0ed', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -12, paddingHorizontal: 16, paddingTop: 16 },
  glass: { position: 'absolute', right: -24, top: 90, width: 188, height: 520, opacity: 0.35 },
  sectionTitle: { color: '#4f2d0f', fontSize: 22, fontWeight: '900', marginBottom: 10 },
  filterWrap: { borderWidth: 1, borderColor: '#4f2d0f', backgroundColor: '#fff', borderRadius: 18, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginBottom: 10 },
  label: { color: '#4f2d0f', fontWeight: '800', marginBottom: 6 },
  inputChip: { borderWidth: 1, borderColor: '#8e5f32', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  inputText: { color: '#4f2d0f', fontWeight: '800', fontSize: 17 },
  loadBtn: { backgroundColor: '#6b3508', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 11 },
  loadBtnText: { color: '#d6a064', fontWeight: '900' },
  tableCard: { flex: 1, overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: '#d7cdbf', backgroundColor: '#fff', width: Dimensions.get('window').width * 0.96, alignSelf: 'center' },
  tableHeadWrap: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#e7ddd4', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { color: '#4f2d0f', fontWeight: '900', fontSize: 22 },
});
