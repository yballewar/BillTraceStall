import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { store } from './src/redux/store';
import { hydrateAuth, logout } from './src/redux/authSlice';
import { useEffect } from 'react';
import { PushTokenBootstrapper } from './src/services/PushTokenBootstrapper';
import { RealtimeBootstrapper } from './src/services/RealtimeBootstrapper';
import { StallNewOrderPopup } from './src/services/StallNewOrderPopup';
import { DeliveryReadyOrderPopup } from './src/services/DeliveryReadyOrderPopup';
import { SweetAlertRoot } from './src/ui/SweetAlert';
import { showAlert } from './src/ui';
import { onUnauthorized } from './src/services/authEvents';

const AppText = Text as any;
if (!AppText.defaultProps) AppText.defaultProps = {};
AppText.defaultProps.allowFontScaling = false;
AppText.defaultProps.maxFontSizeMultiplier = 1;

const AppTextInput = TextInput as any;
if (!AppTextInput.defaultProps) AppTextInput.defaultProps = {};
AppTextInput.defaultProps.allowFontScaling = false;
AppTextInput.defaultProps.maxFontSizeMultiplier = 1;

export default function App() {
  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, []);

  useEffect(() => {
    const unsub = onUnauthorized(() => {
      store.dispatch(logout());
      showAlert('Session expired', 'Please login again.');
    });
    return () => {
      unsub();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PushTokenBootstrapper />
        <RealtimeBootstrapper />
        <RootNavigator />
        <StallNewOrderPopup />
        <DeliveryReadyOrderPopup />
        <SweetAlertRoot />
        <StatusBar style="dark" />
      </Provider>
    </SafeAreaProvider>
  );
}
