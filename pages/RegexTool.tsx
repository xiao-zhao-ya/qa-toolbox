import React, { useState, useMemo } from 'react';

const RegexTool: React.FC = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gm');
  const [text, setText] = useState('test@example.com\nhello@world.org\n123-456-7890');
  
  const matches = useMemo(() => {
    if (!pattern) return [];
    try {
        const regex = new RegExp(pattern, flags);
        // If global flag is not set, match only once
        if (!flags.includes('g')) {
            const m = text.match(regex);
            return m ? [{ index: m.index, match: m[0], groups: m.slice(1) }] : [];
        }
        const results = [];
        let match;
        // Reset lastIndex just in case
        regex.lastIndex = 0; 
        // Need to loop manually for 'g' to get all details
        while ((match = regex.exec(text)) !== null) {
            results.push({
                index: match.index,
                match: match[0],
                groups: match.slice(1)
            });
            if (regex.lastIndex === match.index) {
                regex.lastIndex++; // Avoid infinite loops with zero-width matches
            }
        }
        return results;
    } catch (e) {
        return [];
    }
  }, [pattern, flags, text]);

  // Highlights simple implementation (limited for this demo)
  // A robust highlighter requires complex text node splitting.
  // We will display matches in a list instead for robustness in this code block.

  return (
    <div className="h-full flex flex-col gap-6">
        {/* Regex Input */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex gap-4 items-center shrink-0">
            <div className="flex-1 flex items-center gap-2 text-lg font-mono bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded px-3 py-2">
                <span className="text-gray-400">/</span>
                <input 
                    type="text" 
                    className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-gray-400"
                    placeholder="正则表达式..."
                    value={pattern}
                    onChange={e => setPattern(e.target.value)}
                />
                <span className="text-gray-400">/</span>
                <input 
                    type="text" 
                    className="w-16 bg-transparent outline-none text-slate-900 dark:text-slate-100 text-sm"
                    placeholder="flags"
                    value={flags}
                    onChange={e => setFlags(e.target.value)}
                />
            </div>
        </div>

        {/* Quick Templates */}
        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
            {[
                { name: 'Email', p: '[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}' },
                { name: 'IPv4', p: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b' },
                { name: '日期 YYYY-MM-DD', p: '\\d{4}-\\d{2}-\\d{2}' }
            ].map(t => (
                <button 
                    key={t.name}
                    onClick={() => setPattern(t.p)}
                    className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap"
                >
                    {t.name}
                </button>
            ))}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
            {/* Test String */}
            <div className="flex flex-col gap-2 h-full">
                <label className="font-semibold text-sm text-gray-500">测试文本</label>
                <textarea 
                    className="flex-1 w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none resize-none font-mono text-sm"
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
            </div>

            {/* Matches */}
            <div className="flex flex-col gap-2 h-full min-h-0">
                <div className="flex justify-between items-center">
                    <label className="font-semibold text-sm text-gray-500">匹配结果 ({matches.length})</label>
                </div>
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-2 space-y-2">
                    {matches.length === 0 && pattern && (
                        <div className="text-center text-gray-400 mt-10 text-sm">未找到匹配项。</div>
                    )}
                    {matches.map((m, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-gray-100 dark:border-slate-700 text-sm font-mono">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-blue-600">匹配 {i + 1}</span>
                                <span className="text-xs text-gray-400">位置: {m.index}</span>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-slate-800 dark:text-slate-200 break-all mb-2">
                                {m.match}
                            </div>
                            {m.groups.length > 0 && (
                                <div className="space-y-1">
                                    {m.groups.map((g, gi) => (
                                        <div key={gi} className="flex gap-2 text-xs">
                                            <span className="text-gray-500 w-16">分组 {gi + 1}:</span>
                                            <span className="text-gray-700 dark:text-gray-300">{g}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default RegexTool;