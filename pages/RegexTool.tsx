import React, { useState, useMemo } from 'react';

type Tab = 'test' | 'generate';

interface GeneratedRegex {
  label: string;
  pattern: string;
  desc: string;
}

const RegexTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('test');

  // --- State for Testing ---
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gm');
  const [text, setText] = useState('test@example.com\nhello@world.org\n123-456-7890');

  // --- State for Generation ---
  const [genSource, setGenSource] = useState('Order ID: 20231024-XA Status: Success');
  const [genTarget, setGenTarget] = useState('20231024-XA');
  const [genResults, setGenResults] = useState<GeneratedRegex[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  // --- Logic for Testing ---
  const matches = useMemo(() => {
    if (!pattern) return [];
    try {
        const regex = new RegExp(pattern, flags);
        if (!flags.includes('g')) {
            const m = text.match(regex);
            return m ? [{ index: m.index, match: m[0], groups: m.slice(1) }] : [];
        }
        const results = [];
        let match;
        regex.lastIndex = 0; 
        while ((match = regex.exec(text)) !== null) {
            results.push({
                index: match.index,
                match: match[0],
                groups: match.slice(1)
            });
            if (regex.lastIndex === match.index) {
                regex.lastIndex++;
            }
        }
        return results;
    } catch (e) {
        return [];
    }
  }, [pattern, flags, text]);

  // --- Logic for Generation ---
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const handleGenerate = () => {
    setGenResults([]);
    setGenError(null);

    if (!genSource || !genTarget) return;
    if (!genSource.includes(genTarget)) {
        setGenError('错误：目标文本必须存在于源文本中。');
        return;
    }

    const suggestions: GeneratedRegex[] = [];
    const escapedTarget = escapeRegExp(genTarget);

    // 1. Literal Match (精确匹配)
    suggestions.push({
        label: '精确匹配',
        pattern: escapedTarget,
        desc: '仅匹配完全相同的字符串，特殊字符已转义。'
    });

    // 2. Data Type Inference (类型推断)
    if (/^\d+$/.test(genTarget)) {
        suggestions.push({ label: '纯数字', pattern: '\\d+', desc: '匹配任意连续数字。' });
    } else if (/^[a-zA-Z]+$/.test(genTarget)) {
        suggestions.push({ label: '纯字母', pattern: '[a-zA-Z]+', desc: '匹配任意连续字母。' });
    } else if (/^[a-zA-Z0-9]+$/.test(genTarget)) {
        suggestions.push({ label: '数字字母组合', pattern: '[a-zA-Z0-9]+', desc: '匹配数字和字母。' });
    } else if (/^[\w-]+$/.test(genTarget)) {
         suggestions.push({ label: '单词字符', pattern: '[\\w-]+', desc: '匹配字母、数字、下划线或横杠。' });
    }

    // 3. Contextual Match (上下文提取)
    const index = genSource.indexOf(genTarget);
    
    // Left Context (Prefix)
    // Find the nearest "boundary" character before the target (space, colon, etc.)
    const prefixStr = genSource.substring(0, index);
    const suffixStr = genSource.substring(index + genTarget.length);

    // Try to find a meaningful anchor (e.g., "ID: " or "key=")
    // Grab up to 10 chars, trim spaces, but keep the delimiter
    const meaningfulPrefixMatch = prefixStr.match(/([a-zA-Z0-9_]+[:=]\s*)$/); 
    
    if (meaningfulPrefixMatch) {
        const prefix = escapeRegExp(meaningfulPrefixMatch[1]);
        suggestions.push({
            label: '基于前缀提取',
            pattern: `${prefix}(.*?)`,
            desc: `匹配 "${meaningfulPrefixMatch[1]}" 之后的内容 (捕获组 1)。`
        });
        
        // Zero-width lookbehind (Advanced)
        suggestions.push({
            label: '零宽断言 (Lookbehind)',
            pattern: `(?<=${prefix}).*?`,
            desc: `仅匹配值，不包含前缀 "${meaningfulPrefixMatch[1]}" (部分浏览器支持)。`
        });
    } else {
        // Fallback: simple surrounding non-whitespace
        const lastSpaceIndex = prefixStr.lastIndexOf(' ');
        if (lastSpaceIndex !== -1 && index - lastSpaceIndex < 15) {
             const shortPrefix = escapeRegExp(prefixStr.substring(lastSpaceIndex + 1));
             if (shortPrefix) {
                 suggestions.push({
                    label: '基于前文边界',
                    pattern: `${shortPrefix}(.*?)`,
                    desc: `根据前一个单词定位。`
                 });
             }
        }
    }

    // 4. Wildcard in the middle (Structure inference)
    // If target looks like "2023-10-24", suggest "\d{4}-\d{2}-\d{2}"
    if (/^\d{4}-\d{2}-\d{2}$/.test(genTarget)) {
        suggestions.push({ label: '日期格式 (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', desc: '标准日期格式。' });
    }
    
    setGenResults(suggestions);
  };

  const applyGenerated = (p: string) => {
      setPattern(p);
      setText(genSource); // Also copy source to test area
      setActiveTab('test');
  };

  return (
    <div className="h-full flex flex-col gap-4">
        {/* Tab Switcher */}
        <div className="flex space-x-4 border-b border-gray-200 dark:border-slate-700 pb-2">
            <button
                onClick={() => setActiveTab('test')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'test' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                正则测试 (Test)
            </button>
            <button
                onClick={() => setActiveTab('generate')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'generate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                正则生成 (Generate)
            </button>
        </div>

        {/* --- Tab: Test --- */}
        {activeTab === 'test' && (
            <div className="flex-1 flex flex-col gap-6">
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
                        { name: '日期 YYYY-MM-DD', p: '\\d{4}-\\d{2}-\\d{2}' },
                        { name: '中文', p: '[\\u4e00-\\u9fa5]+' },
                        { name: '身份证', p: '\\d{17}[\\dXx]' }
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
        )}

        {/* --- Tab: Generate --- */}
        {activeTab === 'generate' && (
             <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                    <strong>使用说明：</strong> 输入完整的“源文本”，然后输入你想从中提取的“目标内容”。工具将分析并生成可提取该内容的正则表达式建议。
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="font-semibold text-sm text-gray-600 dark:text-slate-300">源文本 (Source)</label>
                        <textarea 
                            className="w-full h-32 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none resize-none font-mono text-sm"
                            value={genSource}
                            onChange={e => setGenSource(e.target.value)}
                            placeholder="例如：Order ID: 2023-12345 Created successfully."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="font-semibold text-sm text-gray-600 dark:text-slate-300">想要提取的内容 (Match)</label>
                        <textarea 
                            className="w-full h-32 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none resize-none font-mono text-sm"
                            value={genTarget}
                            onChange={e => setGenTarget(e.target.value)}
                            placeholder="例如：2023-12345"
                        />
                    </div>
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={handleGenerate}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        生成正则
                    </button>
                </div>

                {genError && (
                    <div className="text-red-500 text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {genError}
                    </div>
                )}

                {genResults.length > 0 && (
                    <div className="space-y-3 mt-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">生成建议</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {genResults.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full font-bold">
                                                {item.label}
                                            </span>
                                        </div>
                                        <code className="block bg-gray-100 dark:bg-slate-900 px-3 py-2 rounded text-sm font-mono text-slate-800 dark:text-green-400 break-all border border-gray-200 dark:border-slate-700">
                                            {item.pattern}
                                        </code>
                                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(item.pattern)}
                                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                                        >
                                            复制
                                        </button>
                                        <button 
                                            onClick={() => applyGenerated(item.pattern)}
                                            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm"
                                        >
                                            去测试
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
        )}
    </div>
  );
};

export default RegexTool;