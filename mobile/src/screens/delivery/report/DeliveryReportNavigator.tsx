import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeliveryReportHomeScreen } from './DeliveryReportHomeScreen';
import { DeliveryReportDailyScreen } from './DeliveryReportDailyScreen';
import { DeliveryReportMonthlyScreen } from './DeliveryReportMonthlyScreen';

const Stack = createNativeStackNavigator();

export function DeliveryReportNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliveryReportHome" component={DeliveryReportHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DeliveryReportDaily" component={DeliveryReportDailyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DeliveryReportMonthly" component={DeliveryReportMonthlyScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

