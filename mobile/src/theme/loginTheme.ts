/**
 * 1:1 tokens from:
 * E:\BillTraceStall\new-web-billtrace-Tea\new-web-billtrace-Tea\login.css
 * (and structure from login.html)
 */
export const loginTheme = {
  shellBg: '#FFFFFF',
  /** body { background: var(--color-bg) } */
  pageBg: '#F0F0F0',
  card: '#552D0A',
  hero: '#3E2723',
  brown: '#5D3A1A',
  brownMid: '#7C4724',
  brownLight: '#CC9557',
  inputBg: '#EFEFEF',
  textMuted: '#6B5B4F',
  text: '#1A1A1A',
  placeholder: '#9A8F88',

  /** --radius-lg: 1rem */
  radiusLg: 16,
  /** .card border-radius: 2rem top only */
  cardTopRadius: 32,
  /** .formBlock border-radius: 2.5rem top */
  formBlockTopRadius: 40,

  /** .title font-weight: 700 */
  titleFontWeight: '700' as const,

  /** .formBlock margin-top: -2rem */
  formBlockMarginTop: -32,
  /** .formBlock padding: 1.25rem … 2rem */
  formPaddingTop: 20,
  formPaddingBottom: 32,

  /** .wrap margin-bottom: 1rem */
  wrapMarginBottom: 16,
  /** .label margin-bottom: 0.4rem */
  labelMarginBottom: 6,
  /** .title margin-bottom: 0.5rem */
  titleMarginBottom: 8,
  /** .sub margin 0 0 0.25rem */
  subMarginBottom: 4,

  /** .sub 0.9rem */
  subFontSize: 14,

  /** .label 0.65rem, letter-spacing 0.08em */
  labelFontSize: 10,
  labelLetterSpacing: 1.28,

  /** .input padding 0.75rem 1rem */
  inputPaddingVertical: 12,
  inputPaddingHorizontal: 16,
  inputFontSize: 16,

  /** .btn padding 0.9rem 1.25rem */
  btnPaddingVertical: 14,
  btnPaddingHorizontal: 20,

  /** .social-row margin 1rem 0 1.25rem */
  socialMarginTop: 16,
  socialMarginBottom: 20,
  socialRowWidth: 240,
  socialRowHeight: 60,
  socialGap: 5,

  /** .card::before GLSS */
  glssWidth: 350,
  glssHeight: 280,
  glssMarginTop: 10,
  /** .card::before z-index: 10 */
  glssZIndex: 10,

  /** .link margin-right: 30px */
  linkMarginRight: 30,
};

/**
 * Responsive rules from login.css:
 * - .hero @media max-width 640px { min-height: 150px }
 * - .title clamp(1.5rem, 4vw, 1.75rem)
 * - .formBlock padding horizontal clamp(1.25rem, 5vw, 2rem)
 */
export function loginLayoutForWidth(screenWidth: number) {
  const heroMinHeight = screenWidth < 640 ? 150 : 190;
  const titleFontSize = Math.min(28, Math.max(24, screenWidth * 0.04));
  const formPaddingHorizontal = Math.min(32, Math.max(20, screenWidth * 0.05));
  return { heroMinHeight, titleFontSize, formPaddingHorizontal };
}
