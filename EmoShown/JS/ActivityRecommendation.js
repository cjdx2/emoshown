import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Linking,
} from 'react-native';
import { firestore } from './firebaseConfig'; // Ensure the path is correct
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions

const userActivityMatrix = [
    [5, 0, 0, 2, 0, 3],
    [0, 4, 0, 0, 5, 0],
    [3, 0, 0, 0, 0, 4],
    [0, 0, 4, 0, 0, 5],
];

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

    // Fetch user sentiment from Firestore
    const fetchSentimentScore = async () => {
        try {
            const journalsCollection = collection(firestore, 'journals');
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
        } catch (error) {
            console.error("Error fetching sentiment score:", error);
        }
    };

    // Generate recommendations based on simple weighted average
    const recommendActivities = async () => {
        try {
            if (!userSentiment) return;

            const matrix = userActivityMatrix.map(row =>
                row.map(value => value + (userSentiment.compound * 2)) // Adjust based on sentiment
            );

            const userIndex = 0; // Assume user 0 for now
            const weightedScores = matrix[userIndex].map((score, index) => ({
                activity: activities[index],
                score: score
            }));

            const sortedRecommendations = weightedScores
                .sort((a, b) => b.score - a.score)
                .slice(0, 3); // Get top 3 recommendations

            setRecommendations(sortedRecommendations);
        } catch (error) {
            console.error("Error during recommendation process:", error);
        }
    };

    useEffect(() => {
        fetchSentimentScore();
    }, []);

    useEffect(() => {
        if (userSentiment) {
            recommendActivities();
        }
    }, [userSentiment]);

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
            <Text style={styles.title}>Activity Recommendations</Text>
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
