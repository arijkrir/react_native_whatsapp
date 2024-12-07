import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import firebase from "../../Config/Index";
import Icon from "react-native-vector-icons/FontAwesome";

const database = firebase.database();
const ref_lesMessage = database.ref("Discussions");

export default function Chat(props) {
  const { currentUser, secondUser } = props.route.params;

  // Création de l'ID de discussion basé sur l'ID des deux utilisateurs
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

  // Charger les messages
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

  // Vérifier si le second utilisateur est en ligne
  useEffect(() => {
    const ref_online = database.ref(`lesprofiles/${secondUser.id}/isOnline`);

    const listener = ref_online.on("value", (snapshot) => {
      setIsOnline(snapshot.val() === true);
    });

    return () => ref_online.off("value", listener);
  }, [secondUser.id]);

  // Animation pour "is typing..."
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: userTyping ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [userTyping]);

  // Envoyer un message
  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const key = ref_unedisc.push().key;
    const ref_unmessage = ref_unedisc.child(key);

    ref_unmessage
      .set({
        body: newMessage,
        time: new Date().toLocaleString(),
        sender: currentUser.id,  // Utilisation de l'ID de l'utilisateur actuel
        receiver: secondUser.id,  // Utilisation de l'ID du second utilisateur
      })
      .then(() => {
        setNewMessage("");
      })
      .catch((error) => {
        console.error("Error sending message: ", error);
      });

    handleBlur();
  };

  // Gestion du statut "is typing..."
  const handleFocus = () => {
    const typingRef = ref_unedisc.child("isTyping");
    typingRef.set(currentUser.id);  // Indiquer que l'utilisateur actuel est en train d'écrire
    setUserTyping(true);
  };

  const handleBlur = () => {
    const typingRef = ref_unedisc.child("isTyping");
    typingRef.set(null);  // Effacer le statut "is typing"
    setUserTyping(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
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
                <Text style={styles.headerText}>{secondUser.nom} {secondUser.pseudo}</Text>
                <Text style={styles.statusText}>
                  {isOnline ? "En ligne" : "Hors ligne"}
                </Text>
              </View>
            </View>

            {/* Icônes d'appel vocal et vidéo */}
            <View style={styles.callIcons}>
              <TouchableOpacity onPress={() => alert("Appel vocal...")}>
                <Icon name="phone" style={styles.callIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alert("Appel vidéo...")}>
                <Icon name="video-camera" style={styles.callIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
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
                <Text style={styles.messageText}>{item.body}</Text>
                <Text style={styles.messageTime}>{item.time}</Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.messagesContainer}
          />

          {/* Typing Indicator */}
          <View style={styles.typingIndicator}>
            {userTyping && (
              <Animated.Text style={[styles.typingText, { opacity: fadeAnim }]}>
                {secondUser.nom} est en train d'écrire...
              </Animated.Text>
            )}
          </View>

          {/* Zone d'entrée */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Écrire un message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <Button onPress={sendMessage} title="Envoyer" />
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
    borderRadius: 25, // Cercle
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight:15,
    marginTop:10
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
    marginTop:10
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
  },
  callIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginRight:15,
    marginTop:10
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
  },
  messageSent: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  messageReceived: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
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
  },
});
