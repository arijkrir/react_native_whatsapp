import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  Linking,
  ImageBackground,
} from "react-native";
import firebase from "../../Config/Index";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ListProfile(props) {
  const [data, setData] = useState([]);
  const navigation = useNavigation();
  const database = firebase.database();
  const ref_lesprofils = database.ref("lesprofiles");
  const currentid = props.route.params.currentid;

  useEffect(() => {
    const listener = ref_lesprofils.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((unprofil) => {
        if (unprofil.val().id !== currentid) d.push(unprofil.val());
      });
      setData(d);
    });
    return () => {
      ref_lesprofils.off("value", listener);
    };
  }, []);

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      alert("Ce profil n'a pas de numéro de téléphone.");
      return;
    }
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (!supported) {
          alert("Impossible d'effectuer l'appel.");
        } else {
          return Linking.openURL(phoneUrl); // Launch the call
        }
      })
      .catch(() => alert("Une erreur est survenue."));
  };

  return (
    <ImageBackground
      source={require("../../assets/images.jpeg")} // Set the background image
      style={styles.backgroundImage} // Style the background image
    >
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.textstyle}>Liste des profils</Text>
        <FlatList
          data={data}
          renderItem={({ item }) => {
            // Ajouter un point vert ou gris basé sur l'état en ligne
            const onlineStatus = item.isOnline ? "green" : "gray";
            return (
              <View style={styles.profileContainer}>
                <View style={styles.profileImageContainer}>
                  <Image
                    source={
                      item.profileImage
                        ? { uri: item.profileImage }
                        : require("../../assets/profile.png")
                    }
                    style={styles.profileImage}
                  />
                  <View
                    style={[
                      styles.onlineIndicator,
                      { backgroundColor: onlineStatus },
                    ]}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {item.nom} {item.pseudo}
                  </Text>
                </View>
                <View style={styles.iconsContainer}>
                  {item.telephone && (
                    <TouchableOpacity onPress={() => handleCall(item.telephone)}>
                      <Ionicons
                        name="call-outline"
                        size={28}
                        color="#07f"
                        style={styles.icon}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate("Chat", {
                        profile: item,
                        currentId: currentid,
                      });
                    }}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={28}
                      color="#07f"
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
          style={styles.flatListContainer}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1, // Ensures the image covers the full screen
    resizeMode: "cover", // Keeps the aspect ratio of the image
    justifyContent: "center", // Centers content vertically if needed
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  textstyle: {
    fontSize: 36,
    fontFamily: "serif",
    color: "#003366",
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 20,
    textAlign: "center",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background for readability
    padding: 12,
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "#fff", // White border for better visibility
  },
  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: 60,
    marginLeft: 10, // Add a little space between the icons and the profile name
  },
  icon: {
    marginHorizontal: 6, // Reduced the margin to bring the icons closer together
    padding: 5,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    shadowColor: "#ccc",
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 5,
  },
  flatListContainer: {
    width: "100%",
  },
});
