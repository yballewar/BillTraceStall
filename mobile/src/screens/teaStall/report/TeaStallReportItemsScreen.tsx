import { ActivityIndicator, Image, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useDailyStallReport } from './useDailyStallReport';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { Badge, Screen } from '../../../ui';

export function TeaStallReportItemsScreen({ route, navigation }: any) {
  const initialDate = String(route?.params?.date ?? '');
  const [date, setDate] = useState(initialDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [q, setQ] = useState('');
  const { loading, error, data, load, canLoad } = useDailyStallReport(date);

  const items = useMemo(() => {
    const list = data?.byItem ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((x) => x.itemName.toLowerCase().includes(term) || x.category.toLowerCase().includes(term));
  }, [data, q]);
  const C = { page: '#fff', header: '#5b2e08', title: '#d6a064', body: '#f2f0ed', textDark: '#4f2d0f', action: '#6b3508', border: '#d7cdbf' };

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sale summary</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>REFRESH</Text>
        </TouchableOpacity>
        <Image source={require('../../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>
      <View style={styles.body}>
        <Image source={require('../../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />
        <Text style={styles.sectionTitle}>ITEM WISE</Text>
        <View style={styles.dateLoad}>
          <TouchableOpacity onPress={() => setDateOpen(true)} style={styles.dateBox}>
            <Text style={styles.dateMain}>{date}</Text>
            <Text style={styles.dateSub}>Select date</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={load} disabled={!canLoad} style={styles.loadBtn}>
            <Text style={styles.loadBtnText}>Load</Text>
          </TouchableOpacity>
        </View>
        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />
        <View style={styles.searchWrap}>
          <Text style={{ color: '#c9b79e', fontSize: 14 }}>Search item/ Category</Text>
          <TouchableOpacity onPress={load}><Text style={{ color: '#c9b79e', fontSize: 22 }}>◯</Text></TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color={C.action} /> : null}
        {error ? <Badge tone="danger">{error}</Badge> : null}
        <FlatList
          data={items}
          keyExtractor={(i) => i.menuItemId}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemCat}>{item.category}</Text>
              </View>
              <Text style={styles.itemQty}>{item.qty}</Text>
              <Text style={styles.itemAmount}>{Math.round(item.amount)}</Text>
            </View>
          )}
          ListEmptyComponent={!loading ? <Text style={{ color: '#8f7b67', textAlign: 'center', paddingVertical: 14 }}>No data.</Text> : null}
        />
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
  dateLoad: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  dateBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d7cdbf', borderRadius: 14, padding: 12 },
  dateMain: { color: '#4f2d0f', fontSize: 18, fontWeight: '800' },
  dateSub: { color: '#7f6d5d', marginTop: 2 },
  loadBtn: { backgroundColor: '#6b3508', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 11 },
  loadBtnText: { color: '#d6a064', fontWeight: '900' },
  searchWrap: { backgroundColor: '#6b3508', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemRow: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#8e5f32', padding: 14, flexDirection: 'row', alignItems: 'center' },
  itemName: { color: '#4f2d0f', fontSize: 16, fontWeight: '900' },
  itemCat: { color: '#7f6d5d', marginTop: 2 },
  itemQty: { width: 44, textAlign: 'center', color: '#4f2d0f', fontSize: 30, fontWeight: '900' },
  itemAmount: { width: 56, textAlign: 'right', color: '#4f2d0f', fontSize: 30, fontWeight: '900' },
});
