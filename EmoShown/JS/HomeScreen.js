import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import quotes from './quotes.json';

export function HomeScreen({ navigation }) {
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [quote, setQuote] = useState('');
  const [username, setUsername] = useState('');

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate('Login');
      })
      .catch((error) => {
        console.error('Logout Error:', error);
      });
  };

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

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUsername(user.displayName || '');
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null, 
      headerRight: () => (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.menuButton}>
          <Image source={require('../assets/menu.png')} style={styles.menuButtonImage} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{currentDate}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome, {username || 'Guest'}!</Text>
        </View>
      </View>
  
      <View style={styles.quoteContainer}>
        <Text style={styles.quote}>{quote}</Text>
      </View>
  
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
        <TouchableOpacity style={styles.iconButton} onPress={() => alert('Activities')}>
          <Image source={require('../assets/recommend.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Community')}>
          <Image source={require('../assets/community.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
  
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.date}>{currentDate}</Text>
            <Pressable onPress={handleLogout} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Logout</Text>
            </Pressable>
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Close</Text>
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
    justifyContent: 'flex-start', // Changed to flex-start
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  headerContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    width: '100%', // Ensures it takes full width
  },
  dateContainer: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  date: {
    fontSize: 18,
    textAlign: 'left', // Aligns text to the left
  },
  titleContainer: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  quoteContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderColor: '#000',
    borderWidth: 1,
    alignItems: 'center', // Center the quote text
  },
  quote: {
    textAlign: 'center', // Center the text within the quote container
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    width: 250,
    maxHeight: 150,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'absolute',
    top: 20,
    left: 20,
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
