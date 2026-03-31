import { PropsWithChildren } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from './Screen';
import { colors } from './colors';
import { tokens } from './tokens';

export const teaTheme = {
  card: '#552D0A',
  hero: '#3E2723',
  brownMid: '#7C4724',
  brownLight: '#CC9557',
  inputBg: '#EFEFEF',
  textMuted: '#6B5B4F',
};

export function TeaShell(
  props: PropsWithChildren<{
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean };
    scroll?: boolean;
    contentStyle?: ViewStyle;
  }>
) {
  const scroll = props.scroll ?? true;

  const content = (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.white,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          marginTop: -24,
          paddingTop: tokens.space.lg,
          paddingHorizontal: tokens.space.xl,
          paddingBottom: tokens.space.xxxl,
        },
        props.contentStyle,
      ]}
    >
      {props.children}
    </View>
  );

  return (
    <Screen padded={false} edges={['bottom', 'left', 'right']} style={{ backgroundColor: colors.white }}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ flex: 1, backgroundColor: teaTheme.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
          <View style={{ backgroundColor: teaTheme.hero, paddingTop: 24, paddingBottom: 38, paddingHorizontal: tokens.space.xl }}>
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
                <Ionicons name={props.icon ?? 'cafe'} size={28} color={teaTheme.brownLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: colors.white, letterSpacing: -0.4 }} numberOfLines={1}>
                  {props.title}
                </Text>
                {props.subtitle ? (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }} numberOfLines={1}>
                    {props.subtitle}
                  </Text>
                ) : null}
              </View>
              {props.rightAction ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={props.rightAction.disabled ? undefined : props.rightAction.onPress}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: props.rightAction.disabled ? 0.5 : 1,
                  }}
                >
                  <Ionicons name={props.rightAction.icon} size={22} color={colors.white} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView> : content}
        </View>
      </View>
    </Screen>
  );
}

