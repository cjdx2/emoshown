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
import { CommunityScreen } from './JS/CommunityScreen';
import ActivityRecommendation from './JS/ActivityRecommendation';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

export default function App() {
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);

  useEffect(() => {
    // Check if the user has accepted the privacy notice
    AsyncStorage.getItem('hasAcceptedPrivacy').then((value) => {
      if (value === 'true') {
        setHasAcceptedPrivacy(true);
      }
    });
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="CreateAccount">
            {props => <CreateAccountScreen {...props} onPrivacyAccept={() => {
                setHasAcceptedPrivacy(true);
                AsyncStorage.setItem('hasAcceptedPrivacy', 'true'); // Save acceptance state
                props.navigation.navigate('Introduction'); // Navigate to Introduction
            }} />}
          </Stack.Screen>
          <Stack.Screen name="Introduction" component={IntroductionScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MoodJournal" component={MoodJournalScreen} />
          <Stack.Screen name="MoodJournalHistory" component={MoodJournalHistoryScreen} />
          <Stack.Screen name="Analysis" component={AnalysisScreen} />
          <Stack.Screen name="Activities" component={ActivityRecommendation} />
          <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}