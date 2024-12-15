import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, ImageBackground, StyleSheet, Text, TextInput, TouchableHighlight, Alert, View } from 'react-native';
import firebase from "../../Config/Index";
import { supabase } from "../../Config/Index";

const database = firebase.database();
const ref_tableProfils = database.ref("lesprofiles");

export default function MyProfile(props) {
  const [nom, setNom] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [telephone, setTelephone] = useState('');
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [uriLocalImage, setUriLocalImage] = useState('');
  const [localImageName, setLocalImageName] = useState('');

  const userId = firebase.auth().currentUser.uid; // Utilisation de l'ID utilisateur Firebase, pour référencer l'utilisateur

  const requestPermissions = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission requise pour accéder à la galerie !');
      return false;
    }
    return true;
  };

  const uploadImageToStorage = async (urilocal) => {
    try {
      const response = await fetch(urilocal);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();

      if (!userId) {
        console.error('userId est invalide:', userId);
        return null;
      }

      // Upload de l'image vers Supabase Storage avec un nom unique basé sur un timestamp
      const uniqueImageId = new Date().getTime().toString();  // Création d'un ID unique basé sur l'heure actuelle
      const { error: uploadError } = await supabase.storage
        .from('ProfiliImages')
        .upload(`Profil${uniqueImageId}`, arraybuffer, { upsert: true });

      if (uploadError) {
        console.error('Erreur lors de l\'upload de l\'image:', uploadError.message);
        return null;
      }

      const { data, error: getError } = await supabase
        .storage
        .from('ProfiliImages')
        .getPublicUrl(`Profil${uniqueImageId}`);

      if (getError) {
        console.error('Erreur lors de l\'obtention de l\'URL de l\'image:', getError.message);
        return null;
      }

      if (!data || !data.publicUrl) {
        console.error('L\'URL publique n\'est pas disponible:', data);
        return null;
      }

      console.log('URL publique de l\'image:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      return null;
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setIsDefaultImage(false);
      setUriLocalImage(result.assets[0].uri);
      setLocalImageName(result.assets[0].fileName);
    }
  };

  const saveProfile = async () => {
    try {
      if (!nom || !pseudo || !telephone || !uriLocalImage) {
        alert('Veuillez remplir tous les champs et sélectionner une image.');
        return;
      }

      const urlImage = await uploadImageToStorage(uriLocalImage);
      if (!urlImage) {
        alert('Erreur lors de l\'upload de l\'image.');
        return;
      }

      // Créer un nouvel ID unique pour le profil
      const newProfileRef = ref_tableProfils.push(); // Cette méthode génère un nouvel ID unique
      const newProfileId = newProfileRef.key; // Récupérer cet ID généré

      // Ajouter ou mettre à jour le profil sous ce nouvel ID
      await newProfileRef.set({
        id: newProfileId,
        nom,
        pseudo,
        telephone,
        urlImage: urlImage,  // L'URL de l'image uploadée
      });

      console.log('Données enregistrées avec succès !');
      alert('Profil créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement :', error);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  return (
    <ImageBackground source={require("../../assets/images.jpeg")} style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.textstyle}>Mon Profil</Text>

      <TouchableHighlight onPress={pickImage}>
        <Image
          source={isDefaultImage ? require("../../assets/agent.png") : { uri: uriLocalImage }}
          style={styles.profileImage}
        />
      </TouchableHighlight>

      <TextInput
        value={nom}
        onChangeText={setNom}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Nom"
        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      />

      <TextInput
        value={pseudo}
        onChangeText={setPseudo}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Pseudo"
        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      />

      <TextInput
        value={telephone}
        onChangeText={setTelephone}
        placeholderTextColor="#fff"
        textAlign="center"
        placeholder="Numéro"
        style={styles.textinputstyle}
      />

      <TouchableHighlight onPress={saveProfile} activeOpacity={0.5} underlayColor="#DDDDDD" style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Sauvegarder</Text>
      </TouchableHighlight>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  textstyle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileImage: {
    width: 180,
    height: 180,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#4A90E2',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textinputstyle: {
    fontWeight: 'bold',
    backgroundColor: '#0004',
    fontSize: 20,
    color: '#fff',
    width: '75%',
    height: 50,
    borderRadius: 10,
    margin: 5,
  },
  saveButton: {
    backgroundColor: "#003366",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginTop: 15,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
