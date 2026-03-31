import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { getSelectedOfficeId } from '../../services/storage';
import { realtime } from '../../services/realtime';
import { Badge, Button, Card, Screen, colors, tokens, typography } from '../../ui';

const statColors = [
  { bg: colors.infoSoft, border: colors.info, text: colors.infoDark },
  { bg: colors.primarySoft, border: colors.primary, text: colors.primaryDark },
  { bg: colors.successSoft, border: colors.success, text: colors.successDark },
  { bg: colors.warningSoft, border: colors.warning, text: colors.warningDark },
];

type DaySummary = {
  date: string;
  orderCount: number;
  teaQty: number;
  coffeeQty: number;
  totalQty: number;
  totalAmount: number;
};

type DashboardResponse = {
  month: number;
  year: number;
  office: { id: string; officeName: string; stallId: string; stallName: string; stallCode: string };
  days: DaySummary[];
};

function shiftMonth(year: number, month: number, delta: number) {
  const idx = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(idx / 12);
  const nextMonth = (idx % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

type CalendarCell =
  | { kind: 'empty'; key: string }
  | { kind: 'day'; key: string; day: number; orderCount: number; teaQty: number; coffeeQty: number; totalAmount: number };

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return '—';
  return String(Math.round(amount));
}

export function OfficeDashboardScreen() {
  const navigation = useNavigation<any>();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [office, setOffice] = useState<DashboardResponse['office'] | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [dayPopupOpen, setDayPopupOpen] = useState(false);
  const [dayPopupDate, setDayPopupDate] = useState<string | null>(null);
  const [dayPopupLoading, setDayPopupLoading] = useState(false);
  const [dayPopupError, setDayPopupError] = useState<string | null>(null);
  const [dayPopupOrders, setDayPopupOrders] = useState<
    { id: string; status: string; orderTime: string; amount: number; paymentReceived: boolean; paymentMode: string }[]
  >([]);
  const [dayPopupTotalAmount, setDayPopupTotalAmount] = useState(0);
  const [dayPopupTeaQty, setDayPopupTeaQty] = useState(0);
  const [dayPopupCoffeeQty, setDayPopupCoffeeQty] = useState(0);

  const monthLabel = `${year}-${String(month).padStart(2, '0')}`;
  const monthDisplay = `${monthNames[month - 1]} ${year}`;
  const weekdays = useMemo(() => ['S', 'M', 'T', 'W', 'T', 'F', 'S'], []);

  const monthlyTotals = useMemo(() => {
    let orders = 0;
    let tea = 0;
    let coffee = 0;
    let amount = 0;
    for (const d of days) {
      orders += d.orderCount ?? 0;
      tea += d.teaQty ?? 0;
      coffee += d.coffeeQty ?? 0;
      amount += d.totalAmount ?? 0;
    }
    return { orders, tea, coffee, amount };
  }, [days]);

  const calendarCells = useMemo<CalendarCell[]>(() => {
    const byDate = new Map<string, DaySummary>();
    for (const d of days) {
      if (d?.date) {
        byDate.set(d.date, d);
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = new Date(year, month - 1, 1).getDay();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ kind: 'empty', key: `e-${year}-${month}-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const summary = byDate.get(dateKey);
      cells.push({
        kind: 'day',
        key: dateKey,
        day,
        orderCount: summary?.orderCount ?? 0,
        teaQty: summary?.teaQty ?? 0,
        coffeeQty: summary?.coffeeQty ?? 0,
        totalAmount: summary?.totalAmount ?? 0,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ kind: 'empty', key: `t-${year}-${month}-${cells.length}` });
    }

    return cells;
  }, [days, month, year]);

  const calendarRows = useMemo(() => {
    const rows: CalendarCell[][] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(calendarCells.slice(i, i + 7));
    }
    return rows;
  }, [calendarCells]);

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

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<DashboardResponse>('office/dashboard', {
        params: { month, year, officeId: selectedOfficeId || undefined },
      });
      setOffice(data.office ?? null);
      setDays(data.days ?? []);
    } catch (e: any) {
      setOffice(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [month, selectedOfficeId, year]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadDashboard();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      return;
    }, [loadDashboard])
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent((evt) => {
      if (selectedOfficeId && evt.officeId !== selectedOfficeId) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadDashboard();
      }, 250);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [loadDashboard, selectedOfficeId]);

  const openDay = async (dateKey: string) => {
    if (!selectedOfficeId) {
      return;
    }
    setDayPopupOpen(true);
    setDayPopupDate(dateKey);
    setDayPopupLoading(true);
    setDayPopupError(null);
    try {
      const { data } = await api.get<any>('office/orders-by-date', { params: { officeId: selectedOfficeId, date: dateKey } });
      const items = (data?.items ?? []) as any[];
      setDayPopupOrders(
        items.map((i) => ({
          id: String(i.id),
          status: String(i.status),
          orderTime: String(i.orderTime),
          amount: Number(i.amount ?? 0) || 0,
          paymentReceived: Boolean(i.paymentReceived),
          paymentMode: String(i.paymentMode ?? ''),
        }))
      );
      setDayPopupTotalAmount(Number(data?.totalAmount ?? 0) || 0);
      setDayPopupTeaQty(Number(data?.teaQty ?? 0) || 0);
      setDayPopupCoffeeQty(Number(data?.coffeeQty ?? 0) || 0);
    } catch (e: any) {
      setDayPopupOrders([]);
      setDayPopupTotalAmount(0);
      setDayPopupTeaQty(0);
      setDayPopupCoffeeQty(0);
      setDayPopupError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setDayPopupLoading(false);
    }
  };

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.space.xl, gap: tokens.space.lg, paddingBottom: tokens.space.xxxl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={typography.h2}>Dashboard</Text>
            <Text style={typography.muted}>Monthly orders overview</Text>
          </View>
          <Button variant="ghost" size="sm" onPress={loadDashboard} disabled={loading}>
            Refresh
          </Button>
        </View>

        {!selectedOfficeId ? (
          <Card variant="elevated" style={{ gap: tokens.space.lg }}>
            <Badge tone="warning">No stall selected</Badge>
            <Text style={typography.h4}>Select a stall first</Text>
            <Text style={typography.faint}>Go to Stalls tab, join a stall, and select it to view your dashboard.</Text>
            <Button onPress={() => navigation.navigate('Stalls')}>Go to Stalls</Button>
          </Card>
        ) : office ? (
          <>
            <View style={{ flexDirection: 'row', gap: tokens.space.xs }}>
              {[
                { label: 'Orders', value: monthlyTotals.orders, ...statColors[0] },
                { label: 'Tea', value: monthlyTotals.tea, ...statColors[1] },
                { label: 'Coffee', value: monthlyTotals.coffee, ...statColors[2] },
                { label: 'Total ₹', value: Math.round(monthlyTotals.amount), ...statColors[3] },
              ].map((s, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: s.bg,
                    borderRadius: tokens.radius.sm,
                    paddingVertical: tokens.space.xs,
                    paddingHorizontal: tokens.space.sm,
                    borderWidth: 1,
                    borderColor: s.border,
                    gap: 2,
                  }}
                >
                  <Text style={[typography.faint, { fontSize: 10 }]}>{s.label}</Text>
                  <Text style={[typography.body, { fontSize: tokens.text.sm, fontWeight: '800', color: s.text }]} numberOfLines={1}>{s.value}</Text>
                </View>
              ))}
            </View>

            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: tokens.space.md, backgroundColor: colors.white, borderRadius: tokens.radius.md, borderWidth: 1, borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={() => {
                    const next = shiftMonth(year, month, -1);
                    setYear(next.year);
                    setMonth(next.month);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontWeight: '800', color: colors.primary, fontSize: tokens.text.lg }}>‹</Text>
                </TouchableOpacity>
                <Text style={[typography.h4, { color: colors.text, fontSize: tokens.text.md }]}>{monthDisplay}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const next = shiftMonth(year, month, 1);
                    setYear(next.year);
                    setMonth(next.month);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontWeight: '800', color: colors.primary, fontSize: tokens.text.lg }}>›</Text>
                </TouchableOpacity>
              </View>

              <Card variant="outlined" style={{ paddingVertical: 4, paddingHorizontal: tokens.space.sm }}>
              <View style={{ flexDirection: 'row' }}>
                {weekdays.map((w, idx) => (
                  <View key={`${w}-${idx}`} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: tokens.text.xs, fontWeight: '700', color: colors.textMuted }}>{w}</Text>
                  </View>
                ))}
              </View>
            </Card>
            </View>

            {loading ? <ActivityIndicator color={colors.primary} /> : null}
            {error ? (
              <View style={{ alignItems: 'flex-start' }}>
                <Badge tone="danger">{error}</Badge>
              </View>
            ) : null}

            <View style={{ gap: 4 }}>
              {calendarRows.map((row, rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: 'row', gap: 4 }}>
                  {row.map((item) => {
                    if (item.kind === 'empty') {
                      return (
                        <View
                          key={item.key}
                          style={{
                            flex: 1,
                            aspectRatio: 1 / 1.32,
                            backgroundColor: colors.bgSecondary,
                            borderRadius: tokens.radius.sm,
                          }}
                        />
                      );
                    }
                    const hasOrders = item.orderCount > 0;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => openDay(item.key)}
                        activeOpacity={0.85}
                        style={{
                          flex: 1,
                          aspectRatio: 1 / 1.32,
                          backgroundColor: hasOrders ? colors.primarySoft : colors.white,
                          borderRadius: tokens.radius.sm,
                          padding: 4,
                          borderWidth: 1,
                          borderColor: hasOrders ? colors.primary : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>{item.day}</Text>
                        {hasOrders ? (
                          <>
                            <Text style={{ fontSize: 9, marginTop: 2, color: colors.primary, fontWeight: '700' }}>{item.orderCount}</Text>
                            <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>₹{formatAmount(item.totalAmount)}</Text>
                          </>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <Modal transparent visible={dayPopupOpen} animationType="fade" onRequestClose={() => setDayPopupOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: tokens.space.xl, justifyContent: 'center' }}
          activeOpacity={1}
          onPress={() => setDayPopupOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Card variant="elevated" style={{ gap: tokens.space.lg, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={typography.h4}>{dayPopupDate ?? 'Orders'}</Text>
                <Button variant="ghost" size="sm" onPress={() => setDayPopupOpen(false)}>
                  Close
                </Button>
              </View>

              {dayPopupLoading ? <ActivityIndicator color={colors.primary} /> : null}
              {dayPopupError ? (
                <View style={{ alignItems: 'flex-start' }}>
                  <Badge tone="danger">{dayPopupError}</Badge>
                </View>
              ) : null}
              {!dayPopupLoading ? (
                <Card variant="outlined" style={{ gap: tokens.space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={typography.h4}>Total</Text>
                    <Text style={[typography.h4, { color: colors.primary }]}>₹{Math.round(dayPopupTotalAmount)}</Text>
                  </View>
                  <Text style={typography.faint}>Tea {dayPopupTeaQty} • Coffee {dayPopupCoffeeQty}</Text>
                </Card>
              ) : null}

              <FlatList
                data={dayPopupOrders}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: tokens.space.lg }}
                renderItem={({ item }) => (
                  <Card variant="outlined" style={{ gap: tokens.space.xs }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <Badge tone={item.paymentReceived ? 'success' : 'warning'}>{item.paymentReceived ? 'Paid' : 'Pending'}</Badge>
                      <Text style={{ color: colors.text, fontWeight: '800' }}>₹{Math.round(item.amount)}</Text>
                    </View>
                    <Text style={typography.faint}>{new Date(item.orderTime).toLocaleString()}</Text>
                    <Text style={[typography.muted, { fontSize: tokens.text.sm }]}>{item.status}</Text>
                  </Card>
                )}
                ListEmptyComponent={!dayPopupLoading ? <Text style={[typography.faint, { textAlign: 'center', padding: tokens.space.lg }]}>No orders for this day.</Text> : null}
              />
            </Card>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
