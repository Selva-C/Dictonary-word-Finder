import React, { useState, useEffect } from 'react';


export default function App() {
  // === State Management ===
  const [searchTerm, setSearchTerm] = useState('');
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('dict_history')) || []);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('dict_favorites')) || []);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // === Side Effects ===

  // 1. Dark Mode Toggle Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // 2. LocalStorage Sync for History and Favorites
  useEffect(() => {
    localStorage.setItem('dict_history', JSON.stringify(history));
    localStorage.setItem('dict_favorites', JSON.stringify(favorites));
  }, [history, favorites]);

  // 3. Debounced Search API Call
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchWordData(searchTerm.trim());
      } else {
        setWordData(null);
        setError('');
      }
    }, 600); // 600ms delay for debounce

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // === Core Functions ===

  const fetchWordData = async (word) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) {
        throw new Error('Word not found. Please try another word.');
      }
      
      const data = await response.json();
      setWordData(data[0]); // API returns an array, we grab the first match
      
      // Update history without duplicates, keeping latest 10
      setHistory(prev => {
        const filtered = prev.filter(w => w.toLowerCase() !== word.toLowerCase());
        return [word, ...filtered].slice(0, 10);
      });
      
    } catch (err) {
      setWordData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!wordData) return;
    // Find the first phonetic entry that has an audio file
    const phoneticWithAudio = wordData.phonetics.find(p => p.audio);
    if (phoneticWithAudio) {
      new Audio(phoneticWithAudio.audio).play();
    } else {
      alert("Audio not available for this word.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // In a larger app, you'd trigger a toast notification here
  };

  const toggleFavorite = (word) => {
    if (favorites.includes(word)) {
      setFavorites(favorites.filter(w => w !== word));
    } else {
      setFavorites([...favorites, word]);
    }
  };

  // === Rendering Helpers ===
  const isFavorite = wordData ? favorites.includes(wordData.word) : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">English Dictionary</h1>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a word to search..."
            className="w-full p-4 pl-6 text-lg rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {loading && (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl text-center">
                <p className="text-lg font-semibold">{error}</p>
              </div>
            )}

            {!loading && !error && !wordData && searchTerm.trim() === '' && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                Start typing to explore the dictionary...
              </div>
            )}

            {!loading && wordData && (
              <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
                
                {/* Word Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-4xl sm:text-5xl font-bold mb-2 capitalize">{wordData.word}</h2>
                    <p className="text-xl text-blue-600 dark:text-blue-400 font-mono">
                      {wordData.phonetic || (wordData.phonetics.find(p => p.text)?.text)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={playAudio}
                      className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                      title="Play Pronunciation"
                    >
                      ▶
                    </button>
                    <button 
                      onClick={() => toggleFavorite(wordData.word)}
                      className={`p-3 rounded-full transition ${isFavorite ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                      title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      ★
                    </button>
                  </div>
                </div>

                {/* Word Origin */}
                {wordData.origin && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-gray-600 dark:text-gray-400">
                    <strong className="block text-gray-800 dark:text-gray-200 mb-1">Origin:</strong>
                    {wordData.origin}
                  </div>
                )}

                {/* Meanings Accordion */}
                <div className="space-y-4">
                  {wordData.meanings.map((meaning, index) => (
                    <details 
                      key={index} 
                      className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                      open={index === 0} // Open the first meaning by default
                    >
                      <summary className="cursor-pointer bg-gray-50 dark:bg-gray-900/50 p-4 font-semibold text-lg list-none flex justify-between items-center select-none">
                        <span className="italic text-blue-600 dark:text-blue-400">{meaning.partOfSpeech}</span>
                        <span className="transition-transform group-open:rotate-180 text-gray-400">▼</span>
                      </summary>
                      
                      <div className="p-4 space-y-6">
                        {meaning.definitions.map((def, idx) => (
                          <div key={idx} className="relative group/def">
                            <div className="flex items-start gap-3">
                              <span className="text-gray-400 font-mono mt-1">{idx + 1}.</span>
                              <div className="flex-1">
                                <p className="text-gray-800 dark:text-gray-200 leading-relaxed pr-8">
                                  {def.definition}
                                </p>
                                {def.example && (
                                  <p className="mt-2 text-gray-500 dark:text-gray-400 italic border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                                    "{def.example}"
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Copy Definition Button */}
                            <button 
                              onClick={() => copyToClipboard(def.definition)}
                              className="absolute top-0 right-0 p-1 text-xs bg-gray-200 dark:bg-gray-700 rounded opacity-0 group-hover/def:opacity-100 transition-opacity"
                              title="Copy Definition"
                            >
                              Copy
                            </button>
                          </div>
                        ))}

                        {/* Synonyms */}
                        {meaning.synonyms?.length > 0 && (
                          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <strong className="text-gray-700 dark:text-gray-300 mr-2">Synonyms:</strong>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {meaning.synonyms.map((syn, i) => (
                                <button 
                                  key={i} 
                                  onClick={() => setSearchTerm(syn)}
                                  className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:underline"
                                >
                                  {syn}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="space-y-8">
            
            {/* Search History */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">History</h3>
                {history.length > 0 && (
                  <button 
                    onClick={() => setHistory([])}
                    className="text-xs text-red-500 hover:text-red-700 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent searches.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((word, idx) => (
                    <li key={idx}>
                      <button 
                        onClick={() => setSearchTerm(word)}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 capitalize transition"
                      >
                        {word}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Favorites */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-4 text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                <span>★</span> Favorites
              </h3>
              {favorites.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Star words to save them here.</p>
              ) : (
                <ul className="space-y-2">
                  {favorites.map((word, idx) => (
                    <li key={idx}>
                      <button 
                        onClick={() => setSearchTerm(word)}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 capitalize transition font-medium"
                      >
                        {word}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}