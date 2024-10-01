import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Image, Modal, Pressable, ScrollView, Linking } from 'react-native';
import { firestore } from './firebaseConfig'; // Ensure the path is correct
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

const activities = [
    "Go for a nature walk",
    "Try a new workout",
    "Call a friend",
    "Read a book",
    "Watch a movie",
    "Join a support group",
];

const ActivityRecommendation = ({ navigation }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [userSentiment, setUserSentiment] = useState(null);
    const [modalVisible, setModalVisible] = useState(false); // State for modal
    const [userActivityMatrix, setUserActivityMatrix] = useState([]); // Dynamic user activity matrix
    const [userFullName, setUserFullName] = useState(''); // Assume you have a way to get the user's full name

    // Fetch user sentiment and activity data from Firestore
    const fetchUserData = async () => {
        try {
            const journalsCollection = collection(firestore, 'journals');
            const activitiesCollection = collection(firestore, 'activities'); // Collection for activity recommendations
            const usersCollection = collection(firestore, 'users'); // Collection for activity recommendations

            // Fetch sentiment scores
            const snapshot = await getDocs(journalsCollection);
            let totalSentiment = { compound: 0, neg: 0, neu: 0, pos: 0 };
            let count = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.sentiment) {
                    totalSentiment.compound += data.sentiment.compound || 0;
                    totalSentiment.neg += data.sentiment.neg || 0;
                    totalSentiment.neu += data.sentiment.neu || 0;
                    totalSentiment.pos += data.sentiment.pos || 0;
                    count++;
                }
            });

            if (count > 0) {
                setUserSentiment({
                    compound: totalSentiment.compound / count,
                    neg: totalSentiment.neg / count,
                    neu: totalSentiment.neu / count,
                    pos: totalSentiment.pos / count,
                });
            }

            // Fetch activity recommendation counts
            const activitySnapshot = await getDocs(activitiesCollection);
            const activityCount = {}; // Initialize counts for each activity as an object

            activitySnapshot.forEach(doc => {
                const data = doc.data();
                const activityName = data.activity; // Get the activity name from the document
                if (activityName) {
                    activityCount[activityName] = (activityCount[activityName] || 0) + (data.recommendationCount || 0); // Accumulate recommendations
                }
            });

            // Create a dynamic user activity matrix based on the aggregated counts
            const matrix = [];
            // Assuming there are as many rows as there are users
            const usersSnapshot = await getDocs(collection(firestore, 'users')); // Fetch users
            usersSnapshot.forEach(() => {
                matrix.push(Object.values(activityCount)); // Each user gets the aggregated activity counts
            });

            setUserActivityMatrix(matrix); // Set the dynamic activity matrix

        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

// Function to create a document in the 'activities' collection
const createActivityDocument = async () => {
    try {
        // Fetch user ID from the journals collection
        const journalsCollection = collection(firestore, 'journals');
        const journalsSnapshot = await getDocs(journalsCollection);
        
        let userId;
        journalsSnapshot.forEach(doc => {
            const data = doc.data();
            // Assuming you can identify the user from the journals data
            userId = data.userId; // Replace with the actual field for user ID
        });

        if (!userId) {
            console.error("User ID not found.");
            return;
        }

        // Fetch the full name of the user from the users collection
        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = userData.fullName; // Assuming fullName is the field in the users collection

            const activityRef = doc(collection(firestore, 'activities')); // Create a new document reference in the activities collection

            // Prepare the data to be stored
            const activityData = {
                fullName: fullName, // User's full name
                recommendationCount: {}, // Initialize counts for each activity as an object
                timestamp: new Date(), // Optional: record when the data was created
            };
                 // Initialize recommendation counts for each activity
                 activities.forEach(activity => {
                    activityData.recommendationCount[activity] = 0; // Set initial count to 0
                });

            // Set the document with the activity data
            await setDoc(activityRef, activityData);
            console.log("Activity document created successfully:", activityRef.id);
        } else {
            console.error("No user document found.");
        }
    } catch (error) {
        console.error("Error creating activity document:", error);
    }
};

const updateRecommendationCount = async (activity) => {
    try {
        const activityRef = collection(firestore, 'activities');
        const querySnapshot = await getDocs(activityRef);
        

        const activityDoc = querySnapshot.docs.find(doc => {
            const data = doc.data();
            return data.fullName === userFullName; // Match only based on fullName
        });

        if (activityDoc) {
            const currentRecommendationCount = activityDoc.data().recommendationCount;
            currentRecommendationCount[activityIndex] += 1; // Increment the count at the found index

            await setDoc(activityDoc.ref, {
                recommendationCount: currentRecommendationCount,
            }, { merge: true });
            console.log(`Updated recommendation count for ${activity}`);
        } else {
            console.error("Activity document not found for updating.");
        }
    } catch (error) {
        console.error("Error updating recommendation count:", error);
    }
};


// Add the SVD function to perform matrix factorization
const svd = (matrix) => {
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Initialize user and item latent feature matrices
    const userFeatures = Array.from({ length: rows }, () => Array(2).fill(0));
    const itemFeatures = Array.from({ length: cols }, () => Array(2).fill(0));

    // Random initialization of features
    for (let i = 0; i < rows; i++) {
        userFeatures[i] = [Math.random(), Math.random()]; // 2 latent features
    }

    for (let j = 0; j < cols; j++) {
        itemFeatures[j] = [Math.random(), Math.random()]; // 2 latent features
    }

    // Training phase
    for (let iter = 0; iter < 1000; iter++) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (matrix[i][j] > 0) { // Only consider non-zero entries
                    const error = matrix[i][j] - (userFeatures[i][0] * itemFeatures[j][0] + userFeatures[i][1] * itemFeatures[j][1]);
                    userFeatures[i][0] += 0.01 * error * itemFeatures[j][0];
                    userFeatures[i][1] += 0.01 * error * itemFeatures[j][1];
                    itemFeatures[j][0] += 0.01 * error * userFeatures[i][0];
                    itemFeatures[j][1] += 0.01 * error * userFeatures[i][1];
                }
            }
        }
    }

    return { userFeatures, itemFeatures };
};

// Call this function in your recommendActivities function
const recommendActivities = async () => {
    try {
        if (!userSentiment || userActivityMatrix.length === 0) return;

        // Perform SVD to get the latent feature matrices
        const { userFeatures, itemFeatures } = svd(userActivityMatrix);

        const userIndex = 0; // Assuming we have a single user for simplicity
        const recommendations = itemFeatures.map((item, index) => {
            const score = userFeatures[userIndex][0] * item[0] + userFeatures[userIndex][1] * item[1];
            return { activity: activities[index], score };
        });

        // Sort recommendations based on score
        const sortedRecommendations = recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
        setRecommendations(sortedRecommendations);

        // Update recommendation counts for the top activities
        sortedRecommendations.forEach(rec => updateRecommendationCount(rec.activity));

    } catch (error) {
        console.error("Error during recommendation process:", error);
    }
};

    useEffect(() => {
        fetchUserData(); // Fetch user sentiment and activity data
        createActivityDocument(); // Create an activity document when the component mounts
    }, []);

    useEffect(() => {
        if (userSentiment) {
            recommendActivities();
        }
    }, [userSentiment, userActivityMatrix]); // Trigger recommendation on matrix change

    // Menu button click handler
    const handleMenuPress = () => {
        setModalVisible(true);
    };

    const handleLinkPress = (url) => {
        Linking.openURL(url);
    };

    const handleCallPress = (phoneNumber) => {
        Linking.openURL(`tel:${phoneNumber}`);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Activities for Today</Text>
            {recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendation}>
                    {rec.activity} - Score: {rec.score.toFixed(2)}
                </Text>
            ))}
            <Button title="Refresh Recommendations" onPress={recommendActivities} />

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

            {/* Bottom Navigation */}
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

            {/* Menu Button */}
            <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
                <Image source={require('../assets/menu.png')} style={styles.menuButtonImage} />
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    recommendation: {
        fontSize: 18,
        marginVertical: 5,
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
        position: 'absolute',
        top: 10,
        right: 10,
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
        width: 300,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButton: {
        marginVertical: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#000',
        borderRadius: 8,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});


export { ActivityRecommendation };
