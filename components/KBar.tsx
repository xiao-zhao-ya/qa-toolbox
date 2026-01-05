import React from 'react';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  Action,
} from 'kbar';
import { useNavigate } from 'react-router-dom';
import { TOOLS } from '../constants';
import { pinyin } from 'pinyin-pro';

const KBar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = React.useState<string[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
    
    // Listen for storage changes to keep favorites in sync across components
    const handleStorage = () => {
      const updated = localStorage.getItem('favorites');
      if (updated) {
        setFavorites(JSON.parse(updated));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const actions: Action[] = TOOLS.map((tool) => {
    const isFav = favorites.includes(tool.id);
    const namePinyin = pinyin(tool.name, { toneType: 'none' }).replace(/\s/g, '');
    const firstLetters = pinyin(tool.name, { pattern: 'first', toneType: 'none' }).replace(/\s/g, '');
    
    return {
      id: tool.id,
      name: tool.name,
      shortcut: [],
      keywords: `${tool.desc} ${namePinyin} ${firstLetters}`,
      perform: () => navigate(tool.path),
      section: isFav ? '我的收藏' : tool.category,
      // Priority boost for favorites to show them first
      priority: isFav ? 10 : 0,
    };
  });
// Note: kbar by default sorts by priority then by section order of discovery. 
// We should probably sort the actions themselves before passing them to KBarProvider if needed, 
// but kbar handles sections quite well.
  
  // Custom action sorting to ensure '我的收藏' section comes first
  const sortedActions = [...actions].sort((a, b) => {
    if (a.section === '我的收藏' && b.section !== '我的收藏') return -1;
    if (a.section !== '我的收藏' && b.section === '我的收藏') return 1;
    return 0;
  });

  return (
    <KBarProvider actions={sortedActions}>
      <KBarPortal>
        <KBarPositioner className="z-[99] bg-black/40 backdrop-blur-sm">
          <KBarAnimator className="w-full max-w-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
              <KBarSearch className="w-full bg-transparent border-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400" defaultPlaceholder="搜索工具..." />
            </div>
            <div className="max-h-[400px] overflow-y-auto pb-2">
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
};

function RenderResults() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item}</div>
        ) : (
          <div
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              active ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600' : 'transparent'
            }`}
          >
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {item.name}
              </span>
              {item.keywords && (
                <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
                  {item.keywords.split(' ')[0]}
                </span>
              )}
            </div>
            {item.shortcut?.length ? (
              <div className="flex gap-1">
                {item.shortcut.map((sc) => (
                  <kbd key={sc} className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                    {sc}
                  </kbd>
                ))}
              </div>
            ) : null}
          </div>
        )
      }
    />
  );
}

export default KBar;
