// ActivitiesScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const ActivitiesScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Activities</Text>
      <Text style={styles.content}>Here are some activities you can do to improve your well-being:</Text>
      {/* Add more content related to activities */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ActivitiesScreen;
