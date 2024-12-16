import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ImageBackground,
  Alert,
} from "react-native";
import { Ionicons } from "react-native-vector-icons";
import firebase from "../../Config/Index";

const database = firebase.database();
const ref_groupes = database.ref("Groupes");
const ref_profiles = database.ref("lesprofiles");

export default function Groupe(props) {
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // State to handle edit group modal
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null); // State to track which group is being edited
  const [newGroupName, setNewGroupName] = useState(""); // For updating group name
  const currentid = firebase.auth().currentUser.uid;

  useEffect(() => {
    // Charger la liste des groupes
    const groupListener = ref_groupes.on("value", (snapshot) => {
      const groupes = [];
      snapshot.forEach((group) => {
        const groupData = { ...group.val(), id: group.key };
        // Vérifier si l'utilisateur fait partie des membres du groupe
        if (groupData.members.includes(currentid)) {
          groupes.push(groupData);
        }
      });
      setGroups(groupes);
    });

    // Charger la liste des profils
    const profileListener = ref_profiles.on("value", (snapshot) => {
      const users = [];
      snapshot.forEach((profile) => {
        if (profile.val().id !== currentid) {
          users.push({ ...profile.val(), id: profile.key });
        }
      });
      setProfiles(users);
    });

    return () => {
      ref_groupes.off("value", groupListener);
      ref_profiles.off("value", profileListener);
    };
  }, [currentid]);

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const createGroup = () => {
    if (groupName.trim() === "" || selectedUsers.length === 0) {
      alert("Veuillez entrer un nom de groupe et sélectionner des utilisateurs.");
      return;
    }

    const groupRef = ref_groupes.push();
    groupRef.set({
      name: groupName,
      members: [currentid, ...selectedUsers],
    });

    alert("Groupe créé avec succès !");
    setGroupName("");
    setSelectedUsers([]);
    setShowModal(false);
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() =>
        props.navigation.navigate("ChatGroup", {
          groupId: item.id,
          groupName: item.name,
          members: item.members,
        })
      }
    >
      <Text style={styles.groupName}>{item.name}</Text>
      <Ionicons name="chevron-forward-outline" size={24} color="#FFF" />
      
      {/* Edit and Delete Options */}
      <TouchableOpacity onPress={() => handleEditGroup(item)}>
        <Ionicons name="create-outline" size={20} color="#FFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteGroup(item.id)}>
        <Ionicons name="trash-bin-outline" size={20} color="#FF3E4D" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userItem, selectedUsers.includes(item.id) && styles.selectedUser]}
      onPress={() => toggleUserSelection(item.id)}
    >
      <Text style={[styles.userName, selectedUsers.includes(item.id) && styles.selectedUserText]}>
        {item.nom}
      </Text>
    </TouchableOpacity>
  );

  const handleEditGroup = (group) => {
    setEditingGroupId(group.id);
    setNewGroupName(group.name);
    setShowEditModal(true);
  };

  const handleUpdateGroupName = () => {
    if (newGroupName.trim() === "") {
      alert("Veuillez entrer un nouveau nom pour le groupe.");
      return;
    }

    const groupRef = ref_groupes.child(editingGroupId);
    groupRef.update({
      name: newGroupName,
    });

    alert("Nom du groupe mis à jour !");
    setShowEditModal(false);
    setNewGroupName("");
  };

  const handleDeleteGroup = (groupId) => {
    Alert.alert(
      "Supprimer le groupe",
      "Êtes-vous sûr de vouloir supprimer ce groupe ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          onPress: () => {
            const groupRef = ref_groupes.child(groupId);
            groupRef.remove();
            alert("Groupe supprimé avec succès !");
          },
        },
      ]
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/images.jpeg")} // Remplacez par votre image
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Groupes</Text>
          <Ionicons
            name="add-circle-outline"
            size={30}
            color="#FFF"
            onPress={() => setShowModal(true)}
          />
        </View>

        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun groupe disponible.</Text>
          }
        />

        {/* Modal for Creating Group */}
        <Modal visible={showModal} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Créer un groupe</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom du groupe"
              value={groupName}
              onChangeText={setGroupName}
            />

            <FlatList
              data={profiles}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
            />

            <TouchableOpacity style={styles.createButton} onPress={createGroup}>
              <Text style={styles.createButtonText}>Créer le groupe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close-circle-outline" size={30} color="#FF3E4D" />
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Modal for Editing Group */}
        <Modal visible={showEditModal} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Modifier le nom du groupe</Text>

            <TextInput
              style={styles.input}
              placeholder="Nouveau nom du groupe"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <TouchableOpacity style={styles.createButton} onPress={handleUpdateGroupName}>
              <Text style={styles.createButtonText}>Mettre à jour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close-circle-outline" size={30} color="#FF3E4D" />
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#007BFF",
    borderRadius: 15,
    marginTop:20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  groupCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    marginVertical: 8,
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#003366",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F9FAFB",
    marginBottom: 20,
  },
  userItem: {
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  selectedUser: {
    backgroundColor: "#007BFF",
  },
  userName: {
    fontSize: 16,
    color: "#333",
  },
  selectedUserText: {
    color: "#fff",
  },
  createButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    alignSelf: "center",
    marginTop: 20,
  },
});
