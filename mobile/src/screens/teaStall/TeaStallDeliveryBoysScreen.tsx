import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { Badge, Screen, showAlert } from '../../ui';

type DeliveryBoyRow = { id: string; name: string; phone: string; createdAt: string };
type DeliveryBoysResponse = { items: DeliveryBoyRow[] };
const C = {
  page: '#FFFFFF',
  header: '#5b2e08',
  title: '#d6a064',
  body: '#f2f0ed',
  textDark: '#4f2d0f',
  border: '#d7cdbf',
  card: '#ffffff',
  action: '#6b3508',
  tan: '#c99359',
};

export function TeaStallDeliveryBoysScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DeliveryBoyRow[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const reset = () => {
    setEditingId(null);
    setName('');
    setPhone('');
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<DeliveryBoysResponse>('stall/delivery-boys');
      setItems(data.items ?? []);
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

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      showAlert('Validation', 'Name and phone required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await api.put(`stall/delivery-boys/${editingId}`, { name: name.trim(), phone: phone.trim() });
      } else {
        await api.post('stall/delivery-boys', { name: name.trim(), phone: phone.trim() });
      }
      reset();
      await load();
    } catch (e: any) {
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Save failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={loading ? undefined : load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>{loading ? 'LOADING' : 'REFRESH'}</Text>
        </TouchableOpacity>
        <Image source={require('../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>
      <View style={styles.body}>
        <Image source={require('../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />
        <Text style={styles.blockTitle}>DELIVERY BOYS</Text>
        <Text style={styles.blockSub}>{editingId ? 'Edit Delivery boy' : 'Add new delivery boy'}</Text>

        <View style={styles.formCard}>
          <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#6f4f31" style={styles.input} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#6f4f31" keyboardType="phone-pad" style={styles.input} />
          <View style={styles.actions}>
            <TouchableOpacity onPress={save} disabled={loading} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
            {editingId ? (
              <TouchableOpacity onPress={reset} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {error ? (
          <View style={{ marginBottom: 8 }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}
        {loading ? <ActivityIndicator color={C.action} style={{ marginBottom: 8 }} /> : null}

        <View style={styles.listWrap}>
          <Text style={styles.listTitle}>Existing Delivery Boys</Text>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ gap: 10, padding: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setEditingId(item.id);
                  setName(item.name);
                  setPhone(item.phone);
                }}
                style={styles.itemCard}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPhone}>{item.phone}</Text>
                <View style={styles.tapBtn}>
                  <Text style={styles.tapText}>Tap to edit</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={!loading ? <Text style={{ color: '#8f7b67', textAlign: 'center', paddingVertical: 14 }}>No delivery boys yet.</Text> : null}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  header: { backgroundColor: C.header, paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  headerTitle: { fontSize: 40, fontWeight: '900', color: C.title, marginBottom: 14 },
  refreshBtn: { borderWidth: 1.5, borderColor: C.title, borderRadius: 18, alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 6 },
  refreshText: { color: C.title, fontSize: 16, fontWeight: '800' },
  kettle: { position: 'absolute', right: -22, bottom: -8, width: 205, height: 158, opacity: 0.92 },
  body: { flex: 1, backgroundColor: C.body, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -12, paddingHorizontal: 16, paddingTop: 16 },
  glass: { position: 'absolute', right: -24, top: 90, width: 188, height: 520, opacity: 0.35 },
  blockTitle: { color: C.textDark, fontSize: 22, fontWeight: '900', marginBottom: 6 },
  blockSub: { color: C.textDark, fontSize: 34, marginBottom: 12 },
  formCard: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 14, gap: 12, marginBottom: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1.2, borderColor: '#8a5f33', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, color: C.textDark, fontWeight: '700', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  saveBtn: { backgroundColor: C.action, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 10 },
  saveBtnText: { color: C.title, fontWeight: '900', fontSize: 20 },
  cancelBtn: { backgroundColor: C.tan, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 10 },
  cancelBtnText: { color: C.textDark, fontWeight: '900', fontSize: 20 },
  listWrap: { backgroundColor: C.action, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, paddingTop: 12, marginTop: 8, flex: 1 },
  listTitle: { color: C.title, textAlign: 'center', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  itemCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 14 },
  itemName: { color: C.textDark, fontSize: 30, fontWeight: '900' },
  itemPhone: { color: '#4f4f4f', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  tapBtn: { backgroundColor: C.action, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  tapText: { color: C.title, fontWeight: '900', fontSize: 14 },
});
