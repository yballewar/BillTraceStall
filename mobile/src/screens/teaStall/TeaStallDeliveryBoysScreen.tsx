import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { Badge, Button, Card, Input, TeaShell, showAlert, colors, tokens, typography } from '../../ui';

type DeliveryBoyRow = { id: string; name: string; phone: string; createdAt: string };
type DeliveryBoysResponse = { items: DeliveryBoyRow[] };

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
    <TeaShell title="Delivery Boys" subtitle="Add and manage delivery accounts" icon="bicycle" rightAction={{ icon: 'refresh', onPress: load, disabled: loading }} scroll={false}>
      <View style={{ flex: 1, gap: tokens.space.lg }}>

        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}
        {loading ? <ActivityIndicator color={colors.primary} /> : null}

        <Card variant="elevated" style={{ gap: tokens.space.lg }}>
          <Badge tone="success">{editingId ? 'Edit Delivery Boy' : 'Add Delivery Boy'}</Badge>
          <Input placeholder="Name" value={name} onChangeText={setName} />
          <Input placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button onPress={save} disabled={loading}>{editingId ? 'Update' : 'Add'}</Button>
            {editingId ? <Button variant="ghost" onPress={reset}>Cancel</Button> : null}
          </View>
        </Card>

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: tokens.space.xxxl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setEditingId(item.id);
                setName(item.name);
                setPhone(item.phone);
              }}
            >
              <Card variant="outlined" style={{ gap: tokens.space.xs }}>
                <Text style={{ fontWeight: '800', color: colors.text }}>{item.name}</Text>
                <Text style={typography.muted}>{item.phone}</Text>
                <Text style={typography.faint}>Tap to edit</Text>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={!loading ? <Text style={typography.faint}>No delivery boys yet.</Text> : null}
        />
      </View>
    </TeaShell>
  );
}
