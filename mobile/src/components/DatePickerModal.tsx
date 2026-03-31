import { useMemo, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { colors, tokens, typography } from '../ui';

function parseKey(key: string) {
  const m = key.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, mo, d };
}

function toKey(y: number, mo: number, d: number) {
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, mo: number) {
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

function firstDow(y: number, mo: number) {
  return new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const dowNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function DatePickerModal(props: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (dateKey: string) => void;
}) {
  const parsed = parseKey(props.value);
  const init = parsed ?? (() => {
    const d = new Date();
    return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate() };
  })();

  const [y, setY] = useState(init.y);
  const [mo, setMo] = useState(init.mo);

  const selectedKey = parsed ? toKey(parsed.y, parsed.mo, parsed.d) : null;

  const grid = useMemo(() => {
    const first = firstDow(y, mo);
    const dim = daysInMonth(y, mo);
    const arr: Array<{ kind: 'empty' } | { kind: 'day'; d: number; key: string }> = [];
    for (let i = 0; i < first; i++) arr.push({ kind: 'empty' });
    for (let d = 1; d <= dim; d++) arr.push({ kind: 'day', d, key: toKey(y, mo, d) });
    const remainder = arr.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) arr.push({ kind: 'empty' });
    }
    return arr;
  }, [mo, y]);

  const shiftMonth = (delta: number) => {
    const idx = y * 12 + (mo - 1) + delta;
    const ny = Math.floor(idx / 12);
    const nmo = (idx % 12) + 1;
    setY(ny);
    setMo(nmo);
  };

  return (
    <Modal transparent visible={props.visible} animationType="fade" onRequestClose={props.onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, justifyContent: 'center' }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: tokens.radius.xl, padding: tokens.space.lg, gap: tokens.space.lg, borderWidth: 1, borderColor: colors.border, borderTopWidth: 4, borderTopColor: colors.primary }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontWeight: '800', color: colors.primary }}>Prev</Text>
            </TouchableOpacity>
            <Text style={[typography.h3, { color: colors.text }]}>{monthNames[mo - 1]} {y}</Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontWeight: '800', color: colors.primary }}>Next</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {dowNames.map((n, idx) => (
              <View key={`${n}-${idx}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: colors.textMuted, fontWeight: '800' }}>{n}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {grid.map((c, idx) => {
              if (c.kind === 'empty') {
                return <View key={`e-${idx}`} style={{ width: `${100 / 7}%`, padding: 4 }} />;
              }
              const active = selectedKey === c.key;
              return (
                <View key={c.key} style={{ width: `${100 / 7}%`, padding: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      props.onSelect(c.key);
                      props.onClose();
                    }}
                    style={{
                      borderRadius: tokens.radius.md,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primarySoft : colors.bgSecondary,
                    }}
                  >
                    <Text style={{ color: active ? colors.primary : colors.text, fontWeight: '800' }}>{c.d}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <TouchableOpacity onPress={props.onClose} style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', color: colors.textMuted }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
