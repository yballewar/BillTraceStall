import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../redux/hooks';
import { verifyOtp } from '../../redux/authSlice';
import { api } from '../../services/api';
import { setOfficeDraft } from '../../services/storage';
import { Badge, Button, Screen, showAlert, colors, tokens, typography } from '../../ui';

export function OtpScreen({ route }: any) {
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState(__DEV__ ? '999999' : '');
  const [verifying, setVerifying] = useState(false);
  const phone: string = route.params.phone;
  const design = useMemo(
    () => ({
      card: '#552D0A',
      hero: '#3E2723',
      brownMid: '#7C4724',
      brownLight: '#CC9557',
      inputBg: '#EFEFEF',
      textMuted: '#6B5B4F',
    }),
    []
  );
  const postVerify = route.params?.postVerify as
    | null
    | { kind: 'createTeaStall'; payload: { stallName: string; address: string; city: string; state: string; pincode: string } }
    | { kind: 'saveOfficeDraft'; payload: { officeName: string; contactPerson: string; address: string } };

  return (
    <Screen padded={false} style={{ backgroundColor: colors.white }}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ flex: 1, backgroundColor: design.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
          <View style={{ height: 190, backgroundColor: design.hero, justifyContent: 'center', paddingHorizontal: tokens.space.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: 'rgba(204,149,87,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="shield-checkmark" size={26} color={design.brownLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: colors.white, letterSpacing: -0.4 }}>Verification</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>Enter OTP sent to</Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -32, padding: tokens.space.xl, gap: tokens.space.lg }}>
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Badge tone="info">{phone}</Badge>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: design.textMuted }}>OTP</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="6-digit OTP"
                placeholderTextColor="#9A8F88"
                maxLength={6}
                style={{
                  width: '100%',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  borderWidth: 0,
                  backgroundColor: design.inputBg,
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '800',
                  letterSpacing: 3,
                  textAlign: 'center',
                }}
              />
            </View>

            {__DEV__ ? (
              <Button variant="secondary" onPress={() => setOtp('999999')} style={{ borderRadius: 16 }}>
                Use 999999
              </Button>
            ) : null}

            <Button
              disabled={verifying}
              style={{ backgroundColor: design.brownLight, borderColor: design.brownLight, borderRadius: 16 }}
              onPress={async () => {
                try {
                  if (verifying) return;
                  setVerifying(true);
                  const result = await dispatch(verifyOtp({ phone, otp })).unwrap();
                  if (postVerify?.kind === 'createTeaStall' && result?.role === 'TeaStallOwner') {
                    const p = postVerify.payload;
                    const hasAny = p.stallName.trim() || p.address.trim() || p.city.trim() || p.state.trim() || p.pincode.trim();
                    if (hasAny) {
                      try {
                        await api.post('stall/create', p);
                        showAlert('Tea stall', 'Tea stall profile created');
                      } catch (e: any) {
                        const status = e?.response?.status;
                        if (status === 409) {
                          showAlert('Tea stall', 'Tea stall profile already exists');
                          return;
                        }
                        if (status !== 409) {
                          const msg = String(e?.response?.data?.error ?? e?.message ?? 'Tea stall create failed');
                          showAlert('Tea stall', msg);
                        }
                      }
                    }
                  }
                  if (postVerify?.kind === 'saveOfficeDraft' && result?.role === 'Office') {
                    const p = postVerify.payload;
                    const hasAny = p.officeName.trim() || p.contactPerson.trim() || p.address.trim();
                    if (hasAny) {
                      await setOfficeDraft({ officeName: p.officeName, contactPerson: p.contactPerson, address: p.address });
                    }
                  }
                } catch (e: any) {
                  showAlert('Verification failed', String(e ?? 'Invalid OTP'));
                } finally {
                  setVerifying(false);
                }
              }}
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </Button>

            <Text style={[typography.faint, { color: design.textMuted, textAlign: 'center' }]}>If OTP is not received, go back and resend.</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
