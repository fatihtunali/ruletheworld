'use client';

import { useState, useEffect } from 'react';
import { soundManager, SoundEffects } from '../lib/sounds';

export default function SesAyarlari() {
  const [acik, setAcik] = useState(false);
  const [sesAcik, setSesAcik] = useState(true);
  const [sesSeviyesi, setSesSeviyesi] = useState(50);

  useEffect(() => {
    setSesAcik(soundManager.isEnabled());
    setSesSeviyesi(soundManager.getVolume() * 100);
  }, []);

  const handleSesToggle = () => {
    const yeniDeger = !sesAcik;
    setSesAcik(yeniDeger);
    soundManager.setEnabled(yeniDeger);
    if (yeniDeger) {
      SoundEffects.click();
    }
  };

  const handleSesSeviyesi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deger = parseInt(e.target.value, 10);
    setSesSeviyesi(deger);
    soundManager.setVolume(deger / 100);
  };

  const testSes = () => {
    SoundEffects.notification();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setAcik(!acik)}
        className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
        title="Ses Ayarlari"
      >
        {sesAcik ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>

      {acik && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAcik(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4 z-50">
            <h4 className="text-sm font-medium text-white mb-4">Ses Ayarlari</h4>

            <div className="space-y-4">
              {/* Ses Aç/Kapat */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sesler</span>
                <button
                  onClick={handleSesToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    sesAcik ? 'bg-primary-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sesAcik ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Ses Seviyesi */}
              {sesAcik && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Ses Seviyesi</span>
                    <span className="text-sm text-white">{sesSeviyesi}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sesSeviyesi}
                    onChange={handleSesSeviyesi}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              )}

              {/* Test Butonu */}
              {sesAcik && (
                <button
                  onClick={testSes}
                  className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Test Et
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
