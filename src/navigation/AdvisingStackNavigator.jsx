import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import routes from '../config/routes';
import BuildAdvisingPlan from '../screens/AdvisingPlan/BuildAdvisingPlan';
import EvaluationViewer from '../screens/AdvisingPlan/EvaluationViewer';
import AdvisingFormPreview from '../screens/AdvisingPlan/AdvisingFormPreview';

const Stack = createNativeStackNavigator();

export default function AdvisingStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={routes.BUILD_ADVISING_PLAN} component={BuildAdvisingPlan} />
      <Stack.Screen name={routes.EVALUATION_VIEWER}   component={EvaluationViewer} />
      <Stack.Screen name={routes.ADVISING_FORM_PREVIEW} component={AdvisingFormPreview} />
    </Stack.Navigator>
  );
}
