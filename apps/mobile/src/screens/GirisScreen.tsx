import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function GirisScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const giris = useAuthStore((state) => state.giris);

  const handleGiris = async () => {
    if (!email.trim() || !sifre.trim()) {
      Alert.alert('Hata', 'Email ve şifre gereklidir');
      return;
    }

    setYukleniyor(true);
    try {
      await giris(email, sifre);
    } catch (error: any) {
      Alert.alert(
        'Giriş Başarısız',
        error.response?.data?.message || 'Bir hata oluştu'
      );
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Haydi Hep Beraber</Text>
        <Text style={styles.subtitle}>Topluluk yönetim oyunu</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={sifre}
            onChangeText={setSifre}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />

          <TouchableOpacity
            style={[styles.button, yukleniyor && styles.buttonDisabled]}
            onPress={handleGiris}
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Kayit')}
          >
            <Text style={styles.linkText}>
              Hesabın yok mu? <Text style={styles.linkBold}>Kayıt ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    padding: 12,
  },
  linkText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  linkBold: {
    color: '#7c3aed',
    fontWeight: '600',
  },
});
