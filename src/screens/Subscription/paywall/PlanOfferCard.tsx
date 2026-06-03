import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PREMIUM_PLANS } from '../../../constants';
import type { SubscriptionPlanId } from '../../../subscription/subscription';
import { C, T, R, S, E } from '../../../theme/obsidian';
import { PressableScale } from '../../Dashboard/home/PressableScale';

type Plan = (typeof PREMIUM_PLANS)[number];

interface PlanOfferCardProps {
  plan: Plan;
  selected: boolean;
  featured: boolean;
  badge: string | null;
  disabled?: boolean;
  onPress: () => void;
}

export function PlanOfferCard({
  plan,
  selected,
  featured,
  badge,
  disabled,
  onPress,
}: PlanOfferCardProps) {
  const periodLabel = plan.period === 'week' ? '/wk' : '/mo';

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`${plan.name} plan, ${plan.price}${periodLabel}${selected ? ', selected' : ''}`}
      style={[styles.wrap, disabled && styles.disabled]}
    >
      {featured ? (
        <LinearGradient
          colors={['rgba(199,249,64,0.22)', 'rgba(199,249,64,0.04)', 'rgba(10,11,13,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View
        style={[
          styles.card,
          featured && styles.cardFeatured,
          selected && styles.cardSelected,
          disabled && styles.cardDisabled,
        ]}
      >
        {badge ? (
          <View style={[styles.badge, featured && styles.badgeFeatured]}>
            <Text style={[T.overline, { color: featured ? C.voltInk : C.volt, fontSize: 9 }]}>
              {badge}
            </Text>
          </View>
        ) : null}

        <View style={[styles.topRow, badge ? styles.topRowWithBadge : null]}>
          <View style={{ flex: 1 }}>
            <Text style={[T.cardTitle, { color: C.text }]}>{plan.name}</Text>
            <Text style={[T.caption, { color: C.text2, marginTop: 2 }]}>
              {'subtitle' in plan && plan.subtitle ? plan.subtitle : plan.features[0]}
            </Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={[T.metricSm, { color: C.text }]}>{plan.price}</Text>
            <Text style={[T.caption, { color: C.text3 }]}>{periodLabel}</Text>
          </View>
          <View style={[styles.radio, selected && styles.radioOn]}>
            {selected ? <Ionicons name="checkmark" size={14} color={C.voltInk} /> : null}
          </View>
        </View>

        <View style={styles.features}>
          {plan.features.slice(0, 3).map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={14} color={selected ? C.volt : C.text3} />
              <Text style={[T.caption, { color: C.text2, flex: 1 }]}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </PressableScale>
  );
}

export function planById(planId: SubscriptionPlanId): Plan {
  return PREMIUM_PLANS.find((p) => p.id === planId) ?? PREMIUM_PLANS[1];
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: R.xl,
    overflow: 'hidden',
    marginBottom: S.md,
  },
  disabled: { opacity: 0.55 },
  card: {
    ...E.card,
    borderRadius: R.xl,
    padding: S.base,
    paddingTop: S.lg,
  },
  cardFeatured: {
    backgroundColor: C.surface2,
    borderColor: C.voltBorder,
  },
  cardSelected: {
    borderColor: C.volt,
    borderWidth: 1.5,
    backgroundColor: C.voltDim,
  },
  cardDisabled: {
    borderColor: C.border,
  },
  badge: {
    position: 'absolute',
    top: S.sm,
    left: S.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: R.pill,
    backgroundColor: C.voltDim,
    borderWidth: 1,
    borderColor: C.voltBorder,
  },
  badgeFeatured: {
    backgroundColor: C.volt,
    borderColor: C.volt,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
  },
  topRowWithBadge: {
    marginTop: S.lg,
  },
  priceCol: { alignItems: 'flex-end' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.borderMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOn: {
    backgroundColor: C.volt,
    borderColor: C.volt,
  },
  features: {
    marginTop: S.md,
    gap: 6,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
});
