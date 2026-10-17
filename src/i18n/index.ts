import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import type { User } from '@/types'

import en from './locales/en.json'
import zh from './locales/zh.json'

const resources = {
  en: {
    translation: en
  },
  zh: {
    translation: zh
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

// Function to set language based on user preference
export const setUserLanguage = (user: User | null) => {
  if (user && user.preferred_language) {
    // If user is logged in and has a preferred language, use it
    i18n.changeLanguage(user.preferred_language)
  } else {
    // If user is not logged in, use browser detection
    // This will fall back to the detection settings we configured
    const detectedLanguage = i18n.language || window.navigator.language.split('-')[0]
    const supportedLanguage = detectedLanguage === 'zh' ? 'zh' : 'en'
    i18n.changeLanguage(supportedLanguage)
  }
}

export default i18n
