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
import { app, supabase } from '../../Config/Index';
import { getDatabase, ref, push, set, onValue, child } from 'firebase/database';
import * as Location from 'expo-location';
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Import icons

const database = getDatabase(app);

export default function Chat(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState(null);
  const [file, setFile] = useState(null);

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

  const sendMessage = async () => {
    if (inputText.trim() === "" && !location && !file) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: currentId,
      date: new Date().toISOString(),
      receiver: profile.id,
      location: location || null,
      file: file || null,
    };

    const newMessageRef = ref(database, `/lesDiscussions/${idDiscussion}`);
    const newMessageKey = push(newMessageRef).key;

    set(ref(database, `/lesDiscussions/${idDiscussion}/${newMessageKey}`), newMessage)
      .then(() => {
        set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), null);
        setInputText("");
        setLocation(null);
        setFile(null);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send the message.");
      });
  };

  const sendLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    const userLocation = await Location.getCurrentPositionAsync({});
    const message = {
      id: Date.now().toString(),
      text: "Shared Location",
      sender: currentId,
      date: new Date().toISOString(),
      receiver: profile.id,
      location: userLocation.coords,
    };

    setLocation(userLocation.coords);
    sendMessageWithDetails(message);
  };

  const sendFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        Alert.alert("Error", "No valid image was selected.");
        return;
      }

      const uriLocal = result.assets[0].uri;
      const response = await fetch(uriLocal);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();
      await supabase.storage.from("ProfiliImages").upload(currentId, arraybuffer, {
        upsert: true,
      });

      const { data } = supabase.storage.from("ProfiliImages").getPublicUrl(currentId);
      const publicImageUrl = data.publicUrl;

      const message = {
        id: Date.now().toString(),
        sender: currentId,
        date: new Date().toISOString(),
        receiver: profile.id,
        file: publicImageUrl,
      };

      sendMessageWithDetails(message);
      setFile(publicImageUrl);
    } catch (error) {
    }
  };

  const sendMessageWithDetails = (message) => {
    const newMessageRef = ref(database, `/lesDiscussions/${idDiscussion}`);
    const newMessageKey = push(newMessageRef).key;

    set(ref(database, `/lesDiscussions/${idDiscussion}/${newMessageKey}`), message)
      .then(() => {
        set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), null);
        setInputText("");
        setLocation(null);
        setFile(null);
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to send the message.");
      });
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

        {item.file && item.file.includes('http') && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.file }} style={styles.image} />
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
          <TouchableOpacity onPress={sendFile} style={styles.iconButton}>
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
  seenText: {
    color: "#28A745",  // Green color for "Seen"
    fontSize: 12,
    marginTop: 5,
    alignSelf: "flex-end",
    fontWeight: 'bold',
    backgroundColor: '#f8f9fa', // Add a light background for better visibility
    padding: 5, // Add some padding to make the text stand out more
    borderRadius: 5, // Optional: rounded corners for the background
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
  },
  onlineIndicatorGreen: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5,
    backgroundColor: "#28A745",
    borderWidth: 1,
    borderColor: "#fff",
  },
  onlineIndicatorGray: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5,
    backgroundColor: "#6C757D",
    borderWidth: 1,
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
    width: 200,   // Limit the image width to avoid overflowing
    height: 200,  // Limit the image height to avoid large images
    borderRadius: 10,  // Optional: Adds rounded corners to the image
  },
});
