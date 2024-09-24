import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { auth, firestore } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format, subDays } from 'date-fns';



// Predefine a mapping for mood images
const moodImages = {
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

export function AnalysisScreen({ navigation }) {
    const [currentDate, setCurrentDate] = useState('');
    const [moodToday, setMoodToday] = useState('');
    const [moodProgress, setMoodProgress] = useState(0);
    const [moodHistory, setMoodHistory] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

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
    const fetchMoodData = async () => {
      const userId = auth.currentUser.uid;
      const journalsRef = collection(firestore, 'journals');
      const today = format(new Date(), 'yyyy-MM-dd');

      const todayQuery = query(journalsRef, where('userId', '==', userId), where('date', '==', today));
      const todaySnapshot = await getDocs(todayQuery);

      if (!todaySnapshot.empty) {
        const todayData = todaySnapshot.docs[0].data();
        setMoodToday(todayData.mood);
        setMoodProgress(todayData.moodProgress || 0);
      } else {
        setMoodToday('neutral');
        setMoodProgress(0);
      }

     // Fetch mood history for the last 7 days
     const last7DaysData = [];
     for (let i = 6; i >= 0; i--) {
         const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
         const dayQuery = query(journalsRef, where('userId', '==', userId), where('date', '==', date));
         const daySnapshot = await getDocs(dayQuery);

         if (!daySnapshot.empty) {
             const dayData = daySnapshot.docs[0].data();
             last7DaysData.push({
                 day: format(subDays(new Date(), i), 'eee'), // e.g., Mon, Tue, etc.
                 mood: dayData.mood || 'neutral',
             });
         } else {
             last7DaysData.push({
                 day: format(subDays(new Date(), i), 'eee'),
                 mood: 'neutral', // Default to neutral if no data
             });
         }
     }

     setMoodHistory(last7DaysData);
 };

 fetchMoodData();
}, []);

const renderMoodProgress = () => {
    const moodText = moodProgress >= 0 ? `+${moodProgress}% happier than yesterday` : `${moodProgress}% less happy than yesterday`;
    return <Text style={styles.moodProgress}>{moodText}</Text>;
};

return (
    <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.date}>{currentDate}</Text>
            <Text style={styles.moodText}>You've been feeling <Text style={styles.moodHighlight}>{moodToday}</Text> today</Text>
            {renderMoodProgress()}

            <View style={styles.moodHistory}>
                {moodHistory.map((moodItem, index) => (
                    <View key={index} style={styles.moodHistoryItem}>
                        <Text style={styles.moodHistoryDay}>{moodItem.day}</Text>
                        <Image 
                            source={moodImages[moodItem.mood] || moodImages.neutral}
                            style={styles.moodIcon} 
                        />
                    </View>
                ))}
            </View>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>stress level</Text>
            <Text style={styles.analysisValue}>low</Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>sleep quality</Text>
            <Text style={styles.analysisValue}>excellent</Text>
          </View>
        </View>

        <View style={styles.screenTimeContainer}>
          <Text style={styles.screenTimeLabel}>screen time</Text>
          <Text style={styles.screenTimeValue}>6 hrs 30 mins</Text>
        </View>
     

      {/* Back and Next Button */}
       <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, alignSelf: 'flex-end', }}>
        <TouchableOpacity style={styles.nextButton} onPress={() => alert('Full Details of Analysis')}>
          <Image source={require('../assets/rightarrow.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
      </ScrollView>
    {/* Modal for Logout */}
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
      

       

      {/* Fixed Bottom Navigation */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  moodText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  moodHighlight: {
    color: '#4CAF50',
  },
  moodProgress: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
    moodHistory: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    moodHistoryItem: {
        alignItems: 'center',
    },
    moodHistoryDay: {
        fontSize: 12,
        color: '#888',
    },
    moodIcon: {
        width: 40,
        height: 40,
    },
  analysisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  analysisItem: {
    width: '45%',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenTimeContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  screenTimeLabel: {
    fontSize: 14,
    color: '#888',
  },
  screenTimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    marginTop: 1,
    padding: 7,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
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
});
