import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Heart, Book as BookIcon, ChevronDown, Check, 
  Menu, X, Info, Search, Save, FileText, ChevronRight, Hash
} from 'lucide-react';


const TOPICS = [
  { name: 'All Verses', books: null, description: 'Random verses from the entire Bible' },
  { name: 'Love', books: 'SNG,1JN,RUT,HOS,1CO', description: 'Explore verses about God\'s love and loving others' },
  { name: 'Joy', books: 'PHP,PSA,NEH', description: 'Scripture celebrating joy and rejoicing in the Lord' },
  { name: 'Peace', books: 'ROM,JHN,ISA', description: 'Finding peace and tranquility in God\'s presence' },
  { name: 'Patience', books: 'JAS,JOB,2PE', description: 'Verses on waiting and endurance' },
  { name: 'Righteousness', books: 'ROM,GAL,HEB,PRO', description: 'Living a righteous and just life' },
  { name: 'Jealousy', books: 'GEN,1SA,PRO,SNG', description: 'Navigating envy and finding contentment' },
  { name: 'Sin', books: 'ROM,JDG,LEV', description: 'Understanding sin and redemption' },
  { name: 'Wisdom', books: 'PRO,ECC,JOB,JAS', description: 'Seeking godly wisdom and understanding' },
  { name: 'Faith', books: 'HEB,ROM,JAS,GAL', description: 'Building and maintaining strong faith' },
  { name: 'Hope', books: '1PE,ROM,PSA,LAM', description: 'Finding hope in difficult times' },
  { name: 'Courage', books: 'JOS,ACT,DAN', description: 'Standing firm with godly courage' },
  { name: 'Comfort', books: '2CO,PSA,ISA', description: 'God\'s comfort in times of sorrow' }
];

export default function BibleApp() {
  const [activeTab, setActiveTab] = useState('read'); // 'read', 'favourites', 'reflections'
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]); 
  const [chaptersLoaded, setChaptersLoaded] = useState([]); // [{ id, isRandom: true, verses: [] }]
  const [loading, setLoading] = useState(false);
  
  // App state
  const [favourites, setFavourites] = useState({}); // { 'id': { verse obj } }
  const [reflections, setReflections] = useState([]); // [{id: num, date: string, verseObj, reflectionText}]
  
  // Nav
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  const mainScrollRef = useRef(null);
  const bottomRef = useRef(null);

  const fetchRandomBatch = async (topic = activeTopic) => {
    try {
      setLoading(true);
      const url = topic.books 
         ? `https://bible-api.com/data/kjv/random/${topic.books}`
         : `https://bible-api.com/data/kjv/random`;

      const requests = Array.from({ length: 5 }).map(() =>
        fetch(url).then(res => res.json())
      );
      const results = await Promise.all(requests);
      
      const newBatch = {
        id: `random_${Date.now()}`,
        isRandom: true,
        verses: results.map((data, i) => {
           const v = data.random_verse;
           return {
              id: `${v.book}_${v.chapter}_${v.verse}_${Date.now()}_${i}`,
              book_name: v.book,
              chapter: v.chapter,
              verse: v.verse,
              text: v.text.trim(),
              full_ref: `${v.book} ${v.chapter}:${v.verse}`
           };
        })
      };
      
      setChaptersLoaded(prev => [...prev, newBatch]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load or topic change
  useEffect(() => {
    setChaptersLoaded([]);
    fetchRandomBatch(activeTopic);
    if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!bottomRef.current || loading || activeTab !== 'read') return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && chaptersLoaded.length > 0) {
        fetchRandomBatch();
      }
    }, { root: mainScrollRef.current, rootMargin: '200px' });

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [chaptersLoaded, loading, activeTab]);

  const selectTopic = (topic) => {
    setIsNavOpen(false);
    setActiveTopic(topic);
    setActiveTab('read');
  };

  const toggleFavourite = (verse) => {
    setFavourites(prev => {
      const copy = { ...prev };
      if (copy[verse.id]) delete copy[verse.id];
      else copy[verse.id] = verse;
      return copy;
    });
  };

  const addReflection = (verse, text) => {
    const newRefl = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      verseObj: verse,
      reflectionText: text
    };
    setReflections(prev => [newRefl, ...prev]);
  };

  return (
    <div className="bg-slate-900 text-slate-100 h-[100dvh] font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-100 overflow-hidden">
      
      {/* Top Header Sticky */}
      <header className="shrink-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-sm flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <BookIcon className="text-amber-500 w-6 h-6" />
          <h1 className="text-lg font-semibold tracking-wide text-slate-50 uppercase shadow-2xl">
            {activeTab === 'read' ? activeTopic.name : 
             activeTab === 'favourites' ? 'Favourites' : 'Reflections'}
          </h1>
        </div>
        <button 
          onClick={() => setIsNavOpen(true)}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition flex items-center gap-2 text-amber-500 font-medium text-sm"
        >
          <Hash className="w-4 h-4" /> Topics
        </button>
      </header>

      {/* Main Content Area */}
      <main ref={mainScrollRef} className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 overflow-y-auto snap-y snap-mandatory scroll-smooth pb-32 no-scrollbar md:custom-scrollbar">
        {activeTab === 'read' && (
          <div className="space-y-8 pb-10">
            {chaptersLoaded.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                 <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                 <p>Finding verses about <strong>{activeTopic.name}</strong>...</p>
              </div>
            )}
            
            {chaptersLoaded.map((batch) => (
              <div key={batch.id} className="pt-2">
                <div className="space-y-16">
                  {batch.verses.map(v => (
                    <div 
                      key={v.id} 
                      className="chapter-marker snap-center snap-always min-h-[70vh] flex flex-col justify-center py-4" 
                    >
                      <h4 className="text-amber-500 font-serif mb-4 px-2 text-xl font-medium tracking-wide">{v.full_ref}</h4>
                      <VerseCard 
                         verse={v} 
                         isFav={!!favourites[v.id]}
                         onToggleFav={() => toggleFavourite(v)}
                         onSaveReflection={(text) => addReflection(v, text)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            )}
            
            <div ref={bottomRef} className="h-20 w-full" />
          </div>
        )}

        {activeTab === 'favourites' && (
          <div className="space-y-8">
            {Object.values(favourites).length === 0 ? (
               <div className="text-center text-slate-500 py-12">No favourites saved yet.</div>
            ) : (
               Object.values(favourites)
               .sort((a,b) => a.id.localeCompare(b.id))
               .map(v => (
                  <div key={v.id} className="pt-2">
                    <h4 className="text-amber-500 font-serif mb-4 px-2 text-xl font-medium tracking-wide">{v.full_ref}</h4>
                    <VerseCard 
                      verse={v} isFav={true}
                      onToggleFav={() => toggleFavourite(v)}
                      onSaveReflection={(text) => addReflection(v, text)}
                    />
                  </div>
               ))
            )}
          </div>
        )}

        {activeTab === 'reflections' && (
          <div className="space-y-8">
            {reflections.length === 0 ? (
               <div className="text-center text-slate-500 py-12">No reflections written yet.</div>
            ) : (
               reflections.map(r => (
                  <div key={r.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{r.date}</span>
                       <span className="text-amber-500/80 text-sm font-medium">
                         {r.verseObj.full_ref}
                       </span>
                    </div>
                    <blockquote className="border-l-2 border-slate-600 pl-4 mb-6 italic text-slate-300 font-serif">
                       "{r.verseObj.text}"
                    </blockquote>
                    <div className="text-slate-100 text-lg leading-relaxed whitespace-pre-wrap font-serif">
                      {r.reflectionText}
                    </div>
                  </div>
               ))
            )}
          </div>
        )}
      </main>

      {/* Navigation Modal via Topics */}
      {isNavOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-6 pt-2">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Explore Topics</h2>
              <p className="text-sm text-slate-400 mt-1">Discover verses grouped by theme</p>
            </div>
            <button onClick={() => setIsNavOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 pb-10 custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {TOPICS.map(topic => (
                 <button
                   key={topic.name}
                   onClick={() => selectTopic(topic)}
                   className={`bg-slate-800 border p-4 rounded-xl text-left transition flex flex-col gap-1 ${
                      activeTopic.name === topic.name 
                        ? 'border-amber-500 bg-amber-500/10' 
                        : 'border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/80'
                   }`}
                 >
                   <div className="flex justify-between items-center text-slate-200 font-semibold text-lg tracking-wide">
                     <span>{topic.name}</span>
                     {activeTopic.name === topic.name && <Check className="w-5 h-5 text-amber-500" />}
                   </div>
                   <span className="text-slate-400 text-sm">{topic.description}</span>
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Bottom Tabs */}
      <footer className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 shadow-2xl z-40 pb-4">
        <div className="flex justify-around items-center px-2 py-3">
          <TabButton icon={<BookOpen />} label="Read" isActive={activeTab === 'read'} onClick={() => setActiveTab('read')} />
          <TabButton icon={<Heart />} label="Favs" isActive={activeTab === 'favourites'} onClick={() => setActiveTab('favourites')} />
          <TabButton icon={<FileText />} label="Reflect" isActive={activeTab === 'reflections'} onClick={() => setActiveTab('reflections')} />
        </div>
      </footer>
    </div>
  );
}

// Separate VerseCard Component for cleaner rendering
function VerseCard({ verse, isFav, onToggleFav, onSaveReflection }) {
  const [expandReflect, setExpandReflect] = useState(false);
  const [localReflect, setLocalReflect] = useState("");

  const handleSaveReflection = () => {
    if (localReflect.trim()) {
      onSaveReflection(localReflect);
      setLocalReflect("");
      setExpandReflect(false);
    }
  };

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 md:p-6 border border-slate-700/50 hover:border-slate-600 transition group cascade-fade-in shadow-lg hover:shadow-xl w-full">
      <div className="flex gap-3 md:gap-4">
        <div className="min-w-6 md:min-w-8 pt-1 text-right">
          <span className="text-amber-500/80 font-semibold text-sm md:text-base">{verse.verse}</span>
        </div>
        <div className="flex-1">
          <p className="text-slate-200 font-serif leading-relaxed text-lg md:text-xl md:leading-loose tracking-wide">
            {verse.text}
          </p>
          
          {/* Action Row */}
          <div className="flex items-center gap-2 mt-6 border-t border-slate-700/50 pt-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onToggleFav}
              className={`p-2 rounded-full transition ${isFav ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
              title="Favourite"
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => { setExpandReflect(!expandReflect); }}
              className="px-4 py-2 rounded-full text-sm font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Reflect
            </button>
          </div>

          {/* Reflection Editor */}
          {expandReflect && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              <textarea 
                value={localReflect}
                onChange={(e) => setLocalReflect(e.target.value)}
                placeholder="Write a deeper reflection or journal entry for this verse. This gets added to your Reflections feed..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 md:p-4 text-sm md:text-base text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none h-32"
              />
              <div className="flex justify-end gap-3 mt-3">
                <button onClick={() => setExpandReflect(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleSaveReflection} className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-md transition flex items-center">
                  <Save className="w-4 h-4 mr-2" /> Post Reflection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-all ${isActive ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5 md:w-6 md:h-6' })}
      </div>
      <span className="text-[10px] md:text-xs font-medium tracking-wide">{label}</span>
    </button>
  );
}
