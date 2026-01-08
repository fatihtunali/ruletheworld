import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';

// Screens
import GirisScreen from '../screens/GirisScreen';
import KayitScreen from '../screens/KayitScreen';
import AnaSayfaScreen from '../screens/AnaSayfaScreen';
import LiderlikScreen from '../screens/LiderlikScreen';
import ProfilScreen from '../screens/ProfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1f2937',
          borderTopColor: '#374151',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="AnaSayfa"
        component={AnaSayfaScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tab.Screen
        name="Liderlik"
        component={LiderlikScreen}
        options={{
          tabBarLabel: 'Liderlik',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { backgroundColor: color }]} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack for non-authenticated users
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Giris" component={GirisScreen} />
      <Stack.Screen name="Kayit" component={KayitScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const [hazir, setHazir] = useState(false);
  const girisYapildi = useAuthStore((state) => state.girisYapildi);
  const yukleniyor = useAuthStore((state) => state.yukleniyor);
  const tokenKontrol = useAuthStore((state) => state.tokenKontrol);

  useEffect(() => {
    const init = async () => {
      await tokenKontrol();
      setHazir(true);
    };
    init();
  }, []);

  if (!hazir || yukleniyor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {girisYapildi ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          {/* Add more screens here as needed */}
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  tabIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
