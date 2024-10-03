import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { firestore } from './firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit, addDoc } from 'firebase/firestore';
import axios from 'axios';

const ActivityRecommendation = ({ route }) => {
  const { userId } = route?.params || {}; // Fallback to empty object
  const [sentiment, setSentiment] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    console.log('Route props:', route);
    console.log('User ID:', userId); // Log the userId

    if (!userId) {
      console.error('User ID is undefined');
      return; // Early exit if userId is undefined
    }

    const fetchSentiment = async () => {
        try {
            console.log('Fetching journals for user ID:', userId);
    
            const today = new Date().toISOString().split('T')[0];
    
            const journalSnapshot = await getDocs(
                query(
                    collection(firestore, 'journals'),
                    where('userId', '==', userId),
                    where('date', '>=', today),
                    orderBy('userId'),
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
                console.log('This query requires an index. Please check the Firestore console.');
            }
        }
    };    
    
    fetchSentiment();
  }, [userId]);

  // Fetch recommendations from Flask API
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (sentiment) {
        console.log('Fetching recommendations for:', { userId, sentiment }); // Log parameters
        try {
          const response = await axios.get(`http://192.168.1.11:5000/recommend`, {
            params: {
              userId: userId,
              sentiment: sentiment,
            },
          });
          console.log('Recommendations received:', response.data); // Log the response
          setRecommendations(response.data.recommendations);
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        }
      }
    };

    fetchRecommendations();
  }, [sentiment, userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommendations based on your mood:</Text>
      {recommendations.length === 0 ? (
        <Text>No recommendations available at this time.</Text>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  await addDoc(collection(firestore, 'recoratings'), {
                    title: item.title,
                    userId: userId,
                    like: true, // Assume user likes this item for demo
                    type: item.type,
                  });
                }}
              >
                <Text style={styles.buttonText}>Like</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()} // Ensure id is a string
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
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ActivityRecommendation;
