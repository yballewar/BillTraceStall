import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useDailyStallReport } from './useDailyStallReport';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { Badge, Button, Card, Input, TeaShell, colors, tokens, typography } from '../../../ui';

export function TeaStallReportOfficeScreen({ route, navigation }: any) {
  const initialDate = String(route?.params?.date ?? '');
  const [date, setDate] = useState(initialDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [q, setQ] = useState('');
  const { loading, error, data, load, canLoad } = useDailyStallReport(date);

  const items = useMemo(() => {
    const list = data?.byOffice ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((x) => x.officeName.toLowerCase().includes(term) || x.phone.toLowerCase().includes(term));
  }, [data, q]);

  return (
    <TeaShell title="Office Wise" subtitle="Sale & cash/credit by office" icon="business" rightAction={{ icon: 'arrow-back', onPress: () => navigation.goBack() }} scroll={false}>
    <View style={{ flex: 1, gap: tokens.space.lg }}>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => setDateOpen(true)}
          style={{ flex: 1, borderWidth: 1.5, borderColor: colors.borderStrong, padding: 14, borderRadius: tokens.radius.lg, backgroundColor: colors.surface }}
        >
          <Text style={{ fontWeight: '700', color: colors.text }}>{date}</Text>
          <Text style={[typography.faint, { marginTop: 4 }]}>Select date</Text>
        </TouchableOpacity>
        <Button onPress={load} disabled={!canLoad} size="sm">Load</Button>
      </View>

      <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

      <Input value={q} onChangeText={setQ} placeholder="Search office / phone" autoCapitalize="none" />

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Badge tone="danger">{error}</Badge> : null}

      <FlatList
        data={items}
        keyExtractor={(i) => i.officeId}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ReportOfficeOrders', { date, officeId: item.officeId, officeName: item.officeName })}
          >
            <Card variant="outlined" style={{ gap: tokens.space.xs }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{item.officeName}</Text>
            <Text style={typography.muted}>{item.phone}</Text>
            <Text style={typography.body}>Orders: {item.orders} • Qty: {item.qty}</Text>
            <Text style={{ fontWeight: '700', color: colors.success }}>Sale: ₹{Math.round(item.amount)}</Text>
            <Text style={typography.faint}>Cash: {Math.round(item.cashAmount)} • Credit: {Math.round(item.creditAmount)}</Text>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text style={typography.faint}>No data.</Text> : null}
      />
    </View>
    </TeaShell>
  );
}
