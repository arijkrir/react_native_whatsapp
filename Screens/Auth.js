import { StatusBar } from "react-native";
import React from "react";
import {
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import firebase from "../Config/Index";
const auth = firebase.auth();
const database = firebase.database();

export default function Auth(props) {
  let email, pwd;

  return (
    <ImageBackground
      source={require("../assets/images.jpeg")}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Bienvenue !</Text>

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

        {/* Submit and Exit Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => {
              auth
                .signInWithEmailAndPassword(email, pwd)
                .then(() => {
                  const currentid = auth.currentUser.uid;
                  
                  // Mettre à jour le statut de l'utilisateur à "online"
                  database.ref(`users/${currentid}`).update({ status: "online" });

                  props.navigation.replace("Home", { currentid: currentid });
                })
                .catch((error) => {
                  alert(error);
                });
            }}
          >
            <Text style={styles.buttonText}>Se Connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.exitButton]}
            onPress={() => alert("Quitter l'application")}
          >
            <Text style={styles.buttonText}>Quitter</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <Text
          onPress={() => props.navigation.navigate("NewUser")}
          style={styles.footerText}
        >
          Créer un nouveau compte
        </Text>
        <StatusBar style="auto" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e1f5fe", // Fond doux
  },
  innerContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(240, 240, 240, 0.7)", // Contraste pour le contenu
    width: "90%",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2, // Ajouter une bordure
    borderColor: "#003366", // Bordure bleu marine
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#003366", // Bleu foncé (anciennement Lavande pastel)
    marginBottom: 25,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  textInput: {
    height: 50,
    width: "90%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    fontSize: 16,
    color: "#003366",
    shadowColor: "#003366",
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, // Ajouter une bordure
    borderColor: "#003366", // Bordure bleu marine
  },
  buttonContainer: {
    flexDirection: "column", // Change to column to stack buttons vertically
    justifyContent: "space-between",
    width: "80%",
    marginTop: 25,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 15, // Add space between buttons
  },
  loginButton: {
    backgroundColor: "#5e92f3", // Bleu un peu plus foncé
  },
  exitButton: {
    backgroundColor: "#ff8a80", // Rouge pastel
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  footerText: {
    width: "100%",
    textAlign: "center",
    color: "#003366", // Bleu foncé
    marginTop: 20,
    textDecorationLine: "underline",
    fontSize: 14,
  },
});
