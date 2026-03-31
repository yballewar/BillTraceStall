import { Button, Text, View } from 'react-native';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/authSlice';

export function OfficeSettingsScreen() {
  const dispatch = useAppDispatch();
  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Settings</Text>
      <Button title="Logout" onPress={() => dispatch(logout())} />
    </View>
  );
}

