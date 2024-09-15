import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function HomeScreen({ navigation }) {
  const username = "Username"; // Example username, replace with dynamic logic if necessary

  return (
    <View style={styles.container}>
      <Text style={styles.date}>23 August</Text>
      <Text style={styles.title}>Welcome, {username}!</Text>
      <View style={styles.quoteContainer}>
        <Text style={styles.quote}>
          "When I talk to myself as I would a friend, I see all my best qualities and I allow myself to shine."
        </Text>
      </View>
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('MoodJournal')}>
          <Text style={styles.iconText}>Go to Journal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  date: {
    fontSize: 18,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quoteContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  iconButton: {
    padding: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
  },
});