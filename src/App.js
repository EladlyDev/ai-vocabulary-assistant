import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import SetEditor from './components/SetEditor';
import SetViewer from './components/SetViewer';

function App() {
  // Enhanced mock data for word sets with richer word information
  const [mockSets, setMockSets] = useState([
    { 
      id: 1, 
      name: 'English→Arabic Essential Words', 
      words: [
        {
          word: 'house',
          translation: 'بيت',
          sentence: 'I live in a beautiful house with my family.',
          sentenceTranslation: 'أعيش في بيت جميل مع عائلتي.',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
          pronunciation: '/haʊs/',
          tags: ['noun', 'home', 'family']
        },
        {
          word: 'water',
          translation: 'ماء',
          sentence: 'Please drink more water to stay healthy.',
          sentenceTranslation: 'من فضلك اشرب المزيد من الماء لتبقى بصحة جيدة.',
          image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
          pronunciation: '/ˈwɔːtər/',
          tags: ['noun', 'drink', 'health']
        },
        {
          word: 'book',
          translation: 'كتاب',
          sentence: 'She reads a new book every week.',
          sentenceTranslation: 'تقرأ كتاباً جديداً كل أسبوع.',
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
          pronunciation: '/bʊk/',
          tags: ['noun', 'education', 'reading']
        },
        {
          word: 'food',
          translation: 'طعام',
          sentence: 'The restaurant serves delicious Middle Eastern food.',
          sentenceTranslation: 'يقدم المطعم طعاماً شرق أوسطياً لذيذاً.',
          image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
          pronunciation: '/fuːd/',
          tags: ['noun', 'eating', 'cuisine']
        },
        {
          word: 'friend',
          translation: 'صديق',
          sentence: 'My best friend always supports me.',
          sentenceTranslation: 'أفضل صديق لي يدعمني دائماً.',
          image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=400&h=300&fit=crop',
          pronunciation: '/frend/',
          tags: ['noun', 'relationship', 'social']
        },
        {
          word: 'learn',
          translation: 'يتعلم',
          sentence: 'Students learn Arabic at the university.',
          sentenceTranslation: 'يتعلم الطلاب اللغة العربية في الجامعة.',
          image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
          pronunciation: '/lɜːrn/',
          tags: ['verb', 'education', 'studying']
        }
      ]
    },
    { 
      id: 2, 
      name: 'German→Arabic Daily Life', 
      words: [
        {
          word: 'das Haus',
          translation: 'البيت',
          sentence: 'Unser Haus ist sehr gemütlich und warm.',
          sentenceTranslation: 'بيتنا مريح ودافئ جداً.',
          image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
          pronunciation: '/das haʊs/',
          tags: ['noun', 'home', 'architecture']
        },
        {
          word: 'die Familie',
          translation: 'العائلة',
          sentence: 'Meine Familie kommt aus Deutschland.',
          sentenceTranslation: 'عائلتي من ألمانيا.',
          image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop',
          pronunciation: '/diː faˈmiːliə/',
          tags: ['noun', 'family', 'relationship']
        },
        {
          word: 'arbeiten',
          translation: 'يعمل',
          sentence: 'Ich arbeite jeden Tag von neun bis fünf.',
          sentenceTranslation: 'أعمل كل يوم من التاسعة إلى الخامسة.',
          image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
          pronunciation: '/ˈaʁbaɪtən/',
          tags: ['verb', 'work', 'daily']
        },
        {
          word: 'das Brot',
          translation: 'الخبز',
          sentence: 'Deutsches Brot ist sehr lecker und gesund.',
          sentenceTranslation: 'الخبز الألماني لذيذ جداً وصحي.',
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
          pronunciation: '/das broːt/',
          tags: ['noun', 'food', 'bakery']
        },
        {
          word: 'sprechen',
          translation: 'يتحدث',
          sentence: 'Wir sprechen Deutsch und Arabisch zu Hause.',
          sentenceTranslation: 'نتحدث الألمانية والعربية في البيت.',
          image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop',
          pronunciation: '/ˈʃprɛçən/',
          tags: ['verb', 'communication', 'language']
        },
        {
          word: 'die Zeit',
          translation: 'الوقت',
          sentence: 'Haben Sie Zeit für einen Kaffee?',
          sentenceTranslation: 'هل لديك وقت لشرب القهوة؟',
          image: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop',
          pronunciation: '/diː tsaɪt/',
          tags: ['noun', 'time', 'abstract']
        }
      ]
    },
    { 
      id: 3, 
      name: 'Arabic Business Vocabulary', 
      words: [
        {
          word: 'عمل',
          translation: 'work / business',
          sentence: 'العمل في هذه الشركة ممتع ومفيد.',
          sentenceTranslation: 'Working at this company is enjoyable and beneficial.',
          image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop',
          pronunciation: '/ʕamal/',
          tags: ['noun', 'business', 'career']
        },
        {
          word: 'اجتماع',
          translation: 'meeting',
          sentence: 'لدينا اجتماع مهم غداً في الصباح.',
          sentenceTranslation: 'We have an important meeting tomorrow morning.',
          image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop',
          pronunciation: '/ɪdʒtɪmaːʕ/',
          tags: ['noun', 'business', 'communication']
        },
        {
          word: 'مشروع',
          translation: 'project',
          sentence: 'هذا المشروع سيغير مستقبل الشركة.',
          sentenceTranslation: 'This project will change the future of the company.',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
          pronunciation: '/maʃruːʕ/',
          tags: ['noun', 'business', 'planning']
        },
        {
          word: 'عميل',
          translation: 'client / customer',
          sentence: 'رضا العميل هو أولويتنا الأولى.',
          sentenceTranslation: 'Customer satisfaction is our top priority.',
          image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
          pronunciation: '/ʕamiːl/',
          tags: ['noun', 'business', 'customer service']
        }
      ]
    },
    { 
      id: 4, 
      name: 'English→Arabic Verbs', 
      words: [
        {
          word: 'study',
          translation: 'يدرس',
          sentence: 'Ahmad studies Arabic literature at the university.',
          sentenceTranslation: 'يدرس أحمد الأدب العربي في الجامعة.',
          image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
          pronunciation: '/ˈstʌdi/',
          tags: ['verb', 'education', 'learning']
        },
        {
          word: 'travel',
          translation: 'يسافر',
          sentence: 'They travel to Egypt every summer.',
          sentenceTranslation: 'يسافرون إلى مصر كل صيف.',
          image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
          pronunciation: '/ˈtrævəl/',
          tags: ['verb', 'journey', 'vacation']
        },
        {
          word: 'cook',
          translation: 'يطبخ',
          sentence: 'My mother cooks traditional Arabic dishes.',
          sentenceTranslation: 'تطبخ أمي الأطباق العربية التقليدية.',
          image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
          pronunciation: '/kʊk/',
          tags: ['verb', 'food', 'kitchen']
        },
        {
          word: 'write',
          translation: 'يكتب',
          sentence: 'The journalist writes articles about Middle Eastern culture.',
          sentenceTranslation: 'يكتب الصحفي مقالات عن الثقافة الشرق أوسطية.',
          image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop',
          pronunciation: '/raɪt/',
          tags: ['verb', 'communication', 'journalism']
        },
        {
          word: 'help',
          translation: 'يساعد',
          sentence: 'Good friends always help each other.',
          sentenceTranslation: 'الأصدقاء الجيدون يساعدون بعضهم البعض دائماً.',
          image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop',
          pronunciation: '/help/',
          tags: ['verb', 'assistance', 'social']
        }
      ]
    }
  ]);

  const [currentView, setCurrentView] = useState({ name: 'dashboard' });
  const [activeSet, setActiveSet] = useState(null);
  const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode') || 'list'); // 'list' or 'table'
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateNewSet = () => {
    setActiveSet({ name: 'New Set', words: [] });
    setCurrentView({ name: 'editor' });
  };

  const handleOpenSet = (setId) => {
    const selectedSet = mockSets.find(set => set.id === setId);
    if (selectedSet) {
      setActiveSet(selectedSet);
      setCurrentView({ name: 'viewer' });
    }
  };

  const handleDeleteSet = (setId) => {
    setMockSets(prevSets => prevSets.filter(set => set.id !== setId));
  };

  const handleUpdateSet = (updatedSet) => {
    setActiveSet(updatedSet);
    
    // Update in mockSets if it exists (has an ID)
    if (updatedSet.id) {
      setMockSets(prevSets => 
        prevSets.map(set => 
          set.id === updatedSet.id ? updatedSet : set
        )
      );
    }
  };

  const handleSaveNewSet = (newSet) => {
    if (newSet.name.trim() && newSet.words.length > 0) {
      const setWithId = {
        ...newSet,
        id: Date.now() // Simple ID generation
      };
      setMockSets(prevSets => [...prevSets, setWithId]);
      setCurrentView({ name: 'dashboard' });
      setActiveSet(null);
    }
  };

  const handleShowDashboard = () => {
    setActiveSet(null);
    setCurrentView({ name: 'dashboard' });
    setSearchTerm(''); // Clear search when going back to dashboard
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode); // Remember user preference
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {currentView.name === 'dashboard' && (
        <Dashboard 
          onCreateNewSet={handleCreateNewSet}
          onOpenSet={handleOpenSet}
          sets={mockSets}
        />
      )}
      {currentView.name === 'editor' && (
        <SetEditor 
          set={activeSet} 
          onBack={handleShowDashboard}
          onUpdateSet={setActiveSet}
          onSaveSet={handleSaveNewSet}
        />
      )}
      {currentView.name === 'viewer' && (
        <SetViewer
          set={activeSet}
          onBack={handleShowDashboard}
          onUpdateSet={handleUpdateSet}
          onDeleteSet={handleDeleteSet}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}
    </div>
  );
}

export default App;
