import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import routes from '../../../config/routes';

const ACTIONS = [
  { label: 'Alerts',  icon: 'notifications-outline', route: routes.NOTIFICATIONS },
  { label: 'Profile', icon: 'person-outline',        route: routes.PROFILE       },
];

export default function ActionQuickLinks() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {ACTIONS.map((item, index) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.item, index < ACTIONS.length - 1 && styles.itemBorder]}
          onPress={() => navigation.navigate(item.route)}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Ionicons name={item.icon} size={22} color="#2A7AB6" />
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  itemBorder: {
    borderRightWidth: 0,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3A5068',
  },
});
