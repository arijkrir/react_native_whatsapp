// import React, { useState } from "react";
// import {
//   StyleSheet,
//   TouchableHighlight,
//   TouchableOpacity,
//   View,
//   Text,
//   TextInput,
//   Image,
//   ImageBackground,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { StatusBar } from "expo-status-bar";
// import * as ImagePicker from "expo-image-picker";
// import { firebase, supabase } from "../../Config/Index";

// const database = firebase.database();

// export default function MyProfile() {
//   const [nom, setNom] = useState("");
//   const [pseudo, setPseudo] = useState("");
//   const [telephone, setTelephone] = useState("");
//   const [isDefaultImage, setIsDefaultImage] = useState(true);
//   const [uriLocalImage, setUriLocalImage] = useState(null);
//   const [localImageName, setLocalImageName] = useState(null);
//   const [uploading, setUploading] = useState(false); // Indicateur de chargement

//   /**
//    * Fonction pour uploader l'image sur Supabase Storage
//    * @param {string} urilocal - URI locale de l'image sélectionnée
//    * @returns {string} - URL publique de l'image
//    */
//   const uploadImageToStorage = async (urilocal) => {
//     try {
//       setUploading(true); // Début de l'upload
//       // Récupérer la réponse de l'image
//       const response = await fetch(urilocal);
//       const blob = await response.blob();

//       // Générer un nom unique pour le fichier si non disponible
//       const uniqueFileName = localImageName || `image_${Date.now()}.jpg`;

//       // Uploader le fichier sur Supabase Storage
//       const { error } = await supabase.storage
//         .from("ProfiliImages")
//         .upload(uniqueFileName, blob, {
//           upsert: true, // Permet de remplacer le fichier s'il existe déjà
//         });

//       if (error) {
//         throw error;
//       }

//       // Obtenir l'URL publique de l'image
//       const { data } = supabase.storage
//         .from("ProfiliImages")
//         .getPublicUrl(uniqueFileName);

//       if (data.publicUrl) {
//         return data.publicUrl;
//       } else {
//         throw new Error("Impossible d'obtenir l'URL publique de l'image.");
//       }
//     } catch (err) {
//       console.error("Erreur lors de l'upload de l'image :", err);
//       Alert.alert("Erreur", "Une erreur est survenue lors de l'upload de l'image.");
//       return null;
//     } finally {
//       setUploading(false); // Fin de l'upload
//     }
//   };

//   /**
//    * Fonction pour sélectionner une image depuis la galerie
//    */
//   const pickImage = async () => {
//     try {
//       // Lancer l'Image Picker
//       let result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaType.Image,
//         allowsEditing: false,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       if (!result.canceled) {
//         const selectedAsset = result.assets[0];
//         setIsDefaultImage(false);
//         setUriLocalImage(selectedAsset.uri);

//         // Générer un nom de fichier unique
//         const imageName = selectedAsset.fileName
//           ? selectedAsset.fileName
//           : `image_${Date.now()}.jpg`;
//         setLocalImageName(imageName);
//       }
//     } catch (error) {
//       console.error("Erreur lors de la sélection de l'image :", error);
//       Alert.alert("Erreur", "Une erreur est survenue lors de la sélection de l'image.");
//     }
//   };

//   /**
//    * Fonction pour sauvegarder le profil dans Firebase
//    */
//   const handleSave = async () => {
//     if (!nom || !pseudo || !telephone) {
//       // Alert de validation
//       Alert.alert(
//         "Erreur",
//         "Veuillez remplir tous les champs.",
//         [{ text: "OK" }],
//         { cancelable: false }
//       );
//       return;
//     }

//     let imageUrl = null;

//     if (uriLocalImage) {
//       // Uploader l'image et obtenir l'URL
//       imageUrl = await uploadImageToStorage(uriLocalImage);
//       if (!imageUrl) {
//         // Si l'upload a échoué, arrêter la sauvegarde
//         return;
//       }
//     }

//     const refLesProfils = database.ref("lesprofils");
//     const key = refLesProfils.push().key; // Générer une clé unique
//     const refUnProfil = refLesProfils.child(key); // Utiliser la clé unique sans préfixe

//     const profilData = {
//       nom,
//       pseudo,
//       telephone,
//     };

//     if (imageUrl) {
//       profilData.imageUrl = imageUrl;
//     }

//     refUnProfil
//       .set(profilData)
//       .then(() => {
//         // Message de succès et réinitialisation des champs
//         Alert.alert(
//           "Succès",
//           "Profil sauvegardé avec succès !",
//           [{ text: "OK", onPress: resetFields }],
//           { cancelable: false }
//         );
//       })
//       .catch((error) => {
//         console.error("Erreur lors de la sauvegarde du profil :", error);
//         // Message d'erreur en cas de problème avec la sauvegarde
//         Alert.alert(
//           "Erreur",
//           "Une erreur est survenue. Veuillez réessayer.",
//           [{ text: "OK" }],
//           { cancelable: false }
//         );
//       });
//   };

//   /**
//    * Fonction pour réinitialiser les champs après la sauvegarde
//    */
//   const resetFields = () => {
//     setNom("");
//     setPseudo("");
//     setTelephone("");
//     setIsDefaultImage(true);
//     setUriLocalImage(null);
//     setLocalImageName(null);
//   };

//   return (
//     <ImageBackground
//       source={require("../../assets/images.jpeg")}
//       style={styles.container}
//     >
//       <StatusBar style="light" />

//       <Text style={styles.title}>Mon Profil</Text>

//       <TouchableHighlight
//         onPress={pickImage}
//         underlayColor="#ccc"
//         style={styles.imagePicker}
//       >
//         {uploading ? (
//           <ActivityIndicator size="large" color="#0000ff" />
//         ) : (
//           <Image
//             source={
//               isDefaultImage
//                 ? require("../../assets/agent.png")
//                 : { uri: uriLocalImage }
//             }
//             style={styles.profileImage}
//           />
//         )}
//       </TouchableHighlight>

//       {/* Formulaire */}
//       <View style={styles.formContainer}>
//         <TextInput
//           value={nom}
//           onChangeText={setNom}
//           placeholder="Nom"
//           placeholderTextColor="#ccc"
//           style={styles.textInput}
//         />
//         <TextInput
//           value={pseudo}
//           onChangeText={setPseudo}
//           placeholder="Pseudo"
//           placeholderTextColor="#ccc"
//           style={styles.textInput}
//         />
//         <TextInput
//           value={telephone}
//           onChangeText={setTelephone}
//           placeholder="Numéro de Téléphone"
//           keyboardType="phone-pad"
//           placeholderTextColor="#ccc"
//           style={styles.textInput}
//         />
//       </View>

//       {/* Bouton Enregistrer */}
//       <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//         <Text style={styles.saveButtonText}>Sauvegarder</Text>
//       </TouchableOpacity>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   title: {
//     fontSize: 36,
//     fontWeight: "bold",
//     color: "#003366",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   imagePicker: {
//     marginBottom: 30,
//     borderRadius: 75,
//     overflow: "hidden",
//     borderWidth: 3,
//     borderColor: "#4A90E2",
//     width: 150,
//     height: 150,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   profileImage: {
//     width: "100%",
//     height: "100%",
//   },
//   formContainer: {
//     width: "100%",
//     marginBottom: 30,
//   },
//   textInput: {
//     backgroundColor: "rgba(255, 255, 255, 0.8)",
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     height: 50,
//     marginBottom: 15,
//     fontSize: 16,
//     color: "#003366",
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 2, // Pour les ombres sur Android
//   },
//   saveButton: {
//     backgroundColor: "#003366",
//     paddingVertical: 15,
//     paddingHorizontal: 50,
//     borderRadius: 25,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 3, // Pour les ombres sur Android
//   },
//   saveButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
// });
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
} from 'react-native';
import firebase from "../../Config/Index";
import { supabase } from "../../Config/Index";

const database = firebase.database();

export default function MyProfile(props) {
  const [nom, setNom] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [telephone, setTelephone] = useState('');
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [uriLocalImage, setUriLocalImage] = useState('');
  const [localImageName, setLocalImageName] = useState('');
  const currentId = props.route.params.currentId;

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

      if (!currentId) {
        console.error('currentId est invalide:', currentId);
        return null;
      }

      const { error: uploadError } = await supabase.storage
        .from('ProfiliImages')
        .upload(currentId, arraybuffer, { upsert: true });

      if (uploadError) {
        console.error('Erreur lors de l\'upload de l\'image:', uploadError.message);
        return null;
      }

      const { data, error: getError } = await supabase
        .storage
        .from('ProfiliImages')
        .getPublicUrl(currentId);

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

      const ref_lesprofiles = database.ref('lesprofiles');
      const ref_unprofile = ref_lesprofiles.child(currentId);

      await ref_unprofile.set({
        nom,
        pseudo,
        telephone,
        urlImage,
      });

      console.log('Données enregistrées avec succès !');
      alert('Profil mis à jour avec succès !');
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
        marginTop:15 
      },
      saveButtonText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
      },
});
