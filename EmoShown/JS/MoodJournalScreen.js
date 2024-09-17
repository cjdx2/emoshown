import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { signOut } from 'firebase/auth'; 
import { auth, storage } from './firebaseConfig'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export function MoodJournalScreen({ navigation }) {
  const [mood, setMood] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [emotionModalVisible, setEmotionModalVisible] = useState(false);  // New state for emotion modal
  const [imageUri, setImageUri] = useState(null);

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
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

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

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const userId = auth.currentUser.uid;
    const imageRef = ref(storage, `images/${userId}/${Date.now()}`);

    try {
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Image uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('Upload Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

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
      <Text style={styles.date}>{currentDate}</Text>
      <Text style={styles.title}>How are you feeling today?</Text>

      <View style={styles.moodOptions}>
        <TouchableOpacity onPress={() => setEmotionModalVisible(true)} style={[styles.moodButton, mood === 'Positive' && styles.selectedMood]}>
          <Image source={require('../assets/positive/happiness.png')} style={styles.moodIcon} />
          <Text style={styles.moodText}>Positive</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMood('Neutral')} style={[styles.moodButton, mood === 'Neutral' && styles.selectedMood]}>
          <Image source={require('../assets/neutral/boredom.png')} style={styles.moodIcon} />
          <Text style={styles.moodText}>Neutral</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMood('Negative')} style={[styles.moodButton, mood === 'Negative' && styles.selectedMood]}>
          <Image source={require('../assets/negative/sadness.png')} style={styles.moodIcon} />
          <Text style={styles.moodText}>Negative</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.journalContainer}>
        <TextInput
          style={styles.journalInput}
          placeholder="Journal..."
          value={journalEntry}
          onChangeText={setJournalEntry}
          multiline
        />
        <TouchableOpacity onPress={pickImage} style={styles.attachIcon}>
          <Image source={require('../assets/attach.png')} style={styles.attachIconImage} />
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      <TouchableOpacity style={styles.nextButton} onPress={() => alert('Questionnaire')}>
        <Image source={require('../assets/rightarrow.png')} style={styles.icon} />
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('MoodJournal')}>
          <Image source={require('../assets/dailymood.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => alert('Analysis')}>
          <Image source={require('../assets/analysis.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Image source={require('../assets/home.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => alert('Activities')}>
          <Image source={require('../assets/recommend.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => alert('Community')}>
          <Image source={require('../assets/community.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Emotion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emotionModalVisible}
        onRequestClose={() => setEmotionModalVisible(false)}
      >
        <View style={styles.emotionModalContainer}>
          <View style={styles.emotionModalContent}>
            <Text style={styles.modalTitle}>I feel</Text>
            <View style={styles.emotionOptions}>
              <TouchableOpacity onPress={() => alert('You feel happy')}>
                <Text style={styles.emotionText}>😊 Happy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alert('You feel excited')}>
                <Text style={styles.emotionText}>🤩 Excited</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alert('You feel grateful')}>
                <Text style={styles.emotionText}>🙏 Grateful</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alert('You feel calm')}>
                <Text style={styles.emotionText}>😌 Calm</Text>
              </TouchableOpacity>
            </View>
            <Pressable onPress={() => setEmotionModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
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
  // Add your existing styles here...

  emotionModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emotionModalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emotionOptions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  emotionText: {
    fontSize: 18,
    marginVertical: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
  },

  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: 'center', // Center text and icon
  },
  selectedMood: {
    backgroundColor: '#1E90FF',
  },
  moodText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5, // Add space between the icon and text
  },
  moodIcon: {
    width: 40,
    height: 40,
  },
  journalContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    height: 250,
    width: '100%',
    position: 'relative',
  },
  journalInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  attachIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: 10,
  },
  attachIconImage: {
    width: 24,
    height: 24,
  },
  image: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  nextButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
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
  menuButton: {
    marginRight: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonImage: {
    width: 24,
    height: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FF6347',
    borderRadius: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
