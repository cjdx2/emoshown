import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

export function MoodJournalScreen() {
  const [mood, setMood] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.date}>23 August</Text>
      <Text style={styles.title}>How are you feeling today?</Text>
      
      <View style={styles.moodOptions}>
        <TouchableOpacity onPress={() => setMood('Positive')} style={[styles.moodButton, mood === 'Positive' && styles.selectedMood]}>
          <Text style={styles.moodText}>😊 Positive</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMood('Neutral')} style={[styles.moodButton, mood === 'Neutral' && styles.selectedMood]}>
          <Text style={styles.moodText}>😐 Neutral</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMood('Negative')} style={[styles.moodButton, mood === 'Negative' && styles.selectedMood]}>
          <Text style={styles.moodText}>😞 Negative</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMood('Specific')} style={[styles.moodButton, mood === 'Specific' && styles.selectedMood]}>
          <Text style={styles.moodText}>🤔 Specific</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.journalInput}
        placeholder="Journal..."
        value={journalEntry}
        onChangeText={setJournalEntry}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  date: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  moodButton: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  selectedMood: {
    backgroundColor: '#1E90FF',
  },
  moodText: {
    fontSize: 16,
    color: '#fff',
  },
  journalInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
  },
});