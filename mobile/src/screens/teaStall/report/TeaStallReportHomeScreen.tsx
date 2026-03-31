import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { todayKey, useDailyStallReport } from './useDailyStallReport';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { Badge, Screen } from '../../../ui';

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
  const C = {
    page: '#FFFFFF',
    header: '#5b2e08',
    title: '#d6a064',
    body: '#f2f0ed',
    textDark: '#4f2d0f',
    card: '#6b3508',
    tan: '#c99359',
    border: '#d7cdbf',
  };

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={{ backgroundColor: C.page }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>{loading ? 'LOADING' : 'REFRESH'}</Text>
        </TouchableOpacity>
        <Image source={require('../../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>
      <View style={styles.body}>
        <Image source={require('../../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />
        <Text style={styles.sectionTitle}>{view === 'summary' ? 'DAILY SUMMARY' : 'CHOOSE A REPORT TYPE'}</Text>
        <View style={styles.segment}>
          <TouchableOpacity onPress={() => setView('summary')} style={[styles.segmentBtn, view === 'summary' && styles.segmentBtnOn]}>
            <Text style={[styles.segmentText, view === 'summary' && styles.segmentTextOn]}>Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('menu')} style={[styles.segmentBtn, view === 'menu' && styles.segmentBtnOn]}>
            <Text style={[styles.segmentText, view === 'menu' && styles.segmentTextOn]}>Menu</Text>
          </TouchableOpacity>
        </View>
        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />
        {view === 'summary' ? (
          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={styles.dateLoad}>
              <TouchableOpacity onPress={() => setDateOpen(true)} style={styles.dateBox}>
                <Text style={styles.dateMain}>{date}</Text>
                <Text style={styles.dateSub}>Select date</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={load} style={styles.loadBtn}>
                <Text style={styles.loadBtnText}>Load</Text>
              </TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator color={C.card} /> : null}
            {error ? <Badge tone="danger">{error}</Badge> : null}
            {data ? (
              <View style={styles.totalWrap}>
                <View style={styles.totalHead}>
                  <Text style={styles.totalTitle}>Total</Text>
                  <View style={styles.dateChip}><Text style={styles.dateChipText}>{data?.date ?? date}</Text></View>
                </View>
                <View style={styles.metricGrid}>
                  {[
                    { label: 'Sale', value: cardValue(totals?.totalAmount), color: '#35a760' },
                    { label: 'Orders', value: totals?.totalOrders ?? 0, color: '#0086d1' },
                    { label: 'Quantity', value: totals?.totalQty ?? 0, color: '#c35edd' },
                    { label: 'Cash', value: cardValue(totals?.cashSale), color: '#f2a623' },
                    { label: 'Credit', value: cardValue(totals?.creditSale), color: '#6f6f6f' },
                  ].map((m) => (
                    <View key={m.label} style={styles.metricBox}>
                      <Text style={styles.metricLabel}>{m.label}</Text>
                      <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.navRow}>
              <TouchableOpacity onPress={() => navigation.navigate('ReportOffice', { date })} style={styles.navBtn}>
                <Text style={styles.navTitle}>Office Wise</Text>
                <Text style={styles.navSub}>Sale & cash/credit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ReportItems', { date })} style={styles.navBtn}>
                <Text style={styles.navTitle}>Item Wise</Text>
                <Text style={styles.navSub}>Qty & Sale</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ReportDelivery', { date })} style={styles.navBtn}>
              <Text style={styles.navTitle}>Delivery Boy</Text>
              <Text style={styles.navSub}>Sale & Collection</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {[
              { title: 'Stall Sale Summary', subtitle: 'Date, Bill Amount, Cash, Credit with totals', onPress: () => navigation.navigate('ReportMonthlySummary'), icon: 'S' },
              { title: 'Office Wise Summary', subtitle: 'Date, Office, Cash/Credit, Amount', onPress: () => navigation.navigate('ReportOfficeSummaryDate', { date }), icon: 'O' },
              { title: 'Office Wise Summary', subtitle: 'Date, Office, Cash/Credit, Amount by month', onPress: () => navigation.navigate('ReportOfficeSummaryMonth'), icon: 'O' },
              { title: 'Daily Summary', subtitle: 'Daily summary for selected date', onPress: () => setView('summary'), icon: 'D' },
              { title: 'Office Wise', subtitle: 'Sale & cash/credit by office', onPress: () => navigation.navigate('ReportOffice', { date }), icon: 'O' },
              { title: 'Item Wise', subtitle: 'Qty & sale by items', onPress: () => navigation.navigate('ReportItems', { date }), icon: 'I' },
              { title: 'Delivery Boy', subtitle: 'Sale & collection by delivery boy', onPress: () => navigation.navigate('ReportDelivery', { date }), icon: 'B' },
            ].map((m) => (
              <TouchableOpacity key={m.title + m.subtitle} onPress={m.onPress} style={styles.menuItem}>
                <View style={styles.menuIcon}><Text style={styles.menuIconText}>{m.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{m.title}</Text>
                  <Text style={styles.menuSub}>{m.subtitle}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5b2e08', paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  headerTitle: { fontSize: 40, fontWeight: '900', color: '#d6a064', marginBottom: 14 },
  refreshBtn: { borderWidth: 1.5, borderColor: '#d6a064', borderRadius: 18, alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 6 },
  refreshText: { color: '#d6a064', fontSize: 16, fontWeight: '800' },
  kettle: { position: 'absolute', right: -22, bottom: -8, width: 205, height: 158, opacity: 0.92 },
  body: { flex: 1, backgroundColor: '#f2f0ed', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -12, paddingHorizontal: 16, paddingTop: 16 },
  glass: { position: 'absolute', right: -24, top: 90, width: 188, height: 520, opacity: 0.35 },
  sectionTitle: { color: '#4f2d0f', fontSize: 22, fontWeight: '900', marginBottom: 10 },
  segment: { flexDirection: 'row', borderRadius: 999, overflow: 'hidden', marginBottom: 10, backgroundColor: '#6b3508' },
  segmentBtn: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  segmentBtnOn: { backgroundColor: '#c99359' },
  segmentText: { color: '#d2c4b6', fontWeight: '900', fontSize: 16 },
  segmentTextOn: { color: '#4f2d0f' },
  dateLoad: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dateBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d7cdbf', borderRadius: 14, padding: 12 },
  dateMain: { color: '#4f2d0f', fontSize: 18, fontWeight: '800' },
  dateSub: { color: '#7f6d5d', marginTop: 2 },
  loadBtn: { backgroundColor: '#6b3508', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  loadBtnText: { color: '#d6a064', fontWeight: '900' },
  totalWrap: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#d7cdbf', overflow: 'hidden' },
  totalHead: { backgroundColor: '#6b3508', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalTitle: { color: '#d6a064', fontWeight: '900', fontSize: 16 },
  dateChip: { backgroundColor: '#c99359', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  dateChipText: { color: '#4f2d0f', fontWeight: '800', fontSize: 13 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  metricBox: { width: '30%', minWidth: '30%', borderWidth: 1, borderColor: '#e1d6c8', borderRadius: 16, padding: 10, backgroundColor: '#fff' },
  metricLabel: { color: '#605a54', fontSize: 13 },
  metricValue: { fontSize: 28, fontWeight: '900', marginTop: 2 },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtn: { flex: 1, backgroundColor: '#6b3508', borderRadius: 18, padding: 12 },
  navTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  navSub: { color: '#c9b79e', marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#8e5f32', padding: 12, gap: 12 },
  menuIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#6b3508', alignItems: 'center', justifyContent: 'center' },
  menuIconText: { color: '#c99359', fontSize: 30, fontWeight: '900' },
  menuTitle: { color: '#4f2d0f', fontSize: 16, fontWeight: '900' },
  menuSub: { color: '#c1935c', marginTop: 2 },
  menuArrow: { color: '#6b3508', fontSize: 24, fontWeight: '900' },
});
