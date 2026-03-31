import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { Badge, Button, Card, Input, TeaShell, showAlert, colors, tokens, typography } from '../../ui';

type MenuItemRow = {
  id: string;
  itemName: string;
  price: number;
  category: string;
  isActive: boolean;
};

const CATEGORIES = ['Tea', 'Coffee', 'Snacks', 'Other'] as const;

export function TeaStallMenuScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItemRow[]>([]);

  const [popupOpen, setPopupOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<string>('Tea');
  const [price, setPrice] = useState('10');
  const [isActive, setIsActive] = useState(true);

  const openAdd = () => { resetForm(); setPopupOpen(true); };
  const openEdit = (item: MenuItemRow) => {
    setEditingId(item.id);
    setItemName(item.itemName);
    setCategory(item.category || 'Tea');
    setPrice(String(item.price));
    setIsActive(item.isActive);
    setPopupOpen(true);
  };
  const closePopup = () => { setPopupOpen(false); resetForm(); };

  const resetForm = () => {
    setEditingId(null);
    setItemName('');
    setCategory('Tea');
    setPrice('10');
    setIsActive(true);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('stall/menu');
      // API may return { items: [] } or the array directly; support snake_case
      const raw = Array.isArray(data) ? data : (data?.items ?? []);
      const list = raw.map((r: any): MenuItemRow => ({
        id: r.id ?? String(r._id ?? ''),
        itemName: r.itemName ?? r.item_name ?? '',
        price: Number(r.price) || 0,
        category: r.category ?? 'Other',
        isActive: r.isActive ?? r.is_active ?? true,
      }));
      setItems(list);
    } catch (e: any) {
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (): Promise<boolean> => {
    const parsedPrice = Number(price);
    if (!itemName.trim()) {
      showAlert('Validation', 'Item name is required');
      return false;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showAlert('Validation', 'Please enter a valid price');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('stall/menu', [
        {
          id: editingId,
          itemName: itemName.trim(),
          price: parsedPrice,
          category: (category.trim() || 'Other'),
          isActive,
        },
      ]);
      resetForm();
      await load();
      return true;
    } catch (e: any) {
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Save failed'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeaShell title="Menu" subtitle="Manage items & prices" icon="restaurant" rightAction={{ icon: 'refresh', onPress: load, disabled: loading }} scroll={false}>
      <View style={{ flex: 1, gap: tokens.space.lg }}>

        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}
        {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Text style={typography.h4}>Your Menu Items</Text>
          <Button size="sm" onPress={openAdd}>
            Add New Item
          </Button>
        </View>

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: tokens.space.md, paddingBottom: tokens.space.xxxl, flexGrow: 1 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7}>
              <Card variant="outlined" style={{ gap: tokens.space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: colors.text, fontSize: tokens.text.md }} numberOfLines={1}>
                      {item.itemName}
                    </Text>
                    <Text style={[typography.muted, { marginTop: 2 }]}>{item.category}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '800', color: colors.primary, fontSize: tokens.text.lg }}>₹{item.price}</Text>
                    <Badge tone={item.isActive ? 'success' : 'neutral'} style={{ marginTop: 6 }}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={!loading ? (
            <View style={{ padding: tokens.space.xl, alignItems: 'center' }}>
              <Text style={[typography.faint, { textAlign: 'center' }]}>No menu items yet.</Text>
              <Text style={[typography.faint, { textAlign: 'center', marginTop: 4 }]}>Add your first item above.</Text>
            </View>
          ) : null}
        />

        <Modal transparent visible={popupOpen} animationType="fade" onRequestClose={closePopup}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: tokens.space.xl }}
            activeOpacity={1}
            onPress={closePopup}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <Card variant="elevated" style={{ gap: tokens.space.lg }}>
                <Text style={typography.h4}>{editingId ? 'Edit Item' : 'Add New Item'}</Text>

                <Input
                  label="Item Name"
                  placeholder="e.g. Masala Chai, Filter Coffee"
                  value={itemName}
                  onChangeText={setItemName}
                  autoCapitalize="words"
                />

                <View style={{ gap: tokens.space.sm }}>
                  <Text style={typography.label}>Category</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES.map((c) => {
                      const selected = category.trim() === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setCategory(c)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            borderWidth: 1.5,
                            borderColor: selected ? colors.primary : colors.borderStrong,
                            borderRadius: tokens.radius.md,
                            backgroundColor: selected ? colors.primarySoft : colors.bgSecondary,
                          }}
                        >
                          <Text style={{ color: selected ? colors.primary : colors.textMuted, fontWeight: '700' }}>{c}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Input
                    placeholder="Or enter custom category"
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>

                <Input
                  label="Price (₹)"
                  placeholder="10"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />

                <View style={{ gap: tokens.space.xs }}>
                  <Text style={typography.label}>Status</Text>
                  <TouchableOpacity
                    onPress={() => setIsActive((v) => !v)}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderWidth: 1.5,
                      borderColor: colors.borderStrong,
                      borderRadius: tokens.radius.md,
                      backgroundColor: isActive ? colors.successSoft : colors.bgSecondary,
                    }}
                  >
                    <Text style={{ color: isActive ? colors.success : colors.textMuted, fontWeight: '700' }}>
                      {isActive ? '✓ Active (visible to customers)' : '✗ Inactive (hidden from customers)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Button
                    onPress={async () => {
                      const ok = await save();
                      if (ok) closePopup();
                    }}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add Item'}
                  </Button>
                  <Button variant="ghost" onPress={closePopup}>
                    Cancel
                  </Button>
                </View>
              </Card>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </TeaShell>
  );
}
