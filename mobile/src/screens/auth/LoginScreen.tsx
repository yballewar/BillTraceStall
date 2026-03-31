import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../redux/hooks';
import { requestOtp, verifyOtp } from '../../redux/authSlice';
import { Badge, showAlert } from '../../ui';

/** Design reference: layered hero + glass overlap + asymmetric white sheet (not a flat Figma export). */
const C = {
  brownBg: '#4b2c11',
  heroBg: '#3e2723',
  tanBtn: '#c69154',
  label: '#4b2c11',
  sub: '#6b5b4f',
  inputBg: '#d9d9d9',
  white: '#ffffff',
  placeholder: '#9a8f88',
};

type Role = 'TeaStallOwner' | 'Office' | 'DeliveryBoy';

export function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(__DEV__ ? '999999' : '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<Role>('TeaStallOwner');

  const roles: { key: Role; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'TeaStallOwner', label: 'Tea Stall\nOwner', icon: 'person-outline' },
    { key: 'Office', label: 'Office\nstaff', icon: 'business-outline' },
    { key: 'DeliveryBoy', label: 'Delivery\nboy', icon: 'bicycle-outline' },
  ];

  const buttonLabel = submitting ? 'Working...' : otp.trim().length === 6 ? 'Log in' : 'Send OTP';

  return (
    <SafeAreaView style={styles.shell} edges={['top', 'bottom', 'left', 'right']}>
      {/* overflow: visible so the glass can sit above the white sheet without being clipped */}
      <View style={styles.card}>
        <View style={styles.heroZone}>
          <View style={styles.hero}>
            <Image source={require('../../../assets/web/kettle.png')} style={styles.heroKettle} resizeMode="contain" />
          </View>
          <Image
            source={require('../../../assets/web/GLSSimage.png')}
            style={styles.heroGlass}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formBlock}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Login</Text>

          <Text style={styles.sub}>
            Don&apos;t have an account?{' '}
            <Text style={styles.linkBold} onPress={() => navigation.navigate('Register')}>
              Sign up
            </Text>
          </Text>

          <View style={styles.roleRow}>
            {roles.map((r) => {
              const on = role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  activeOpacity={0.85}
                  onPress={() => setRole(r.key)}
                  style={[styles.rolePill, on && styles.rolePillOn]}
                >
                  <Ionicons name={r.icon} size={18} color={C.tanBtn} />
                  <Text style={styles.roleText}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.wrap}>
            <Text style={styles.label}>CONTACT NUMBER</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="1234567890"
              placeholderTextColor={C.placeholder}
              style={styles.input}
              keyboardType="phone-pad"
              autoComplete="tel"
              importantForAutofill="no"
            />
          </View>

          <View style={styles.wrap}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="******"
              placeholderTextColor={C.placeholder}
              style={styles.input}
              secureTextEntry
              keyboardType="number-pad"
              autoComplete="sms-otp"
              importantForAutofill="no"
              maxLength={6}
            />
          </View>

          {error ? (
            <View style={{ marginBottom: 10, alignSelf: 'stretch' }}>
              <Badge tone="danger">{error}</Badge>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.cta, submitting && styles.ctaDisabled]}
            disabled={submitting}
            activeOpacity={0.88}
            onPress={async () => {
              if (submitting) return;
              setSubmitting(true);
              setError(null);
              try {
                if (otp.trim().length === 6) {
                  if (__DEV__ && otp.trim() === '999999') {
                    await dispatch(requestOtp({ phone, mode: 'login' })).unwrap();
                  }
                  await dispatch(verifyOtp({ phone, otp: otp.trim() })).unwrap();
                  return;
                }
                await dispatch(requestOtp({ phone, mode: 'login' })).unwrap();
                showAlert('OTP', 'OTP sent to your mobile number');
              } catch (e: any) {
                setError(String(e ?? 'Login failed'));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Text style={styles.ctaText}>{buttonLabel}</Text>
          </TouchableOpacity>

          {String(error ?? '').toLowerCase().includes('register') ? (
            <TouchableOpacity onPress={() => navigation.navigate('Register', { phone })} style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: C.label, fontWeight: '800', fontSize: 14 }}>Go to Register</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: C.white,
  },
  card: {
    flex: 1,
    backgroundColor: C.brownBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'visible',
  },
  /** Hero + overlapping glass (z-index) */
  heroZone: {
    height: 200,
    position: 'relative',
    zIndex: 2,
  },
  hero: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.heroBg,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  heroKettle: {
    width: '42%',
    height: 100,
    marginLeft: -4,
  },
  heroGlass: {
    position: 'absolute',
    right: -8,
    bottom: -48,
    width: 160,
    height: 200,
    zIndex: 3,
  },
  /** Asymmetric sheet: large left radius (design), smaller top-right */
  formBlock: {
    backgroundColor: C.white,
    borderTopLeftRadius: 88,
    borderTopRightRadius: 16,
    marginTop: -36,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 28,
    flexGrow: 1,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.label,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    textAlign: 'center',
    color: C.sub,
    marginBottom: 14,
    fontSize: 14,
  },
  linkBold: {
    color: C.label,
    fontWeight: '800',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  rolePill: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderColor: C.tanBtn,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
    backgroundColor: C.white,
  },
  rolePillOn: {
    backgroundColor: 'rgba(198, 145, 84, 0.15)',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
    color: C.tanBtn,
  },
  wrap: {
    marginBottom: 15,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: C.label,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  cta: {
    backgroundColor: C.tanBtn,
    paddingVertical: 16,
    borderRadius: 15,
    marginTop: 12,
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    textAlign: 'center',
    color: C.label,
    fontWeight: '800',
    fontSize: 17,
  },
});
