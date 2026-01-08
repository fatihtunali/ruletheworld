'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TutorialStep {
  id: number;
  baslik: string;
  aciklama: string;
  gorsel: string;
  ipucu: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    baslik: 'Hosgeldin!',
    aciklama: 'RuleTheWorld, arkadaslarinla birlikte bir toplulugu yonettigin stratejik bir karar oyunudur. Her kararin toplulugunu etkiler!',
    gorsel: '🏘️',
    ipucu: 'Oyun 4-8 oyuncu ile oynanir',
  },
  {
    id: 2,
    baslik: 'Kaynaklar',
    aciklama: 'Toplulugun 4 temel kaynagi var: Hazine (ekonomi), Refah (mutluluk), Istikrar (guvenlik) ve Altyapi (gelisme). Hepsini dengede tutmalisin!',
    gorsel: '📊',
    ipucu: 'Her kaynak 50 ile baslar, 0-100 arasi degisir',
  },
  {
    id: 3,
    baslik: 'Olaylar',
    aciklama: 'Her turda toplulugunu etkileyen bir olay ortaya cikar. Kriz, firsat veya karar olabilir. Olaya uygun bir cozum secmelisin.',
    gorsel: '⚡',
    ipucu: 'Olaylari dikkatlice oku, her secenegin farkli etkileri var',
  },
  {
    id: 4,
    baslik: 'Oneri Yap',
    aciklama: 'Olaya karsi bir cozum oner! Seceneklerden birini sec ve neden bu karari verdiginizi acikla. Diger oyuncular onerini gorecek.',
    gorsel: '💡',
    ipucu: 'Iyi bir aciklama, oylamanin lehinize sonuclanmasina yardimci olur',
  },
  {
    id: 5,
    baslik: 'Oylama',
    aciklama: 'Tum oyuncular onerilere oy verir: Evet, Hayir veya Cekimser. En cok "Evet" oyu alan oneri uygulanir.',
    gorsel: '🗳️',
    ipucu: 'Esitlik durumunda onerici sayisi ve rastgele faktor devreye girer',
  },
  {
    id: 6,
    baslik: 'Sonuc',
    aciklama: 'Kazanan onerinin etkileri kaynaklara uygulanir. Iyi kararlar kaynaklari arttirir, kotu kararlar azaltir.',
    gorsel: '📈',
    ipucu: 'Herhangi bir kaynak 0\'a duserse oyun erken biter!',
  },
  {
    id: 7,
    baslik: 'Kazanma',
    aciklama: '6 tur sonunda kaynaklarin durumuna gore puan kazanirsin. Tum kaynaklar 70+ ise en yuksek puan carpani!',
    gorsel: '🏆',
    ipucu: 'Dengeli oyna, tek bir kaynaga odaklanma',
  },
  {
    id: 8,
    baslik: 'Hazirsin!',
    aciklama: 'Artik oynamaya hazirsin! Bir lobiye katil veya kendi lobini olustur. Iyi eglenceler!',
    gorsel: '🚀',
    ipucu: 'Arkadaslarinla oynamak daha eglenceli!',
  },
];

export default function TutorialPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  if (!step) return null;

  const handleNext = () => {
    if (!completed.includes(currentStep)) {
      setCompleted([...completed, currentStep]);
    }
    if (isLastStep) {
      // Tutorial tamamlandi, localStorage'a kaydet
      localStorage.setItem('tutorialCompleted', 'true');
      router.push('/lobi');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tutorialCompleted', 'true');
    router.push('/lobi');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Atla
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-800/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index < currentStep
                    ? 'bg-primary-500'
                    : index === currentStep
                      ? 'bg-primary-400'
                      : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {currentStep + 1} / {tutorialSteps.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="max-w-lg w-full">
          {/* Step Card */}
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            {/* Icon */}
            <div className="text-8xl mb-6">{step.gorsel}</div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-4">{step.baslik}</h1>

            {/* Description */}
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              {step.aciklama}
            </p>

            {/* Tip */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 mb-8">
              <p className="text-primary-400 text-sm">
                <span className="font-semibold">Ipucu:</span> {step.ipucu}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex-1 py-4 rounded-xl font-medium transition-colors ${
                  isFirstStep
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Geri
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
              >
                {isLastStep ? 'Oynamaya Basla' : 'Devam'}
              </button>
            </div>
          </div>

          {/* Quick Navigation Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary-500'
                    : completed.includes(index)
                      ? 'bg-primary-500/50'
                      : 'bg-gray-700 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
