import { StyleSheet } from 'react-native';
import colors from './colors';
import spacing from './spacing';
import fonts from './fonts';
import shadows from './shadows';

const commonStyles = StyleSheet.create({
  // Screens
  screen: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: colors.bgPage,
    padding: spacing.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cards
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: spacing.base,
    ...shadows.sm,
  },
  cardSoft: {
    backgroundColor: colors.bgSoft,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Header
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textOnDark,
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold,
  },

  // Typography
  textTitle: {
    fontSize: fonts.size.xxl,
    fontWeight: fonts.weight.bold,
    color: colors.textPrimary,
  },
  textSubtitle: {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.semiBold,
    color: colors.textPrimary,
  },
  textBody: {
    fontSize: fonts.size.md,
    fontWeight: fonts.weight.regular,
    color: colors.textPrimary,
  },
  textCaption: {
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.regular,
    color: colors.textSecondary,
  },
  textMuted: {
    fontSize: fonts.size.sm,
    color: colors.textMuted,
  },

  // Buttons
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: fonts.size.base,
    fontWeight: fonts.weight.semiBold,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: colors.primary,
    fontSize: fonts.size.base,
    fontWeight: fonts.weight.semiBold,
  },

  // Inputs
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fonts.size.md,
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default commonStyles;
