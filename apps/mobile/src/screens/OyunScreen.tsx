import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { io, Socket } from 'socket.io-client';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { toplulukId: string } }, 'params'>;
};

interface Kaynaklar {
  hazine: number;
  refah: number;
  istikrar: number;
  altyapi: number;
}

interface Oyuncu {
  id: string;
  kullaniciAdi: string;
  rol: string;
  hazir: boolean;
  bagli: boolean;
}

interface OlaySecenegi {
  id: string;
  baslik: string;
  aciklama: string;
  etkiler: Kaynaklar;
}

interface Olay {
  id: string;
  baslik: string;
  aciklama: string;
  tip: string;
  secenekler: OlaySecenegi[];
}

interface Oneri {
  id: string;
  onericiId: string;
  onericiAdi: string;
  baslik: string;
  aciklama: string;
  secenekId: string;
  oylar: { oyuncuId: string; secim: string }[];
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4001';
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:4001';

export default function OyunScreen({ navigation, route }: Props) {
  const { toplulukId } = route.params;
  const { token, kullanici } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [bagli, setBagli] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Oyun durumu
  const [durum, setDurum] = useState<string>('LOBI');
  const [asama, setAsama] = useState<string>('LOBI');
  const [mevcutTur, setMevcutTur] = useState(0);
  const [toplamTur, setToplamTur] = useState(6);
  const [kaynaklar, setKaynaklar] = useState<Kaynaklar>({ hazine: 50, refah: 50, istikrar: 50, altyapi: 50 });
  const [oyuncular, setOyuncular] = useState<Oyuncu[]>([]);
  const [mevcutOlay, setMevcutOlay] = useState<Olay | null>(null);
  const [oneriler, setOneriler] = useState<Oneri[]>([]);
  const [toplulukIsmi, setToplulukIsmi] = useState('');
  const [geriSayim, setGeriSayim] = useState<number | null>(null);

  // Öneri yapma
  const [secilenSecenek, setSecilenSecenek] = useState<string | null>(null);
  const [oneriAciklama, setOneriAciklama] = useState('');

  // Socket bağlantısı
  useEffect(() => {
    const newSocket = io(WS_URL, {
      auth: { token },
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setBagli(true);
      newSocket.emit('topluluga-katil', { toplulukId });
    });

    newSocket.on('disconnect', () => {
      setBagli(false);
    });

    newSocket.on('hata', (data: { mesaj: string }) => {
      Alert.alert('Hata', data.mesaj);
      setYukleniyor(false);
    });

    newSocket.on('topluluk-durumu', (data: any) => {
      setDurum(data.durum);
      setAsama(data.asama);
      setMevcutTur(data.mevcutTur || 0);
      setToplamTur(data.toplamTur || 6);
      setKaynaklar(data.kaynaklar || { hazine: 50, refah: 50, istikrar: 50, altyapi: 50 });
      setOyuncular(data.oyuncular || []);
      setMevcutOlay(data.mevcutOlay);
      setOneriler(data.oneriler || []);
      setToplulukIsmi(data.toplulukIsmi || '');
      setYukleniyor(false);
    });

    newSocket.on('oyuncu-katildi', (oyuncu: Oyuncu) => {
      setOyuncular((prev) => [...prev.filter((o) => o.id !== oyuncu.id), oyuncu]);
    });

    newSocket.on('hazirlik-guncellendi', (data: { oyuncuId: string; hazir: boolean }) => {
      setOyuncular((prev) =>
        prev.map((o) => (o.id === data.oyuncuId ? { ...o, hazir: data.hazir } : o))
      );
    });

    newSocket.on('geri-sayim-basladi', (data: { kalanSure: number }) => {
      setDurum('GERI_SAYIM');
      setGeriSayim(data.kalanSure);
    });

    newSocket.on('geri-sayim-guncellendi', (data: { kalanSure: number }) => {
      setGeriSayim(data.kalanSure);
    });

    newSocket.on('oyun-basladi', (data: { kaynaklar: Kaynaklar }) => {
      setDurum('DEVAM_EDIYOR');
      setAsama('TUR_BASI');
      setMevcutTur(1);
      setKaynaklar(data.kaynaklar);
      setGeriSayim(null);
    });

    newSocket.on('yeni-tur', (data: { tur: number; olay: Olay }) => {
      setMevcutTur(data.tur);
      setMevcutOlay(data.olay);
      setOneriler([]);
      setSecilenSecenek(null);
      setOneriAciklama('');
      setAsama('OLAY_ACILISI');
    });

    newSocket.on('tartisma-basladi', () => {
      setAsama('TARTISMA');
    });

    newSocket.on('yeni-oneri', (oneri: Oneri) => {
      setOneriler((prev) => [...prev.filter((o) => o.id !== oneri.id), oneri]);
    });

    newSocket.on('oylama-basladi', () => {
      setAsama('OYLAMA');
    });

    newSocket.on('oy-guncellendi', (data: { oneriId: string; oyuncuId: string; secim: string }) => {
      setOneriler((prev) =>
        prev.map((o) =>
          o.id === data.oneriId
            ? {
                ...o,
                oylar: [
                  ...o.oylar.filter((oy) => oy.oyuncuId !== data.oyuncuId),
                  { oyuncuId: data.oyuncuId, secim: data.secim },
                ],
              }
            : o
        )
      );
    });

    newSocket.on('tur-sonucu', (data: { yeniKaynaklar: Kaynaklar }) => {
      setKaynaklar(data.yeniKaynaklar);
      setAsama('TUR_SONU');
    });

    newSocket.on('oyun-bitti', (data: { sonuc: any }) => {
      setAsama('SONUC');
      setDurum('TAMAMLANDI');
      Alert.alert(
        'Oyun Bitti!',
        `Sonuç: ${data.sonuc?.durum || 'Bilinmiyor'}`,
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [toplulukId, token, navigation]);

  // Hazır ol
  const hazirOl = () => {
    socket?.emit('hazir-ol');
  };

  // Öneri gönder
  const oneriGonder = () => {
    if (!secilenSecenek) {
      Alert.alert('Hata', 'Bir seçenek seçin');
      return;
    }
    socket?.emit('oneri-gonder', { secenekId: secilenSecenek, aciklama: oneriAciklama });
    setSecilenSecenek(null);
    setOneriAciklama('');
  };

  // Oy ver
  const oyVer = (oneriId: string, secim: 'EVET' | 'HAYIR' | 'CEKIMSER') => {
    socket?.emit('oy-ver', { oneriId, secim });
  };

  // Kaynak gösterimi
  const KaynakBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={styles.kaynakItem}>
      <Text style={styles.kaynakLabel}>{label}</Text>
      <View style={styles.kaynakBarContainer}>
        <View style={[styles.kaynakBar, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.kaynakValue, { color }]}>{value}</Text>
    </View>
  );

  if (yukleniyor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Oyun yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.toplulukIsmi}>{toplulukIsmi}</Text>
          <Text style={styles.durumText}>
            {durum === 'LOBI' && 'Lobide Bekleniyor'}
            {durum === 'GERI_SAYIM' && `Başlıyor: ${geriSayim}sn`}
            {durum === 'DEVAM_EDIYOR' && `Tur ${mevcutTur}/${toplamTur}`}
            {durum === 'TAMAMLANDI' && 'Oyun Bitti'}
          </Text>
        </View>
        <View style={[styles.bagliDot, { backgroundColor: bagli ? '#22c55e' : '#ef4444' }]} />
      </View>

      {/* Kaynaklar */}
      <View style={styles.kaynaklar}>
        <KaynakBar label="Hazine" value={kaynaklar.hazine} color="#eab308" />
        <KaynakBar label="Refah" value={kaynaklar.refah} color="#22c55e" />
        <KaynakBar label="İstikrar" value={kaynaklar.istikrar} color="#3b82f6" />
        <KaynakBar label="Altyapı" value={kaynaklar.altyapi} color="#a855f7" />
      </View>

      {/* Lobi Durumu */}
      {durum === 'LOBI' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oyuncular ({oyuncular.length})</Text>
          {oyuncular.map((o) => (
            <View key={o.id} style={styles.oyuncuItem}>
              <View style={styles.oyuncuInfo}>
                <Text style={styles.oyuncuAdi}>{o.kullaniciAdi}</Text>
                {o.rol === 'KURUCU' && <Text style={styles.kurucuBadge}>Kurucu</Text>}
              </View>
              <Text style={[styles.hazirDurum, { color: o.hazir ? '#22c55e' : '#9ca3af' }]}>
                {o.hazir ? 'Hazır' : 'Bekliyor'}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={styles.hazirButton} onPress={hazirOl}>
            <Text style={styles.hazirButtonText}>Hazırım</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Geri Sayım */}
      {durum === 'GERI_SAYIM' && geriSayim !== null && (
        <View style={styles.geriSayimContainer}>
          <Text style={styles.geriSayimText}>{geriSayim}</Text>
          <Text style={styles.geriSayimLabel}>Oyun Başlıyor!</Text>
        </View>
      )}

      {/* Olay */}
      {mevcutOlay && durum === 'DEVAM_EDIYOR' && (
        <View style={styles.section}>
          <View style={styles.olayHeader}>
            <Text style={styles.olayTip}>{mevcutOlay.tip}</Text>
            <Text style={styles.olayBaslik}>{mevcutOlay.baslik}</Text>
          </View>
          <Text style={styles.olayAciklama}>{mevcutOlay.aciklama}</Text>

          {/* Seçenekler */}
          {(asama === 'TARTISMA' || asama === 'OLAY_ACILISI') && (
            <View style={styles.secenekler}>
              <Text style={styles.seceneklerTitle}>Seçenekler</Text>
              {mevcutOlay.secenekler.map((secenek) => (
                <TouchableOpacity
                  key={secenek.id}
                  style={[
                    styles.secenekItem,
                    secilenSecenek === secenek.id && styles.secenekItemSecili,
                  ]}
                  onPress={() => setSecilenSecenek(secenek.id)}
                >
                  <Text style={styles.secenekBaslik}>{secenek.baslik}</Text>
                  <Text style={styles.secenekAciklama}>{secenek.aciklama}</Text>
                  <View style={styles.etkiler}>
                    {Object.entries(secenek.etkiler).map(([key, val]) => (
                      <Text
                        key={key}
                        style={[styles.etki, { color: (val as number) >= 0 ? '#22c55e' : '#ef4444' }]}
                      >
                        {key}: {(val as number) >= 0 ? '+' : ''}{val}
                      </Text>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}

              {secilenSecenek && (
                <View style={styles.oneriForm}>
                  <TextInput
                    style={styles.oneriInput}
                    placeholder="Açıklama (opsiyonel)"
                    placeholderTextColor="#9ca3af"
                    value={oneriAciklama}
                    onChangeText={setOneriAciklama}
                    multiline
                  />
                  <TouchableOpacity style={styles.oneriButton} onPress={oneriGonder}>
                    <Text style={styles.oneriButtonText}>Öneri Gönder</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Öneriler ve Oylama */}
      {oneriler.length > 0 && asama === 'OYLAMA' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öneriler</Text>
          {oneriler.map((oneri) => (
            <View key={oneri.id} style={styles.oneriItem}>
              <Text style={styles.oneriOnerici}>{oneri.onericiAdi}</Text>
              <Text style={styles.oneriBaslik}>{oneri.baslik}</Text>
              {oneri.aciklama && <Text style={styles.oneriAciklamaText}>{oneri.aciklama}</Text>}

              <View style={styles.oylamaButtons}>
                <TouchableOpacity
                  style={[styles.oyButton, styles.evetButton]}
                  onPress={() => oyVer(oneri.id, 'EVET')}
                >
                  <Text style={styles.oyButtonText}>Evet ({oneri.oylar.filter(o => o.secim === 'EVET').length})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.oyButton, styles.hayirButton]}
                  onPress={() => oyVer(oneri.id, 'HAYIR')}
                >
                  <Text style={styles.oyButtonText}>Hayır ({oneri.oylar.filter(o => o.secim === 'HAYIR').length})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.oyButton, styles.cekimserButton]}
                  onPress={() => oyVer(oneri.id, 'CEKIMSER')}
                >
                  <Text style={styles.oyButtonText}>Çekimser</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#374151',
  },
  toplulukIsmi: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  durumText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  bagliDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  kaynaklar: {
    padding: 16,
    backgroundColor: '#374151',
    marginBottom: 12,
  },
  kaynakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kaynakLabel: {
    width: 70,
    color: '#9ca3af',
    fontSize: 12,
  },
  kaynakBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#4b5563',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  kaynakBar: {
    height: '100%',
    borderRadius: 4,
  },
  kaynakValue: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#374151',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  oyuncuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  oyuncuInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oyuncuAdi: {
    color: '#fff',
    fontSize: 14,
  },
  kurucuBadge: {
    backgroundColor: '#7c3aed',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
  },
  hazirDurum: {
    fontSize: 12,
  },
  hazirButton: {
    backgroundColor: '#7c3aed',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  hazirButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  geriSayimContainer: {
    alignItems: 'center',
    padding: 40,
  },
  geriSayimText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  geriSayimLabel: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 8,
  },
  olayHeader: {
    marginBottom: 12,
  },
  olayTip: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    marginBottom: 4,
  },
  olayBaslik: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  olayAciklama: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
  },
  secenekler: {
    marginTop: 16,
  },
  seceneklerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  secenekItem: {
    backgroundColor: '#4b5563',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  secenekItemSecili: {
    borderColor: '#7c3aed',
  },
  secenekBaslik: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  secenekAciklama: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
  },
  etkiler: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  etki: {
    fontSize: 11,
    fontWeight: '500',
  },
  oneriForm: {
    marginTop: 12,
  },
  oneriInput: {
    backgroundColor: '#4b5563',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  oneriButton: {
    backgroundColor: '#7c3aed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  oneriButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  oneriItem: {
    backgroundColor: '#4b5563',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  oneriOnerici: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  oneriBaslik: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  oneriAciklamaText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
  },
  oylamaButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  oyButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  evetButton: {
    backgroundColor: '#22c55e',
  },
  hayirButton: {
    backgroundColor: '#ef4444',
  },
  cekimserButton: {
    backgroundColor: '#6b7280',
  },
  oyButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
});
