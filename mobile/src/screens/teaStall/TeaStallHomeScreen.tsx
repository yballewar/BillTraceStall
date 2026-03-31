import { Button, Text, View } from 'react-native';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/authSlice';

export function TeaStallHomeScreen() {
  const dispatch = useAppDispatch();
  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Tea Stall Dashboard</Text>
      <Button title="Logout" onPress={() => dispatch(logout())} />
    </View>
  );
}
