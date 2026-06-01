import { StyleSheet } from 'react-native';
import { C, T } from '../../../theme/obsidian';

// Shared bits across the subscription module, on the OBSIDIAN system.
export const subscriptionStyles = StyleSheet.create({
  sectionLabel: {
    ...T.overline,
    color: C.text3,
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitle: {
    ...T.cardTitle,
    fontSize: 16,
    color: C.text,
    marginBottom: 8,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  infoText: {
    ...T.bodySm,
    color: C.text2,
    lineHeight: 21,
  },
  linkText: {
    ...T.label,
    color: C.volt,
  },
  destructiveLink: {
    ...T.label,
    color: C.text3,
  },
});
