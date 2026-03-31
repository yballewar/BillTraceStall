import { Text, View } from 'react-native';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/authSlice';
import { Button, Card, TeaShell, tokens, typography } from '../../ui';

export function TeaStallSettingsScreen() {
  const dispatch = useAppDispatch();
  return (
    <TeaShell title="Settings" subtitle="Manage account and preferences" icon="settings" scroll={false}>
      <View style={{ gap: tokens.space.xl }}>
        <Card variant="elevated" style={{ gap: tokens.space.lg }}>
          <Text style={typography.body}>Manage your stall preferences and account.</Text>
          <Button variant="danger" onPress={() => dispatch(logout())}>
            Logout
          </Button>
        </Card>
      </View>
    </TeaShell>
  );
}
