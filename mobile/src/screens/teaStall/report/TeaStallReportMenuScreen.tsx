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

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function TeaStallReportMenuScreen({ navigation }: any) {
  const date = todayKey();

  const items: MenuItem[] = [
    { title: 'Stall Sale Summary (Day Wise)', subtitle: 'Date, Bill Amount, Cash, Credit with totals', route: 'ReportMonthlySummary', color: colors.success, icon: 'S' },
    { title: 'Office Wise Summary (Date)', subtitle: 'Date, Office, Cash/Credit, Amount by date', route: 'ReportOfficeSummaryDate', params: { date }, color: colors.info, icon: 'O' },
    { title: 'Office Wise Summary (Month)', subtitle: 'Date, Office, Cash/Credit, Amount by month', route: 'ReportOfficeSummaryMonth', color: colors.info, icon: 'M' },
    { title: 'Daily Summary', subtitle: 'Daily summary for selected date', route: 'ReportHome', color: colors.info, icon: 'D' },
    { title: 'Office Wise', subtitle: 'Sale & cash/credit by office', route: 'ReportOffice', params: { date }, color: colors.info, icon: 'O' },
    { title: 'Item Wise', subtitle: 'Qty & sale by items', route: 'ReportItems', params: { date }, color: colors.purple, icon: 'I' },
    { title: 'Delivery Boy', subtitle: 'Sale & collection by delivery boy', route: 'ReportDelivery', params: { date }, color: colors.warning, icon: 'B' },
  ];

  return (
    <Screen edges={['bottom', 'left', 'right']} style={{ paddingTop: 0 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ backgroundColor: colors.primary, paddingTop: 28, paddingBottom: 32, paddingHorizontal: tokens.space.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5 }}>Reports</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>Choose a report type</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.space.xl, paddingTop: tokens.space.lg, gap: 12 }} showsVerticalScrollIndicator={false}>
          {items.map((m) => (
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
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                  {m.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                  {m.subtitle}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: m.color, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}
