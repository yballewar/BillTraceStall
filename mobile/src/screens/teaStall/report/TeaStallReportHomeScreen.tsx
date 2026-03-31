import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { todayKey, useDailyStallReport } from './useDailyStallReport';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { Badge, Button, Card, TeaShell, colors, tokens, typography } from '../../../ui';

function cardValue(v: number | undefined) {
  return Math.round(v ?? 0);
}

export function TeaStallReportHomeScreen({ navigation }: any) {
  const [date, setDate] = useState(todayKey());
  const [dateOpen, setDateOpen] = useState(false);
  const [view, setView] = useState<'summary' | 'menu'>('summary');
  const { loading, error, data, load } = useDailyStallReport(date);

  const totals = data?.totals;
  const quick = useMemo(() => {
    if (!data) return null;
    return {
      topOffices: data.byOffice.slice(0, 3),
      topItems: data.byItem.slice(0, 3),
      topDelivery: data.byDeliveryBoy.slice(0, 3),
    };
  }, [data]);

  return (
    <TeaShell title="Reports" subtitle={view === 'summary' ? 'Daily summary' : 'Choose a report type'} icon="bar-chart" rightAction={{ icon: 'refresh', onPress: load, disabled: loading }} scroll={false}>
      <View style={{ flex: 1, gap: tokens.space.lg }}>

        <View style={{ flexDirection: 'row', borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: tokens.radius.lg, overflow: 'hidden' }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setView('summary')}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: view === 'summary' ? colors.primary : colors.surface }}
          >
            <Text style={{ fontWeight: '800', color: view === 'summary' ? colors.white : colors.textMuted }}>Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setView('menu')}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: view === 'menu' ? colors.primary : colors.surface, borderLeftWidth: 1.5, borderLeftColor: colors.borderStrong }}
          >
            <Text style={{ fontWeight: '800', color: view === 'menu' ? colors.white : colors.textMuted }}>Menu</Text>
          </TouchableOpacity>
        </View>

        {view === 'summary' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setDateOpen(true)}
                style={{ flex: 1, borderWidth: 1.5, borderColor: colors.borderStrong, padding: 14, borderRadius: tokens.radius.lg, backgroundColor: colors.surface }}
              >
                <Text style={{ fontWeight: '700', color: colors.text }}>{date}</Text>
                <Text style={[typography.faint, { marginTop: 4 }]}>Select date</Text>
              </TouchableOpacity>
              <Button onPress={load} size="sm">Load</Button>
            </View>

            <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

            {loading ? <ActivityIndicator color={colors.primary} /> : null}
            {error ? <Badge tone="danger">{error}</Badge> : null}

            {data ? (
              <Card variant="elevated" style={{ gap: tokens.space.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={typography.h4}>Totals</Text>
                  <Badge tone="info">{data?.date ?? date}</Badge>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    { label: 'Sale', value: cardValue(totals?.totalAmount), color: colors.success },
                    { label: 'Orders', value: totals?.totalOrders ?? 0, color: colors.info },
                    { label: 'Qty', value: totals?.totalQty ?? 0, color: colors.purple },
                    { label: 'Cash', value: cardValue(totals?.cashSale), color: colors.warning },
                    { label: 'Credit', value: cardValue(totals?.creditSale), color: colors.textMuted },
                  ].map((s, i) => (
                    <View key={i} style={{ flex: 1, minWidth: '28%', backgroundColor: colors.surface, borderRadius: tokens.radius.md, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={typography.faint}>{s.label}</Text>
                      <Text style={[typography.h4, { color: s.color }]}>{s.value}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportOffice', { date })}
                style={{ flex: 1, minWidth: '45%', paddingVertical: 16, paddingHorizontal: 16, borderRadius: tokens.radius.lg, backgroundColor: colors.info }}
              >
                <Text style={{ color: colors.white, fontWeight: '700' }}>Office Wise</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: tokens.text.sm }}>Sale & cash/credit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportItems', { date })}
                style={{ flex: 1, minWidth: '45%', paddingVertical: 16, paddingHorizontal: 16, borderRadius: tokens.radius.lg, backgroundColor: colors.purple }}
              >
                <Text style={{ color: colors.white, fontWeight: '700' }}>Item Wise</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: tokens.text.sm }}>Qty & sale</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('ReportDelivery', { date })}
              style={{ paddingVertical: 16, paddingHorizontal: 16, borderRadius: tokens.radius.lg, backgroundColor: colors.success }}
            >
              <Text style={{ color: colors.white, fontWeight: '700' }}>Delivery Boy</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: tokens.text.sm }}>Sale & collection</Text>
            </TouchableOpacity>

            {quick ? (
              <Card variant="elevated" style={{ gap: tokens.space.lg }}>
                <Text style={typography.h4}>Quick view</Text>
                <View style={{ gap: 8 }}>
                  <Text style={typography.label}>Top offices</Text>
                  {quick.topOffices.map((o) => (
                    <TouchableOpacity
                      key={o.officeId}
                      onPress={() => navigation.navigate('ReportOfficeOrders', { date, officeId: o.officeId, officeName: o.officeName })}
                      style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '600' }}>{o.officeName} • ₹{Math.round(o.amount)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={typography.label}>Top items</Text>
                  {quick.topItems.map((i) => (
                    <Text key={i.menuItemId} style={typography.body}>{i.itemName} • {i.qty}</Text>
                  ))}
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={typography.label}>Top delivery</Text>
                  {quick.topDelivery.map((d) => (
                    <TouchableOpacity
                      key={String(d.deliveryBoyId ?? 'unassigned')}
                      onPress={() => navigation.navigate('ReportDeliveryOrders', { date, deliveryBoyId: d.deliveryBoyId, name: d.name })}
                      style={{ paddingVertical: 6 }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '600' }}>{d.name} • ₹{Math.round(d.cashCollected)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            ) : null}
          </>
        ) : (
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: tokens.space.xxxl }} showsVerticalScrollIndicator={false}>
            {[
              { title: 'Stall Sale Summary (Day Wise)', subtitle: 'Date, Bill Amount, Cash, Credit with totals', onPress: () => navigation.navigate('ReportMonthlySummary'), color: colors.info, icon: 'S' },
              { title: 'Office Wise Summary (Date)', subtitle: 'Date, Office, Cash/Credit, Amount', onPress: () => navigation.navigate('ReportOfficeSummaryDate', { date }), color: colors.info, icon: 'O' },
              { title: 'Office Wise Summary (Month)', subtitle: 'Date, Office, Cash/Credit, Amount by month', onPress: () => navigation.navigate('ReportOfficeSummaryMonth'), color: colors.info, icon: 'M' },
              { title: 'Daily Summary (Old)', subtitle: 'Daily summary for selected date', onPress: () => setView('summary'), color: colors.success, icon: 'D' },
              { title: 'Office Wise', subtitle: 'Sale & cash/credit by office', onPress: () => navigation.navigate('ReportOffice', { date }), color: colors.info, icon: 'O' },
              { title: 'Item Wise', subtitle: 'Qty & sale by items', onPress: () => navigation.navigate('ReportItems', { date }), color: colors.purple, icon: 'I' },
              { title: 'Delivery Boy', subtitle: 'Sale & collection by delivery boy', onPress: () => navigation.navigate('ReportDelivery', { date }), color: colors.warning, icon: 'B' },
            ].map((m) => (
              <TouchableOpacity
                key={m.title}
                activeOpacity={0.8}
                onPress={m.onPress}
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
        )}
      </View>
    </TeaShell>
  );
}
