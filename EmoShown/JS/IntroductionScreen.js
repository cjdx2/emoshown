import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';

export function IntroductionScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(-1);

  const slides = [
    { title: "Monitor Your Emotions", image: require('../assets/onboard1.png') },
    { title: "Analyze Patterns", image: require('../assets/onboard2.png') },
    { title: "Improve Wellness", image: require('../assets/onboard3.png') }
  ];

  const handleNext = () => {
    if (currentSlide === -1) {
      setCurrentSlide(0);
    } else if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= currentSlide ? '#333333' : '#ababab' },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {currentSlide === -1 ? (
        <>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>
            <Text style={styles.emoText}>Emo</Text>
            <Text style={styles.shownText}>Shown</Text>
          </Text>
          <Text style={styles.subtitle}>Your Emotional Wellness Hub</Text>
        </>
      ) : (
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

      {renderProgressBar()}
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
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: -150,
  },
  appName: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: -10,
  },
  emoText: {
    color: '#a3c2e8',
  },
  shownText: {
    color: '#b9dabf',
  },
  subtitle: {
    fontSize: 35,
    color: '#000',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 50,
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
    width: 60,
    height: 60,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
  },
progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});