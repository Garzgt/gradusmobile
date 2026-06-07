import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function NotificationFilterTabs({ active, onSelect, unreadCount }) {
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', badge: unreadCount },
  ];

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.tabInner}>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
              {tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              )}
            </View>
            {isActive && <View style={styles.underline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 14,
    marginBottom: 4,
    elevation: 1,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8BA4BC',
  },
  labelActive: {
    color: '#1a3c5e',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#2A7AB6',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#2A7AB6',
    borderRadius: 2,
  },
});
