import { Text, View } from 'react-native';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/authSlice';
import { Button, Card, Screen, tokens, typography } from '../../ui';

export function DeliverySettingsScreen() {
  const dispatch = useAppDispatch();
  return (
    <Screen>
      <View style={{ gap: tokens.space.xl }}>
        <Text style={typography.h2}>Settings</Text>
        <Card variant="elevated" style={{ gap: tokens.space.lg }}>
          <Text style={typography.body}>Manage your delivery preferences and account.</Text>
          <Button variant="danger" onPress={() => dispatch(logout())}>
            Logout
          </Button>
        </Card>
      </View>
    </Screen>
  );
}
