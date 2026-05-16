import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        search: 'Search',
        labour: 'Labour Dashboard',
        client: 'Client Dashboard',
        admin: 'Admin Panel',
        chat: 'Chat',
        notifications: 'Notifications',
        settings: 'Settings',
        about: 'About & Contact',
        login: 'Login / Signup'
      },
      home: {
        badge: 'Trusted marketplace for skilled labour',
        title: 'Hire verified workers faster. Build local careers with confidence.',
        subtitle:
          'WorkLink connects clients with skilled labour professionals through instant search, booking, real-time chat, and verified work history.',
        primaryCta: 'Join as Labour',
        secondaryCta: 'Join as Client',
        searchPlaceholder: 'Search service or worker',
        sectionTitle: 'Find the right worker without the chaos',
        howTitle: 'How WorkLink works'
      },
      auth: {
        title: 'Create your WorkLink account',
        subtitle: 'Choose your role and continue with phone, Google, or email.',
        labour: 'Labour',
        client: 'Client'
      },
      shared: {
        available: 'Available',
        busy: 'Busy',
        offline: 'Offline',
        verified: 'Verified',
        unverified: 'Unverified',
        nearby: 'Nearby labour',
        recommended: 'AI matched'
      }
    }
  },
  hi: {
    translation: {
      nav: {
        home: 'होम',
        search: 'खोज',
        labour: 'लेबर डैशबोर्ड',
        client: 'क्लाइंट डैशबोर्ड',
        admin: 'एडमिन पैनल',
        chat: 'चैट',
        notifications: 'सूचनाएं',
        settings: 'सेटिंग्स',
        about: 'जानकारी और संपर्क',
        login: 'लॉगिन / साइनअप'
      },
      home: {
        badge: 'कुशल श्रमिकों के लिए भरोसेमंद मार्केटप्लेस',
        title: 'सही कामगार जल्दी खोजें और भरोसे के साथ काम शुरू करें।',
        subtitle:
          'WorkLink क्लाइंट्स और श्रमिकों को सर्च, बुकिंग, चैट और सत्यापित प्रोफाइल के साथ जोड़ता है।',
        primaryCta: 'लेबर के रूप में जुड़ें',
        secondaryCta: 'क्लाइंट के रूप में जुड़ें',
        searchPlaceholder: 'इलेक्ट्रीशियन, प्लंबर, पेंटर और अन्य खोजें',
        sectionTitle: 'बिना परेशानी सही कामगार पाएं',
        howTitle: 'WorkLink कैसे काम करता है'
      },
      auth: {
        title: 'अपना WorkLink अकाउंट बनाएं',
        subtitle: 'रोल चुनें और फोन, गूगल या ईमेल से जारी रखें।',
        labour: 'लेबर',
        client: 'क्लाइंट'
      },
      shared: {
        available: 'उपलब्ध',
        busy: 'व्यस्त',
        offline: 'ऑफलाइन',
        verified: 'सत्यापित',
        unverified: 'असत्यापित',
        nearby: 'नजदीकी लेबर',
        recommended: 'एआई सुझाव'
      }
    }
  },
  te: {
    translation: {
      nav: {
        home: 'హోమ్',
        search: 'శోధన',
        labour: 'లేబర్ డ్యాష్‌బోర్డ్',
        client: 'క్లయింట్ డ్యాష్‌బోర్డ్',
        admin: 'అడ్మిన్ ప్యానెల్',
        chat: 'చాట్',
        notifications: 'నోటిఫికేషన్లు',
        settings: 'సెట్టింగ్స్',
        about: 'గురించి మరియు సంప్రదింపు',
        login: 'లాగిన్ / సైనప్'
      },
      home: {
        badge: 'నైపుణ్య కార్మికుల కోసం నమ్మకమైన మార్కెట్‌ప్లేస్',
        title: 'సరైన కార్మికుడిని త్వరగా కనుగొని నమ్మకంగా పని ప్రారంభించండి.',
        subtitle:
          'WorkLink క్లయింట్లు మరియు కార్మికులను శోధన, బుకింగ్, చాట్, ధృవీకరించిన ప్రొఫైల్‌లతో కలుపుతుంది.',
        primaryCta: 'లేబర్‌గా చేరండి',
        secondaryCta: 'క్లయింట్‌గా చేరండి',
        searchPlaceholder: 'ఎలక్ట్రిషియన్, ప్లంబర్, పెయింటర్ మరియు మరెన్నో శోధించండి',
        sectionTitle: 'అల్లకల్లోలం లేకుండా సరైన వర్కర్‌ను కనుగొనండి',
        howTitle: 'WorkLink ఎలా పనిచేస్తుంది'
      },
      auth: {
        title: 'మీ WorkLink ఖాతాను సృష్టించండి',
        subtitle: 'మీ పాత్రను ఎంచుకుని ఫోన్, గూగుల్ లేదా ఇమెయిల్‌తో కొనసాగండి.',
        labour: 'లేబర్',
        client: 'క్లయింట్'
      },
      shared: {
        available: 'అందుబాటులో',
        busy: 'బిజీ',
        offline: 'ఆఫ్‌లైన్',
        verified: 'ధృవీకరించబడింది',
        unverified: 'ధృవీకరించబడలేదు',
        nearby: 'సమీప లేబర్',
        recommended: 'ఎఐ సిఫార్సు'
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  lng: window.localStorage.getItem('worklink-lang') ?? 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;

