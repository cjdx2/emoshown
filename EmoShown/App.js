import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CreateAccountScreen } from './JS/CreateAccountScreen';
import { LoginScreen } from './JS/LoginScreen';
import { HomeScreen } from './JS/HomeScreen';
import { MoodJournalScreen } from './JS/MoodJournalScreen';
import { MoodJournalHistoryScreen } from './JS/MoodJournalHistoryScreen';
import { AnalysisScreen } from './JS/AnalysisScreen';
import { QuestionnaireScreen } from './JS/QuestionnaireScreen';
import { IntroductionScreen } from './JS/IntroductionScreen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(true); // Set to true for now to always show IntroductionScreen

  /*
  useEffect(() => {
    // Check if it's the user's first time launching the app
    AsyncStorage.getItem('isFirstLaunch').then((value) => {
      if (value === null) {
        AsyncStorage.setItem('isFirstLaunch', 'false');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);
  */

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Introduction">
        <Stack.Screen name="EmoShown" component={IntroductionScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MoodJournal" component={MoodJournalScreen} />
        <Stack.Screen name="MoodJournalHistory" component={MoodJournalHistoryScreen} />
        <Stack.Screen name="Analysis" component={AnalysisScreen} />
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
