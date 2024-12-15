import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView 
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import firebase from "../../Config/Index";

const database = firebase.database();

export default function ChatGroup({ route }) {
  const { groupId, groupName, members } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
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

  const initiateVoiceCall = () => {
    console.log("Voice call initiated");
    // Placeholder for voice call functionality
  };

  const initiateVideoCall = () => {
    console.log("Video call initiated");
    // Placeholder for video call functionality
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{groupName}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={initiateVoiceCall} style={styles.iconButton}>
            <Icon name="call" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={initiateVideoCall} style={styles.iconButton}>
            <Icon name="videocam" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMembers(true)} style={styles.iconButton}>
            <Icon name="group" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
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

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Members Modal */}
      <Modal visible={showMembers} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Membres du groupe</Text>
            <ScrollView>
              {members.map((member, index) => (
                <Text key={index} style={styles.memberText}>
                  {member}
                </Text>
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
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#007BFF",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    marginHorizontal: 5,
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
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  memberText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
