import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TOOLS, Icons } from '../constants';
import { Tool, ToolCategory } from '../types';

interface ToolCardProps {
  tool: Tool;
  isFav: boolean;
  onToggle: (id: string, e: React.MouseEvent) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, isFav, onToggle }) => {
  const Icon = Icons[tool.icon] || Icons.Code;

  return (
    <Link 
      to={tool.path}
      className="block p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all group relative"
    >
      <button 
        onClick={(e) => onToggle(tool.id, e)}
        className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600 hover:text-yellow-400'}`}
      >
        <Icons.Star className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
           <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-1">{tool.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{tool.desc}</p>
        </div>
      </div>
    </Link>
  );
};

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavs = favorites.includes(id) 
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('favorites', JSON.stringify(newFavs));
  };

  const filteredTools = TOOLS.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, Tool[]>);

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Search */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          测试工程师 <span className="text-blue-600">常用工具站</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          测试工程师 (QA) 日常辅助工具集合。提供数据格式化、URL 解析、日志分析及测试数据生成等功能。
        </p>
        
        <div className="max-w-xl mx-auto relative mt-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icons.Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-gray-300 dark:border-slate-600 rounded-full leading-5 bg-white dark:bg-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg shadow-sm"
            placeholder="搜索工具 (例如 'json', '时间', '正则')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && !searchTerm && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icons.Star className="w-5 h-5 text-yellow-400 fill-current" />
            我的收藏
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.filter(t => favorites.includes(t.id)).map(tool => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                isFav={true}
                onToggle={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Tools grouped by category */}
      {Object.entries(groupedTools).map(([category, tools]) => (
        <section key={category}>
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-gray-200 dark:border-slate-700 pb-2">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(tool => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                isFav={favorites.includes(tool.id)}
                onToggle={toggleFavorite}
              />
            ))}
          </div>
        </section>
      ))}

      {filteredTools.length === 0 && (
         <div className="text-center py-10 text-gray-500">
           未找到匹配的工具 "{searchTerm}"
         </div>
      )}
    </div>
  );
};

export default Home;