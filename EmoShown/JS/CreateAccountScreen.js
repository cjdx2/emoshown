import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Include updateProfile
import { auth, firestore } from './firebaseConfig'; // Import Firebase auth and Firestore
import { setDoc, doc } from 'firebase/firestore'; // Firestore functions

export function CreateAccountScreen({ navigation }) {
  const [fullName, setFullName] = useState(''); // Add fullName state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Error", "Full Name is required");
      return;
    }

    try {
      // Firebase Authentication: Sign up user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with full name
      await updateProfile(user, {
        displayName: fullName
      });

      // Save additional user info in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        fullName,
        email,
        createdAt: new Date().toISOString()
      });

      Alert.alert("Success", "Account created successfully");
      navigation.navigate('Login'); // Navigate to Login screen after successful sign up
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create{"\n"}Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Image source={require('../assets/rightarrow.png')} style={styles.icon} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    color: '#333333',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 100,
    textAlign: 'left',
    
  },
  input: {
    color: '#333333',
    height: 50,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  button: {
    backgroundColor: 'transparent',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 20,
    marginTop: 50,
    left: 270,
  },
  icon: {
    width: 24,
    height: 24,  
  },
  link: {
    color: '#1E90FF',
    textAlign: 'center',
    marginTop: 50,
  },
});
