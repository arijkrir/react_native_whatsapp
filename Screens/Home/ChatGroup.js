import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import firebase from "../../Config/Index";

const database = firebase.database();

export default function ChatGroup({ route }) {
  const { groupId, groupName, members } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const currentid = firebase.auth().currentUser.uid;

  useEffect(() => {
    const messagesRef = database.ref(`GroupMessages/${groupId}`);
    const listener = messagesRef.on("value", (snapshot) => {
      const msgs = [];
      snapshot.forEach((msg) => msgs.push({ ...msg.val(), id: msg.key }));
      setMessages(msgs);
    });

    return () => messagesRef.off("value", listener);
  }, [groupId]);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    const messagesRef = database.ref(`GroupMessages/${groupId}`);
    messagesRef.push({
      sender: currentid,
      text: newMessage,
      timestamp: Date.now(),
    });
    setNewMessage("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{groupName}</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.sender === currentid ? styles.myMessage : styles.otherMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    padding: 15,
    backgroundColor: "#007BFF",
    color: "#FFF",
  },
  message: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007BFF",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E0E0E0",
  },
  messageText: {
    color: "#FFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#FFF",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 10,
  },
  sendButtonText: {
    color: "#FFF",
  },
});
