import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeaStallReportMenuScreen } from './TeaStallReportMenuScreen';
import { TeaStallReportHomeScreen } from './TeaStallReportHomeScreen';
import { TeaStallReportMonthlySummaryScreen } from './TeaStallReportMonthlySummaryScreen';
import { TeaStallReportOfficeScreen } from './TeaStallReportOfficeScreen';
import { TeaStallReportItemsScreen } from './TeaStallReportItemsScreen';
import { TeaStallReportDeliveryScreen } from './TeaStallReportDeliveryScreen';
import { TeaStallReportDeliveryOrdersScreen } from './TeaStallReportDeliveryOrdersScreen';
import { TeaStallReportOfficeOrdersScreen } from './TeaStallReportOfficeOrdersScreen';
import { TeaStallReportOfficeSummaryDateScreen } from './TeaStallReportOfficeSummaryDateScreen';
import { TeaStallReportOfficeSummaryMonthScreen } from './TeaStallReportOfficeSummaryMonthScreen';

const Stack = createNativeStackNavigator();

export function TeaStallReportNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReportHome" component={TeaStallReportHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportMenu" component={TeaStallReportMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportMonthlySummary" component={TeaStallReportMonthlySummaryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportOffice" component={TeaStallReportOfficeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportOfficeSummaryDate" component={TeaStallReportOfficeSummaryDateScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportOfficeSummaryMonth" component={TeaStallReportOfficeSummaryMonthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportItems" component={TeaStallReportItemsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportDelivery" component={TeaStallReportDeliveryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportDeliveryOrders" component={TeaStallReportDeliveryOrdersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportOfficeOrders" component={TeaStallReportOfficeOrdersScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
