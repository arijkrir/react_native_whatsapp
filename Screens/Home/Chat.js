import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Button,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import * as Location from "expo-location";
import firebase from "../../Config/Index";
import Icon from "react-native-vector-icons/FontAwesome";
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native';


const database = firebase.database();
const ref_lesMessage = database.ref("Discussions");

export default function Chat(props) {
  const { currentUser, secondUser } = props.route.params;

  const iddisc =
    currentUser.id > secondUser.id
      ? currentUser.id + secondUser.id
      : secondUser.id + currentUser.id;

  const ref_unedisc = ref_lesMessage.child(iddisc);

  const [data, setData] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userTyping, setUserTyping] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isOnline, setIsOnline] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false); // State to control the visibility of the bubble

  const ref_currentistyping = ref_unedisc.child(`${currentUser.id}isTyping`);

  useEffect(() => {
    const listener = ref_unedisc.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((message) => {
        d.push(message.val());
      });
      setData(d);
    });

    return () => ref_unedisc.off("value", listener);
  }, []);

  useEffect(() => {
    const ref_online = database.ref(`lesprofiles/${secondUser.id}/isOnline`);

    const listener = ref_online.on("value", (snapshot) => {
      setIsOnline(snapshot.val() === true);
    });

    return () => ref_online.off("value", listener);
  }, [secondUser.id]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: userTyping ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [userTyping]);

  const sendMessage = (messageContent, type = "text") => {
    if (!messageContent.trim() && type === "text") return;

    const key = ref_unedisc.push().key;
    const ref_unmessage = ref_unedisc.child(key);

    ref_unmessage
      .set({
        body: messageContent,
        time: new Date().toLocaleString(),
        sender: currentUser.id,
        receiver: secondUser.id,
        type,
      })
      .then(() => {
        if (type === "text") setNewMessage("");
      })
      .catch((error) => {
        console.error("Error sending message: ", error);
      });

    handleBlur();
  };

  const handleFocus = () => {
    ref_currentistyping.set(true);
    setUserTyping(true);
  };

  const handleBlur = () => {
    ref_currentistyping.set(false);
    setUserTyping(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      sendMessage(result.assets[0].uri, "image");
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
    });

    if (result.type === "success") {
      sendMessage(result.uri, "file");
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission d'enregistrement refusée.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        sendMessage(uri, "audio");
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const sendLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission pour accéder à la localisation refusée.");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const locationMessage = `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
    sendMessage(locationMessage, "location");
  };

  const toggleBubble = () => {
    setIsBubbleVisible(!isBubbleVisible); // Toggle the visibility of the bubble
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <View style={styles.profilePictureContainer}>
                {secondUser.urlImage ? (
                  <Image
                    source={{ uri: secondUser.urlImage }}
                    style={styles.profilePicture}
                  />
                ) : (
                  <View style={styles.profilePicture}>
                    <Text style={styles.profileText}>
                      {secondUser.nom ? secondUser.nom[0] : ""}
                    </Text>
                  </View>
                )}
                {isOnline && <View style={styles.onlineIndicator} />}
              </View>
              <View>
                <Text style={styles.headerText}>
                  {secondUser.nom} {secondUser.pseudo}
                </Text>
                <Text style={styles.statusText}>
                  {isOnline ? "En ligne" : "Hors ligne"}
                </Text>
              </View>
            </View>
            <View style={styles.callIcons}>
              <TouchableOpacity onPress={() => alert("Appel vocal...")}>
                <Icon name="phone" style={styles.callIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alert("Appel vidéo...")}>
                <Icon name="video-camera" style={styles.callIcon} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={data}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageContainer,
                  item.sender === currentUser.id
                    ? styles.messageSent
                    : styles.messageReceived,
                ]}
              >
                {item.type === "text" && <Text style={styles.messageText}>{item.body}</Text>}
                {item.type === "image" && (
                  <Image
                    source={{ uri: item.body }}
                    style={styles.messageImage}
                    resizeMode="contain"
                  />
                )}
                {item.type === "file" && (
                  <Text style={styles.messageFile}>Fichier : {item.body}</Text>
                )}
                {item.type === "audio" && (
                  <Text style={styles.messageAudio}>Message audio envoyé</Text>
                )}
                {item.type === "location" && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(item.body)}
                    style={styles.messageLocation}
                  >
                    <Text style={styles.messageLocationText}>Voir la localisation</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.messageTime}>{item.time}</Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.messagesContainer}
          />

          <View style={styles.typingIndicator}>
            {userTyping && (
              <Animated.Text style={[styles.typingText, { opacity: fadeAnim }]}>
                {secondUser.nom} est en train d’écrire...
              </Animated.Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Écrire un message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={4}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <Button onPress={() => sendMessage(newMessage)} title="Envoyer" />

            {/* Bubble button */}
            <TouchableOpacity onPress={toggleBubble}>
              <Icon name="plus" style={styles.icon} />
            </TouchableOpacity>

            {/* Bubble with icons */}
            {isBubbleVisible && (
              <View style={styles.bubbleContainer}>
                <TouchableOpacity onPress={pickImage}>
                  <Icon name="image" style={styles.bubbleIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={pickFile}>
                  <Icon name="paperclip" style={styles.bubbleIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording}>
                  <Icon name="microphone" style={styles.bubbleIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={sendLocation}>
                  <Icon name="location-arrow" style={styles.bubbleIcon} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 10,
    backgroundColor: "#007BFF",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePictureContainer: {
    position: "relative",
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    marginTop: 10,
  },
  profileText: {
    fontSize: 18,
    color: "#007BFF",
    fontWeight: "bold",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "green",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
  },
  callIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginTop: 10,
  },
  callIcon: {
    fontSize: 25,
    color: "#fff",
    marginLeft: 25,
  },
  messagesContainer: {
    paddingVertical: 10,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: "75%",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  messageSent: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  messageReceived: {
    backgroundColor: "#fff",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
  },
  typingIndicator: {
    marginVertical: 5,
    alignItems: "center",
  },
  typingText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    backgroundColor: "#f9f9f9",
    maxHeight: 100,
  },
  icon: {
    fontSize: 24,
    color: "#007BFF",
    marginLeft: 10,
  },
  bubbleContainer: {
    position: "absolute",
    bottom: 55,
    right:0,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: 200,
    zIndex: 1,
  },
  bubbleIcon: {
    fontSize: 20,
    color: "#007BFF",
    marginHorizontal: 10,
  },
});
