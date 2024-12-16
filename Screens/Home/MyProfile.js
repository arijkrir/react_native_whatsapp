import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  Alert,
  View,
  Modal,
} from "react-native";
import firebase from "../../Config/Index";
import { supabase } from "../../Config/Index";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/MaterialIcons";

const database = firebase.database();
const ref_tableProfils = database.ref("lesprofiles");

export default function MyProfile(props) {
  const [nom, setNom] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [telephone, setTelephone] = useState("");
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [uriLocalImage, setUriLocalImage] = useState("");
  const [localImageName, setLocalImageName] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);

  const userId = firebase.auth().currentUser.uid;

  useEffect(() => {
    const userProfileRef = ref_tableProfils.child(`Profil${userId}`);
    userProfileRef.on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNom(data.nom || "");
        setPseudo(data.pseudo || "");
        setTelephone(data.telephone || "");
        if (data.profileImage) {
          setUriLocalImage(data.profileImage);
          setIsDefaultImage(false);
        }
      }
    });

    return () => userProfileRef.off();
  }, []);

  const handleImagePick = async (fromCamera) => {
    try {
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          `You need to allow access to your ${fromCamera ? "camera" : "media library"}.`
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });
      setModalVisible(false);
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        if (!uri) throw new Error("Failed to get image base64 data.");
        setUriLocalImage(result.assets[0].uri);
        setIsDefaultImage(false);
        await uploadImageToSupabase(uri);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const uploadImageToSupabase = async (urilocal) => {
    try {
      const response = await fetch(urilocal);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();

      if (!userId) {
        console.error("userId is invalid:", userId);
        return null;
      }

      const uniqueImageId = new Date().getTime().toString();
      const { error: uploadError } = await supabase.storage
        .from("ProfiliImages")
        .upload(`Profil${uniqueImageId}`, arraybuffer, { upsert: true });

      if (uploadError) {
        console.error("Error uploading image:", uploadError.message);
        return null;
      }

      const { data, error: getError } = await supabase.storage
        .from("ProfiliImages")
        .getPublicUrl(`Profil${uniqueImageId}`);

      if (getError) {
        console.error("Error getting image public URL:", getError.message);
        return null;
      }

      if (!data || !data.publicUrl) {
        console.error("Public URL is not available:", data);
        return null;
      }

      console.log("Public image URL:", data.publicUrl);
      await ref_tableProfils.child(`Profil${userId}`).update({
        profileImage: data.publicUrl,
      });

      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const saveProfile = () => {
    if (!nom || !pseudo || !telephone) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    const userProfileRef = ref_tableProfils.child(`Profil${userId}`);
    userProfileRef
      .update({
        id: userId,
        nom,
        pseudo,
        telephone,
      })
      .then(() => Alert.alert("Success", "Profile updated successfully!"))
      .catch((error) => Alert.alert("Error", error.message));
  };

  return (
    <ImageBackground
      source={require("../../assets/images.jpeg")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>My Profile</Text>

      <View style={styles.imageContainer}>
        <Image
          source={
            isDefaultImage
              ? require("../../assets/agent.png")
              : { uri: uriLocalImage }
          }
          style={styles.profileImage}
        />
        <TouchableOpacity
          style={styles.cameraIcon}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="camera" size={28} color="#000080" />
        </TouchableOpacity>
      </View>

      <Modal transparent={true} visible={isModalVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleImagePick(true)}
            >
              <Ionicons name="camera" size={28} color="#000080" />
              <Text style={styles.modalButtonText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleImagePick(false)}
            >
              <Ionicons name="image" size={28} color="#000080" />
              <Text style={styles.modalButtonText}>Select from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <TextInput
        value={nom}
        onChangeText={setNom}
        textAlign="center"
        placeholderTextColor="#000"
        placeholder="Nom"
        keyboardType="default"
        style={styles.textinputstyle}
      />
      <TextInput
        value={pseudo}
        onChangeText={setPseudo}
        textAlign="center"
        placeholderTextColor="#000"
        placeholder="Pseudo"
        keyboardType="default"
        style={styles.textinputstyle}
      />
      <TextInput
        value={telephone}
        onChangeText={setTelephone}
        placeholderTextColor="#000"
        textAlign="center"
        placeholder="Numero"
        keyboardType="phone-pad"
        style={styles.textinputstyle}
      />

      <TouchableHighlight
        onPress={saveProfile}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.saveButton}
      >
        <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "bold" }}>
          Save
        </Text>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={async () => {
          try {
            // Mettre l'utilisateur hors ligne dans la base de données
            await database.ref(`users/${userId}`).update({ status: "offline" });

            // Se déconnecter
            await firebase.auth().signOut();
            await AsyncStorage.removeItem("email");
            await AsyncStorage.removeItem("password");
            props.navigation.replace("Auth");
          } catch (error) {
            Alert.alert("Logout Error", error.message);
          }
        }}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.deconnectionButton}
      >
        <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "bold" }}>
          Sign Out
        </Text>
      </TouchableHighlight>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
    marginBottom: -15,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 2,
  },
  profileImage: {
    height: 150,
    width: 150,
    borderRadius: 100,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  textinputstyle: {
    fontWeight: "bold",
    backgroundColor: "rgba(255, 255, 255, 0.53)", 
    borderWidth: 2,
    borderColor: "#003366", 
    fontSize: 20,
    color: "#003366", 
    width: "70%",
    height: 50,
    borderRadius: 35,
    margin: 5,
    selectionColor: "white",
    marginBottom: 10,
    shadowColor: "#000",
  },
  textstyle: {
    fontSize: 40,
    fontFamily: "serif",
    color: "#003366", // Navy blue
    fontWeight: "bold",
    marginTop:20,
    marginBottom:-10
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    marginBottom: 5,
    borderColor: "#003366", 
    borderWidth: 2,
    backgroundColor: "#003366", 
    height: 50,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 70,
    marginTop: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deconnectionButton: {
    marginBottom: 5,
    borderColor: "#ff8a80", 
    borderWidth: 2,
    backgroundColor: "#ff8a80", 
    height: 50,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 70,
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(118, 123, 126, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flexDirection: "row",
    width: 350,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
  },
  modalButton: {
    flexDirection: "col",
    alignItems: "center",
    marginVertical: 10,
  },
  modalButtonText: {
    fontSize: 16,
    marginRight: 8,
    color: "#333",
    fontWeight: 500,
  },
});
