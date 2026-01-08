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
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function KayitScreen({ navigation }: Props) {
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const kayit = useAuthStore((state) => state.kayit);

  const handleKayit = async () => {
    if (!kullaniciAdi.trim() || !email.trim() || !sifre.trim()) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    if (sifre !== sifreTekrar) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (sifre.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    setYukleniyor(true);
    try {
      await kayit(kullaniciAdi, email, sifre);
    } catch (error: any) {
      Alert.alert(
        'Kayıt Başarısız',
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Maceraya katıl!</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              value={kullaniciAdi}
              onChangeText={setKullaniciAdi}
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />

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

            <TextInput
              style={styles.input}
              placeholder="Şifre Tekrar"
              value={sifreTekrar}
              onChangeText={setSifreTekrar}
              secureTextEntry
              placeholderTextColor="#9ca3af"
            />

            <TouchableOpacity
              style={[styles.button, yukleniyor && styles.buttonDisabled]}
              onPress={handleKayit}
              disabled={yukleniyor}
            >
              {yukleniyor ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>
                Zaten hesabın var mı? <Text style={styles.linkBold}>Giriş yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  scrollContent: {
    flexGrow: 1,
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
