import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './DomainNoticeCard.styles';

export default function DomainNoticeCard() {
  return (
    <View style={styles.container}>
      <Ionicons name="information-circle-outline" size={16} color="#2A7AB6" style={styles.icon} />
      <Text style={styles.text}>
        Use your PSU institutional email{' '}
        <Text style={styles.domain}>@pampangastateu.edu.ph</Text>
      </Text>
    </View>
  );
}
