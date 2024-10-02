import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Button } from 'react-native';
import { auth } from './firebaseConfig';

export function ActivityRecommendation({ navigation }) {
    const [recommendations, setRecommendations] = useState([]);

    // Fetch recommendations from Flask API
    const fetchRecommendations = async () => {
        try {
            const userId = auth.currentUser.uid;

            const response = await fetch('http://192.168.1.11:5000/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Recommendations data:", data);  // Debugging line to check data
                setRecommendations(data);
            } else {
                console.error("Error response:", data);  // Log the error response from the server
                Alert.alert('Error', data.error || 'Failed to get recommendations');
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            Alert.alert('Error', 'An error occurred while fetching recommendations.');
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const handleRateRecommendation = async (id, type, isLike) => {
        try {
            const userId = auth.currentUser.uid;

            const response = await fetch('http://192.168.1.11:5000/rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, id, type, isLike }),
            });

            if (response.ok) {
                console.log(`Successfully rated ${type} with ID: ${id}`);
                fetchRecommendations();  // Refresh recommendations after rating
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Failed to rate the recommendation');
            }
        } catch (error) {
            console.error('Error rating recommendation:', error);
            Alert.alert('Error', 'An error occurred while rating the recommendation.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Recommended Activities and Resources</Text>
            {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                        {rec.type === 'activity' ? (
                            <Text>Activity ID: {rec.activityId}</Text>
                        ) : (
                            <Text>Resource ID: {rec.resourceId}</Text>
                        )}
                        <Text>Predicted Rating: {rec.predicted_rating !== null ? rec.predicted_rating.toFixed(2) : 'Not Rated'}</Text>
                        <View style={styles.buttonContainer}>
                            <Button title="Like" onPress={() => handleRateRecommendation(rec.activityId || rec.resourceId, rec.type, true)} />
                            <Button title="Dislike" onPress={() => handleRateRecommendation(rec.activityId || rec.resourceId, rec.type, false)} />
                        </View>
                    </View>
                ))
            ) : (
                <Text>No recommendations available.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    recommendationItem: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
        borderColor: '#ccc',
        borderWidth: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
});
