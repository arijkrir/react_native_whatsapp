import { Image } from 'react-native';
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import firebase from "../../Config/Index";
import * as ImagePicker from "expo-image-picker";

const database = firebase.database();

export default function ChatGroup({ route }) {
  const { groupId, groupName, members } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [memberDetails, setMemberDetails] = useState([]); // Changer memberNames à memberDetails pour inclure pseudo et nom
  const currentId = firebase.auth().currentUser.uid;

  useEffect(() => {
    const messagesRef = database.ref(`GroupMessages/${groupId}`);
    const listener = messagesRef.on("value", (snapshot) => {
      const fetchedMessages = [];
      snapshot.forEach((msg) => {
        if (msg.key !== "typing") {
          fetchedMessages.push({ ...msg.val(), id: msg.key });
        }
      });
      setMessages(fetchedMessages.reverse());
    });

    const typingListener = database
      .ref(`GroupMessages/${groupId}/typing`)
      .on("value", (snapshot) => {
        if (snapshot.val() && snapshot.val() !== currentId) {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      });

    // Récupérer les informations des membres du groupe
    const fetchMemberDetails = async () => {
      const details = [];
      for (const memberId of members) {
        const userRef = database.ref(`lesprofiles/${memberId}`); // Accédez à la collection "Profiles" pour obtenir le nom et le pseudo
        const userSnapshot = await userRef.once('value');
        const user = userSnapshot.val();
        if (user) {
          details.push({
            name: user.nom, // Le nom complet de l'utilisateur
            username: user.pseudo,
            image: user.profileImage, // Le pseudo de l'utilisateur
          });
        }
      }
      setMemberDetails(details);
    };

    fetchMemberDetails();

    return () => {
      messagesRef.off("value", listener);
      database.ref(`GroupMessages/${groupId}/typing`).off("value", typingListener);
    };
  }, [groupId, members]);

  const handleInputChange = (text) => {
    setInputText(text);
    if (text) {
      database.ref(`GroupMessages/${groupId}/typing`).set(currentId);
    } else {
      database.ref(`GroupMessages/${groupId}/typing`).set(null);
    }
  };

  const sendMessage = () => {
    if (inputText.trim() === "" && !selectedImage) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: currentId,
      date: new Date().toISOString(),
      image: selectedImage || null,
    };

    const messagesRef = database.ref(`GroupMessages/${groupId}`);
    messagesRef.push(newMessage);
    database.ref(`GroupMessages/${groupId}/typing`).set(null);

    setInputText("");
    setSelectedImage(null);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner une image.");
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === currentId;
    const formattedDate = new Date(item.date).toLocaleTimeString();

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
        {item.text && <Text style={styles.messageText}>{item.text}</Text>}
        {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
        <Text style={styles.timestamp}>{formattedDate}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{groupName}</Text>
        <TouchableOpacity onPress={() => setShowMembers(true)} style={styles.iconButton}>
          <Icon name="account-group" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Chat Body */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flexGrow}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
        />
        {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrire un message..."
            value={inputText}
            onChangeText={handleInputChange}
          />
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Icon name="image" size={27} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Icon name="send" size={27} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Members Modal */}
      <Modal visible={showMembers} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Membres du groupe</Text>
            <ScrollView>
              {memberDetails.map((member, index) => (
                <View key={index} style={styles.memberContainer}>
                  <Image source={{ uri: member.image }} style={styles.memberImage} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberUsername}>{member.username}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowMembers(false)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  flexGrow: { flex: 1 },
  messagesList: { paddingHorizontal: 10, paddingVertical: 15 },
  messageContainer: {
    maxWidth: "75%",
    borderRadius: 20,
    padding: 12,
    marginVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#4A90E2" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#6C757D" },
  messageText: { color: "#fff", fontSize: 16 },
  timestamp: { fontSize: 10, color: "#EDEDED", alignSelf: "flex-end", marginTop: 5 },
  messageImage: { width: 200, height: 200, borderRadius: 10, marginVertical: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  textInput: { flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 10, backgroundColor: "#F1F3F5" },
  iconButton: { marginLeft: 10 },
  sendButton: { marginLeft: 15 },
  header: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#4A90E2" },
  headerText: { fontSize: 20, fontWeight: "bold", color: "#FFF", flex: 1 },
  typingIndicator: { textAlign: "center", fontStyle: "italic", color: "#6C757D", marginBottom: 10 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "#FFF", borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  closeButton: { marginTop: 20, backgroundColor: "#4A90E2", padding: 10, borderRadius: 10 },
  closeButtonText: { color: "#FFF", fontWeight: "bold", textAlign: "center" },

  // Member styles
  memberContainer: {
    flexDirection: 'row', // Image à gauche, texte à droite
    alignItems: 'center',
    marginBottom: 15, // Espacement entre les membres
  },
  memberImage: {
    width: 40,  // Ajuster la taille de l'image du profil
    height: 40, // Ajuster la taille de l'image du profil
    borderRadius: 20, // Rendre l'image circulaire
    marginRight: 10, // Espacement entre l'image et le texte
  },
  memberInfo: {
    flexDirection: 'column', // Texte à afficher verticalement
  },
  memberName: {
    fontSize: 16,  // Taille du nom du membre
    fontWeight: 'bold',  // Mettre en gras le nom
  },
  memberUsername: {
    fontSize: 14, // Taille du pseudo
    color: '#6C757D', // Couleur plus claire pour le pseudo
  },
});
