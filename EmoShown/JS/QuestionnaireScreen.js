// QuestionnaireScreen.js
import { ProgressBar } from 'react-native-paper';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Image, FlatList, Alert } from 'react-native';
import { getFirestore, collection, addDoc, setDoc } from 'firebase/firestore'; // Firebase Firestore
import { getAuth } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore'; // For fetching user profile from Firestore


export const QuestionnaireScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false); 
  const [currentSlide, setCurrentSlide] = useState(0);
  const [responses, setResponses] = useState(Array(21).fill(-1)); // Default to -1 to check for unanswered questions

  const db = getFirestore(); // Initialize Firestore

   // DASS21 Questionnaire Questions (Depression, Anxiety, Stress categories)
   const questions = [
    { text: 'I found it hard to wind down', category: 'stress' },
    { text: 'I was aware of dryness of my mouth', category: 'anxiety' },
    { text: 'I couldn’t seem to experience any positive feeling at all', category: 'depression' },
    { text: 'I experienced breathing difficulty', category: 'anxiety' },
    { text: 'I found it difficult to work up the initiative to do things', category: 'depression' },
    { text: 'I tended to over-react to situations', category: 'stress' },
    { text: 'I experienced trembling', category: 'anxiety' },
    { text: 'I felt that I was using a lot of nervous energy', category: 'stress' },
    { text: 'I was worried about situations in which I might panic', category: 'anxiety' },
    { text: 'I felt that I had nothing to look forward to', category: 'depression' },
    { text: 'I found myself getting agitated', category: 'stress' },
    { text: 'I found it difficult to relax', category: 'stress' },
    { text: 'I felt down-hearted and blue', category: 'depression' },
    { text: 'I was intolerant of anything that kept me from getting on with what I was doing', category: 'stress' },
    { text: 'I felt I was close to panic', category: 'anxiety' },
    { text: 'I was unable to become enthusiastic about anything', category: 'depression' },
    { text: 'I felt I wasn’t worth much as a person', category: 'depression' },
    { text: 'I felt that I was rather touchy', category: 'stress' },
    { text: 'I was aware of the action of my heart in the absence of physical exertion', category: 'anxiety' },
    { text: 'I felt scared without any good reason', category: 'anxiety' },
    { text: 'I felt that life was meaningless', category: 'depression' },
  ];

  
  const getUserProfile = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid)); // Assuming user profiles are stored in 'users' collection
    if (userDoc.exists()) {
      return userDoc.data(); // Returns the user's profile data
    }
    return null;
  };
  const scoreRanges = {
    depression: [9, 13, 20, 27], // Normal, Mild, Moderate, Severe (Extremely Severe is 28+)
    anxiety: [7, 9, 14, 19], // Normal, Mild, Moderate, Severe (Extremely Severe is 20+)
    stress: [14, 18, 25, 33], // Normal, Mild, Moderate, Severe (Extremely Severe is 34+)
  };
  
  const severityLabels = ['Normal', 'Mild', 'Moderate', 'Severe', 'Extremely Severe'];
  
  // If the scores are already multiplied elsewhere, remove the multiplication by 2
const computeSeverity = (totalScore, category) => {
  const range = scoreRanges[category];
    
  if (totalScore <= range[0]) {
    return severityLabels[0]; // Normal
  } else if (totalScore <= range[1]) {
    return severityLabels[1]; // Mild
  } else if (totalScore <= range[2]) {
    return severityLabels[2]; // Moderate
  } else if (totalScore <= range[3]) {
    return severityLabels[3]; // Severe
  } else {
    return severityLabels[4]; // Extremely Severe
  }
};

const saveResultsToFirebase = async (depressionScore, anxietyScore, stressScore) => {
  const auth = getAuth();
  const user = auth.currentUser; // Get the current authenticated user

  if (user) {
    const { uid } = user; // Extract user ID
    const userProfile = await getUserProfile(uid); // Fetch the user's profile
    const fullName = userProfile?.fullName || 'Anonymous'; // Fallback to 'Anonymous' if fullName is not found

    // Calculate severity without multiplying the score again
    const depressionSeverity = computeSeverity(depressionScore, 'depression');
    const anxietySeverity = computeSeverity(anxietyScore, 'anxiety');
    const stressSeverity = computeSeverity(stressScore, 'stress');

    console.log(`Depression Severity: ${depressionSeverity}`);
    console.log(`Anxiety Severity: ${anxietySeverity}`);
    console.log(`Stress Severity: ${stressSeverity}`);  
   

    try {
      // Use `addDoc` to create a new document with a unique ID
      await addDoc(collection(db, 'checkins'), { 
        uid, // Add the user's UID
        fullName, // Add the user's full name
        depressionScore,
        depressionSeverity,
        anxietyScore,
        anxietySeverity,
        stressScore,
        stressSeverity,
        timestamp: new Date(), // Store the current timestamp for when the check-in was completed
      });
      Alert.alert("Success", "Your results have been saved.");
    } catch (error) {
      console.error("Error saving to Firestore: ", error);
      Alert.alert("Error", "Failed to save your results. Please try again.");
    }
  } else {
    Alert.alert("Error", "User is not logged in.");
  }
};


   // Function to go to the next slide
const nextSlide = () => {
  const currentQuestionsAnswered = responses[currentSlide] !== -1;

  if (!currentQuestionsAnswered) {
    Alert.alert("Error", "Please answer the question before proceeding.");
    return;
  }

  if (currentSlide < questions.length - 1) {
    setCurrentSlide(currentSlide + 1);
  } else {
    finishQuestionnaire();
  }
};

// Function to go to the previous slide
const prevSlide = () => {
  if (currentSlide > 0) {
    setCurrentSlide(currentSlide - 1);
  }
};

  // Return to instructions
  const backToInstructions = () => {
    setShowQuestionnaire(false);
  };

   // Finish questionnaire and calculate scores
   const finishQuestionnaire = () => {
    if (responses.includes(-1)) {
      Alert.alert("Error", "Please answer all the questions before finishing.");
      return;
    }
  
    let depressionScore = 0, anxietyScore = 0, stressScore = 0;
  
    // Calculate the raw scores
    responses.forEach((response, index) => {
      const category = questions[index].category;
      if (category === 'depression') depressionScore += response;
      else if (category === 'anxiety') anxietyScore += response;
      else if (category === 'stress') stressScore += response;
    });
  
    // Multiply each score by 2 as required by the DASS-21 scoring method
    depressionScore *= 2;
    anxietyScore *= 2;
    stressScore *= 2;
  
    // Save to Firebase
    saveResultsToFirebase(depressionScore, anxietyScore, stressScore);
  
    // Navigate back to Mood Journal
    navigation.navigate('MoodJournal');
    alert("Thank you for completing the questionnaire!");
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

  const renderInstructions = () => (
    <View style={styles.container}>
      {/* Title for the questionnaire */}
      <Text style={styles.title}>DASS21 Questionnaire</Text>

      {/* Instructions */}
      <Text style={styles.instructions}>
        Please read each statement and{' '}
        <Text style={{ fontWeight: 'bold' }}>choose a number (0, 1, 2 or 3)</Text> which indicates
        how much the statement applied to you over the past week.{' '}
        <Text style={{ fontWeight: 'bold' }}>There are no right or wrong answers.</Text> Do not spend
        too much time on any statement.
      </Text>

      {/* Likert Scale */}
      <View style={styles.likertScaleContainer}>
        <View style={styles.likertItem}>
          <Text style={styles.likertNumber}>0</Text>
          <Text style={styles.likertDescription}>Did not apply to me at all</Text>
        </View>
        <View style={styles.likertItem}>
          <Text style={styles.likertNumber}>1</Text>
          <Text style={styles.likertDescription}>Applied to me to some degree, or some of the time</Text>
        </View>
        <View style={styles.likertItem}>
          <Text style={styles.likertNumber}>2</Text>
          <Text style={styles.likertDescription}>Applied to me to a considerable degree or a good part of the time</Text>
        </View>
        <View style={styles.likertItem}>
          <Text style={styles.likertNumber}>3</Text>
          <Text style={styles.likertDescription}>Applied to me very much or most of the time</Text>
        </View>
      </View>

      {/* Proceed Button */}
      <TouchableOpacity style={styles.nextButton} onPress={() => setShowQuestionnaire(true)}>
        <Text style={styles.nextButtonText}>Proceed</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuestionnaire = () => {
    const currentQuestion = questions[currentSlide]; // Only one question per slide
    const progress = (currentSlide + 1) / questions.length; // Calculate progress
  
    console.log(`Current Slide: ${currentSlide + 1}, Progress: ${progress}`);
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>DASS21 Questionnaire</Text>
  
        {/* Progress Bar Container */}
        <View style={styles.progressBarContainer}>
          <ProgressBar progress={progress} color="#000" style={styles.progressBar} />
        </View>

       <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentSlide + 1}. {currentQuestion.text}</Text>
        <View style={styles.likertScaleContainer}>
          {[0, 1, 2, 3].map(value => (
            <TouchableOpacity
              key={value}
              style={[
                styles.likertItem,
                responses[currentSlide] === value ? styles.selectedLikertItem : null
              ]}
              onPress={() => {
                const newResponses = [...responses];
                newResponses[currentSlide] = value;
                setResponses(newResponses);
              }}
            >
              <Text style={styles.likertNumber}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      

{/* Navigation buttons */}
<View style={styles.navigationButtons}>
        {currentSlide === 0 ? (
          <TouchableOpacity style={styles.navButton} onPress={() => setShowQuestionnaire(false)}>
            <Text style={styles.navButtonText}>Back to Instructions</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={prevSlide}>
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={nextSlide}>
          <Text style={styles.navButtonText}>
            {currentSlide < questions.length - 1 ? 'Next' : 'Finish'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  return (
    <View style={styles.container}>
      {showQuestionnaire ? renderQuestionnaire() : (
        <View style={styles.container}>
          <Text style={styles.title}>DASS21 Questionnaire</Text>
          <Text style={styles.instructions}>
            Please read each statement and choose a number (0, 1, 2, or 3) indicating how much the statement applied to you over the past week.
          </Text>
          <TouchableOpacity style={styles.nextButton} onPress={() => setShowQuestionnaire(true)}>
            <Text style={styles.nextButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      )}
    

      {/* Bottom Navigation Icons */}
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
        <TouchableOpacity style={styles.iconButton} onPress={() => alert('Community')}>
          <Image source={require('../assets/community.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable onPress={() => navigation.navigate('Login')} style={styles.modalButton}>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Start from top
    alignItems: 'stretch', // Allow children to stretch horizontally
    backgroundColor: '#fff',
    padding: 20,
  },
  progressBar: {
    height: '100%', // Fill the container's height
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
    width: '100%',
  },
   questionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBarContainer: {
    backgroundColor: '#e0e0e0', // Light gray background for contrast
    borderRadius: 5,
    overflow: 'hidden', // Ensure the ProgressBar doesn't spill out
    height: 15, // Increased height for better visibility
    width: '100%', // Full width
    marginVertical: 10,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  likertScaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    width: '100%',
  },
  likertItem: {
    alignItems: 'center',
    flex: 1,
    padding: 10,
  },
  likertNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedLikertItem: {
    backgroundColor: '#d3d3d3', // Highlight selected item
    borderRadius: 10,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Creates space between the buttons
    width: '100%',
    marginTop: 30, // Adds space from the content above
    marginBottom: 40, // Adds space from the bottom navigation bar
  },
  navButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 30, // Increases padding for a wider button
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  likertDescription: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
    paddingHorizontal: 5,
  },
  nextButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
