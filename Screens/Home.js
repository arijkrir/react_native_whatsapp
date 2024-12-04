import React from "react";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import { Ionicons } from "react-native-vector-icons"; // Importer les icônes
import ListProfile from "./Home/ListProfile";
import Groupe from "./Home/Groupe";
import MyProfile from "./Home/MyProfile";

const Tab = createMaterialBottomTabNavigator();

export default function Home(props) {
  const currentid = props.route.params.currentid;
  return (
    <Tab.Navigator
      activeColor="#fff"
      inactiveColor="#ccc"
      barStyle={{ backgroundColor: "#003366" }}
    >
      <Tab.Screen
        name="ListProfile"
        component={ListProfile}
        initialParams={{ currentid: currentid }}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={27} color={color} /> // Icône de profil
          ),
        }}
      />
      <Tab.Screen
        name="Groupe"
        component={Groupe}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={27} color={color} /> // Icône de groupe
          ),
        }}
      />
      <Tab.Screen
        name="MyProfile"
        component={MyProfile}
        initialParams={{ currentid: currentid }}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={27} color={color} /> // Icône de profil personnel
          ),
        }}
      />
    </Tab.Navigator>
  );
}
