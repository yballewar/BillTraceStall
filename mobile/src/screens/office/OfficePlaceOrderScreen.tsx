import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { Badge, Button, Card, Input, Screen, showAlert, colors, tokens, typography } from '../../ui';

type MenuItemRow = {
  id: string;
  itemName: string;
  price: number;
  category: string;
};

type MenuResponse = {
  officeId: string;
  stall: { id: string; stallName: string; uniqueCode: string };
  items: MenuItemRow[];
};

export function OfficePlaceOrderScreen({ route, navigation }: any) {
  const officeId: string = route.params.officeId;
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [itemsOpen, setItemsOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const total = useMemo(() => {
    if (!menu) return 0;
    return menu.items.reduce((sum, i) => sum + (qtyById[i.id] ?? 0) * i.price, 0);
  }, [menu, qtyById]);

  const selectedCount = useMemo(() => {
    return Object.values(qtyById).reduce((sum, q) => sum + (q > 0 ? 1 : 0), 0);
  }, [qtyById]);

  const totalQty = useMemo(() => {
    return Object.values(qtyById).reduce((sum, q) => sum + (q ?? 0), 0);
  }, [qtyById]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of menu?.items ?? []) {
      if (it.category) set.add(it.category);
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [menu]);

  const visibleMenuItems = useMemo(() => {
    const list = menu?.items ?? [];
    const q = itemQuery.trim().toLowerCase();
    return list.filter((it) => {
      if (category !== 'All' && it.category !== category) return false;
      if (!q) return true;
      return it.itemName.toLowerCase().includes(q) || it.category.toLowerCase().includes(q);
    });
  }, [category, itemQuery, menu]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<MenuResponse>(`office/stalls/${officeId}/menu`);
      setMenu(data);
      setQtyById({});
      setCategory('All');
    } catch (e: any) {
      setMenu(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load menu'));
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    load();
  }, [load]);

  const setQtyNumber = (id: string, n: number) => {
    const next = Math.max(0, Math.floor(n));
    setQtyById((prev) => {
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const clear = () => {
    setQtyById({});
  };

  const place = async () => {
    if (!menu) return;
    const items = Object.entries(qtyById)
      .filter(([, q]) => q > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (items.length === 0) {
      showAlert('Select items', 'Please choose at least one item.');
      return;
    }

    setPlacing(true);
    setError(null);
    try {
      const { data } = await api.post<{ id: string }>('orders', {
        officeId,
        deliveryBoyId: null,
        orderType: 'manual',
        orderTime: null,
        items,
      });
      setItemsOpen(false);
      setItemQuery('');
      setCategory('All');
      clear();
      navigation.navigate('OfficeOrderDetails', { orderId: data.id });
    } catch (e: any) {
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to place order'));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View style={{ gap: tokens.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.h3}>Place Order</Text>
          <Button variant="ghost" onPress={load} disabled={loading}>
            Refresh
          </Button>
        </View>

        {loading ? <ActivityIndicator /> : null}
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}

        {menu ? (
          <View style={{ gap: tokens.space.md }}>
            <Card style={{ gap: tokens.space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={typography.h3} numberOfLines={1}>
                  {menu.stall.stallName}
                </Text>
                <Badge tone="info">{menu.stall.uniqueCode}</Badge>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.muted}>Items: {selectedCount} • Qty: {totalQty}</Text>
                <Text style={typography.h3}>{Math.round(total)}</Text>
              </View>
              <Button
                variant="primary"
                disabled={placing}
                onPress={() => {
                  setItemQuery('');
                  setCategory('All');
                  setItemsOpen(true);
                }}
              >
                Select Items
              </Button>
            </Card>

            <Card style={{ gap: tokens.space.sm }}>
              <Text style={typography.h3}>Selected Items</Text>
              {selectedCount === 0 ? (
                <Text style={typography.faint}>No items selected. Tap “Select Items”.</Text>
              ) : (
                <View style={{ gap: tokens.space.xs }}>
                  {menu.items
                    .filter((it) => (qtyById[it.id] ?? 0) > 0)
                    .slice(0, 6)
                    .map((it) => (
                      <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={{ color: colors.text, fontWeight: '800' }} numberOfLines={1}>
                            {it.itemName}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontWeight: '700' }} numberOfLines={1}>
                            {it.category}
                          </Text>
                        </View>
                        <Text style={{ width: 60, textAlign: 'right', color: colors.text, fontWeight: '900' }}>{qtyById[it.id] ?? 0}</Text>
                        <Text style={{ width: 90, textAlign: 'right', color: colors.text, fontWeight: '900' }}>
                          {Math.round((qtyById[it.id] ?? 0) * it.price)}
                        </Text>
                      </View>
                    ))}
                  {selectedCount > 6 ? <Text style={typography.faint}>+{selectedCount - 6} more</Text> : null}
                </View>
              )}
            </Card>

            <View style={{ flexDirection: 'row', gap: tokens.space.sm }}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" disabled={placing || selectedCount === 0} onPress={clear}>
                  Clear
                </Button>
              </View>
              <View style={{ flex: 2 }}>
                <Button variant="primary" disabled={placing || selectedCount === 0} onPress={place}>
                  {placing ? 'Placing...' : 'Place Order'}
                </Button>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <Modal transparent visible={itemsOpen} animationType="fade" onRequestClose={() => setItemsOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: 16, justifyContent: 'center' }}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: tokens.radius.md, padding: tokens.space.md, gap: tokens.space.md, maxHeight: '85%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.h3}>Select Items</Text>
              <Button variant="ghost" onPress={() => setItemsOpen(false)}>
                Done
              </Button>
            </View>

            <Input
              value={itemQuery}
              onChangeText={setItemQuery}
              placeholder="Search item / category"
              autoCapitalize="none"
            />

            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(c) => c}
              contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
              renderItem={({ item: c }) => {
                const active = c === category;
                return (
                  <TouchableOpacity
                    onPress={() => setCategory(c)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.borderStrong,
                      borderRadius: 999,
                      backgroundColor: active ? 'rgba(79,70,229,0.18)' : colors.surface,
                    }}
                  >
                    <Text style={{ color: active ? colors.text : colors.textMuted, fontWeight: '900' }}>{c}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <FlatList
              data={visibleMenuItems}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
              renderItem={({ item }) => {
                const qty = qtyById[item.id] ?? 0;
                return (
                  <Card style={{ gap: tokens.space.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: '900' }} numberOfLines={1}>
                          {item.itemName}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontWeight: '700' }} numberOfLines={1}>
                          {item.category}
                        </Text>
                      </View>
                      <Text style={{ color: colors.text, fontWeight: '900' }}>{Math.round(item.price)}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => setQtyNumber(item.id, qty - 1)}
                        style={{ width: 44, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: tokens.radius.md, alignItems: 'center', backgroundColor: colors.surface }}
                      >
                        <Text style={{ fontWeight: '900', color: colors.text }}>-</Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: tokens.text.lg, fontWeight: '900', color: colors.text }}>{qty}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setQtyNumber(item.id, qty + 1)}
                        style={{ width: 44, paddingVertical: 10, borderWidth: 1, borderColor: colors.primary, borderRadius: tokens.radius.md, backgroundColor: colors.primary, alignItems: 'center' }}
                      >
                        <Text style={{ fontWeight: '900', color: colors.white }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              }}
              ListEmptyComponent={<Text style={typography.faint}>No items.</Text>}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontWeight: '900' }}>Qty: {totalQty}</Text>
              <Text style={{ color: colors.text, fontWeight: '900' }}>Amount: {Math.round(total)}</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
