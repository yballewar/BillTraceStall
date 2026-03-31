import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { Image, ScrollView, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { Screen } from './Screen';
import { colors } from './colors';
import { tokens } from './tokens';
import { loginLayoutForWidth, loginTheme } from '../theme/loginTheme';

export function AuthShell(
  props: PropsWithChildren<{
    title: string;
    subtitle?: ReactNode;
    heroImage?: any;
    /** Image mockup: kettle + gear (hides GLSS steam overlay) */
    showGlssOverlay?: boolean;
    /** Image mockup: circular settings top-right on hero */
    heroRightAccessory?: ReactNode;
    /** Image mockup: dark brown bar under scroll content */
    showBrownFooter?: boolean;
    /** Slight elevation on white form sheet (mockup) */
    formCardShadow?: boolean;
    socialRow?: { left: any; middle: any; right: any };
    scroll?: boolean;
  }>
) {
  const scroll = props.scroll ?? false;
  const { width: W } = useWindowDimensions();
  const layout = useMemo(() => loginLayoutForWidth(W), [W]);

  const showGlss = props.showGlssOverlay !== false;

  const glssW = Math.min(loginTheme.glssWidth, W * 0.92);
  const glssH = (glssW / loginTheme.glssWidth) * loginTheme.glssHeight;
  const glssLeft = W * 1.14 - glssW / 2;

  const formStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderTopLeftRadius: loginTheme.formBlockTopRadius,
    borderTopRightRadius: loginTheme.formBlockTopRadius,
    marginTop: loginTheme.formBlockMarginTop,
    paddingTop: loginTheme.formPaddingTop,
    paddingHorizontal: layout.formPaddingHorizontal,
    paddingBottom: loginTheme.formPaddingBottom,
    alignItems: 'center',
    ...(props.formCardShadow
      ? {
          shadowColor: '#2d1e14',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 6,
        }
      : {}),
  };

  const content = (
    <View style={formStyle}>
      <Text
        style={{
          fontSize: layout.titleFontSize,
          fontWeight: loginTheme.titleFontWeight,
          color: loginTheme.brownMid,
          marginBottom: loginTheme.titleMarginBottom,
        }}
      >
        {props.title}
      </Text>
      {props.subtitle ? <View style={{ marginBottom: loginTheme.subMarginBottom }}>{props.subtitle}</View> : null}

      {props.socialRow ? (
        <View
          style={{
            width: loginTheme.socialRowWidth,
            height: loginTheme.socialRowHeight,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: loginTheme.socialGap,
            marginTop: loginTheme.socialMarginTop,
            marginBottom: loginTheme.socialMarginBottom,
          }}
        >
          <Image source={props.socialRow.left} style={{ flex: 1, height: '100%', resizeMode: 'contain' }} />
          <Image source={props.socialRow.middle} style={{ flex: 1, height: '100%', resizeMode: 'contain' }} />
          <Image source={props.socialRow.right} style={{ flex: 1, height: '100%', resizeMode: 'contain' }} />
        </View>
      ) : null}

      <View style={{ width: '100%' }}>{props.children}</View>
    </View>
  );

  const showFooter = props.showBrownFooter === true;

  return (
    <Screen padded={false} safeBackgroundColor={loginTheme.pageBg} style={{ flex: 1, backgroundColor: loginTheme.shellBg }}>
      <View style={{ flex: 1, backgroundColor: loginTheme.shellBg }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            backgroundColor: loginTheme.card,
            borderTopLeftRadius: loginTheme.cardTopRadius,
            borderTopRightRadius: loginTheme.cardTopRadius,
            overflow: 'visible',
          }}
        >
          {showGlss ? (
            <Image
              source={require('../../assets/web/GLSSimage.png')}
              style={{
                position: 'absolute',
                left: glssLeft,
                top: loginTheme.glssMarginTop,
                width: glssW,
                height: glssH,
                resizeMode: 'contain',
                zIndex: loginTheme.glssZIndex,
              }}
            />
          ) : null}

          <View style={{ position: 'relative', zIndex: 5 }}>
            <View
              style={{
                minHeight: layout.heroMinHeight,
                width: '100%',
                backgroundColor: loginTheme.hero,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: 0,
                overflow: 'visible',
              }}
            >
              {props.heroImage ? (
                <Image
                  source={props.heroImage}
                  style={{
                    width: '44%',
                    height: 150,
                    marginLeft: -2,
                    resizeMode: 'contain',
                  }}
                />
              ) : null}
            </View>
            {props.heroRightAccessory ? (
              <View style={{ position: 'absolute', top: 10, right: 14, zIndex: 20 }}>{props.heroRightAccessory}</View>
            ) : null}
          </View>

          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: tokens.space.lg }}
            >
              {content}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>{content}</View>
          )}

          {showFooter ? <View style={{ height: 120, backgroundColor: loginTheme.card }} /> : null}
        </View>
      </View>
    </Screen>
  );
}
