import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Modal, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, firestore } from './firebaseConfig';
import { setDoc, doc } from 'firebase/firestore';

export function CreateAccountScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleSignUp = async () => {
    if (!isAccepted) {
      Alert.alert("Error", "You must accept the Data Privacy Notice to create an account.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
  
    if (!fullName.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await updateProfile(user, {
        displayName: fullName
      });
  
      await setDoc(doc(firestore, "users", user.uid), {
        fullName,
        email,
        createdAt: new Date().toISOString()
      });
  
      Alert.alert("Success", "Account created successfully");
      // Navigate to the IntroductionScreen directly after the privacy acceptance
      navigation.navigate('Introduction');
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create{"\n"}Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Name"
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
      
      <TouchableOpacity style={styles.button} onPress={() => setIsModalVisible(true)}>
        <Image source={require('../assets/rightarrow.png')} style={styles.icon} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>

      {/* Privacy Notice Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Data Privacy Notice</Text>
              <Text style={styles.modalText}>
                Thank you for choosing to create an account with our app. We value your privacy and are committed to protecting your personal data. This notice outlines how we collect, use, and safeguard your information.
              </Text>
              <Text style={styles.modalText}>
                1. Information We Collect: When you register for an account, we may collect the following personal information:
                - Full Name: Used to personalize your experience and display your name within the app.
                - Email Address: Used for account verification, notifications, and communication regarding your account and the app.
                - Password: Used to secure your account. We do not store your password in plain text.
              </Text>
              <Text style={styles.modalText}>
                2. How We Use Your Information: Your personal data is used for the following purposes:
                - Account Creation: To set up and manage your user account.
                - Personalization: To provide tailored content and recommendations based on your preferences and activity within the app.
                - Communication: To send you updates, alerts, and other information related to your account and our services.
                - Analytics: To analyze usage patterns and improve the app's functionality and user experience.
              </Text>
              <Text style={styles.modalText}>
                3. Data Sharing and Disclosure: We do not sell or rent your personal data to third parties. We may share your information with:
                - Service Providers: Trusted third-party services that assist us in operating the app and conducting our business, such as hosting services and customer support.
                - Legal Compliance: We may disclose your information if required by law or in response to valid requests by public authorities.
              </Text>
              <Text style={styles.modalText}>
                4. Your Rights: You have the following rights regarding your personal data:
                - Access: You can request access to the personal information we hold about you.
                - Correction: You can request that we correct any inaccurate or incomplete information.
                - Deletion: You can request the deletion of your personal data, subject to certain exceptions.
                - Opt-Out: You can opt out of receiving promotional communications from us.
              </Text>
              <Text style={styles.modalText}>
                5. Changes to This Privacy Notice: We may update this privacy notice from time to time. We will notify you of any changes by posting the new notice on this page and updating the effective date.
              </Text>
              <Text style={styles.modalText}>
                6. Contact Us: If you have any questions or concerns about this privacy notice or our data practices, please contact us at:
                [Your Contact Email]
              </Text>
              <Text style={styles.modalText}>
                By creating an account, you acknowledge that you have read and understood this Data Privacy Notice and agree to the collection and use of your information as described.
              </Text>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.declineButton}>
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setIsAccepted(true); setIsModalVisible(false); handleSignUp(); }} style={styles.acceptButton}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    maxHeight: '80%',
    height: '60%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  acceptButton: {
    backgroundColor: '#a3d3a3',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#f5a3a3',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

