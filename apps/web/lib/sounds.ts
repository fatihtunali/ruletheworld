// Ses efektleri yönetimi

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== 'undefined') {
      // LocalStorage'dan ayarları yükle
      const savedEnabled = localStorage.getItem('sound_enabled');
      const savedVolume = localStorage.getItem('sound_volume');

      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true';
      }
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume);
      }
    }
  }

  // Ses dosyasını önceden yükle
  preload(name: string, url: string): void {
    if (typeof window === 'undefined') return;

    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = this.volume;
    this.sounds.set(name, audio);
  }

  // Ses çal
  play(name: string): void {
    if (!this.enabled || typeof window === 'undefined') return;

    const audio = this.sounds.get(name);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = this.volume;
      audio.play().catch(() => {
        // Kullanıcı etkileşimi olmadan ses çalınamayabilir
      });
    }
  }

  // Sesleri aç/kapat
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_enabled', String(enabled));
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Ses seviyesini ayarla
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((audio) => {
      audio.volume = this.volume;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_volume', String(this.volume));
    }
  }

  getVolume(): number {
    return this.volume;
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Oyun sesleri
export const GameSounds = {
  // Bildirim sesleri
  NOTIFICATION: 'notification',
  MESSAGE: 'message',

  // Oyun olayları
  TURN_START: 'turn_start',
  VOTE_START: 'vote_start',
  VOTE_CAST: 'vote_cast',
  GAME_START: 'game_start',
  GAME_END: 'game_end',

  // UI sesleri
  CLICK: 'click',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Sesleri başlat (uygulama başladığında çağrılmalı)
export function initializeSounds(): void {
  // Web Audio API ile basit ses efektleri oluştur
  // Not: Gerçek uygulamada ses dosyaları /public/sounds/ klasöründe olmalı

  // Şimdilik placeholder olarak boş bırakıyoruz
  // Gerçek ses dosyaları eklendiğinde:
  // soundManager.preload(GameSounds.NOTIFICATION, '/sounds/notification.mp3');
  // soundManager.preload(GameSounds.MESSAGE, '/sounds/message.mp3');
  // vs.
}

// Web Audio API ile basit beep sesi oluştur
export function playBeep(frequency: number = 440, duration: number = 200): void {
  if (typeof window === 'undefined' || !soundManager.isEnabled()) return;

  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.value = soundManager.getVolume() * 0.3;

    oscillator.start();

    setTimeout(() => {
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 100);
    }, duration);
  } catch {
    // Audio context başlatılamadı
  }
}

// Hazır ses efektleri
export const SoundEffects = {
  notification: () => playBeep(880, 150),
  message: () => playBeep(660, 100),
  turnStart: () => {
    playBeep(440, 100);
    setTimeout(() => playBeep(550, 100), 120);
    setTimeout(() => playBeep(660, 150), 240);
  },
  voteStart: () => {
    playBeep(523, 150);
    setTimeout(() => playBeep(659, 200), 170);
  },
  success: () => {
    playBeep(523, 100);
    setTimeout(() => playBeep(659, 100), 100);
    setTimeout(() => playBeep(784, 150), 200);
  },
  error: () => {
    playBeep(200, 200);
    setTimeout(() => playBeep(180, 300), 220);
  },
  click: () => playBeep(1000, 30),
  gameStart: () => {
    playBeep(392, 150);
    setTimeout(() => playBeep(523, 150), 170);
    setTimeout(() => playBeep(659, 150), 340);
    setTimeout(() => playBeep(784, 250), 510);
  },
  gameEnd: () => {
    playBeep(784, 200);
    setTimeout(() => playBeep(659, 200), 220);
    setTimeout(() => playBeep(523, 200), 440);
    setTimeout(() => playBeep(392, 400), 660);
  },
};
