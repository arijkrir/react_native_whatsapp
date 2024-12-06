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
} from "react-native";
import firebase from "../../Config/Index";
import Icon from "react-native-vector-icons/FontAwesome";

const database = firebase.database();
const ref_lesMessage = database.ref("Discussions");

export default function Chat(props) {
  const currentUser = props.route.params.currentUser;
  const secondUser = props.route.params.secondUser;

  const iddisc =
    currentUser.id > secondUser.id
      ? currentUser.id + secondUser.id
      : secondUser.id + currentUser.id;

  const ref_unedisc = ref_lesMessage.child(iddisc);

  const [data, setData] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userTyping, setUserTyping] = useState(false); // L'autre utilisateur tape
  const [isTyping, setIsTyping] = useState(false); // Statut "is typing..." pour l'utilisateur actuel

  // Charger les messages
  useEffect(() => {
    if (!currentUser || !secondUser) {
      console.error("User data is missing!");
      return;
    }

    const listener = ref_unedisc.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((message) => {
        d.push(message.val());
      });
      setData(d);
    });

    return () => ref_unedisc.off("value", listener);
  }, [currentUser, secondUser]);

  // Écoute du statut "is typing..."
  useEffect(() => {
    const typingRef = ref_unedisc.child("isTyping");
    const typingListener = typingRef.on("value", (snapshot) => {
      setUserTyping(snapshot.val() === currentUser.id ? false : snapshot.val() === secondUser.id);
    });

    return () => typingRef.off("value", typingListener);
  }, [currentUser.id, secondUser.id, ref_unedisc]);

  // Envoyer un message
  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const key = ref_unedisc.push().key;
    const ref_unmessage = ref_unedisc.child(key);

    ref_unmessage
      .set({
        body: newMessage,
        time: new Date().toLocaleString(),
        sender: currentUser.id,
        receiver: secondUser.id,
      })
      .then(() => {
        setNewMessage(""); // Réinitialiser le message
      })
      .catch((error) => {
        console.error("Error sending message: ", error);
      });

    handleBlur(); // Arrêter "is typing..." après l'envoi
  };

  // Handle "is typing..." events
  const handleFocus = () => {
    const typingRef = ref_unedisc.child("isTyping");
    typingRef.set(currentUser.id); // Marque que l'utilisateur actuel tape
    setIsTyping(true);
  };

  const handleBlur = () => {
    const typingRef = ref_unedisc.child("isTyping");
    typingRef.set(null); // Supprime le statut "is typing"
    setIsTyping(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileText}>{secondUser.nom ? secondUser.nom[0] : ""}</Text>
          </View>
          <View>
            <Text style={styles.headerText}>{secondUser.nom ? secondUser.nom : ""}</Text>
            <Text style={styles.statusText}>Last seen today at 3:00 PM</Text>
          </View>
        </View>

        <View style={styles.callIcons}>
          <TouchableOpacity onPress={() => console.log("Voice Call pressed")}>
            <Icon name="phone" style={styles.callIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Video Call pressed")}>
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
              item.sender === currentUser.id ? styles.messageSent : styles.messageReceived,
            ]}
          >
            <Text style={styles.messageText}>{item.body ? item.body : ""}</Text>
            <Text style={styles.messageTime}>{item.time ? item.time : ""}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={<View style={{ padding: 10 }} />}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Typing Indicator */}
      <View style={styles.typingIndicator}>
        {userTyping && <Text style={styles.typingText}>{secondUser.nom} est en train d'écrire...</Text>}
      </View>

      {/* Input Area */}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 15,
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
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  profileText: {
    fontSize: 18,
    color: "#007BFF",
    fontWeight: "bold",
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
  },
  callIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  callIcon: {
    fontSize: 25,
    color: "#fff",
    marginLeft: 23,
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
