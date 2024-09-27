import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Linking, StyleSheet } from 'react-native';

export const CommunityScreen = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState('');

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{currentDate}</Text>
      <Text style={styles.title}>Community Support</Text>

      <View style={styles.supportContainer}>
        <Text style={styles.supportText}>If you need to talk to someone, here are some helpful hotlines and links:</Text>

        {/* Hotline Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Hotlines</Text>
          <TouchableOpacity onPress={() => handleCallPress('123456789')}>
            <Text style={styles.hotlineText}>National Helpline: 123-456-789</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCallPress('911')}>
            <Text style={styles.hotlineText}>Emergency Services: 911</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCallPress('1800273TALK')}>
            <Text style={styles.hotlineText}>Mental Health Support: 1-800-273-TALK</Text>
          </TouchableOpacity>
        </View>

        {/* Website Links Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Helpful Links</Text>
          <TouchableOpacity onPress={() => handleLinkPress('https://www.mentalhealth.gov')}>
            <Text style={styles.linkText}>Mental Health Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress('https://www.suicidepreventionlifeline.org')}>
            <Text style={styles.linkText}>Suicide Prevention Lifeline</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress('https://www.samhsa.gov')}>
            <Text style={styles.linkText}>Substance Abuse Help</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Community')}>
          <Image source={require('../assets/community.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  date: {
    fontSize: 18, marginBottom: 10, textAlign: 'center',
  },
  title: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center',
  },
  supportContainer: {
    marginVertical: 20,
  },
  supportText: {
    fontSize: 16, marginBottom: 20, textAlign: 'center',
  },
  supportSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20, fontWeight: 'bold', marginBottom: 10,
  },
  hotlineText: {
    fontSize: 16, marginBottom: 5, color: 'blue', textDecorationLine: 'underline', // Make text look clickable
  },
  linkText: {
    fontSize: 16, color: 'blue', marginBottom: 5, textDecorationLine: 'underline',
  },
  bottomNav: {
    position: 'absolute', bottom: 0, flexDirection: 'row', justifyContent: 'space-around', width: '100%',
    padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd',
  },
  iconButton: {
    flex: 1, alignItems: 'center',
  },
  icon: {
    width: 30, height: 30,
  },
});

export default CommunityScreen; // Ensure this is a default export
