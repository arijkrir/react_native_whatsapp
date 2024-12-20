import { Image } from 'react-native';
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import firebase from "../../Config/Index"; // Ensure this is the correct path
import { getDatabase, ref, push, set, onValue, child } from 'firebase/database';
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Import icons

const database = firebase.database(); // Firebase database reference

export default function Chat(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const profile = props.route.params.profile;
  const currentId = props.route.params.currentId;
  const idDiscussion = currentId > profile.id ? currentId + profile.id : profile.id + currentId;
  const ref_uneDiscussion = ref(database, `/lesDiscussions/${idDiscussion}`);

  useEffect(() => {
    const messagesListener = onValue(ref_uneDiscussion, (snapshot) => {
      const fetchedMessages = [];
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.key !== "typing") {
          const message = childSnapshot.val();
          fetchedMessages.push(message);
        }
      });
      setMessages(fetchedMessages.reverse());
    });

    const typingListener = onValue(child(ref_uneDiscussion, "typing"), (snapshot) => {
      if (snapshot.val() && snapshot.val() !== currentId) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }
    });

    return () => {
      messagesListener();
      typingListener();
    };
  }, []); // Run only once when component mounts

  const handleInputChange = (text) => {
    setInputText(text);
    if (text) {
      set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), currentId);
    } else {
      set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), null);
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

    const newMessageRef = ref(database, `/lesDiscussions/${idDiscussion}`);
    const newMessageKey = push(newMessageRef).key;

    set(ref(database, `/lesDiscussions/${idDiscussion}/${newMessageKey}`), newMessage)
      .then(() => {
        set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), null);
        setInputText("");
        setSelectedImage(null);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send the message.");
      });
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
      Alert.alert("Error", "Unable to select an image.");
    }
  };

  const openUrl = (url) => {
    Linking.openURL(url).catch((err) => console.error("Failed to open URL", err));
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === currentId;
    const formattedDate = new Date(item.date).toLocaleTimeString();

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>

        {item.location && (
          <TouchableOpacity onPress={() => openUrl(`https://maps.google.com/?q=${item.location.latitude},${item.location.longitude}`)}>
            <Text style={styles.messageText}>Location: {item.location.latitude}, {item.location.longitude}</Text>
          </TouchableOpacity>
        )}

        {item.image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.image} />
          </View>
        )}

        <Text style={styles.timestamp}>{formattedDate}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.recipientInfo}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
            {profile.isOnline ? (
              <View style={styles.onlineIndicatorGreen} />
            ) : (
              <View style={styles.onlineIndicatorGray} />
            )}
          </View>

          <View style={styles.textInfo}>
            <Text style={styles.recipientName}>{profile.nom}</Text>
            <Text style={styles.recipientPseudo}>{profile.pseudo}</Text>
          </View>
        </View>
      </View>

      {/* Main Chat Body */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flexGrow}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
        />
        {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={handleInputChange}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <MaterialCommunityIcons name="send" size={27} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
            <MaterialCommunityIcons name="image" size={27} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",  // Soft background for better contrast
  },
  flexGrow: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  messageContainer: {
    maxWidth: "75%",
    borderRadius: 20,
    padding: 12,
    marginVertical: 7,
    shadowColor: "#000",  // Add a subtle shadow effect for message bubbles
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#6C757D",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: "#EDEDED",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  typingIndicator: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#6C757D",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: "#F1F3F5",
  },
  iconButton: {
    marginLeft: 10,
  },
  sendButton: {
    marginLeft: 15
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2", // Nouveau code de couleur (bleu clair)
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 0,
    marginLeft: 8,
    marginRight: 3,
    marginTop: 10,
    borderColor: "#fff",
    borderWidth:3,
  },
  onlineIndicatorGreen: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5,
    backgroundColor: "#28A745",
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineIndicatorGray: {
    position: "absolute",
    bottom: 2,
    right: 5,
    width: 11,
    height: 11,
    borderRadius: 5,
    backgroundColor: "#6C757D",
    borderWidth: 2,
    borderColor: "#fff",
  },
  textInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  recipientPseudo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  recipientName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 5,
    marginTop: 10,
  },
  image: {
    width: 200,   
    height: 200,  
    borderRadius: 10,
  },
});
