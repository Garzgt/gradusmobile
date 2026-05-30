import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import routes from '../config/routes';
import Login from '../screens/Auth/Login';
import DomainBlocked from '../screens/Auth/DomainBlocked';
import WelcomeTour from '../screens/Onboarding/WelcomeTour';
import ProfileSetup from '../screens/ProfileSetup/ProfileSetup';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={routes.LOGIN} component={Login} />
      <Stack.Screen name={routes.DOMAIN_BLOCKED} component={DomainBlocked} />
      <Stack.Screen name={routes.WELCOME_TOUR} component={WelcomeTour} />
      <Stack.Screen name={routes.PROFILE_SETUP} component={ProfileSetup} />
    </Stack.Navigator>
  );
}
