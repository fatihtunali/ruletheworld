'use client';

import { useState, useRef, useEffect } from 'react';
import { api, ReaksiyonOzeti } from '../lib/api';

// İzin verilen emojiler
const EMOJILER = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '💯'];

interface EmojiPickerProps {
  mesajId: string;
  reaksiyonlar?: ReaksiyonOzeti[];
  onReaksiyonDegisti?: (reaksiyonlar: ReaksiyonOzeti[]) => void;
  compact?: boolean;
}

export default function EmojiPicker({
  mesajId,
  reaksiyonlar = [],
  onReaksiyonDegisti,
  compact = false,
}: EmojiPickerProps) {
  const [pickerAcik, setPickerAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerAcik(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = async (emoji: string) => {
    if (yukleniyor) return;

    setYukleniyor(true);
    try {
      const sonuc = await api.reaksiyonlar.toggle(mesajId, emoji);
      if (sonuc.data?.reaksiyonlar) {
        onReaksiyonDegisti?.(sonuc.data.reaksiyonlar);
      }
    } catch (error) {
      console.error('Reaksiyon hatası:', error);
    } finally {
      setYukleniyor(false);
      setPickerAcik(false);
    }
  };

  const handleReaksiyonClick = async (emoji: string) => {
    if (yukleniyor) return;

    setYukleniyor(true);
    try {
      const sonuc = await api.reaksiyonlar.toggle(mesajId, emoji);
      if (sonuc.data?.reaksiyonlar) {
        onReaksiyonDegisti?.(sonuc.data.reaksiyonlar);
      }
    } catch (error) {
      console.error('Reaksiyon hatası:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap" ref={pickerRef}>
      {/* Mevcut reaksiyonlar */}
      {reaksiyonlar.map((reaksiyon) => (
        <button
          key={reaksiyon.emoji}
          onClick={() => handleReaksiyonClick(reaksiyon.emoji)}
          disabled={yukleniyor}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-all ${
            reaksiyon.benReaksiyonVerdimMi
              ? 'bg-blue-600/30 border border-blue-500'
              : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
          } ${yukleniyor ? 'opacity-50' : ''}`}
          title={`${reaksiyon.sayi} kişi`}
        >
          <span>{reaksiyon.emoji}</span>
          <span className="text-xs text-gray-300">{reaksiyon.sayi}</span>
        </button>
      ))}

      {/* Emoji ekle butonu */}
      <div className="relative">
        <button
          onClick={() => setPickerAcik(!pickerAcik)}
          className={`p-1.5 rounded-full transition-colors ${
            compact
              ? 'opacity-0 group-hover:opacity-100 hover:bg-gray-700'
              : 'hover:bg-gray-700 bg-gray-800'
          }`}
          title="Reaksiyon ekle"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Emoji picker dropdown */}
        {pickerAcik && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 animate-fade-in">
            <div className="flex gap-1 flex-wrap max-w-[200px]">
              {EMOJILER.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  disabled={yukleniyor}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
