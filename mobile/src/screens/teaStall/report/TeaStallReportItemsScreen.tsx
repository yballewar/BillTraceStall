import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useDailyStallReport } from './useDailyStallReport';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { Badge, Button, Card, Input, TeaShell, colors, tokens, typography } from '../../../ui';

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

  return (
    <TeaShell title="Item Wise" subtitle="Qty & sale by items" icon="pricetag" rightAction={{ icon: 'arrow-back', onPress: () => navigation.goBack() }} scroll={false}>
      <View style={{ flex: 1, gap: tokens.space.lg }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setDateOpen(true)}
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.borderStrong, padding: 14, borderRadius: tokens.radius.lg, backgroundColor: colors.surface }}
          >
            <Text style={{ fontWeight: '700', color: colors.text }}>{date}</Text>
            <Text style={[typography.faint, { marginTop: 4 }]}>Select date</Text>
          </TouchableOpacity>
          <Button onPress={load} disabled={!canLoad} size="sm">
            Load
          </Button>
        </View>

        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

        <Input value={q} onChangeText={setQ} placeholder="Search item / category" autoCapitalize="none" />

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Badge tone="danger">{error}</Badge> : null}

        <FlatList
          data={items}
          keyExtractor={(i) => i.menuItemId}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Card variant="outlined" style={{ gap: tokens.space.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                    {item.itemName}
                  </Text>
                  <Text style={typography.muted} numberOfLines={1} ellipsizeMode="tail">
                    {item.category}
                  </Text>
                </View>
                <Text style={[typography.body, { width: 60, textAlign: 'right', fontWeight: '800' }]}>{item.qty}</Text>
                <Text style={[typography.body, { width: 90, textAlign: 'right', fontWeight: '800', color: colors.success }]}>₹{Math.round(item.amount)}</Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={!loading ? <Text style={typography.faint}>No data.</Text> : null}
        />
      </View>
    </TeaShell>
  );
}
