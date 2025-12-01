import React, { useState } from 'react';

type Mode = 'base64' | 'url' | 'html';

const EncodeDecode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Mode>('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // --- Helpers ---

  // Base64 with UTF-8 support
  const toBase64 = (str: string) => {
    return window.btoa(unescape(encodeURIComponent(str)));
  };

  const fromBase64 = (str: string) => {
    return decodeURIComponent(escape(window.atob(str)));
  };

  // HTML Entities
  const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const unescapeHtml = (safe: string) => {
    return safe
         .replace(/&amp;/g, "&")
         .replace(/&lt;/g, "<")
         .replace(/&gt;/g, ">")
         .replace(/&quot;/g, '"')
         .replace(/&#039;/g, "'");
  };

  const handleAction = (action: 'encode' | 'decode') => {
    setError(null);
    try {
        if (!input) {
            setOutput('');
            return;
        }

        let res = '';
        switch (activeTab) {
            case 'base64':
                res = action === 'encode' ? toBase64(input) : fromBase64(input);
                break;
            case 'url':
                res = action === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input);
                break;
            case 'html':
                res = action === 'encode' ? escapeHtml(input) : unescapeHtml(input);
                break;
        }
        setOutput(res);
    } catch (e: any) {
        setError("处理失败: " + e.message);
    }
  };

  const getTitle = () => {
      switch (activeTab) {
          case 'base64': return 'Base64';
          case 'url': return 'URL';
          case 'html': return 'HTML 实体';
      }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2">
        {(['base64', 'url', 'html'] as Mode[]).map((tab) => (
            <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null); setInput(''); setOutput(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                {tab === 'base64' ? 'Base64' : tab === 'url' ? 'URL 编码' : 'HTML 实体'}
            </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
         {/* Input */}
         <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center">
                 <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">原始文本</label>
                 <div className="space-x-2">
                     <button onClick={() => setInput('')} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">清空</button>
                     <button onClick={() => navigator.clipboard.readText().then(setInput)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">粘贴</button>
                 </div>
             </div>
             <textarea
                className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="在此输入文本..."
             />
         </div>

         {/* Output */}
         <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center">
                 <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">处理结果 ({getTitle()})</label>
                 <button onClick={() => navigator.clipboard.writeText(output)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">复制</button>
             </div>
             <textarea
                readOnly
                className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 focus:outline-none resize-none text-slate-700 dark:text-green-400"
                value={output}
                placeholder="结果将显示在这里..."
             />
         </div>
      </div>

      <div className="flex justify-center gap-4 py-2">
         <button 
            onClick={() => handleAction('encode')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
         >
            编码 (Encode)
         </button>
         <button 
            onClick={() => handleAction('decode')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors"
         >
            解码 (Decode)
         </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
        </div>
      )}
    </div>
  );
};

export default EncodeDecode;
