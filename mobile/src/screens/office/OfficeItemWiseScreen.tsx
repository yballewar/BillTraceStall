import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { getSelectedOfficeId } from '../../services/storage';

type ItemRow = {
  itemName: string;
  category: string;
  qty: number;
  amount: number;
};

type DayGroup = {
  date: string;
  items: ItemRow[];
};

type ItemWiseResponse = {
  month: number;
  year: number;
  office: { id: string; officeName: string; stallId: string; stallName: string; stallCode: string };
  days: DayGroup[];
};

function shiftMonth(year: number, month: number, delta: number) {
  const idx = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(idx / 12);
  const nextMonth = (idx % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

export function OfficeItemWiseScreen() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DayGroup[]>([]);
  const [office, setOffice] = useState<ItemWiseResponse['office'] | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);

  const monthLabel = `${year}-${String(month).padStart(2, '0')}`;

  useFocusEffect(
    useMemo(
      () => () => {
        (async () => {
          const id = await getSelectedOfficeId();
          setSelectedOfficeId(id);
        })();
      },
      []
    )
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ItemWiseResponse>('office/item-wise', {
          params: { month, year, officeId: selectedOfficeId || undefined },
        });
        if (!cancelled) {
          setOffice(data.office ?? null);
          setDays(data.days ?? []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setOffice(null);
          setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
          setDays([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, selectedOfficeId, year]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>{office ? office.stallName : 'Item-wise (Day-wise)'}</Text>
      {office ? <Text style={{ color: '#6b7280' }}>{office.stallCode}</Text> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={() => {
            const next = shiftMonth(year, month, -1);
            setYear(next.year);
            setMonth(next.month);
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}
        >
          <Text>Prev</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{monthLabel}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            const next = shiftMonth(year, month, 1);
            setYear(next.year);
            setMonth(next.month);
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}
        >
          <Text>Next</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ color: 'crimson' }}>{error}</Text> : null}

      <FlatList
        data={days}
        keyExtractor={(d) => d.date}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item: day }) => (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 10 }}>{day.date}</Text>
            {day.items.map((it) => (
              <View key={`${day.date}-${it.itemName}-${it.category}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontWeight: '600' }}>{it.itemName}</Text>
                  <Text style={{ color: '#6b7280' }}>{it.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text>Qty: {it.qty}</Text>
                  <Text style={{ fontWeight: '700' }}>{it.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>No orders found.</Text> : null}
      />
    </View>
  );
}
