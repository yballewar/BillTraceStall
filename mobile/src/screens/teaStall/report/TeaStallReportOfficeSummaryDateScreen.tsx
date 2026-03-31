import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { Badge, Button, Card, Screen, colors, tokens, typography } from '../../../ui';
import { todayKey, useDailyStallReport } from './useDailyStallReport';

export function TeaStallReportOfficeSummaryDateScreen({ route, navigation }: any) {
  const initialDate = String(route?.params?.date ?? todayKey());
  const [date, setDate] = useState(initialDate);
  const [dateOpen, setDateOpen] = useState(false);
  const { loading, error, data, load, canLoad } = useDailyStallReport(date);

  const rows = useMemo(() => {
    const list = data?.byOffice ?? [];
    return list.map((o) => ({
      id: o.officeId,
      date,
      officeName: `${o.officeName} (Cash=${Math.round(o.cashAmount)}/Credit=${Math.round(o.creditAmount)})`,
      amount: o.amount,
    }));
  }, [data, date]);

  const totalAmount = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);

  const COL_DATE = 81;
  const COL_OFFICE = 140;
  const COL_AMOUNT = 78;
  const GRID_WIDTH = COL_DATE + COL_OFFICE + COL_AMOUNT;

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
              <Text style={[typography.caption, { marginTop: 4, color: colors.textMuted }]}>Date • {date}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: tokens.radius.md, backgroundColor: colors.surface }}>
              <Text style={[typography.label, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: tokens.space.sm, alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={() => setDateOpen(true)} activeOpacity={0.85} style={{ flex: 1, borderWidth: 1.5, borderColor: colors.borderStrong, padding: 14, borderRadius: tokens.radius.lg, backgroundColor: colors.surface }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{date}</Text>
            <Text style={[typography.faint, { marginTop: 4 }]}>Select date</Text>
          </TouchableOpacity>
          <Button variant="primary" size="sm" onPress={load} disabled={loading || !canLoad} style={{ marginBottom: 2 }}>
            {loading ? 'Loading' : 'Load'}
          </Button>
        </View>

        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

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
                <Text style={[typography.h4, { color: colors.text }]}>Office Wise Report</Text>
                <Badge tone="info">{date}</Badge>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ minWidth: GRID_WIDTH, flex: 1 }}>
                <View style={{ flexDirection: 'row', backgroundColor: GRID_HEADER_BG, borderBottomWidth: 2, borderBottomColor: GRID_BORDER }}>
                  <View style={[headerCellBase, { width: COL_DATE }]}>
                    <Text style={headerCellText}>Date</Text>
                  </View>
                  <View style={[headerCellBase, { width: COL_OFFICE }]}>
                    <Text style={headerCellText}>Office Name (Cash/Credit)</Text>
                  </View>
                  <View style={[headerCellBase, { width: COL_AMOUNT, borderRightWidth: 0 }]}>
                    <Text style={[...headerCellText, { textAlign: 'right' }]}>Amount</Text>
                  </View>
                </View>

                <FlatList
                  data={rows}
                  keyExtractor={(i) => i.id}
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
                        <Text style={rowCellText} numberOfLines={1}>{item.date}</Text>
                      </View>
                      <View style={[cellBase, { width: COL_OFFICE }]}>
                        <Text style={rowCellText} numberOfLines={2}>{item.officeName}</Text>
                      </View>
                      <View style={[cellBase, { width: COL_AMOUNT, borderRightWidth: 0 }]}>
                        <Text style={[...rowCellText, numText, { color: colors.text }]}>{Math.round(item.amount)}</Text>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    !loading ? (
                      <View style={{ padding: tokens.space.xxl, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>No data for this date</Text>
                        <Text style={[typography.faint, { marginTop: tokens.space.xs }]}>Try a different date</Text>
                      </View>
                    ) : null
                  }
                  ListFooterComponent={
                    rows.length > 0 ? (
                      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderTopColor: GRID_BORDER, backgroundColor: TOTALS_BG, paddingVertical: 13 }}>
                        <View style={[totalsCellBase, { width: COL_DATE }]}>
                          <Text style={[typography.label, { color: colors.text, fontWeight: '800', fontSize: tokens.text.sm }]}>Total</Text>
                        </View>
                        <View style={[totalsCellBase, { width: COL_OFFICE }]}>
                          <Text style={[typography.label, { color: colors.textMuted, fontWeight: '800', fontSize: tokens.text.sm }]}>—</Text>
                        </View>
                        <View style={[totalsCellBase, { width: COL_AMOUNT, borderRightWidth: 0 }]}>
                          <Text style={[typography.label, { textAlign: 'right', color: colors.text, fontWeight: '800', fontSize: tokens.text.sm }]}>{Math.round(totalAmount)}</Text>
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
