import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Screen, colors, tokens, typography } from '../../../ui';

type MenuItem = {
  title: string;
  subtitle: string;
  route: string;
  params?: any;
  color: string;
  icon: string;
};

const menuItems: MenuItem[] = [
  { title: 'Summary (Month Wise)', subtitle: 'Monthly delivery summary with day-wise breakup', route: 'DeliveryReportMonthly', color: colors.info, icon: 'M' },
  { title: 'Summary (Day Wise)', subtitle: 'Delivered orders summary for a selected day', route: 'DeliveryReportDaily', params: { initialTab: 'Summary' }, color: colors.success, icon: 'D' },
  { title: 'Delivery Orders', subtitle: 'All delivered orders list for a selected day', route: 'DeliveryReportDaily', params: { initialTab: 'Orders' }, color: colors.primary, icon: 'O' },
  { title: 'Item Wise', subtitle: 'Items sold summary for a selected day', route: 'DeliveryReportDaily', params: { initialTab: 'Items' }, color: colors.purple, icon: 'I' },
  { title: 'Collection Wise', subtitle: 'Cash vs Credit for a selected day', route: 'DeliveryReportDaily', params: { initialTab: 'Collection' }, color: colors.warning, icon: 'C' },
];

export function DeliveryReportHomeScreen({ navigation }: any) {
  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: 0 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ backgroundColor: colors.primary, paddingTop: 28, paddingBottom: 32, paddingHorizontal: tokens.space.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5 }}>Reports</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>Choose a report type</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.space.xl, paddingTop: tokens.space.lg, gap: 12 }} showsVerticalScrollIndicator={false}>
          {menuItems.map((m) => (
            <TouchableOpacity
              key={m.title}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(m.route, m.params)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: tokens.space.md, borderRadius: 16, gap: 16 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: m.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: m.color }}>{m.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>{m.title}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>{m.subtitle}</Text>
              </View>
              <Text style={{ fontSize: 18, color: m.color, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}
