import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Image, FlatList } from 'react-native';

export const QuestionnaireScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false); // New state to toggle between views
  const [currentSlide, setCurrentSlide] = useState(0);

  // DASS21 Questionnaire Questions
  const questions = [
    'I found it hard to wind down',
    'I was aware of dryness of my mouth',
    'I couldn’t seem to experience any positive feeling at all',
    'I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)',
    'I found it difficult to work up the initiative to do things',
    'I tended to over-react to situations',
    'I experienced trembling (e.g. in the hands)',
    'I felt that I was using a lot of nervous energy',
    'I was worried about situations in which I might panic and make a fool of myself',
    'I felt that I had nothing to look forward to',
    'I found myself getting agitated',
    'I found it difficult to relax',
    'I felt down-hearted and blue',
    'I was intolerant of anything that kept me from getting on with what I was doing',
    'I felt I was close to panic',
    'I was unable to become enthusiastic about anything',
    'I felt I wasn’t worth much as a person',
    'I felt that I was rather touchy',
    'I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)',
    'I felt scared without any good reason',
    'I felt that life was meaningless',
  ];

   // Function to go to the next slide
   const nextSlide = () => {
    if (currentSlide < Math.floor(questions.length / 3)) {
      setCurrentSlide(currentSlide + 1);
    } else {
      finishQuestionnaire(); // Finish the questionnaire if it's the last slide
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

  // Finish questionnaire and navigate to Mood Journal
const finishQuestionnaire = () => {
  // Here, navigate back to the Mood Journal screen
  navigation.navigate('MoodJournal');
  // You can also display an alert or perform any final action if needed
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
    const startIndex = currentSlide * 3;
    const currentQuestions = questions.slice(startIndex, startIndex + 3);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>DASS21 Questionnaire</Text>

        <FlatList
          data={currentQuestions}
          renderItem={({ item, index }) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.questionText}>{startIndex + index + 1}. {item}</Text>
              <View style={styles.likertScaleContainer}>
                <TouchableOpacity style={styles.likertItem}>
                  <Text style={styles.likertNumber}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.likertItem}>
                  <Text style={styles.likertNumber}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.likertItem}>
                  <Text style={styles.likertNumber}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.likertItem}>
                  <Text style={styles.likertNumber}>3</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />

<View style={styles.navigationButtons}>
          {currentSlide === 0 ? (
            <TouchableOpacity style={styles.navButton} onPress={backToInstructions}>
              <Text style={styles.navButtonText}>Back to Instructions</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.navButton} onPress={prevSlide}>
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentSlide < Math.floor(questions.length / 3) - 1 ? (
          <TouchableOpacity style={styles.navButton} onPress={nextSlide}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
            <TouchableOpacity style={styles.navButton} onPress={finishQuestionnaire}>
              <Text style={styles.navButtonText}>Finish</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      {showQuestionnaire ? renderQuestionnaire() : renderInstructions()}

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
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
  },
  likertNumber: {
    fontSize: 24,
    fontWeight: 'bold',
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
