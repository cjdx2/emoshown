import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';

export function IntroductionScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(-1);
  const videoRef = useRef(null);  // Reference to control video
  const [isPlaying, setIsPlaying] = useState(true);  // State for play/pause

  const slides = [
    { title: "Monitor Your Emotions", image: require('../assets/onboard1.png') },
    { title: "Analyze Patterns", image: require('../assets/onboard2.png') },
    { title: "Improve Wellness", image: require('../assets/onboard3.png') },
    { title: "App Preview", video: require('../assets/video/EmoShownAppVideoDemo.mp4') }
  ];

  const handleNext = async () => {
    if (currentSlide === slides.length - 1 && videoRef.current) {
      // If currently on the App Preview slide, pause the video before navigating
      await videoRef.current.pauseAsync();
    }
  
    if (currentSlide === -1) {
      setCurrentSlide(0);
    } else if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // At the last slide (App Preview), navigate to Login
      navigation.navigate('Login');
    }
  };

  const togglePlayback = async () => {
    const status = await videoRef.current.getStatusAsync();
    if (status.isPlaying) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      videoRef.current.playAsync();
      setIsPlaying(true);
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
      ) : currentSlide === slides.length - 1 ? (
        <View style={styles.videoContainer}>
          <Text style={styles.title}>{slides[currentSlide].title}</Text>
          <Video
            ref={videoRef}
            source={slides[currentSlide].video}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            shouldPlay
            style={styles.video}
            useNativeControls  // Native controls for play/pause, fullscreen
          />
          <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayback}>
            <Text style={styles.playPauseText}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 20,  // Adjust margin for top spacing
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
  videoContainer: {
    flex: 1,
    justifyContent: 'flex-start',  // Align content to the top
    alignItems: 'center',
    paddingTop: 20,  // Adjust padding to move video below title
  },
  video: {
    width: 350,  // Increase video size
    height: 400,
  },
  playPauseButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  playPauseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
