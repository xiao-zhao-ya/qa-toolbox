import React, { useState } from 'react';

const TextDiff: React.FC = () => {
  const [diffA, setDiffA] = useState('');
  const [diffB, setDiffB] = useState('');
  const [diffResult, setDiffResult] = useState<React.ReactNode | null>(null);

  // Simple line-by-line diff implementation
  const runDiff = () => {
    const linesA = diffA.split('\n');
    const linesB = diffB.split('\n');
    const maxLines = Math.max(linesA.length, linesB.length);
    const resultElements = [];

    for (let i = 0; i < maxLines; i++) {
        const lineA = linesA[i] || '';
        const lineB = linesB[i] || '';
        
        if (lineA === lineB) {
            resultElements.push(
                <div key={i} className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-gray-100 dark:border-slate-800 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="overflow-hidden truncate px-1 text-gray-500">{i + 1} | {lineA}</div>
                    <div className="overflow-hidden truncate px-1 text-gray-500">{i + 1} | {lineB}</div>
                </div>
            );
        } else {
             resultElements.push(
                <div key={i} className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-gray-100 dark:border-slate-800 bg-yellow-50 dark:bg-yellow-900/10">
                    <div className={`overflow-hidden truncate px-1 py-0.5 ${lineA ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-slate-800/50'}`}>
                        <span className="select-none text-gray-400 mr-2">{i + 1}</span>
                        {lineA || <span className="text-gray-300 italic">(空)</span>}
                    </div>
                    <div className={`overflow-hidden truncate px-1 py-0.5 ${lineB ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-slate-800/50'}`}>
                        <span className="select-none text-gray-400 mr-2">{i + 1}</span>
                        {lineB || <span className="text-gray-300 italic">(空)</span>}
                    </div>
                </div>
            );
        }
    }
    setDiffResult(resultElements);
  };

  const clear = () => {
    setDiffA('');
    setDiffB('');
    setDiffResult(null);
  };

  return (
    <div className="flex flex-col h-full gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">文本对比工具</h2>
                <p className="text-sm text-gray-500">按行对比两个文本或表格内容的差异。</p>
            </div>
            <div className="space-x-2">
                <button 
                    onClick={clear}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    清空
                </button>
                <button 
                    onClick={runDiff} 
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                    开始对比
                </button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 h-1/3 min-h-[200px]">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">原始文本 (A)</label>
                <textarea 
                  className="flex-1 w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs resize-none"
                  placeholder="在此输入文本 A..."
                  value={diffA}
                  onChange={e => setDiffA(e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">对比文本 (B)</label>
                <textarea 
                  className="flex-1 w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs resize-none"
                  placeholder="在此输入文本 B..."
                  value={diffB}
                  onChange={e => setDiffB(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 min-h-0">
            <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">对比结果</label>
            <div className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 overflow-auto p-2">
                {diffResult ? (
                    <div className="w-full">
                        {diffResult}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        点击“开始对比”查看结果
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default TextDiff;
