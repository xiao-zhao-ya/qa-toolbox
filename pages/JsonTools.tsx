import React, { useState } from 'react';

type Tab = 'format' | 'diff' | 'path';

const JsonTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('format');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // For Diff
  const [diffA, setDiffA] = useState('');
  const [diffB, setDiffB] = useState('');
  const [diffResult, setDiffResult] = useState<React.ReactNode | null>(null);

  const formatJson = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const minifyJson = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

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
                <div key={i} className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-gray-100 dark:border-slate-800 opacity-60">
                    <div className="overflow-hidden truncate px-1">{lineA}</div>
                    <div className="overflow-hidden truncate px-1">{lineB}</div>
                </div>
            );
        } else {
             resultElements.push(
                <div key={i} className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-gray-100 dark:border-slate-800 bg-red-50 dark:bg-red-900/20">
                    <div className={`overflow-hidden truncate px-1 ${lineA && 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>{lineA || <span className="text-gray-300">空</span>}</div>
                    <div className={`overflow-hidden truncate px-1 ${lineB && 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'}`}>{lineB || <span className="text-gray-300">空</span>}</div>
                </div>
            );
        }
    }
    setDiffResult(resultElements);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2">
         <div className="flex space-x-4">
            {(['format', 'diff'] as Tab[]).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    {tab === 'format' ? '格式化 / 校验' : '行对比'}
                </button>
            ))}
         </div>
      </div>

      {activeTab === 'format' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">JSON 原文</label>
                <div className="space-x-2">
                     <button onClick={clear} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">清空</button>
                     <button 
                        onClick={() => navigator.clipboard.readText().then(text => setInput(text))}
                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    >
                        粘贴
                    </button>
                </div>
            </div>
            <textarea
              className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder='{"key": "value"}'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {/* Actions & Output */}
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center h-[28px]">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">结果</label>
                <div className="flex gap-2">
                    <button onClick={minifyJson} className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-xs rounded hover:bg-gray-300 dark:hover:bg-slate-600">压缩</button>
                    <button onClick={formatJson} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow-sm">格式化</button>
                </div>
             </div>
             <div className="relative flex-1">
                {error ? (
                    <div className="absolute inset-0 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 font-mono text-sm overflow-auto">
                        <strong>JSON 格式错误:</strong>
                        <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
                    </div>
                ) : (
                    <textarea
                        readOnly
                        className="w-full h-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-700 dark:text-green-400 focus:outline-none resize-none"
                        value={output}
                        placeholder="格式化后的 JSON 将显示在这里..."
                    />
                )}
                 {!error && output && (
                    <button 
                        onClick={() => navigator.clipboard.writeText(output)}
                        className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-slate-800/80 rounded shadow text-gray-500 hover:text-blue-600"
                        title="复制"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                 )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'diff' && (
          <div className="flex flex-col h-full gap-4">
              <div className="grid grid-cols-2 gap-4 h-1/3">
                  <textarea 
                    className="p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 font-mono text-xs resize-none"
                    placeholder="文本 A"
                    value={diffA}
                    onChange={e => setDiffA(e.target.value)}
                  />
                  <textarea 
                    className="p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 font-mono text-xs resize-none"
                    placeholder="文本 B"
                    value={diffB}
                    onChange={e => setDiffB(e.target.value)}
                  />
              </div>
              <div>
                  <button onClick={runDiff} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">对比</button>
              </div>
              <div className="flex-1 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 overflow-auto p-2">
                  {diffResult}
              </div>
          </div>
      )}
    </div>
  );
};

export default JsonTools;