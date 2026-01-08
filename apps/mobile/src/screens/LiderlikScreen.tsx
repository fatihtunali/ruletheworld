import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { siralamaApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

type SiralamaGirisi = {
  sira: number;
  oyuncu: {
    id: string;
    kullaniciAdi: string;
  };
  puan: number;
  oynananOyun: number;
};

type SiralamaTipi = 'genel' | 'haftalik' | 'sezonluk';

export default function LiderlikScreen() {
  const kullanici = useAuthStore((state) => state.kullanici);
  const [siralama, setSiralama] = useState<SiralamaGirisi[]>([]);
  const [tip, setTip] = useState<SiralamaTipi>('genel');
  const [yukleniyor, setYukleniyor] = useState(true);

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      let response;
      switch (tip) {
        case 'haftalik':
          response = await siralamaApi.haftalik();
          break;
        case 'sezonluk':
          response = await siralamaApi.sezonluk();
          break;
        default:
          response = await siralamaApi.genel();
      }
      setSiralama(response.data || []);
    } catch (error) {
      console.error('Sıralama yükleme hatası:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    verileriYukle();
  }, [tip]);

  const renderSiraItem = ({ item }: { item: SiralamaGirisi }) => {
    const benMiyim = item.oyuncu.id === kullanici?.id;

    return (
      <View style={[styles.siraItem, benMiyim && styles.siraItemBen]}>
        <View style={styles.siraNumara}>
          <Text
            style={[
              styles.siraText,
              item.sira <= 3 && styles.siraTextTop,
            ]}
          >
            {item.sira}
          </Text>
        </View>
        <View style={styles.oyuncuInfo}>
          <Text style={[styles.oyuncuAdi, benMiyim && styles.oyuncuAdiBen]}>
            {item.oyuncu.kullaniciAdi}
            {benMiyim && ' (Sen)'}
          </Text>
          <Text style={styles.oyunSayisi}>
            {item.oynananOyun} oyun
          </Text>
        </View>
        <Text style={styles.puan}>{item.puan}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Liderlik Tablosu</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tip === 'genel' && styles.tabButtonActive]}
          onPress={() => setTip('genel')}
        >
          <Text
            style={[styles.tabText, tip === 'genel' && styles.tabTextActive]}
          >
            Genel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tip === 'haftalik' && styles.tabButtonActive]}
          onPress={() => setTip('haftalik')}
        >
          <Text
            style={[styles.tabText, tip === 'haftalik' && styles.tabTextActive]}
          >
            Haftalık
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tip === 'sezonluk' && styles.tabButtonActive]}
          onPress={() => setTip('sezonluk')}
        >
          <Text
            style={[styles.tabText, tip === 'sezonluk' && styles.tabTextActive]}
          >
            Sezon
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={siralama}
        renderItem={renderSiraItem}
        keyExtractor={(item) => item.oyuncu.id}
        refreshControl={
          <RefreshControl
            refreshing={yukleniyor}
            onRefresh={verileriYukle}
            tintColor="#7c3aed"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {yukleniyor ? 'Yükleniyor...' : 'Henüz sıralama yok'}
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#7c3aed',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  siraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  siraItemBen: {
    backgroundColor: '#4c1d95',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  siraNumara: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siraText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  siraTextTop: {
    color: '#fbbf24',
  },
  oyuncuInfo: {
    flex: 1,
  },
  oyuncuAdi: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  oyuncuAdiBen: {
    color: '#a78bfa',
  },
  oyunSayisi: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  puan: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7c3aed',
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
