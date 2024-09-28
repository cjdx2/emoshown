import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Linking, StyleSheet, Modal, Pressable } from 'react-native';

export const CommunityScreen = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false); // Added state for modal

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  const handleCallPress = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

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
    navigation.setOptions({
      headerLeft: () => null,
      headerRight: () => (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.menuButton}>
          <Image source={require('../assets/menu.png')} style={styles.menuButtonImage} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{currentDate}</Text>
      <Text style={styles.title}>Community Support</Text>

      <View style={styles.supportContainer}>
        <Text style={styles.supportText}>If you need to talk to someone, here are some helpful hotlines and links:</Text>

        {/* Hotline Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Hotlines</Text>
          <TouchableOpacity onPress={() => handleCallPress('(02) 8804-4673')}>
            <Text style={styles.hotlineText}>HOPELINE: (02) 8804-4673</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCallPress('1553')}>
            <Text style={styles.hotlineText}>NCMH Crisis Hotline: 1553</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCallPress('+63288937603')}>
            <Text style={styles.hotlineText}>In Touch: Crisis Line: +63288937603</Text>
          </TouchableOpacity>
        </View>

        {/* Website Links Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Helpful Links</Text>
          <TouchableOpacity onPress={() => handleLinkPress('https://www.pmha.org.ph')}>
            <Text style={styles.linkText}>Philippine Mental Health Association, Inc.</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress('https://ncmh.gov.ph')}>
            <Text style={styles.linkText}>National Center for Mental Health</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress('https://in-touch.org')}>
            <Text style={styles.linkText}>In Touch Community Services</Text>
          </TouchableOpacity>
        </View>
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
  supportContainer: {
    marginVertical: 20,
  },
  supportText: {
    fontSize: 16, 
    marginBottom: 20, 
    textAlign: 'center',
  },
  supportSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 10,
  },
  hotlineText: {
    fontSize: 16, 
    marginBottom: 5, 
    color: 'blue', 
    textDecorationLine: 'underline', // Make text look clickable
  },
  linkText: {
    fontSize: 16, 
    color: 'blue', 
    marginBottom: 5, 
    textDecorationLine: 'underline',
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

export default CommunityScreen;
