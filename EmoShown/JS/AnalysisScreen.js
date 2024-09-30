import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { signOut } from 'firebase/auth'; 
import { auth, firestore } from './firebaseConfig';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { format, subDays, startOfDay } from 'date-fns';

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
    blank: require('../assets/blankemoji.png'),
};

const getMoodStyle = (mood) => {
  switch (mood) {
      case 'happy':
      case 'grateful':
      case 'excited':
      case 'calm':
          return styles.positiveMood;
      case 'sad':
      case 'angry':
      case 'worried':
      case 'lonely':
          return styles.negativeMood;
      default:
          return styles.neutralMood;
  }
};

export function AnalysisScreen({ navigation }) {
    const [currentDate, setCurrentDate] = useState('');
    const [moodToday, setMoodToday] = useState('');
    const [moodProgress, setMoodProgress] = useState(0);
    const [moodHistory, setMoodHistory] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [anomalies, setAnomalies] = useState([]);
    const [checkins, setCheckins] = useState([]);
    const [loading, setLoading] = useState(true);
    const db = getFirestore();

    useEffect(() => {
        const fetchCheckins = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const q = query(
                        collection(db, 'checkins'),
                        where('uid', '==', user.uid)
                    );

                    const querySnapshot = await getDocs(q);
                    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setCheckins(data);
                } else {
                    Alert.alert("Error", "User is not logged in.");
                }
            } catch (error) {
                console.error("Error fetching check-ins: ", error);
                Alert.alert("Error", "Failed to fetch check-in data.");
            } finally {
                setLoading(false);
            }
        };

        fetchCheckins();
    }, []);

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

    // MOOD HISTORY
    useEffect(() => {
      const fetchMoodHistory = async () => {
          const userId = auth.currentUser.uid;
          const moodsRef = collection(firestore, 'journals');
  
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const today = startOfDay(new Date());
          let last7DaysData = [];
          const startOfWeek = subDays(today, today.getDay());
  
          const startDayToFetch = (today.getDay() === 0) ? subDays(startOfWeek, 1) : startOfWeek;
          
          for (let i = 0; i < 7; i++) {
              const day = subDays(startDayToFetch, -i);
              const dayFormatted = format(day, 'MMMM d, yyyy');
              const dayQuery = query(
                  moodsRef,
                  where('userId', '==', userId),
                  where('date', '==', dayFormatted)
              );
              const daySnapshot = await getDocs(dayQuery);
  
              let emotion = 'blank';
              let sentiment = 0;
  
              if (!daySnapshot.empty) {
                  const journalData = daySnapshot.docs[0].data();
                  emotion = journalData.emotion || 'blank';
                  sentiment = journalData.sentiment ? journalData.sentiment.compound : 0;
              }
  
              const dayOfWeek = format(day, 'E');
  
              last7DaysData.push({
                  day: dayOfWeek,
                  date: dayFormatted,
                  emotion: emotion,
                  sentiment: sentiment
              });
          }
  
          const sortedData = last7DaysData.sort((a, b) => {
              return daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
          });
  
          setMoodHistory(sortedData);
  
          const todayMood = sortedData[0];
          if (todayMood) {
              setMoodToday(todayMood.emotion);
              setMoodProgress(todayMood.sentiment);
          } else {
              setMoodToday('No mood data available.');
              setMoodProgress(0);
          }
      };
  
      fetchMoodHistory();
  }, []);        

    // ANOMALY DETECTION
    useEffect(() => {
      if (moodHistory.length > 0) {
          detectAnomalies(moodHistory);
      }
    }, [moodHistory]);

    const detectAnomalies = async (history) => {
      try {
          console.log('Sending mood history for anomaly detection:', JSON.stringify(history));

          const response = await fetch('http://192.168.1.9:5000/detect_anomalies', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(history),
          });

          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Anomalies detected:', data);

          if (Array.isArray(data)) {
              setAnomalies(data);
          } else {
              console.error('Unexpected data format received:', data);
              setAnomalies([]);
          }
      } catch (error) {
          console.error('Error fetching anomalies:', error);
      }
    };

    const getSentimentDescription = (sentimentScore) => {
        if (sentimentScore > 0.05) {
            return 'positive';
        } else if (sentimentScore < -0.05) {
            return 'negative';
        } else {
            return 'neutral';
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.date}>{currentDate}</Text>
            <Text style={styles.moodText}>
                {moodToday ? 
                    `You've been feeling ` : 
                    "No mood data available."}
                <Text style={getMoodStyle(moodToday)}>
                    {moodToday}
                </Text>
                {moodToday ? ' today' : ''}
            </Text>
            <Text style={styles.moodProgress}>
                {moodProgress >= 0 
                  ? <>
                <Text style={styles.boldText}>+{moodProgress}%</Text> happier than yesterday
              </>
            : <>
                <Text style={styles.boldText}>{moodProgress}%</Text> less happy than yesterday
              </>
                }</Text>

            {/* Mood History */}
            {moodHistory.length > 0 ? (
                <View style={styles.moodHistory}>
                    {moodHistory.map((moodItem, index) => (
                        <View key={index} style={styles.moodHistoryItem}>
                            <Text style={styles.moodHistoryDay}>{moodItem.day}</Text>
                            <Image
                                source={moodImages[moodItem.emotion] || moodImages.blank}
                                style={styles.moodIcon}
                            />
                        </View>
                    ))}
                </View>
            ) : (
                <Text>No mood history available.</Text>
            )}

            {/* Check-ins */}
            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <View style={styles.checkinsContainer}>
                    {checkins.length > 0 ? (
                        checkins.map((item) => (
                            <View key={item.id} style={styles.checkinBox}>
                                <Text style={styles.checkinText}>Check-In Date: {item.timestamp.toDate().toDateString()}</Text>
                                <Text style={styles.checkinText}>Depression Severity: {item.depressionSeverity}</Text>
                                <Text style={styles.checkinText}>Anxiety Severity: {item.anxietySeverity}</Text>
                                <Text style={styles.checkinText}>Stress Severity: {item.stressSeverity}</Text>
                            </View>
                        ))
                    ) : (
                        <Text>No check-ins available.</Text>
                    )}
                </View>
            )}

            {/* Anomalies */}
            <View style={styles.anomaliesContainer}>
                <Text style={styles.sectionHeader}>Anomalies Detected</Text>
                {anomalies.length > 0 ? (
                    anomalies.map((anomaly, index) => (
                        <Text key={index} style={styles.anomalyText}>
                            {anomaly.date ? `On ${anomaly.date}, your mood was ${getSentimentDescription(anomaly.sentiment)}.` : 'No anomalies detected.'}
                        </Text>
                    ))
                ) : (
                    <Text>No anomalies detected.</Text>
                )}
            </View>

            {/* Menu Modal */}
            <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
         
            <Pressable onPress={handleLogout} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Logout</Text>
            </Pressable>
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
    },
    date: {
        fontSize: 16,
        textAlign: 'left',
        marginVertical: 10,
    },
    moodText: {
        fontSize: 30,
        textAlign: 'left',
        marginVertical: 5,
        fontWeight: 'bold',
    },
    moodProgress: {
        textAlign: 'left',
        marginBottom: 10,
        fontSize: 16,
    },
    moodHistory: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
    },
    moodHistoryItem: {
        alignItems: 'center',
    },
    moodHistoryDay: {
        fontSize: 14,
        marginBottom: 5,
    },
    moodIcon: {
        width: 40,
        height: 40,
    },
    checkinsContainer: {
        marginVertical: 10,
    },
    checkinBox: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    checkinText: {
        fontSize: 14,
        marginBottom: 5,
    },
    anomaliesContainer: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    anomalyText: {
        fontSize: 14,
        marginBottom: 5,
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    positiveMood: {
        color: '#a3c2e8',
    },
    negativeMood: {
        color: '#b9dabf',
    },
    neutralMood: {
        color: '#d9d9d9',
    },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  iconButton: {
    padding: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
  boldText: {
    fontWeight: 'bold', 
  },
});
