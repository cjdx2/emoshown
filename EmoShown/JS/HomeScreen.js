import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { signOut } from 'firebase/auth';  // Import Firebase sign out
import { auth } from './firebaseConfig'; // Import auth from Firebase config

export function HomeScreen({ navigation }) {
  const username = "Username"; // Replace with dynamic username logic if necessary
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Function to handle logging out
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate('Login');
      })
      .catch((error) => {
        console.error('Logout Error:', error);
      });
  };

  // Get the current date dynamically
  useEffect(() => {
    const updateDate = () => {
      const date = new Date();
      const formattedDate = date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setCurrentDate(formattedDate);
    };

    updateDate();
    const intervalId = setInterval(updateDate, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Set up navigation options for the menu button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null, // Remove back button
      headerRight: () => (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>Menu</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{currentDate}</Text>
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

      {/* Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable onPress={() => navigation.navigate('MoodJournal')} style={styles.navButton}>
              <Text style={styles.navButtonText}>Go to Journal</Text>
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  menuButton: {
    marginRight: 10,
    padding: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
    marginBottom: 10,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
    marginBottom: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
  },
});
