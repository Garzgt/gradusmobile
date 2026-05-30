import React, { useEffect, useState } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from './components/GoogleSignInButton';
import styles from './Login.styles';

const logo = require('../../../assets/images/gradus-logo-new.png');

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoScale  = useSharedValue(0.85);
  const textOpacity = useSharedValue(0);
  const textY      = useSharedValue(12);
  const cardY      = useSharedValue(180);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
    logoScale.value   = withSpring(1, { damping: 14, stiffness: 80 });

    textOpacity.value = withDelay(350, withTiming(1, { duration: 600 }));
    textY.value       = withDelay(350, withSpring(0, { damping: 18, stiffness: 100 }));

    cardY.value      = withDelay(200, withSpring(0, { damping: 22, stiffness: 95 }));
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) Alert.alert('Sign In Failed', error.message);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topSection}>
        <Animated.View style={logoStyle}>
          <Image source={logo} style={styles.logo} />
        </Animated.View>
        <Animated.Text style={[styles.appName, textStyle]}>GRADUS</Animated.Text>
        <Animated.Text style={[styles.tagline, textStyle]}>PSU Sto. Tomas Campus</Animated.Text>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <GoogleSignInButton onPress={handleGoogleSignIn} loading={loading} />

        <Text style={styles.hint}>
          Use your <Text style={styles.hintBold}>@pampangastateu.edu.ph</Text> account
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
