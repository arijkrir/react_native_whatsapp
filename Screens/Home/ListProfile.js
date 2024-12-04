import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import firebase from "../../Config/Index";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ListProfile() {
  const [data, setData] = useState([]);
  const navigation = useNavigation();
  const database = firebase.database();
  const ref_lesprofils = database.ref("lesprofils");

  useEffect(() => {
    const listener = ref_lesprofils.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((unprofil) => {
        d.push(unprofil.val());
      });
      setData(d);
    });
    return () => ref_lesprofils.off("value", listener);
  }, []);

  return (
    <ImageBackground source={require("../../assets/images.jpeg")} style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.textstyle}>Liste des profils</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={styles.profileContainer}>
            <Image
              source={item.photo ? { uri: item.photo } : require("../../assets/profile.png")}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{item.nom} {item.pseudo}</Text>
            </View>
            <View style={styles.iconsContainer}>
              <TouchableOpacity onPress={() => alert(`Appel vers ${item.nom}`)}>
                <Ionicons name="call-outline" size={24} color="#07f" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Chat", {
                    currentUser: { id: currentid, nom: "Utilisateur actuel" },
                    secondUser: item,
                  })
                }
              >
                <Ionicons name="chatbubbles-outline" size={24} color="#07f" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id} // Clé unique pour chaque profil
        style={styles.flatListContainer}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textstyle: {
    fontSize: 40,
    fontFamily: "serif",
    color: "#003366",
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  iconsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 70,
    marginRight: 20,
  },
  flatListContainer: {
    backgroundColor: "#fff4",
    width: "95%",
  },
});
