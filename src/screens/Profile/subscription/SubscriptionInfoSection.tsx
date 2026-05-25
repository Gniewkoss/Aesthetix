import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { COLORS, FONT_FAMILY, FONTS, SPACING } from '../../../theme';
import { FREE_PLAN_LIMITS } from '../../../subscription/subscription';
import { subscriptionStyles } from './subscriptionStyles';

interface SubscriptionInfoSectionProps {
  periodEndDate: string | null;
  showCancelInfo: boolean;
}

export function SubscriptionInfoSection({
  periodEndDate,
  showCancelInfo,
}: SubscriptionInfoSectionProps) {
  return (
    <View>
      <Text style={subscriptionStyles.sectionLabel}>GOOD TO KNOW</Text>
      <GlassCard>
        {showCancelInfo && periodEndDate && (
          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
              <Text style={styles.blockTitle}>If you cancel</Text>
            </View>
            <Text style={subscriptionStyles.infoText}>
              Premium stays active until the end of your current billing period. After that,
              your account moves to the free plan automatically — no extra charges.
            </Text>
          </View>
        )}

        <View style={[styles.block, showCancelInfo && periodEndDate && styles.blockSpaced]}>
          <View style={styles.blockHeader}>
            <Ionicons name="lock-open-outline" size={16} color={COLORS.text.muted} />
            <Text style={styles.blockTitle}>Free plan includes</Text>
          </View>
          {FREE_PLAN_LIMITS.map((limit, i) => (
            <View key={i} style={styles.limitRow}>
              <View style={styles.bullet} />
              <Text style={subscriptionStyles.infoText}>{limit}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  blockSpaced: {
    marginTop: SPACING.base,
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  blockTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.text.primary,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: 6,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.text.muted,
    marginTop: 6,
  },
});
