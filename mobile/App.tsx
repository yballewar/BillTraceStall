import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
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
    <Provider store={store}>
      <PushTokenBootstrapper />
      <RealtimeBootstrapper />
      <RootNavigator />
      <StallNewOrderPopup />
      <DeliveryReadyOrderPopup />
      <SweetAlertRoot />
      <StatusBar style="dark" />
    </Provider>
  );
}
