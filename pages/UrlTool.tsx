import React, { useState, useEffect } from 'react';

const UrlTool: React.FC = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [parsed, setParsed] = useState<URL | null>(null);
  const [params, setParams] = useState<[string, string][]>([]);

  useEffect(() => {
    try {
        if(!inputUrl) {
            setParsed(null);
            setParams([]);
            return;
        }
        // Attempt to prepend https:// if missing for better UX
        const urlToParse = inputUrl.match(/^https?:\/\//) ? inputUrl : `http://${inputUrl}`;
        const u = new URL(urlToParse);
        setParsed(u);
        setParams(Array.from(u.searchParams.entries()));
    } catch (e) {
        setParsed(null);
        setParams([]);
    }
  }, [inputUrl]);

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">输入 URL</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    className="flex-1 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com/api?id=123&token=abc"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                />
                <button 
                    onClick={() => setInputUrl('')} 
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                    清空
                </button>
            </div>
        </div>

        {parsed && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* General Info */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 h-fit">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">组成部分</h3>
                    <div className="space-y-3 text-sm">
                        {[
                            ['协议', parsed.protocol],
                            ['主机名', parsed.hostname],
                            ['端口', parsed.port || '(默认)'],
                            ['路径', parsed.pathname],
                            ['哈希', parsed.hash || '-']
                        ].map(([label, val]) => (
                            <div key={label} className="flex flex-col border-b border-gray-100 dark:border-slate-700 last:border-0 pb-2 last:pb-0">
                                <span className="text-gray-500 text-xs uppercase">{label}</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400 break-all">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Query Parameters */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">查询参数 ({params.length})</h3>
                        <button 
                             onClick={() => {
                                 const json = JSON.stringify(Object.fromEntries(params), null, 2);
                                 navigator.clipboard.writeText(json);
                             }}
                             className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                            复制为 JSON
                        </button>
                    </div>
                    
                    {params.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">参数名</th>
                                        <th className="px-4 py-3 font-medium">参数值</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {params.map(([k, v], i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">{k}</td>
                                            <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 break-all">{v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-gray-400 italic text-center py-8">未发现查询参数。</div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default UrlTool;