'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, Bildirim, BildirimTipi } from '../lib/api';
import { useAuthStore } from '../lib/store';

export default function Bildirimler() {
  const { token } = useAuthStore();
  const [acik, setAcik] = useState(false);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Okunmamis sayisini duzenli kontrol et
  useEffect(() => {
    if (!token) return;

    const kontrolEt = async () => {
      const res = await api.bildirimler.okunmamisSayisi();
      if (res.data) {
        setOkunmamisSayisi(res.data.sayi);
      }
    };

    kontrolEt();
    const interval = setInterval(kontrolEt, 30000); // 30 saniyede bir

    return () => clearInterval(interval);
  }, [token]);

  // Disari tiklaninca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAcik(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bildirimleriYukle = async () => {
    setYukleniyor(true);
    const res = await api.bildirimler.getir();
    if (res.data) {
      setBildirimler(res.data.bildirimler);
      setOkunmamisSayisi(res.data.okunmamisSayisi);
    }
    setYukleniyor(false);
  };

  const menuAc = () => {
    if (!acik) {
      bildirimleriYukle();
    }
    setAcik(!acik);
  };

  const okunduIsaretle = async (id: string) => {
    await api.bildirimler.okunduIsaretle(id);
    setBildirimler((prev) =>
      prev.map((b) => (b.id === id ? { ...b, okundu: true } : b))
    );
    setOkunmamisSayisi((prev) => Math.max(0, prev - 1));
  };

  const tumunuOku = async () => {
    await api.bildirimler.tumunuOku();
    setBildirimler((prev) => prev.map((b) => ({ ...b, okundu: true })));
    setOkunmamisSayisi(0);
  };

  const bildirimIkonu = (tip: BildirimTipi) => {
    const ikonlar: Record<BildirimTipi, string> = {
      OYUN_BASLADI: '🎮',
      OYUN_BITTI: '🏁',
      TUR_BASLADI: '🔄',
      OYLAMA_BASLADI: '🗳️',
      ONERI_KABUL_EDILDI: '✅',
      ONERI_REDDEDILDI: '❌',
      TOPLULUGA_DAVET: '📨',
      TOPLULUKTAN_ATILDI: '🚫',
      YENI_MESAJ: '💬',
      SISTEM: '⚙️',
    };
    return ikonlar[tip] || '📢';
  };

  if (!token) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Bildirim Butonu */}
      <button
        onClick={menuAc}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Bildirimler"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {okunmamisSayisi > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {okunmamisSayisi > 9 ? '9+' : okunmamisSayisi}
          </span>
        )}
      </button>

      {/* Bildirim Paneli */}
      {acik && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white">Bildirimler</h3>
            {okunmamisSayisi > 0 && (
              <button
                onClick={tumunuOku}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Tumunu oku
              </button>
            )}
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-96 overflow-y-auto">
            {yukleniyor ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : bildirimler.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>Bildirim yok</p>
              </div>
            ) : (
              bildirimler.map((bildirim) => (
                <div
                  key={bildirim.id}
                  onClick={() => !bildirim.okundu && okunduIsaretle(bildirim.id)}
                  className={`px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    !bildirim.okundu ? 'bg-gray-700/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">
                      {bildirimIkonu(bildirim.tip)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {bildirim.baslik}
                        </p>
                        {!bildirim.okundu && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {bildirim.icerik}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatZaman(bildirim.olusturuldu)}
                      </p>
                    </div>
                  </div>
                  {bildirim.link && (
                    <Link
                      href={bildirim.link}
                      className="mt-2 text-xs text-primary-400 hover:text-primary-300 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Goruntule →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatZaman(tarih: string): string {
  const simdi = new Date();
  const bildirimTarihi = new Date(tarih);
  const fark = simdi.getTime() - bildirimTarihi.getTime();
  const dakika = Math.floor(fark / 60000);
  const saat = Math.floor(dakika / 60);
  const gun = Math.floor(saat / 24);

  if (dakika < 1) return 'Az once';
  if (dakika < 60) return `${dakika} dk once`;
  if (saat < 24) return `${saat} saat once`;
  if (gun < 7) return `${gun} gun once`;
  return bildirimTarihi.toLocaleDateString('tr-TR');
}
