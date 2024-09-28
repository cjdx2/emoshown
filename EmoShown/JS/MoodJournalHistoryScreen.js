import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { auth, firestore } from './firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export function MoodJournalHistoryScreen({ navigation }) {
  const [journalHistory, setJournalHistory] = useState([]);

  useEffect(() => {
    const fetchJournalHistory = async () => {
      try {
        const userId = auth.currentUser.uid;
        const journalsRef = collection(firestore, 'journals');
        const q = query(journalsRef, where('userId', '==', userId));

        const querySnapshot = await getDocs(q);
        const journals = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setJournalHistory(journals);
      } catch (error) {
        console.error('Error fetching journal history:', error);
      }
    };

    fetchJournalHistory();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.historyContainer}>
        <Text style={styles.title}>Journal History</Text>
        {journalHistory.length === 0 ? (
          <Text style={styles.noHistoryText}>No journal entries yet.</Text>
        ) : (
          journalHistory.map((journal) => {
            return (
              <View key={journal.id} style={styles.journalItem}>
                <Text style={styles.dateText}>{journal.date}</Text>
                <Text style={styles.entryText}>{journal.journalEntry}</Text>
                {journal.imageUrl && (
                  <Image source={{ uri: journal.imageUrl }} style={styles.journalImage} />
                )}
              </View>
            );
          })
        )}
      </ScrollView>
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('MoodJournal')}>
          <Image source={require('../assets/dailymood.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Analysis')}>
          <Image source={require('../assets/analysis.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Image source={require('../assets/home.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Activities')}>
          <Image source={require('../assets/recommend.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Community')}>
          <Image source={require('../assets/community.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  historyContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  noHistoryText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  journalItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  entryText: {
    fontSize: 16,
    marginBottom: 10,
  },
  journalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
  },
  iconButton: {
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
  },
});