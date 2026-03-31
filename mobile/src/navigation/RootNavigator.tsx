import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../redux/hooks';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { DeliveryAvailableScreen } from '../screens/delivery/DeliveryAvailableScreen';
import { DeliveryScheduledScreen } from '../screens/delivery/DeliveryScheduledScreen';
import { DeliveryTodayScreen } from '../screens/delivery/DeliveryTodayScreen';
import { DeliveryReportNavigator } from '../screens/delivery/report/DeliveryReportNavigator';
import { DeliverySettingsScreen } from '../screens/delivery/DeliverySettingsScreen';
import { OfficeDashboardScreen } from '../screens/office/OfficeDashboardScreen';
import { OfficeItemWiseScreen } from '../screens/office/OfficeItemWiseScreen';
import { OfficeOrderDetailsScreen } from '../screens/office/OfficeOrderDetailsScreen';
import { OfficeOrdersScreen } from '../screens/office/OfficeOrdersScreen';
import { OfficeOrdersByDayScreen } from '../screens/office/OfficeOrdersByDayScreen';
import { OfficePaymentsScreen } from '../screens/office/OfficePaymentsScreen';
import { OfficePlaceOrderScreen } from '../screens/office/OfficePlaceOrderScreen';
import { OfficeReportNavigator } from '../screens/office/report/OfficeReportNavigator';
import { OfficeSettingsScreen } from '../screens/office/OfficeSettingsScreen';
import { OfficeStallsScreen } from '../screens/office/OfficeStallsScreen';
import { TeaStallDashboardScreen } from '../screens/teaStall/TeaStallDashboardScreen';
import { TeaStallMenuScreen } from '../screens/teaStall/TeaStallMenuScreen';
import { TeaStallDeliveryBoysScreen } from '../screens/teaStall/TeaStallDeliveryBoysScreen';
import { TeaStallOrdersScreen } from '../screens/teaStall/TeaStallOrdersScreen';
import { TeaStallReportNavigator } from '../screens/teaStall/report/TeaStallReportNavigator';
import { TeaStallSettingsScreen } from '../screens/teaStall/TeaStallSettingsScreen';
import { navigationRef } from './navigationRef';
import { colors } from '../ui';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const OfficeStack = createNativeStackNavigator();

const tabBarStyles = {
  tabBarActiveTintColor: '#d6a064',
  tabBarInactiveTintColor: '#8f6e4f',
  tabBarStyle: {
    backgroundColor: '#5b2e08',
    borderTopWidth: 0,
    height: 66,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabelStyle: { fontWeight: '600' as const, fontSize: 11 },
  tabBarItemStyle: { borderRadius: 10, marginHorizontal: 2, marginVertical: 4 },
  tabBarActiveBackgroundColor: 'rgba(214,160,100,0.24)',
};

function TeaStallTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#d6a064',
        tabBarInactiveTintColor: '#8f6e4f',
        tabBarStyle: {
          backgroundColor: '#5b2e08',
          borderTopWidth: 0,
          height: 66 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        tabBarItemStyle: { borderRadius: 10, marginHorizontal: 2, marginVertical: 4 },
        tabBarActiveBackgroundColor: 'rgba(214,160,100,0.24)',
      }}
    >
      <Tabs.Screen name="Dashboard" component={TeaStallDashboardScreen} options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={20} color={color} /> }} />
      <Tabs.Screen name="Orders" component={TeaStallOrdersScreen} options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={20} color={color} /> }} />
      <Tabs.Screen name="Report" component={TeaStallReportNavigator} options={{ headerShown: false, tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={20} color={color} /> }} />
      <Tabs.Screen name="Menu" component={TeaStallMenuScreen} options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={20} color={color} /> }} />
      <Tabs.Screen name="Delivery" component={TeaStallDeliveryBoysScreen} options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bicycle' : 'bicycle-outline'} size={20} color={color} /> }} />
      <Tabs.Screen name="Settings" component={TeaStallSettingsScreen} options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={20} color={color} /> }} />
    </Tabs.Navigator>
  );
}

function OfficeTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={{
        ...tabBarStyles,
        tabBarStyle: {
          ...(tabBarStyles.tabBarStyle as object),
          height: 66 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen name="Stalls" component={OfficeStallsScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="storefront" size={22} color={color} /> }} />
      <Tabs.Screen name="Orders" component={OfficeOrdersScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="receipt" size={22} color={color} /> }} />
      <Tabs.Screen name="Report" component={OfficeReportNavigator} options={{ headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} /> }} />
      <Tabs.Screen name="Dashboard" component={OfficeDashboardScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="Items" component={OfficeItemWiseScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="pricetag" size={22} color={color} /> }} />
      <Tabs.Screen name="Payments" component={OfficePaymentsScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="wallet" size={22} color={color} /> }} />
      <Tabs.Screen name="Settings" component={OfficeSettingsScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} /> }} />
    </Tabs.Navigator>
  );
}

function OfficeNavigator() {
  return (
    <OfficeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <OfficeStack.Screen name="OfficeTabs" component={OfficeTabs} options={{ headerShown: false }} />
      <OfficeStack.Screen name="OfficePlaceOrder" component={OfficePlaceOrderScreen} options={{ title: 'Place Order' }} />
      <OfficeStack.Screen name="OfficeOrderDetails" component={OfficeOrderDetailsScreen} options={{ title: 'Order Details' }} />
      <OfficeStack.Screen name="OfficeOrdersByDay" component={OfficeOrdersByDayScreen} options={{ title: 'Daily Orders' }} />
    </OfficeStack.Navigator>
  );
}

function DeliveryTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={{
        ...tabBarStyles,
        tabBarActiveTintColor: '#d6a064',
        tabBarStyle: {
          ...(tabBarStyles.tabBarStyle as object),
          height: 66 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen name="Order" component={DeliveryAvailableScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="receipt" size={22} color={color} /> }} />
      <Tabs.Screen name="Schedule" component={DeliveryScheduledScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="Today" component={DeliveryTodayScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="today" size={22} color={color} /> }} />
      <Tabs.Screen name="Report" component={DeliveryReportNavigator} options={{ headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} /> }} />
      <Tabs.Screen name="Settings" component={DeliverySettingsScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} /> }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { status, role } = useAppSelector((s) => s.auth);

  return (
    <NavigationContainer ref={navigationRef}>
      {status === 'authenticated' ? (
        role === 'TeaStallOwner' ? (
          <TeaStallTabs />
        ) : role === 'DeliveryBoy' ? (
          <DeliveryTabs />
        ) : (
          <OfficeNavigator />
        )
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
