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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../redux/hooks';
import { requestOtp } from '../../redux/authSlice';
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

const formatPhoneDisplay = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

export function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const buttonLabel = submitting ? 'Working...' : 'Send OTP';

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

          <View style={styles.wrap}>
            <Text style={styles.label}>CONTACT NUMBER</Text>
            <TextInput
              value={phone}
              onChangeText={(value) => {
                setPhone(formatPhoneDisplay(value));
                if (error) setError(null);
              }}
              placeholder="1234567890"
              placeholderTextColor={C.placeholder}
              style={styles.input}
              keyboardType="phone-pad"
              autoComplete="tel"
              importantForAutofill="no"
              maxLength={11}
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
              const normalizedPhone = phone.replace(/\D/g, '');
              if (normalizedPhone.length !== 10) {
                setError('Please enter a valid 10-digit mobile number');
                return;
              }
              setSubmitting(true);
              setError(null);
              try {
                await dispatch(requestOtp({ phone: normalizedPhone, mode: 'login' })).unwrap();
                showAlert('OTP', 'OTP sent to your mobile number');
                navigation.navigate('Otp', { phone: normalizedPhone });
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
