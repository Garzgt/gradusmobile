import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import routes from '../config/routes';
import GradesOverview from '../screens/Grades/GradesOverview';
import SubjectGradeDetail from '../screens/Grades/SubjectGradeDetail';

const Stack = createNativeStackNavigator();

export default function GradesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={routes.GRADES_OVERVIEW} component={GradesOverview} />
      <Stack.Screen name={routes.SUBJECT_GRADE_DETAIL} component={SubjectGradeDetail} />
    </Stack.Navigator>
  );
}
