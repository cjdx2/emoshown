import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, Pressable, Image, ScrollView } from 'react-native';
import { signOut } from 'firebase/auth'; 
import { auth, firestore, storage } from './firebaseConfig'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import * as ImagePicker from 'expo-image-picker';

export function MoodJournalScreen({ navigation }) {
  const [mood, setMood] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [emotionModalVisible, setEmotionModalVisible] = useState(false);
  const [neutralModalVisible, setNeutralModalVisible] = useState(false);
  const [negativeModalVisible, setNegativeModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState('');

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
      return downloadURL; // Return the image URL
    } catch (error) {
      console.error('Upload Error:', error);
      return null;
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

  // Firestore: Check if the user has already selected a mood for today
  const checkIfMoodSelected = async (currentDate) => {
    const userId = auth.currentUser.uid;
    const moodDocRef = doc(firestore, 'moods', `${userId}_${currentDate}`);
    const moodDoc = await getDoc(moodDocRef);
    return moodDoc.exists(); // Returns true if mood is already selected
  };

  // Firestore: Save the selected mood to Firestore
  const saveMoodToFirebase = async (emotion, currentDate) => {
    const userId = auth.currentUser.uid;
    const moodDocRef = doc(firestore, 'moods', `${userId}_${currentDate}`);

    try {
      await setDoc(moodDocRef, {
        mood: emotion,
        date: currentDate,
        userId: userId
      });
      console.log('Mood saved successfully:', emotion);
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  // Handle mood selection and prevent multiple selections per day
  const handleEmotionSelect = async (emotion) => {
    const alreadySelected = await checkIfMoodSelected(currentDate); // Check for the current date

    if (alreadySelected) {
      alert('You have already selected a mood for today!');
      setEmotionModalVisible(false);
      setNeutralModalVisible(false);
      setNegativeModalVisible(false);
    } else {
      setSelectedEmotion(emotion);
      await saveMoodToFirebase(emotion, currentDate); // Save mood to Firestore
      setEmotionModalVisible(false);
      setNeutralModalVisible(false);
      setNegativeModalVisible(false);
      alert('Mood saved successfully!');
    }
  };

  // Save Journal Entry and Image to Firestore
  const saveJournalToFirebase = async () => {
    const userId = auth.currentUser.uid;
    const journalDocRef = doc(firestore, 'journals', `${userId}_${currentDate}`);

    let imageDownloadURL = null;
    if (imageUri) {
      imageDownloadURL = await uploadImage(imageUri); // Upload the image first, then get the URL
    }

    try {
      await setDoc(journalDocRef, {
        journalEntry: journalEntry,
        imageUrl: imageDownloadURL || '',
        date: currentDate,
        userId: userId
      });
      alert('Journal Saved');
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{currentDate}</Text>
      <Text style={styles.title}>How are you feeling today?</Text>

      <View style={styles.moodOptions}>
        <TouchableOpacity onPress={() => setEmotionModalVisible(true)} style={[styles.moodButton, mood === 'Positive' && styles.selectedMood]}>
          <Image source={require('../assets/positive/happiness.png')} style={styles.moodIcon} />
          <Text style={styles.moodText}>positive</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNeutralModalVisible(true)} style={[styles.moodButton, mood === 'Neutral' && styles.selectedMood]}>
          <Image source={require('../assets/neutral/boredom.png')} style={styles.moodIcon} />
          <Text style={styles.moodText}>neutral</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNegativeModalVisible(true)} style={[styles.moodButton, mood === 'Negative' && styles.selectedMood]}>
          <Image source={require('../assets/negative/sadness.png')} style={styles.moodIcon} />
          <Text style={styles.moodText}>negative</Text>
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

      {/* Save and Next Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, alignSelf: 'flex-end', }}>
        <TouchableOpacity style={styles.saveButton} onPress={saveJournalToFirebase}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => alert('Questionnaire')}>
          <Image source={require('../assets/rightarrow.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.bottomNav}>
        {/* Bottom Navigation */}
      </View>

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

      {/* Positive Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emotionModalVisible}
        onRequestClose={() => setEmotionModalVisible(false)}
      >
        <View style={styles.emotionModalContainer}>
          <View style={styles.emotionModalContent}>
          <Text style={styles.modalTitle}>
            I feel 
            <Text style={styles.selectedEmotionText}> {selectedEmotion}</Text>
          </Text>
          <View style={styles.emotionOptions}>
              <TouchableOpacity onPress={() => handleEmotionSelect('happy')}>
                <Image source={require('../assets/positive/happiness.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>happy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('excited')}>
                <Image source={require('../assets/positive/excitement.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>excited</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('grateful')}>
                <Image source={require('../assets/positive/gratitude.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>grateful</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('calm')}>
                <Image source={require('../assets/positive/calm.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>calm</Text>
              </TouchableOpacity>
            </View>
            <Pressable onPress={() => setEmotionModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Neutral Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={neutralModalVisible}
        onRequestClose={() => setNeutralModalVisible(false)}
      >
        <View style={styles.emotionModalContainer}>
          <View style={styles.emotionModalContent}>
            <Text style={styles.modalTitle}>
              I feel
              <Text style={styles.selectedEmotionText}> {selectedEmotion}</Text>
            </Text>
            <View style={styles.emotionOptions}>
              <TouchableOpacity onPress={() => handleEmotionSelect('bored')}>
                <Image source={require('../assets/neutral/boredom.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>bored</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('numb')}>
                <Image source={require('../assets/neutral/numbness.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>numb</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('confused')}>
                <Image source={require('../assets/neutral/confusion.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>confused</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('doubt')}>
                <Image source={require('../assets/neutral/ambivalence.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>doubt</Text>
              </TouchableOpacity>
            </View>
            <Pressable onPress={() => setNeutralModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Negative Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={negativeModalVisible}
        onRequestClose={() => setNegativeModalVisible(false)}
      >
        <View style={styles.emotionModalContainer}>
          <View style={styles.emotionModalContent}>
            <Text style={styles.modalTitle}>
              I feel
              <Text style={styles.selectedEmotionText}> {selectedEmotion}</Text>
            </Text>
            <View style={styles.emotionOptions}>
              <TouchableOpacity onPress={() => handleEmotionSelect('angry')}>
                <Image source={require('../assets/negative/anger.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>angry</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('lonely')}>
                <Image source={require('../assets/negative/loneliness.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>lonely</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('sad')}>
                <Image source={require('../assets/negative/sadness.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>sad</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmotionSelect('worried')}>
                <Image source={require('../assets/negative/anxiety.png')} style={styles.emotionIcon} />
                <Text style={styles.emotionText}>worried</Text>
              </TouchableOpacity>
            </View>
            <Pressable onPress={() => setNegativeModalVisible(false)} style={styles.closeButton}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({

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
    fontSize: 18,
    marginBottom: 20,
  },
  selectedEmotionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emotionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  emotionIcon: {
    width: 50,
    height: 50,
  },
  emotionText: {
    textAlign: 'center',
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
    alignItems: 'center',
  },
  selectedMood: {
    backgroundColor: '#1E90FF',
  },
  moodText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
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
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    marginTop: 1,
    padding: 7,
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
