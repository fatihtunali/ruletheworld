import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { oyunApi, istatistikApi } from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Lobi = {
  id: string;
  isim: string;
  durum: string;
  oyuncuSayisi: number;
  maxOyuncu: number;
  oyunModu: string;
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AnaSayfaScreen({ navigation }: Props) {
  const kullanici = useAuthStore((state) => state.kullanici);
  const [lobiler, setLobiler] = useState<Lobi[]>([]);
  const [istatistikler, setIstatistikler] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  const verileriYukle = async () => {
    try {
      const [lobiResponse, istatistikResponse] = await Promise.all([
        oyunApi.lobiler(),
        istatistikApi.genel(),
      ]);
      setLobiler(lobiResponse.data.lobiler || []);
      setIstatistikler(istatistikResponse.data);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setYukleniyor(false);
      setYenileniyor(false);
    }
  };

  useEffect(() => {
    verileriYukle();
  }, []);

  const lobiKatil = async (lobi: Lobi) => {
    try {
      await oyunApi.lobiKatil(lobi.id);
      Alert.alert('Başarılı', `${lobi.isim} lobisine katıldınız!`);
      navigation.navigate('Oyun', { toplulukId: lobi.id });
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Lobiye katılınamadı');
    }
  };

  const renderLobi = ({ item }: { item: Lobi }) => (
    <TouchableOpacity
      style={styles.lobiCard}
      onPress={() => lobiKatil(item)}
    >
      <View style={styles.lobiHeader}>
        <Text style={styles.lobiIsim}>{item.isim}</Text>
        <View style={[styles.durumBadge, { backgroundColor: item.durum === 'LOBI' ? '#22c55e' : '#f59e0b' }]}>
          <Text style={styles.durumText}>
            {item.durum === 'LOBI' ? 'Bekliyor' : 'Devam Ediyor'}
          </Text>
        </View>
      </View>
      <View style={styles.lobiInfo}>
        <Text style={styles.lobiMod}>{item.oyunModu || 'NORMAL'}</Text>
        <Text style={styles.lobiOyuncu}>
          {item.oyuncuSayisi}/{item.maxOyuncu} oyuncu
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.hosgeldin}>Hoş geldin,</Text>
        <Text style={styles.kullaniciAdi}>{kullanici?.kullaniciAdi}</Text>
      </View>

      {/* Stats */}
      {istatistikler && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{istatistikler.toplamOyuncu || 0}</Text>
            <Text style={styles.statLabel}>Oyuncu</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{istatistikler.aktifOyun || 0}</Text>
            <Text style={styles.statLabel}>Aktif Oyun</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{kullanici?.toplamPuan || 0}</Text>
            <Text style={styles.statLabel}>Puanın</Text>
          </View>
        </View>
      )}

      {/* Create Lobby Button */}
      <TouchableOpacity
        style={styles.olusturButton}
        onPress={() => navigation.navigate('LobiOlustur')}
      >
        <Text style={styles.olusturButtonText}>+ Yeni Lobi Oluştur</Text>
      </TouchableOpacity>

      {/* Lobbies List */}
      <Text style={styles.sectionTitle}>Açık Lobiler</Text>
      <FlatList
        data={lobiler}
        renderItem={renderLobi}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={yenileniyor}
            onRefresh={() => {
              setYenileniyor(true);
              verileriYukle();
            }}
            tintColor="#7c3aed"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {yukleniyor ? 'Yükleniyor...' : 'Henüz açık lobi yok'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  hosgeldin: {
    fontSize: 16,
    color: '#9ca3af',
  },
  kullaniciAdi: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  olusturButton: {
    marginHorizontal: 20,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  olusturButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  lobiCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  lobiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lobiIsim: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  durumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durumText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  lobiInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lobiMod: {
    fontSize: 14,
    color: '#9ca3af',
  },
  lobiOyuncu: {
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
});
