import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useDailyStallReport } from './useDailyStallReport';
import { DatePickerModal } from '../../../components/DatePickerModal';

export function TeaStallReportDeliveryScreen({ route, navigation }: any) {
  const initialDate = String(route?.params?.date ?? '');
  const [date, setDate] = useState(initialDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [q, setQ] = useState('');
  const { loading, error, data, load, canLoad } = useDailyStallReport(date);

  const items = useMemo(() => {
    const list = data?.byDeliveryBoy ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((x) => x.name.toLowerCase().includes(term) || x.phone.toLowerCase().includes(term));
  }, [data, q]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Delivery Boy</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
          <Text style={{ fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => setDateOpen(true)}
          style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8 }}
        >
          <Text style={{ fontWeight: '700' }}>{date}</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>Select date</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={load}
          disabled={!canLoad}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#111827', borderRadius: 8, backgroundColor: '#111827' }}
        >
          <Text style={{ color: '#fff' }}>Load</Text>
        </TouchableOpacity>
      </View>

      <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search delivery boy / phone"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8 }}
      />

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ color: 'crimson' }}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.deliveryBoyId ?? 'unassigned')}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ReportDeliveryOrders', { date, deliveryBoyId: item.deliveryBoyId, name: item.name })}
            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12, gap: 4 }}
          >
            <Text style={{ fontWeight: '700' }}>{item.name}</Text>
            {item.phone ? <Text style={{ color: '#6b7280' }}>{item.phone}</Text> : null}
            <Text>Orders: {item.orders}</Text>
            <Text style={{ fontWeight: '700' }}>Sale: {Math.round(item.saleAmount)}</Text>
            <Text>Collected: {Math.round(item.cashCollected)} • Credit: {Math.round(item.creditAmount)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text>No data.</Text> : null}
      />
    </View>
  );
}
