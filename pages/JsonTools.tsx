import React, { useState } from 'react';
import { format as formatSqlString } from 'sql-formatter';

type FormatTab = 'json' | 'sql';

const JsonTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FormatTab>('json');
  
  // JSON State
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // SQL State
  const [sqlInput, setSqlInput] = useState('');
  const [sqlOutput, setSqlOutput] = useState('');
  const [sqlError, setSqlError] = useState<string | null>(null);

  // --- JSON Logic ---
  const formatJson = () => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
      setJsonOutput('');
    }
  };

  const minifyJson = () => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
      setJsonOutput('');
    }
  };

  const clearJson = () => {
    setJsonInput('');
    setJsonOutput('');
    setJsonError(null);
  };

  // --- SQL Logic ---
  const formatSql = () => {
    try {
        if (!sqlInput.trim()) return;
        // 使用 sql-formatter 格式化，支持大部分标准 SQL
        const formatted = formatSqlString(sqlInput, {
            language: 'sql',
            tabWidth: 4,
            keywordCase: 'upper',
            linesBetweenQueries: 2
        });
        setSqlOutput(formatted);
        setSqlError(null);
    } catch (e: any) {
        setSqlError("SQL 格式化错误: " + e.message);
        setSqlOutput('');
    }
  };

  const clearSql = () => {
    setSqlInput('');
    setSqlOutput('');
    setSqlError(null);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2">
        <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'json' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            JSON 格式化
        </button>
        <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sql' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            SQL 格式化
        </button>
      </div>

      {activeTab === 'json' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
            {/* JSON Input */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">JSON 原文</label>
                    <div className="space-x-2">
                        <button onClick={clearJson} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">清空</button>
                        <button 
                            onClick={() => navigator.clipboard.readText().then(text => setJsonInput(text))}
                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        >
                            粘贴
                        </button>
                    </div>
                </div>
                <textarea
                className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder='{"key": "value"}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                />
            </div>

            {/* JSON Output */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center h-[28px]">
                    <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">结果</label>
                    <div className="flex gap-2">
                        <button onClick={minifyJson} className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-xs rounded hover:bg-gray-300 dark:hover:bg-slate-600">压缩</button>
                        <button onClick={formatJson} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow-sm">格式化</button>
                    </div>
                </div>
                <div className="relative flex-1">
                    {jsonError ? (
                        <div className="absolute inset-0 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 font-mono text-sm overflow-auto">
                            <strong>JSON 格式错误:</strong>
                            <pre className="mt-2 whitespace-pre-wrap">{jsonError}</pre>
                        </div>
                    ) : (
                        <textarea
                            readOnly
                            className="w-full h-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-700 dark:text-green-400 focus:outline-none resize-none"
                            value={jsonOutput}
                            placeholder="格式化后的 JSON 将显示在这里..."
                        />
                    )}
                    {!jsonError && jsonOutput && (
                        <button 
                            onClick={() => navigator.clipboard.writeText(jsonOutput)}
                            className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-slate-800/80 rounded shadow text-gray-500 hover:text-blue-600"
                            title="复制"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
             {/* SQL Input */}
             <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">SQL 原文</label>
                    <div className="space-x-2">
                        <button onClick={clearSql} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">清空</button>
                        <button 
                            onClick={() => navigator.clipboard.readText().then(text => setSqlInput(text))}
                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        >
                            粘贴
                        </button>
                    </div>
                </div>
                <textarea
                    className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    placeholder="SELECT * FROM table WHERE id = 1..."
                    value={sqlInput}
                    onChange={(e) => setSqlInput(e.target.value)}
                />
            </div>

            {/* SQL Output */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center h-[28px]">
                    <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">结果</label>
                    <button onClick={formatSql} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow-sm">
                        格式化
                    </button>
                </div>
                <div className="relative flex-1">
                    {sqlError ? (
                        <div className="absolute inset-0 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 font-mono text-sm overflow-auto">
                            <strong>错误:</strong>
                            <pre className="mt-2 whitespace-pre-wrap">{sqlError}</pre>
                        </div>
                    ) : (
                        <textarea
                            readOnly
                            className="w-full h-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-700 dark:text-green-400 focus:outline-none resize-none"
                            value={sqlOutput}
                            placeholder="美化后的 SQL 将显示在这里..."
                        />
                    )}
                    {!sqlError && sqlOutput && (
                        <button 
                            onClick={() => navigator.clipboard.writeText(sqlOutput)}
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
    </div>
  );
};

export default JsonTools;