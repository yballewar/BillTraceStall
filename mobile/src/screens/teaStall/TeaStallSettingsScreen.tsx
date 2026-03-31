import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/authSlice';
import { Screen } from '../../ui';

const C = {
  page: '#FFFFFF',
  header: '#5b2e08',
  title: '#d6a064',
  body: '#f2f0ed',
  textDark: '#4f2d0f',
  border: '#ded4c8',
  danger: '#f24747',
};

export function TeaStallSettingsScreen() {
  const dispatch = useAppDispatch();
  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>REFRESH</Text>
        </TouchableOpacity>
        <Image source={require('../../../assets/web/kettle.png')} style={styles.kettle} resizeMode="contain" />
      </View>
      <View style={styles.body}>
        <Image source={require('../../../assets/web/GLSSimage.png')} style={styles.glass} resizeMode="contain" />
        <Text style={styles.pageTitle}>SETTINGS</Text>

        <View style={styles.card}>
          <Text style={styles.desc}>Manage your stall preferences and account</Text>
          <TouchableOpacity onPress={() => dispatch(logout())} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  header: { backgroundColor: C.header, paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  headerTitle: { fontSize: 40, fontWeight: '900', color: C.title, marginBottom: 14 },
  refreshBtn: { borderWidth: 1.5, borderColor: C.title, borderRadius: 18, alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 6 },
  refreshText: { color: C.title, fontSize: 16, fontWeight: '800' },
  kettle: { position: 'absolute', right: -22, bottom: -8, width: 205, height: 158, opacity: 0.92 },
  body: { flex: 1, backgroundColor: C.body, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -12, paddingHorizontal: 16, paddingTop: 16 },
  glass: { position: 'absolute', right: -24, top: 90, width: 188, height: 520, opacity: 0.35 },
  pageTitle: { color: C.textDark, fontSize: 22, fontWeight: '900', marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 26, borderWidth: 1, borderColor: C.border, padding: 20, marginTop: 90 },
  desc: { color: C.textDark, fontSize: 14, fontWeight: '700', marginBottom: 14, lineHeight: 20 },
  logoutBtn: { backgroundColor: C.danger, borderRadius: 24, paddingVertical: 14 },
  logoutText: { color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '900' },
});
