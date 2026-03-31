import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { Badge, Screen, showAlert } from '../../ui';

type MenuItemRow = {
  id: string;
  itemName: string;
  price: number;
  category: string;
  isActive: boolean;
};

const CATEGORIES = ['Tea', 'Coffee', 'Snacks', 'Other'] as const;
const C = {
  page: '#FFFFFF',
  header: '#5b2e08',
  title: '#d6a064',
  body: '#f2f0ed',
  textDark: '#4f2d0f',
  card: '#5f3008',
  chip: '#c99359',
  activeBg: '#daf8ec',
  activeText: '#2d9f6a',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.45)',
};

function getMenuImage(name: string, category: string) {
  const key = `${name} ${category}`.toLowerCase();
  if (key.includes('tea') || key.includes('chai')) return require('../../../assets/web/1-Photoroom.png');
  if (key.includes('khari') || key.includes('snack') || key.includes('bread') || key.includes('bun')) return require('../../../assets/web/2-Photoroom-2.png');
  if (key.includes('coffee')) return require('../../../assets/web/3-Photoroom-3.png');
  return require('../../../assets/web/1-Photoroom.png');
}

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
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={loading ? undefined : load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>{loading ? 'LOADING' : 'REFRESH'}</Text>
        </TouchableOpacity>
        <Image source={require('../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>

      <View style={styles.body}>
        <Image source={require('../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />

        <View style={styles.topRow}>
          <Text style={styles.sectionTitle}>Your Menu Items</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>ADD NEW ITEM</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={{ marginBottom: 8 }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}
        {loading ? <ActivityIndicator color={C.card} style={{ marginVertical: 8 }} /> : null}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.82} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.itemName}
                </Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
                <View style={[styles.statusChip, !item.isActive && styles.statusChipOff]}>
                  <Text style={[styles.statusText, !item.isActive && styles.statusTextOff]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
              <Image source={getMenuImage(item.itemName, item.category)} style={styles.itemImg} resizeMode="contain" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ color: '#8a725d', fontWeight: '600' }}>No menu items yet.</Text>
              </View>
            ) : null
          }
        />
      </View>

      <Modal transparent visible={popupOpen} animationType="slide" onRequestClose={closePopup}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closePopup}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Item' : 'Add New Item'}</Text>

            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput
              placeholder="e.g. Masala Chai"
              value={itemName}
              onChangeText={setItemName}
              autoCapitalize="words"
              style={styles.input}
              placeholderTextColor="#9f8f81"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map((c) => {
                const selected = category.trim() === c;
                return (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catPill, selected && styles.catPillOn]}>
                    <Text style={[styles.catPillText, selected && styles.catPillTextOn]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              placeholder="Or custom category"
              value={category}
              onChangeText={setCategory}
              style={styles.input}
              placeholderTextColor="#9f8f81"
            />

            <Text style={styles.inputLabel}>Price (₹)</Text>
            <TextInput
              placeholder="10"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor="#9f8f81"
            />

            <TouchableOpacity onPress={() => setIsActive((v) => !v)} style={[styles.statusToggle, isActive && styles.statusToggleOn]}>
              <Text style={[styles.statusToggleText, isActive && styles.statusToggleTextOn]}>
                {isActive ? 'Active (visible to customers)' : 'Inactive (hidden from customers)'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={async () => {
                  const ok = await save();
                  if (ok) closePopup();
                }}
                disabled={loading}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Saving...' : editingId ? 'Update' : 'Add Item'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closePopup} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  header: {
    backgroundColor: C.header,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTitle: { fontSize: 40, fontWeight: '900', color: C.title, marginBottom: 14 },
  refreshBtn: { borderWidth: 1.5, borderColor: C.title, borderRadius: 18, alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 6 },
  refreshText: { color: C.title, fontSize: 16, fontWeight: '800' },
  kettle: { position: 'absolute', right: -22, bottom: -8, width: 210, height: 160, opacity: 0.92 },
  body: {
    flex: 1,
    backgroundColor: C.body,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  glass: { position: 'absolute', right: -24, top: 82, width: 185, height: 460, opacity: 0.35 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 },
  sectionTitle: { color: C.textDark, fontSize: 22, fontWeight: '900' },
  addBtn: { borderWidth: 1.5, borderColor: C.textDark, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.chip },
  addBtnText: { color: C.textDark, fontSize: 12, fontWeight: '900' },
  itemCard: { backgroundColor: C.card, borderRadius: 34, paddingVertical: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', minHeight: 115 },
  itemName: { color: C.white, fontSize: 34, fontWeight: '900' },
  itemPrice: { color: '#5de38c', fontSize: 30, fontWeight: '900', marginTop: 2 },
  statusChip: { backgroundColor: C.activeBg, borderRadius: 999, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6 },
  statusChipOff: { backgroundColor: '#ebdfd8' },
  statusText: { color: C.activeText, fontWeight: '800', fontSize: 22 },
  statusTextOff: { color: '#9a7f69' },
  itemImg: { width: 122, height: 104, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff8f1',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    padding: 22,
    paddingBottom: 26,
    minHeight: '72%',
  },
  modalTitle: { color: C.textDark, fontSize: 22, fontWeight: '900', marginBottom: 12 },
  inputLabel: { color: C.textDark, fontWeight: '800', fontSize: 13, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#efe7df', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.textDark },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8, marginTop: 4 },
  catPill: { borderWidth: 1.3, borderColor: '#b79f88', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#f8f1e9' },
  catPillOn: { borderColor: C.card, backgroundColor: '#ead2b8' },
  catPillText: { color: '#80644b', fontWeight: '700', fontSize: 12 },
  catPillTextOn: { color: C.card },
  statusToggle: { borderWidth: 1.2, borderColor: '#b79f88', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, backgroundColor: '#f8f1e9' },
  statusToggleOn: { backgroundColor: '#daf8ec', borderColor: '#7ecfa6' },
  statusToggleText: { color: '#80644b', fontWeight: '700' },
  statusToggleTextOn: { color: '#2d9f6a' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: { flex: 1, backgroundColor: C.chip, borderRadius: 12, paddingVertical: 11 },
  primaryBtnText: { textAlign: 'center', color: C.textDark, fontWeight: '900' },
  secondaryBtn: { borderWidth: 1.2, borderColor: '#b79f88', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  secondaryBtnText: { color: '#80644b', fontWeight: '800' },
});
