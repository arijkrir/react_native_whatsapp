import { StatusBar } from "react-native";
import React from 'react';
import {
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import firebase from "../Config/Index";
const auth = firebase.auth();

export default function NewUser(props) {
  let email, pwd;

  return (
    <ImageBackground
      source={require("../assets/images.jpeg")}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Créer un compte</Text>

        {/* Email Input */}
        <TextInput
          onChangeText={(txt) => {
            email = txt;
          }}
          placeholder="Email"
          keyboardType="email-address"
          style={styles.textInput}
          placeholderTextColor="#003366"
        />

        {/* Password Input */}
        <TextInput
          onChangeText={(txt) => {
            pwd = txt;
          }}
          placeholder="Mot de passe"
          secureTextEntry={true}
          style={styles.textInput}
          placeholderTextColor="#003366"
        />

        {/* Confirm Password */}
        <TextInput
          placeholder="Confirmer le mot de passe"
          secureTextEntry={true}
          style={styles.textInput}
          placeholderTextColor="#003366"
        />

        {/* Submit and Back Buttons */}
        <View style={styles.buttonContainer}>
        <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => {
              auth
                .createUserWithEmailAndPassword(email, pwd)
                .then(() => {
                  const currentid = auth.currentUser.uid;
                  props.navigation.replace("MyProfile", { currentid });
                })
                .catch((error) => {
                  alert(error.message);
                });
            }}
          >
            <Text style={styles.buttonText}>S'inscrire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => props.navigation.goBack()}
          >
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>

        <StatusBar style="auto" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e1f5fe', // Fond doux
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.7)', // Contraste pour le contenu
    width: '90%',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#003366', // Bordure bleu marine
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#003366', // Bleu foncé
    marginBottom: 25,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  textInput: {
    height: 50,
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fond semi-transparent
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    fontSize: 16,
    color: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, // Ajouter une bordure
    borderColor: '#003366', // Bordure bleu marine
  },
  buttonContainer: {
    flexDirection: 'column', // Stack buttons vertically
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 25,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 15, // Add space between buttons
  },
  registerButton: {
    backgroundColor: '#5e92f3', // Bleu plus foncé
  },
  backButton: {
    backgroundColor: '#ff8a80', // Rouge pastel
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerText: {
    width: '100%',
    textAlign: 'center',
    color: '#5e92f3', // Bleu foncé
    marginTop: 20,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
