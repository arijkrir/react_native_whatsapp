import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Auth from './Screens/Auth';
import NewUser from './Screens/NewUser';
import Home from './Screens/Home';
import Chat from './Screens/Home/Chat';
import ChatGroup from './Screens/Home/ChatGroup';
import MyProfile from './Screens/Home/MyProfile';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={Auth} />
        <Stack.Screen name="NewUser" component={NewUser} options={{ headerShown: true }} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="ChatGroup" component={ChatGroup} />
        <Stack.Screen name="MyProfile" component={MyProfile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
