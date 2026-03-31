import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { DatePickerModal } from '../../components/DatePickerModal';
import { Badge, Button, Card, Input, Screen, showAlert, colors, tokens, typography } from '../../ui';

type OfficeRow = { id: string; name: string; phone: string; address: string; schedules: { id: string; officeId: string; deliveryTime: string }[] };
type MenuItemRow = { id: string; itemName: string; category: string; price: number };

type MetaResponse = {
  date: string;
  offices: OfficeRow[];
  menuItems: MenuItemRow[];
};

type MyDeliveryRow = {
  id: string;
  date: string;
  time: string;
  status: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdOrderId?: string | null;
  createdOrderNumber?: string | null;
  office: { id: string; name: string; phone: string };
  amount: number;
  items: { itemName: string; category: string; quantity: number; price: number; amount: number }[];
};

type MyDeliveriesResponse = {
  date: string;
  items: MyDeliveryRow[];
};

function defaultSlotTimes() {
  return [
    { id: null as any, label: 'Morning', time: '09:00' },
    { id: null as any, label: 'Lunch', time: '13:00' },
    { id: null as any, label: 'Evening', time: '17:00' },
  ];
}

export function DeliveryScheduledScreen() {
  const [tab, setTab] = useState<'Entry' | 'My'>('Entry');
  const [date, setDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [dateOpen, setDateOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);

  const [officeQuery, setOfficeQuery] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ scheduleId: string | null; time: string } | null>(null);
  const [qtyByItem, setQtyByItem] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');

  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);
  const [myData, setMyData] = useState<MyDeliveriesResponse | null>(null);

  const loadMeta = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<MetaResponse>('delivery/scheduled/meta', { params: { date } });
      setMeta(data);
    } catch (e: any) {
      setMeta(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [date]);

  const loadMy = useCallback(async () => {
    setMyLoading(true);
    setMyError(null);
    try {
      const { data } = await api.get<MyDeliveriesResponse>('delivery/scheduled/deliveries', { params: { date } });
      setMyData(data);
    } catch (e: any) {
      setMyData(null);
      setMyError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setMyLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadMeta();
    loadMy();
  }, [loadMeta, loadMy]);

  const offices = useMemo(() => {
    const list = meta?.offices ?? [];
    const term = officeQuery.trim().toLowerCase();
    if (!term) return list;
    return list.filter((o) => o.name.toLowerCase().includes(term) || o.phone.toLowerCase().includes(term));
  }, [meta, officeQuery]);

  const selectedOffice = useMemo(() => (meta?.offices ?? []).find((o) => o.id === selectedOfficeId) ?? null, [meta, selectedOfficeId]);

  const slotOptions = useMemo(() => {
    const s = selectedOffice?.schedules ?? [];
    if (s.length === 0) return defaultSlotTimes();
    return s.map((x) => ({ id: x.id, label: x.deliveryTime, time: x.deliveryTime }));
  }, [selectedOffice]);

  useEffect(() => {
    if (!selectedOffice) {
      setSlot(null);
      return;
    }
    const first = slotOptions[0];
    if (first) {
      setSlot({ scheduleId: first.id, time: first.time });
    }
  }, [selectedOffice, slotOptions]);

  const setQtyNumber = (menuItemId: string, n: number) => {
    const next = Math.max(0, Math.floor(n));
    setQtyByItem((prev) => {
      if (next <= 0) {
        const { [menuItemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [menuItemId]: String(next) };
    });
  };

  const selectedItemsSummary = useMemo(() => {
    const menuItems = meta?.menuItems ?? [];
    const selected = Object.entries(qtyByItem)
      .map(([id, q]) => ({ id, qty: Number(q || 0) }))
      .filter((x) => x.qty > 0)
      .map((x) => ({ ...x, item: menuItems.find((m) => m.id === x.id) }))
      .filter((x) => !!x.item);
    const totalQty = selected.reduce((sum, x) => sum + x.qty, 0);
    const totalAmount = selected.reduce((sum, x) => sum + x.qty * Number(x.item!.price || 0), 0);
    return { selected, totalQty, totalAmount };
  }, [meta, qtyByItem]);

  const submit = async () => {
    if (!selectedOfficeId) {
      showAlert('Select office', 'Please select an office.');
      return;
    }
    if (!slot) {
      showAlert('Select time', 'Please select delivery time.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const items = Object.entries(qtyByItem)
        .map(([menuItemId, q]) => ({ menuItemId, quantity: Number(q || 0) }))
        .filter((x) => x.quantity > 0);
      if (items.length === 0) {
        showAlert('No items', 'Enter quantity for at least one item.');
        return;
      }
      await api.post('delivery/scheduled/deliveries', {
        officeId: selectedOfficeId,
        date,
        scheduleId: slot.scheduleId || undefined,
        deliveryTime: slot.scheduleId ? undefined : slot.time,
        items,
      });
      setQtyByItem({});
      showAlert('Saved', 'Delivery entry sent for office approval.');
      await loadMy();
      setEntryOpen(false);
    } catch (e: any) {
      showAlert('Failed', String(e?.response?.data?.error ?? e?.message ?? 'Failed to submit'));
    } finally {
      setSubmitting(false);
    }
  };

  const tabConfig = [
    { key: 'Entry' as const, label: 'New Entry', count: offices.length, color: colors.accent },
    { key: 'My' as const, label: 'My Entries', count: myData?.items?.length ?? 0, color: colors.success },
  ];
  const dateDisplay = useMemo(() => {
    const [y, m, d] = date.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [date]);

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: '2%' }}>
      <View style={{ flex: 1, paddingHorizontal: tokens.space.xl, gap: tokens.space.md }}>
        <Card variant="gradientBorder" style={{ paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '120%', marginHorizontal: '-10%' }}>
          <View>
            <Text style={[typography.h3, { color: colors.text }]}>Scheduled Delivery</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {tab === 'Entry' ? 'Schedule deliveries for offices' : `${myData?.items?.length ?? 0} entries for selected date`}
            </Text>
          </View>
          <Button variant="ghost" size="sm" onPress={() => { loadMeta(); loadMy(); }} disabled={loading || myLoading}>
            Refresh
          </Button>
        </Card>

        <TouchableOpacity onPress={() => setDateOpen(true)} activeOpacity={0.85}>
          <Card variant="elevated" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: tokens.space.md, paddingHorizontal: tokens.space.lg, width: '120%', marginHorizontal: '-10%' }}>
            <View>
              <Text style={[typography.h4, { color: colors.text }]}>{dateDisplay}</Text>
              <Text style={[typography.caption, { marginTop: 2 }]}>Tap to change date</Text>
            </View>
            <Badge tone="info">Date</Badge>
          </Card>
        </TouchableOpacity>

        <DatePickerModal visible={dateOpen} value={date} onClose={() => setDateOpen(false)} onSelect={setDate} />

        <View style={{ flexDirection: 'row', gap: 8, width: '120%', marginHorizontal: '-10%' }}>
          {tabConfig.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: tab === t.key ? t.color : colors.borderStrong,
                borderRadius: tokens.radius.lg,
                backgroundColor: tab === t.key ? t.color + '20' : colors.surface,
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Text style={{ color: tab === t.key ? t.color : colors.textMuted, fontWeight: '700', fontSize: tokens.text.sm }} numberOfLines={1}>
                {t.label}
              </Text>
              <View style={{ backgroundColor: tab === t.key ? t.color + '40' : colors.bgSecondary, borderRadius: tokens.radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.key ? t.color : colors.textMuted }}>{t.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'Entry' ? (
          <View style={{ gap: tokens.space.md, flex: 1 }}>
            {error ? (
              <Card variant="outlined" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger, padding: tokens.space.md, width: '120%', marginHorizontal: '-10%' }}>
                <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>
              </Card>
            ) : null}

            <View style={{ width: '120%', marginHorizontal: '-10%' }}>
              <Input
                label="Search office or phone"
                value={officeQuery}
                onChangeText={setOfficeQuery}
                placeholder="Type to search..."
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={offices}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
              ListHeaderComponent={loading ? (
                <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text>
                </View>
              ) : null}
              renderItem={({ item }) => {
                const active = item.id === selectedOfficeId;
                return (
                  <TouchableOpacity
                    onPress={() => { setSelectedOfficeId(item.id); setQtyByItem({}); setEntryOpen(true); }}
                    activeOpacity={0.85}
                  >
                    <Card variant="elevated" style={{
                      width: '100%',
                      alignSelf: 'stretch',
                      borderLeftWidth: 4,
                      borderLeftColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? 'rgba(20,184,166,0.1)' : colors.card,
                    }}>
                      <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[typography.muted, { marginTop: 4 }]} numberOfLines={1}>{item.phone}</Text>
                      <Text style={[typography.faint, { marginTop: 2 }]} numberOfLines={2}>{item.address}</Text>
                    </Card>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={!loading ? (
                <Card variant="outlined" style={{ padding: tokens.space.xxl, alignItems: 'center', marginTop: tokens.space.lg }}>
                  <Text style={[typography.h4, { color: colors.textMuted, marginBottom: tokens.space.sm }]}>No offices</Text>
                  <Text style={[typography.faint, { textAlign: 'center' }]}>Offices with delivery schedules will appear here.</Text>
                </Card>
              ) : null}
              style={{ flex: 1, width: '120%', marginHorizontal: '-10%' }}
            />
          </View>
        ) : (
          <View style={{ gap: tokens.space.md, flex: 1 }}>
            {myError ? (
              <Card variant="outlined" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger, padding: tokens.space.md, width: '120%', marginHorizontal: '-10%' }}>
                <Text style={[typography.bodySmall, { color: colors.danger }]}>{myError}</Text>
              </Card>
            ) : null}

            <FlatList
              data={myData?.items ?? []}
              keyExtractor={(i) => i.id}
              style={{ width: '120%', marginHorizontal: '-10%' }}
              contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
              ListHeaderComponent={myLoading ? (
                <View style={{ paddingVertical: tokens.space.lg, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[typography.faint, { marginTop: tokens.space.sm }]}>Loading…</Text>
                </View>
              ) : null}
              renderItem={({ item }) => {
                const statusColor = item.status === 'Approved' ? colors.success : item.status === 'Rejected' ? colors.danger : colors.warning;
                return (
                  <Card variant="elevated" style={{ gap: tokens.space.sm, borderLeftWidth: 4, borderLeftColor: statusColor }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{item.office.name}</Text>
                        <Text style={[typography.caption, { marginTop: 2 }]}>{item.date} • {item.time}</Text>
                      </View>
                      <Badge tone={item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}>{item.status}</Badge>
                      <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(item.amount)}</Text>
                    </View>
                    {item.createdOrderNumber ? (
                      <Text style={typography.faint}>Order #{item.createdOrderNumber}</Text>
                    ) : item.createdOrderId ? (
                      <Text style={typography.faint}>Order #{item.createdOrderId}</Text>
                    ) : null}
                    <View style={{ gap: 4, paddingTop: tokens.space.xs, borderTopWidth: 1, borderTopColor: colors.border }}>
                      {item.items.slice(0, 4).map((i, idx) => (
                        <Text key={`${item.id}-${idx}`} style={typography.bodySmall}>{i.itemName} × {i.quantity}</Text>
                      ))}
                      {item.items.length > 4 ? <Text style={typography.faint}>+{item.items.length - 4} more</Text> : null}
                    </View>
                  </Card>
                );
              }}
              ListEmptyComponent={!myLoading ? (
                <Card variant="outlined" style={{ padding: tokens.space.xxl, alignItems: 'center', marginTop: tokens.space.lg }}>
                  <Text style={[typography.h4, { color: colors.textMuted, marginBottom: tokens.space.sm }]}>No entries</Text>
                  <Text style={[typography.faint, { textAlign: 'center' }]}>Your scheduled delivery entries will appear here.</Text>
                </Card>
              ) : null}
            />
          </View>
        )}
      </View>

      <Modal transparent visible={entryOpen} animationType="fade" onRequestClose={() => setEntryOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: tokens.space.lg, justifyContent: 'center' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: tokens.radius.xl, padding: tokens.space.lg, maxHeight: '88%', borderWidth: 1, borderColor: colors.border, ...(Platform.OS === 'android' ? { elevation: 12 } : { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24 }) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.md }}>
              <Text style={typography.h3}>New Delivery Entry</Text>
              <Button variant="ghost" size="sm" onPress={() => setEntryOpen(false)}>Close</Button>
            </View>

            <ScrollView style={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              {selectedOffice ? (
                <>
                  <Card variant="outlined" style={{ gap: tokens.space.sm, marginBottom: tokens.space.md }}>
                    <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>{selectedOffice.name}</Text>
                    <Text style={typography.muted} numberOfLines={1}>{selectedOffice.phone}</Text>
                    <Text style={typography.faint} numberOfLines={2}>{selectedOffice.address}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Badge tone="info">Date</Badge>
                      <Text style={typography.faint}>{dateDisplay}</Text>
                    </View>
                  </Card>

                  <Text style={[typography.label, { marginBottom: tokens.space.sm }]}>Delivery Time</Text>
                  <View style={{ flexDirection: 'row', gap: tokens.space.xs, marginBottom: tokens.space.md }}>
                    {slotOptions.map((s) => {
                      const active = slot?.scheduleId === s.id && slot?.time === s.time;
                      return (
                        <TouchableOpacity
                          key={`${String(s.id)}-${s.time}`}
                          onPress={() => setSlot({ scheduleId: s.id, time: s.time })}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderWidth: 2,
                            borderColor: active ? colors.accent : colors.borderStrong,
                            borderRadius: tokens.radius.lg,
                            backgroundColor: active ? 'rgba(20,184,166,0.1)' : colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: active ? colors.accent : colors.textMuted, fontWeight: '700', fontSize: tokens.text.sm }} numberOfLines={1}>{s.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Card variant="elevated" style={{ gap: tokens.space.sm, marginBottom: tokens.space.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={typography.h4}>Items</Text>
                      <Text style={[typography.h4, { color: colors.success }]}>₹{Math.round(selectedItemsSummary.totalAmount)}</Text>
                    </View>
                    <Text style={typography.faint}>Qty: {selectedItemsSummary.totalQty}</Text>
                    {selectedItemsSummary.selected.length ? (
                      <View style={{ gap: 4 }}>
                        {selectedItemsSummary.selected.slice(0, 5).map((x) => (
                          <Text key={x.id} style={typography.bodySmall} numberOfLines={1}>{x.item!.itemName} × {x.qty}</Text>
                        ))}
                        {selectedItemsSummary.selected.length > 5 ? <Text style={typography.faint}>+{selectedItemsSummary.selected.length - 5} more</Text> : null}
                      </View>
                    ) : (
                      <Text style={typography.faint}>No items selected</Text>
                    )}
                    <Button variant="secondary" size="sm" onPress={() => { setItemQuery(''); setItemsOpen(true); }}>
                      Select Items
                    </Button>
                  </Card>

                  <Button variant="primary" disabled={submitting} onPress={submit}>
                    {submitting ? 'Submitting…' : 'Send to Office for Approval'}
                  </Button>
                </>
              ) : (
                <Text style={typography.faint}>Select an office from the list.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={itemsOpen} animationType="fade" onRequestClose={() => setItemsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: tokens.space.lg, justifyContent: 'center' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: tokens.radius.xl, padding: tokens.space.lg, maxHeight: '88%', borderWidth: 1, borderColor: colors.border, ...(Platform.OS === 'android' ? { elevation: 12 } : { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24 }) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.md }}>
              <Text style={typography.h3}>Select Items</Text>
              <Button variant="primary" size="sm" onPress={() => setItemsOpen(false)}>Done</Button>
            </View>

            <Input value={itemQuery} onChangeText={setItemQuery} placeholder="Search item or category" autoCapitalize="none" />

            <FlatList
              data={(meta?.menuItems ?? []).filter((m) => {
                const t = itemQuery.trim().toLowerCase();
                if (!t) return true;
                return m.itemName.toLowerCase().includes(t) || m.category.toLowerCase().includes(t);
              })}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 280, marginVertical: tokens.space.md }}
              contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: tokens.space.sm }}
              renderItem={({ item }) => {
                const qty = Number(qtyByItem[item.id] || 0);
                return (
                  <Card variant="outlined" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: tokens.space.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>{item.itemName}</Text>
                      <Text style={[typography.caption]} numberOfLines={1}>{item.category} • ₹{Math.round(item.price)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setQtyNumber(item.id, qty - 1)}
                        style={{ width: 40, height: 40, borderWidth: 2, borderColor: colors.borderStrong, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}
                      >
                        <Text style={{ fontWeight: '800', color: colors.text, fontSize: 18 }}>-</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: tokens.text.lg, fontWeight: '800', color: colors.text, minWidth: 28, textAlign: 'center' }}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => setQtyNumber(item.id, qty + 1)}
                        style={{ width: 40, height: 40, borderWidth: 2, borderColor: colors.primary, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}
                      >
                        <Text style={{ fontWeight: '800', color: colors.white, fontSize: 18 }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              }}
              ListEmptyComponent={<Text style={[typography.faint, { textAlign: 'center', padding: tokens.space.lg }]}>No items found</Text>}
            />

            <Card variant="elevated" style={{ padding: tokens.space.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h4, { color: colors.textMuted }]}>Total</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.h3, { color: colors.success }]}>₹{Math.round(selectedItemsSummary.totalAmount)}</Text>
                <Text style={typography.caption}>{selectedItemsSummary.totalQty} items</Text>
              </View>
            </Card>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
