import { Text, View } from 'react-native';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/authSlice';
import { Button, Card, Screen, tokens, typography } from '../../ui';

export function OfficeHomeScreen() {
  const dispatch = useAppDispatch();
  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View style={{ gap: tokens.space.xl }}>
        <Text style={typography.h2}>Office Dashboard</Text>
        <Card variant="elevated">
          <Button variant="danger" onPress={() => dispatch(logout())}>
            Logout
          </Button>
        </Card>
      </View>
    </Screen>
  );
}
