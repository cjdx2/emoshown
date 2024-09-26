// IntroductionScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';

export function IntroductionScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(-1); // Start with -1 to display the intro first

  const slides = [
    { title: "Monitor Your Emotions", image: require('../assets/onboard1.png') },
    { title: "Analyze Patterns", image: require('../assets/onboard2.png') },
    { title: "Improve Wellness", image: require('../assets/onboard3.png') }
  ];

  const handleNext = () => {
    if (currentSlide === -1) {
      // First click, move to the first slide
      setCurrentSlide(0);
    } else if (currentSlide < slides.length - 1) {
      // Move through slides
      setCurrentSlide(currentSlide + 1);
    } else {
      // After the last slide, navigate to login
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      {currentSlide === -1 ? (
        // Initial Introduction Screen content
        <>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>EmoShown</Text>
          <Text style={styles.subtitle}>Your Emotional Wellness Hub</Text>
        </>
      ) : (
        // Slide content with background image
        <ImageBackground
          source={slides[currentSlide].image}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <Text style={styles.title}>{slides[currentSlide].title}</Text>
        </ImageBackground>
      )}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Image source={require('../assets/rightarrow.png')} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000', // White text for better visibility on the background
    textAlign: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4ECDC4', // EmoShown color styling
  },
  subtitle: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  nextButton: {
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  icon: {
    width: 40,  // Set your preferred size
    height: 40, // Set your preferred size
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
  },
});


