import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking, Animated, Alert } from 'react-native';
import { firestore } from './firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit, addDoc } from 'firebase/firestore';
import recommendationsData from './reco.json';

const ActivityRecommendation = ({ route }) => {
  const { userId } = route?.params || {};
  const [sentiment, setSentiment] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    console.log('Route props:', route);
    console.log('User ID:', userId);

    if (!userId) {
      console.error('User ID is undefined');
      return;
    }

    const fetchSentiment = async () => {
      try {
        console.log('Fetching journals for user ID:', userId);

        const today = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const journalSnapshot = await getDocs(
          query(
            collection(firestore, 'journals'),
            where('userId', '==', userId),
            where('date', '==', today),
            orderBy('date', 'desc'),
            limit(1)
          )
        );

        if (!journalSnapshot.empty) {
          const journalData = journalSnapshot.docs[0].data();
          console.log('Fetched journal data:', journalData);
          setSentiment(journalData.sentiment);
        } else {
          console.log('No journals found for user:', userId);
        }
      } catch (error) {
        console.error('Error fetching sentiment:', error);
        if (error.code === 'failed-precondition') {
          console.log('This query requires an index in Firestore.');
        }
      }
    };

    fetchSentiment();
  }, [userId]);

  useEffect(() => {
    const fetchRecommendations = () => {
      if (sentiment) {
        console.log('Fetching recommendations for:', { userId, sentiment });

        // Filtering recommendations based on sentiment
        const filteredRecommendations = recommendationsData.data.filter(item => {
          if (sentiment.compound < -0.05) {
            return item.emotionalImpact.includes("negative");
          } else if (sentiment.compound > 0.05) {
            return item.emotionalImpact.includes("positive");
          } else {
            return item.emotionalImpact.includes("neutral");
          }
        });

        console.log('Recommendations filtered:', filteredRecommendations);
        setRecommendations(filteredRecommendations);
      }
    };

    fetchRecommendations();
  }, [sentiment, userId]);

  // Function to animate the specific item
  const animateFlashcard = (animation) => {
    Animated.timing(animation, {
      toValue: 1.1, // Scale up
      duration: 100, // Duration of scale up
      useNativeDriver: true,
    }).start(() => {
      // Scale back to original size
      Animated.timing(animation, {
        toValue: 1, // Scale back to original
        duration: 100, // Duration of scale back
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRate = async (item, userId, like) => {
    await addDoc(collection(firestore, 'recoratings'), {
      title: item.title,
      userId: userId,
      like: like, // User likes or dislikes this item
      type: item.type || 'activity', // Adjust as needed
    });

    // Show the thank you message as a popup
    Alert.alert('Thank You for Rating!', `You ${like ? 'liked' : 'disliked'} "${item.title}"`, [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommendations based on your mood:</Text>
      {recommendations.length === 0 ? (
        <Text>No recommendations available at this time.</Text>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={({ item, index }) => {
            const animation = new Animated.Value(1); // Each item has its own animation value
            return (
              <Animated.View style={[styles.itemContainer, { transform: [{ scale: animation }] }]}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => {
                      animateFlashcard(animation); // Trigger the animation for the current item
                      handleRate(item, userId, true); // Handle liking the item
                    }}
                  >
                    <Text style={styles.buttonText}>Like</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dislikeButton}
                    onPress={() => {
                      animateFlashcard(animation); // Trigger the animation for the current item
                      handleRate(item, userId, false); // Handle disliking the item
                    }}
                  >
                    <Text style={styles.buttonText}>Dislike</Text>
                  </TouchableOpacity>
                  {item.type === "Resource" && item.link && (
                    <TouchableOpacity
                      style={styles.goButton}
                      onPress={() => Linking.openURL(item.link)}
                    >
                      <Text style={styles.buttonText}>Go</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            );
          }}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  itemContainer: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 16,
    marginVertical: 5,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  likeButton: {
    backgroundColor: '#a3c2e8',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  dislikeButton: {
    backgroundColor: '#e75a70',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  goButton: {
    backgroundColor: '#b9dabf',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ActivityRecommendation;
