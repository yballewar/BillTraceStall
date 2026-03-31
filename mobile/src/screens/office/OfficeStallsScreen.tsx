import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { getOfficeDraft, getSelectedOfficeId, setSelectedOfficeId } from '../../services/storage';
import { useAppSelector } from '../../redux/hooks';
import { Badge, Button, Card, Input, Screen, showAlert, colors, tokens, typography } from '../../ui';

type MyStallRow = {
  officeId: string;
  officeName: string;
  contactPerson: string;
  phone: string;
  address: string;
  uniqueCode: string;
  stall: {
    stallId: string;
    stallName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    uniqueCode: string;
    ownerPhone: string;
  };
  createdAt: string;
};

type MyStallsResponse = { items: MyStallRow[] };

type SearchRow = {
  stallId: string;
  stallName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  uniqueCode: string;
  ownerPhone: string;
};

type SearchResponse = { items: SearchRow[] };

export function OfficeStallsScreen() {
  const navigation = useNavigation<any>();
  const authPhone = useAppSelector((s) => s.auth.phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOfficeId, setSelectedOfficeIdState] = useState<string | null>(null);
  const [myStalls, setMyStalls] = useState<MyStallRow[]>([]);

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchRow[]>([]);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  const loadSelected = async () => {
    const id = await getSelectedOfficeId();
    setSelectedOfficeIdState(id);
  };

  const loadMyStalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<MyStallsResponse>('office/stalls');
      setMyStalls(data.items ?? []);
      if (!selectedOfficeId && data.items?.length) {
        const first = data.items[0].officeId;
        await setSelectedOfficeId(first);
        setSelectedOfficeIdState(first);
      }
    } catch (e: any) {
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
      setMyStalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadSelected();
      await loadMyStalls();
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    (async () => {
      setSearchLoading(true);
      try {
        const { data } = await api.get<SearchResponse>('office/stalls/search', { params: { query: debouncedQuery } });
        if (!cancelled) setSearchResults(data.items ?? []);
      } catch (e: any) {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const selectOffice = async (officeId: string) => {
    await setSelectedOfficeId(officeId);
    setSelectedOfficeIdState(officeId);
  };

  const selectAndOrder = async (officeId: string) => {
    await selectOffice(officeId);
    navigation.navigate('OfficePlaceOrder', { officeId });
  };

  const join = async (stallUniqueCode: string) => {
    const draft = await getOfficeDraft();
    if (!draft?.officeName?.trim() || !draft?.contactPerson?.trim() || !draft?.address?.trim()) {
      showAlert('Office details missing', 'Please register as Office and fill Office Details first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('office/join-stall', {
        stallUniqueCode,
        officeName: draft.officeName,
        contactPerson: draft.contactPerson,
        phone: authPhone ?? '',
        address: draft.address,
      });
      await loadMyStalls();
    } catch (e: any) {
      const msg = String(e?.response?.data?.error ?? e?.message ?? 'Join failed');
      setError(msg);
      showAlert('Join failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View style={{ gap: tokens.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.h3}>Stalls</Text>
          <Button variant="ghost" onPress={loadMyStalls} disabled={loading}>
            Refresh
          </Button>
        </View>
        {error ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Badge tone="danger">{error}</Badge>
          </View>
        ) : null}
        {loading ? <ActivityIndicator /> : null}

        <Card style={{ gap: tokens.space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={typography.h3}>Join a Stall</Text>
            <Badge tone="neutral">Search</Badge>
          </View>

          <Input
            label="Search Stall (name / address / phone)"
            placeholder="Type at least 2 characters..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {searchLoading ? <ActivityIndicator /> : null}

          <FlatList
            data={searchResults}
            keyExtractor={(i) => i.stallId}
            contentContainerStyle={{ gap: tokens.space.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => join(item.uniqueCode)} activeOpacity={0.85}>
                <Card style={{ gap: tokens.space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                      {item.stallName}
                    </Text>
                    <Badge tone="info">{item.uniqueCode}</Badge>
                  </View>
                  <Text style={{ color: colors.textMuted, fontWeight: '700' }} numberOfLines={2}>
                    {item.address}
                  </Text>
                  <Text style={{ color: colors.textFaint, fontWeight: '700' }} numberOfLines={1}>
                    {item.city} • {item.ownerPhone}
                  </Text>
                  <View style={{ alignItems: 'flex-start', marginTop: tokens.space.xs }}>
                    <Badge tone="success">Tap to Join</Badge>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
            ListEmptyComponent={debouncedQuery.length >= 2 && !searchLoading ? <Text style={typography.faint}>No stalls found.</Text> : null}
          />
        </Card>

        <View style={{ gap: tokens.space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={typography.h3}>My Joined Stalls</Text>
            {selectedOfficeId ? <Badge tone="info">Selected</Badge> : <Badge tone="warning">Not Selected</Badge>}
          </View>

          <FlatList
            data={myStalls}
            keyExtractor={(i) => i.officeId}
            contentContainerStyle={{ gap: tokens.space.sm, paddingBottom: 24 }}
            renderItem={({ item }) => {
              const selected = item.officeId === selectedOfficeId;
              return (
                <TouchableOpacity
                  onPress={() => selectAndOrder(item.officeId)}
                  onLongPress={() => {
                    selectOffice(item.officeId);
                    showAlert('Selected', 'Stall selected');
                  }}
                  activeOpacity={0.85}
                >
                  <Card
                    style={{
                      borderWidth: selected ? 1 : 0,
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      borderColor: selected ? colors.primary : 'transparent',
                      backgroundColor: selected ? 'rgba(79,70,229,0.10)' : colors.card,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                        {item.stall.stallName}
                      </Text>
                      <Badge tone={selected ? 'success' : 'neutral'}>{selected ? 'Selected' : 'Joined'}</Badge>
                    </View>
                    <Text style={{ marginTop: tokens.space.xs, color: colors.textMuted, fontWeight: '700' }} numberOfLines={2}>
                      {item.stall.address}
                    </Text>
                    <Text style={{ marginTop: tokens.space.sm, color: colors.textFaint, fontWeight: '700' }}>
                      Tap to Order • Long-press to Select
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={!loading ? <Text style={typography.faint}>No stalls joined yet. Search above and join.</Text> : null}
          />
        </View>
      </View>
    </Screen>
  );
}
