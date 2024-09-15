// MoodJournalScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, firestore, storage } from './firebaseConfig'; // Import Firebase configurations
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export function MoodJournalScreen({ navigation }) {
  const [mood, setMood] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);

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

  // Request permission to access media library
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  // Function to handle logging out
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate('Login'); // Navigate to Login screen after logout
      })
      .catch((error) => {
        console.error('Logout Error:', error);
      });
  };

  // Function to pick an image from the device
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      setImageUri(uri);
      uploadImage(uri);
    }
  };

  // Function to upload image to Firebase Storage
  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const userId = auth.currentUser.uid; // Get user ID from auth
    const imageRef = ref(storage, `images/${userId}/${Date.now()}`);

    try {
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Image uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('Upload Error:', error);
    }
  };

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

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
        <Text style={styles.uploadButtonText}>Pick an image</Text>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable onPress={() => navigation.navigate('Home')} style={styles.navButton}>
              <Text style={styles.navButtonText}>Home</Text>
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
  uploadButton: {
    padding: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  image: {
    width: 100,
    height: 100,
    marginVertical: 10,
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
