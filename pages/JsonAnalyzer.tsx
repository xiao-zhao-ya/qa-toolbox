import React, { useState, useEffect, useMemo } from 'react';

// Sample data for demonstration
const SAMPLE_JSON = `{
    "code": 200,
    "msg": "ok",
    "data": {
        "list": [
            {
                "data_id": "75fe8f105d5b",
                "payment_plan_no": "FKJH20251105000009",
                "creator": {
                    "name": "赵晓倩",
                    "title": "测试工程师"
                },
                "status": "waiting_payment",
                "fee_detail": [
                     { "fee_type": "FEE01" }
                ]
            },
            {
                "data_id": "f42d6ffe0953",
                "payment_plan_no": "FKJH20251105000001",
                "creator": {
                    "name": "高文豪",
                    "title": "服务器开发工程师"
                },
                "status": "waiting_payment",
                "fee_detail": [
                     { "fee_type": "FEE02" }
                ]
            }
        ],
        "total": 2
    }
}`;

const JsonAnalyzer: React.FC = () => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Paths
  const [searchTerm, setSearchTerm] = useState('');
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  // Results
  const [extractedValues, setExtractedValues] = useState<{path: string, value: any}[]>([]);

  // 1. Parse JSON when input changes
  useEffect(() => {
    if (!input.trim()) {
        setParsedData(null);
        setAllPaths([]);
        setError(null);
        return;
    }
    try {
        const data = JSON.parse(input);
        setParsedData(data);
        setError(null);
        
        // Discover paths
        const paths = new Set<string>();
        discoverPaths(data, '', paths);
        setAllPaths(Array.from(paths).sort());
    } catch (e: any) {
        setError(e.message);
        setParsedData(null);
        setAllPaths([]);
    }
  }, [input]);

  // Helper: Recursive Path Discovery
  const discoverPaths = (obj: any, currentPath: string, paths: Set<string>) => {
      if (obj === null || obj === undefined) return;

      if (Array.isArray(obj)) {
          // If array, mark path with [*] and traverse distinct items
          // To be efficient, we traverse all items to ensure we catch optional keys, 
          // but for huge arrays we might limit this. Here we traverse all.
          const nextPath = currentPath ? `${currentPath}[*]` : '[*]';
          
          if (obj.length > 0) {
             // Union of keys from objects in array
             obj.forEach(item => {
                 discoverPaths(item, nextPath, paths);
             });
          } else {
             // Empty array, just record the path itself
             paths.add(nextPath);
          }
      } else if (typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
              const nextPath = currentPath ? `${currentPath}.${key}` : key;
              paths.add(nextPath);
              discoverPaths(obj[key], nextPath, paths);
          });
      } else {
          // Primitive value (leaf node)
          // We already added the path in the parent loop or root call, 
          // but checking here ensures we don't miss anything.
      }
  };

  // 2. Extract Values when path is selected
  useEffect(() => {
    if (!parsedData || !selectedPath) {
        setExtractedValues([]);
        return;
    }

    const results: {path: string, value: any}[] = [];
    extractValuesRecursive(parsedData, selectedPath, '', results);
    setExtractedValues(results);

  }, [selectedPath, parsedData]);

  const extractValuesRecursive = (currentData: any, targetPath: string, currentBreadcrumb: string, collector: any[]) => {
      // Base case: We've reached the end of the path definition
      if (targetPath === '') {
          collector.push({
              path: currentBreadcrumb,
              value: currentData
          });
          return;
      }

      // Parse the next segment of the target path
      // Handle [*] or .key
      let nextDotIndex = targetPath.indexOf('.');
      let nextBracketIndex = targetPath.indexOf('[*]');
      
      // Determine which comes first (dot or array wildcard)
      let segment = '';
      let remainder = '';
      let isArray = false;

      // Special case: Starts with [*]
      if (targetPath.startsWith('[*]')) {
          segment = '[*]';
          remainder = targetPath.substring(3); // Remove [*]
          // If remainder starts with dot, remove it too for clean recursion
          if (remainder.startsWith('.')) remainder = remainder.substring(1);
          isArray = true;
      } else {
          // Find next separator
          let separatorIndex = -1;
          if (nextDotIndex !== -1 && nextBracketIndex !== -1) {
              separatorIndex = Math.min(nextDotIndex, nextBracketIndex);
          } else {
              separatorIndex = Math.max(nextDotIndex, nextBracketIndex);
          }

          if (separatorIndex === -1) {
              // No more separators, this is the last segment
              segment = targetPath;
              remainder = '';
          } else {
              segment = targetPath.substring(0, separatorIndex);
              remainder = targetPath.substring(separatorIndex);
              // Prepare remainder for next call
              if (remainder.startsWith('.')) remainder = remainder.substring(1);
              // Note: if it starts with [*], we leave it for the next recursive call to handle as "Starts with [*]"
          }
          isArray = false;
      }

      // Traverse
      if (isArray) {
          if (Array.isArray(currentData)) {
              currentData.forEach((item, index) => {
                  extractValuesRecursive(item, remainder, `${currentBreadcrumb}[${index}]`, collector);
              });
          }
      } else {
          // Object key access
          if (currentData && typeof currentData === 'object' && segment in currentData) {
              const nextBreadcrumb = currentBreadcrumb ? `${currentBreadcrumb}.${segment}` : segment;
              extractValuesRecursive(currentData[segment], remainder, nextBreadcrumb, collector);
          }
      }
  };

  // Filter paths based on search
  const filteredPaths = useMemo(() => {
      if (!searchTerm) return [];
      const lower = searchTerm.toLowerCase();
      // Only show paths that contain the search term in their keys (not strictly exact match)
      // Prioritize paths ending with the term
      return allPaths.filter(p => p.toLowerCase().includes(lower));
  }, [allPaths, searchTerm]);

  return (
    <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 flex justify-between items-center shadow-sm shrink-0">
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">JSON 数据分析</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">输入 JSON，搜索字段名，批量提取数组中的字段值。</p>
            </div>
            <div className="space-x-2">
                <button 
                    onClick={() => { setInput(SAMPLE_JSON); setSearchTerm('status'); }}
                    className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                >
                    加载示例
                </button>
                <button 
                    onClick={() => { setInput(''); setParsedData(null); setAllPaths([]); setExtractedValues([]); setSearchTerm(''); setSelectedPath(null); }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    清空
                </button>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
            {/* Left: JSON Input */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">原始 JSON</label>
                <div className="flex-1 relative">
                    <textarea 
                        className={`w-full h-full p-4 border rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-xs leading-relaxed ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                        placeholder="在此粘贴复杂的 JSON 数据..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    {error && (
                        <div className="absolute bottom-4 left-4 right-4 bg-red-100 text-red-700 px-3 py-2 rounded text-xs border border-red-200 shadow-sm">
                            JSON 格式错误: {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Middle: Path Selector */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">字段搜索 & 选择</label>
                <div className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                        <div className="relative">
                            <input 
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="输入字段名 (例如: status, id)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                        {!parsedData ? (
                            <div className="text-center text-gray-400 mt-10 text-sm">请先输入有效的 JSON</div>
                        ) : !searchTerm ? (
                            <div className="text-center text-gray-400 mt-10 text-sm">请输入字段名进行搜索</div>
                        ) : filteredPaths.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10 text-sm">未找到包含 "{searchTerm}" 的路径</div>
                        ) : (
                            <div className="space-y-1">
                                {filteredPaths.map(path => (
                                    <button
                                        key={path}
                                        onClick={() => setSelectedPath(path)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono break-all transition-colors ${
                                            selectedPath === path 
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700' 
                                            : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {path}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Results */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center h-[24px]">
                    <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                        提取结果 
                        {extractedValues.length > 0 && <span className="text-xs font-normal text-gray-400 ml-2">({extractedValues.length} 条)</span>}
                    </label>
                    {extractedValues.length > 0 && (
                        <button 
                            onClick={() => {
                                const text = extractedValues.map(x => JSON.stringify(x.value)).join('\n');
                                navigator.clipboard.writeText(text);
                            }}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            复制全部值
                        </button>
                    )}
                </div>
                
                <div className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl overflow-hidden flex flex-col">
                    {!selectedPath ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                            请在左侧选择一个路径
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 font-medium border-b border-gray-200 dark:border-slate-700 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 w-12 text-center">#</th>
                                        <th className="px-3 py-2">路径索引</th>
                                        <th className="px-3 py-2">值</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {extractedValues.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2 font-mono text-gray-500 break-all w-1/3 text-[10px]">{item.path}</td>
                                            <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200 break-all">
                                                {typeof item.value === 'object' ? (
                                                    <pre className="whitespace-pre-wrap text-[10px] text-gray-500">{JSON.stringify(item.value, null, 1)}</pre>
                                                ) : (
                                                    String(item.value)
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {extractedValues.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-8 text-center text-gray-400">
                                                该路径下没有数据 (null 或 数组为空)
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default JsonAnalyzer;