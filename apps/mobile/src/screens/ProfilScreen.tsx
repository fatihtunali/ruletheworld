import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function ProfilScreen() {
  const kullanici = useAuthStore((state) => state.kullanici);
  const cikis = useAuthStore((state) => state.cikis);

  const handleCikis = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: cikis,
        },
      ]
    );
  };

  if (!kullanici) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {kullanici.kullaniciAdi.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.kullaniciAdi}>{kullanici.kullaniciAdi}</Text>
        <Text style={styles.email}>{kullanici.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{kullanici.toplamPuan}</Text>
          <Text style={styles.statLabel}>Toplam Puan</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{kullanici.oynananOyunlar}</Text>
          <Text style={styles.statLabel}>Oynanan</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{kullanici.tamamlananOyunlar}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Profili Düzenle</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Şifre Değiştir</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Bildirim Ayarları</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium</Text>

        <TouchableOpacity style={styles.premiumCard}>
          <View>
            <Text style={styles.premiumTitle}>Premium'a Geç</Text>
            <Text style={styles.premiumDesc}>
              Özel avantajlar ve ekstra özellikler
            </Text>
          </View>
          <Text style={styles.premiumArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diğer</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Yardım & Destek</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Gizlilik Politikası</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Uygulama Hakkında</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cikisButton} onPress={handleCikis}>
        <Text style={styles.cikisText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Versiyon 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  kullaniciAdi: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#4b5563',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  premiumCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  premiumDesc: {
    fontSize: 12,
    color: '#e9d5ff',
    marginTop: 2,
  },
  premiumArrow: {
    fontSize: 24,
    color: '#fff',
  },
  cikisButton: {
    marginHorizontal: 20,
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cikisText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    padding: 40,
  },
  version: {
    fontSize: 12,
    color: '#6b7280',
  },
});
