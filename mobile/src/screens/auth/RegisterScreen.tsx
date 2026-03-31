import { useMemo, useState } from 'react';
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
import { requestOtp, UserRole } from '../../redux/authSlice';
import { showAlert } from '../../ui';

/** Tea-stall signup mockup: dark brown sheet, kettle + glass, tan accents */
const C = {
  bg: '#4a2c0f',
  heroBg: '#3e2723',
  tan: '#c68e53',
  tanMuted: '#d4a574',
  label: '#d4a574',
  title: '#c68e53',
  sub: '#c4a574',
  inputFill: 'rgba(255, 255, 255, 0.12)',
  placeholder: 'rgba(255, 255, 255, 0.55)',
  textOnInput: '#ffffff',
  btnText: '#4a2c0f',
  white: '#ffffff',
};

export function RegisterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('TeaStallOwner');
  const [submitting, setSubmitting] = useState(false);

  const [stallName, setStallName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [officeName, setOfficeName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');

  const roles: { key: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = useMemo(
    () => [
      { key: 'TeaStallOwner', label: 'Tea Stall\nOwner', icon: 'person-outline' },
      { key: 'Office', label: 'Office\nstaff', icon: 'business-outline' },
      { key: 'DeliveryBoy', label: 'Delivery\nboy', icon: 'bicycle-outline' },
    ],
    []
  );

  const onSubmit = async () => {
    try {
      if (submitting) return;
      if (!name.trim() || !phone.trim()) {
        showAlert('Validation', 'Name and mobile number are required');
        return;
      }
      if (role === 'TeaStallOwner') {
        if (!stallName.trim() || !address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
          showAlert('Validation', 'Please fill all tea stall fields');
          return;
        }
      }
      if (role === 'Office') {
        if (!officeName.trim() || !(contactPerson || name).trim() || !officeAddress.trim()) {
          showAlert('Validation', 'Please fill office details');
          return;
        }
      }
      setSubmitting(true);
      await dispatch(
        requestOtp({
          phone,
          mode: 'register',
          name,
          role,
          stallName: role === 'TeaStallOwner' ? stallName : undefined,
          stallAddress: role === 'TeaStallOwner' ? address : undefined,
          city: role === 'TeaStallOwner' ? city : undefined,
          state: role === 'TeaStallOwner' ? state : undefined,
          pincode: role === 'TeaStallOwner' ? pincode : undefined,
        })
      ).unwrap();
      navigation.navigate('Otp', {
        phone,
        postVerify:
          role === 'Office'
            ? {
                kind: 'saveOfficeDraft',
                payload: {
                  officeName,
                  contactPerson: contactPerson || name,
                  address: officeAddress,
                },
              }
            : null,
      });
    } catch (e: any) {
      const msg = String(e ?? 'Registration failed');
      if (msg.toLowerCase().includes('already exists')) {
        showAlert('Already registered', 'This number may already exist. Try Login OTP.', [
          {
            text: 'Login OTP',
            onPress: async () => {
              try {
                setSubmitting(true);
                await dispatch(requestOtp({ phone, mode: 'login' })).unwrap();
                navigation.navigate('Otp', {
                  phone,
                  postVerify:
                    role === 'TeaStallOwner'
                      ? { kind: 'createTeaStall', payload: { stallName, address, city, state, pincode } }
                      : role === 'Office'
                        ? {
                            kind: 'saveOfficeDraft',
                            payload: {
                              officeName,
                              contactPerson: contactPerson || name,
                              address: officeAddress,
                            },
                          }
                        : null,
                });
              } catch (err: any) {
                showAlert('Login failed', String(err ?? 'Login failed'));
              } finally {
                setSubmitting(false);
              }
            },
          },
          { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
        ]);
        return;
      }
      showAlert('Registration failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.card}>
        <View style={styles.heroZone}>
          <View style={styles.hero}>
            <Image source={require('../../../assets/web/kettle.png')} style={styles.heroKettle} resizeMode="contain" />
          </View>
          <Image source={require('../../../assets/web/GLSSimage.png')} style={styles.heroGlass} resizeMode="contain" />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create new Account</Text>
          <Text style={styles.subtitle}>
            Already Registered?{' '}
            <Text style={styles.linkLogin} onPress={() => navigation.navigate('Login')}>
              Log in
            </Text>{' '}
            here.
          </Text>

          <Text style={styles.sectionLabel}>YOUR ROLE</Text>
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
                  <Ionicons name={r.icon} size={18} color={on ? C.btnText : C.tan} />
                  <Text style={[styles.roleText, on && styles.roleTextOn]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field label="NAME" placeholder="billtrace infotech" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="CONTACT NUMBER" placeholder="1234567890" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          {role === 'TeaStallOwner' ? (
            <>
              <Field label="TEA STALL NAME" placeholder="Select" value={stallName} onChangeText={setStallName} />
              <Field label="ADDRESS" placeholder="Select" value={address} onChangeText={setAddress} />
              <View style={styles.rowTwo}>
                <View style={styles.half}>
                  <Field label="CITY" placeholder="Select" value={city} onChangeText={setCity} />
                </View>
                <View style={styles.half}>
                  <Field label="STATE" placeholder="Select" value={state} onChangeText={setState} />
                </View>
              </View>
              <Field label="PINCODE" placeholder="Select" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
            </>
          ) : null}

          {role === 'Office' ? (
            <>
              <Field label="OFFICE NAME" placeholder="Office name" value={officeName} onChangeText={setOfficeName} />
              <Field label="CONTACT PERSON" placeholder="Name" value={contactPerson} onChangeText={setContactPerson} />
              <Field label="OFFICE ADDRESS" placeholder="Address" value={officeAddress} onChangeText={setOfficeAddress} />
            </>
          ) : null}

          {role === 'DeliveryBoy' ? (
            <Text style={styles.hint}>Delivery sign-up uses name and contact above. Tap Sign up to get OTP.</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.signUpBtn, submitting && styles.signUpBtnDisabled]}
            disabled={submitting}
            activeOpacity={0.88}
            onPress={onSubmit}
          >
            <Text style={styles.signUpBtnText}>{submitting ? 'Sending...' : 'Sign up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={C.placeholder}
        keyboardType={props.keyboardType ?? 'default'}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: C.white },
  card: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    overflow: 'visible',
  },
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
  heroKettle: { width: '42%', height: 100, marginLeft: -4 },
  heroGlass: {
    position: 'absolute',
    right: -8,
    bottom: -48,
    width: 160,
    height: 200,
    zIndex: 3,
  },
  formScroll: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    marginTop: -36,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: C.sub,
    fontSize: 14,
    marginBottom: 22,
    lineHeight: 20,
  },
  linkLogin: {
    fontWeight: '800',
    color: C.tan,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: C.label,
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
    justifyContent: 'space-between',
  },
  rolePill: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1.5,
    borderColor: C.tan,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
    backgroundColor: 'transparent',
  },
  rolePillOn: {
    backgroundColor: C.tan,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
    color: C.tan,
  },
  roleTextOn: {
    color: C.btnText,
  },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: C.label,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.inputFill,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: C.textOnInput,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  half: { flex: 1 },
  hint: { color: C.sub, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  signUpBtn: {
    backgroundColor: C.tan,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  signUpBtnDisabled: { opacity: 0.55 },
  signUpBtnText: {
    textAlign: 'center',
    color: C.btnText,
    fontWeight: '800',
    fontSize: 17,
  },
  backLink: { paddingVertical: 16, alignItems: 'center' },
  backLinkText: { color: C.tanMuted, fontSize: 14, fontWeight: '600' },
});
