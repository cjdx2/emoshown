import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, Pressable, Image, ScrollView, Alert } from 'react-native';
import { signOut } from 'firebase/auth'; 
import { auth, firestore, storage } from './firebaseConfig'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

export function MoodJournalScreen({ navigation }) {
  const [mood, setMood] = useState(null);
  const [journalEntry, setJournalEntry] = useState(''); // State for journal entry
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [emotionModalVisible, setEmotionModalVisible] = useState(false);
  const [neutralModalVisible, setNeutralModalVisible] = useState(false);
  const [negativeModalVisible, setNegativeModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null); // State for sentiment analysis result
  const [weeklyCheckInVisible, setWeeklyCheckInVisible] = useState(false); // Weekly Check-In state
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
          setUsername(user.displayName || '');
          setUserId(user.uid); // Store the userId
        }
      }, []);

  const moodIcons = {
    happy: require('../assets/positive/happiness.png'),
    excited: require('../assets/positive/excitement.png'),
    grateful: require('../assets/positive/gratitude.png'),
    calm: require('../assets/positive/calm.png'),
    bored: require('../assets/neutral/boredom.png'),
    numb: require('../assets/neutral/numbness.png'),
    confused: require('../assets/neutral/confusion.png'),
    doubt: require('../assets/neutral/ambivalence.png'),
    angry: require('../assets/negative/anger.png'),
    lonely: require('../assets/negative/loneliness.png'),
    sad: require('../assets/negative/sadness.png'),
    worried: require('../assets/negative/anxiety.png'),
  };

  const BACKEND_URL = 'http://192.168.1.45:5000/analyze'; // pc url

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

// Set weekly check-in visibility
useEffect(() => {
  
  // Assuming you store the last check-in date in Firestore or AsyncStorage, retrieve it here
  const checkLastCheckIn = async () => {
    try {
      const userId = auth.currentUser.uid;
      const lastCheckInDoc = await getDoc(doc(firestore, 'checkins', userId));
      
      if (lastCheckInDoc.exists()) {
        const lastCheckInData = lastCheckInDoc.data(); // Get the document data
  
        // Check if lastCheckIn exists before calling toDate()
        if (lastCheckInData?.lastCheckIn) {
          const lastCheckIn = lastCheckInData.lastCheckIn.toDate(); // Convert Firestore timestamp to Date
          const currentDate = new Date();
  
          // Check if the current date is 7 days after the last check-in
          const diffDays = Math.ceil((currentDate - lastCheckIn) / (1000 * 60 * 60 * 24));
          setWeeklyCheckInVisible(diffDays >= 0); // Show check-in if 7 or more days have passed
        } else {
          // If no lastCheckIn field exists, show the notification
          setWeeklyCheckInVisible(true);
        }
      } else {
        // If no document exists, show the notification
        setWeeklyCheckInVisible(true);
      }
    } catch (error) {
      console.error('Error checking last check-in date:', error);
    }
  };
  

  checkLastCheckIn();
}, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);
  
  useEffect(() => {
    // Fetch user's mood for today
    const fetchMoodForToday = async () => {
      const userId = auth.currentUser.uid;
      const moodDocRef = doc(firestore, 'moods', `${userId}_${currentDate}`);
      const moodDoc = await getDoc(moodDocRef);
      
      if (moodDoc.exists()) {
        setMood(moodDoc.data().mood); // Set mood from Firestore
      }
    };

    fetchMoodForToday();
  }, [currentDate]);

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
    const fullName = auth.currentUser.displayName; 
    const moodDocRef = doc(firestore, 'moods', `${userId}_${currentDate}`);

    try {
      await setDoc(moodDocRef, {
        mood: emotion,
        date: currentDate,
        userId: userId,
        fullName: fullName, // Save the full name
      });
      setMood(emotion); // Set local state to reflect saved mood
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

  // Function to analyze sentiment of the journal entry
 // Function to analyze sentiment of the journal entry and emotion
const analyzeSentiment = async (text, emotion) => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, emotion }),  // Send both text and emotion
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sentiment analysis');
    }
    
    const result = await response.json();
    setSentimentResult(result); // Store sentiment result
    return result;
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    Alert.alert('Error', 'Failed to analyze sentiment');
    return null;
  }
};

  // Save Journal Entry and Image to Firestore
const saveJournalToFirebase = async () => {
  const userId = auth.currentUser.uid;
  const fullName = auth.currentUser.displayName; 
  const journalDocRef = doc(firestore, `journals/${userId}_${Date.now()}`); // Use Date.now() for a unique ID

  let imageDownloadURL = null;
  if (imageUri) {
    imageDownloadURL = await uploadImage(imageUri); // Upload the image first, then get the URL
  }

  const sentiment = await analyzeSentiment(journalEntry, selectedEmotion);  // Analyze sentiment with journal entry and emotion

  try {
    await setDoc(journalDocRef, {
      journalEntry: journalEntry,
      imageUrl: imageDownloadURL || '',
      date: currentDate,
      userId: userId,
      fullName: fullName, // Save the full name
      sentiment: sentiment || {},  // Save the sentiment result
      emotion: selectedEmotion, // Save the selected emotion
    });
    alert('Journal Saved!');
    setJournalEntry(''); // Clear the journal entry after saving
    setImageUri(null); // Clear the image after saving
  } catch (error) {
    console.error('Error saving journal:', error);
  }
};

// Function to navigate to the questionnaire screen and reset weekly check-in
const handleWeeklyCheckIn = async () => {
  try {
    // Update the last check-in date to the current date
    const userId = auth.currentUser.uid;
    await setDoc(doc(firestore, 'checkins', userId), {
      lastCheckIn: new Date(),
    });

    // Hide the notification
    setWeeklyCheckInVisible(false);

    // Navigate to the Questionnaire screen
    navigation.navigate('Questionnaire');
  } catch (error) {
    console.error('Error updating last check-in date:', error);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{currentDate}</Text>
      <Text style={styles.title}>How are you feeling today?</Text>

       {mood ? (
        <View style={styles.currentMoodContainer}>
          <Image source={moodIcons[mood]} style={styles.currentMoodIcon} />
          <Text style={styles.currentMoodText}>{mood}</Text>
        </View>
      ) : (
        <Text style={styles.currentMoodText}></Text>
      )}

      {!mood && (
        <View style={styles.moodOptions}>
          <TouchableOpacity onPress={() => setEmotionModalVisible(true)} style={styles.moodButton}>
            <Image source={require('../assets/positive/happiness.png')} style={styles.moodIcon} />
            <Text style={styles.moodText}>positive</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setNeutralModalVisible(true)} style={styles.moodButton}>
            <Image source={require('../assets/neutral/boredom.png')} style={styles.moodIcon} />
            <Text style={styles.moodText}>neutral</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setNegativeModalVisible(true)} style={styles.moodButton}>
            <Image source={require('../assets/negative/sadness.png')} style={styles.moodIcon} />
            <Text style={styles.moodText}>negative</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.journalContainer}>

        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('MoodJournalHistory')}>
          <Image source={require('../assets/history.png')} style={styles.historyIcon} />
        </TouchableOpacity>
      
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

<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
  {/* Weekly Check-In Notification */}
  {weeklyCheckInVisible && (
    <View style={styles.notificationContainer}>
      <View style={styles.notificationContent}>
        <Image 
          source={require('../assets/notification.png')} 
          style={styles.checkinIcon} 
        />
        <Text style={styles.notificationText}>
          It's time for your weekly check-in!
        </Text>
      </View>
      <TouchableOpacity style={styles.proceedButton} onPress={handleWeeklyCheckIn}>
        <Text style={styles.proceedButtonText}>
          Would you like to proceed?
        </Text>
      </TouchableOpacity>
    </View>
  )}

  {/* Save Button */}
  <TouchableOpacity style={styles.saveButton} onPress={saveJournalToFirebase}>
    <Text style={styles.saveButtonText}>Save</Text>
  </TouchableOpacity>
</View>

{/*
{sentimentResult && (
  <View style={styles.sentimentContainer}>
    <Text style={styles.sentimentText}>Sentiment Analysis:</Text>
    <Text>Positive: {sentimentResult.pos}</Text>
    <Text>Neutral: {sentimentResult.neu}</Text>
    <Text>Negative: {sentimentResult.neg}</Text>
    <Text>Compound: {sentimentResult.compound}</Text>
  </View>
)}
*/}

      <View style={styles.bottomNav}>
        {/* Bottom Navigation */}
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
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Activities', { userId })}>
          <Image source={require('../assets/recommend.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Community')}>
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
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  journalInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
  saveButton: { backgroundColor: 'blue', padding: 10, borderRadius: 5 },
  saveButtonText: { color: '#fff', textAlign: 'center' },
  sentimentContainer: { marginTop: 20 },
  sentimentText: { fontWeight: 'bold', marginTop: 20, textAlign: 'center' 
  },
  currentMoodContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  currentMoodIcon: {
    width: 70,
    height: 70,
    marginBottom: 5,
  },
  currentMoodText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
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
    backgroundColor: '#000',
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
    alignItems: 'center',
    margin: 10,
  },
  selectedMood: {
    backgroundColor: '#1E90FF',
  },
  moodText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
  moodIcon: {
    width: 40,
    height: 40,
  },
  journalContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 10,
    height: 250,
    width: '100%',
    position: 'relative',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
  },
  journalInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  attachIcon: {
    position: 'absolute',
    bottom: 1,
    right: 4,
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
  historyButton: {
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyModalContent: {
    width: '80%',
  maxHeight: '80%',
  backgroundColor: 'white',
  borderRadius: 20,
  padding: 20,
  elevation: 5,
  },
  scrollView: {
    flexGrow: 1,
  },
  historyButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  historyIcon: {
    width: 28,
    height: 28,
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 20, // Add this to create space between save button and notification
    width: 80,  // Set the specific width of the button (adjust this as needed)
    height: 40,  // Set the specific height of the button (adjust this as needed)
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationContainer: {
  padding: 10,
  borderColor: '#000',
  borderWidth: 1,
  borderRadius: 8,
  backgroundColor: '#fff',
  marginBottom: 8,
  width: '60%',
  alignSelf: 'flex-start',
  marginRight: 20, // Add this to create space between notification and save button
},
  notificationContent: {
    flexDirection: 'row', // Place icon and text side-by-side
    alignItems: 'center', // Vertically center the items
    marginBottom: 1, // Space between content and button
  },
  checkinIcon: {
    width: 22, // Smaller width for the icon
    height: 22, // Smaller height for the icon
    marginRight: 6, // Space between icon and texte between icon and text
  },
  notificationText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  proceedButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
    width: '100%', // Make button full width
    alignItems: 'center', // Center text in the button
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 10,
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
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
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
    backgroundColor: '#000',
    borderRadius: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
