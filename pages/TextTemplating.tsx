import React, { useState } from 'react';

const TextTemplating: React.FC = () => {
  const [source, setSource] = useState('');
  const [rules, setRules] = useState('');
  const [result, setResult] = useState('');

  const sampleSource = `POST /api/v1/orders
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
Content-Type: application/json

{
  "orderId": "ORD-2023-001",
  "amount": 99.50,
  "currency": "USD",
  "userId": 10086
}`;

  const sampleRules = `ORD-2023-001 : <ORDER_ID>
99.50 : <PRICE>
10086 : <USER_ID>
eyJhbGciOiJIUzI1Ni... -> [TOKEN_REMOVED]`;

  const loadSample = () => {
    setSource(sampleSource);
    setRules(sampleRules);
  };

  const handleProcess = () => {
    if (!source) return;

    let processedText = source;
    const lines = rules.split('\n');
    
    // Parse rules
    const ruleList: { target: string; replaceWith: string }[] = [];
    let autoVarIndex = 1;

    lines.forEach(line => {
      if (!line.trim()) return;

      let target = '';
      let replaceWith = '';

      // Support separators: ':', '->'
      if (line.includes('->')) {
        const parts = line.split('->');
        target = parts[0].trim();
        replaceWith = parts[1]?.trim();
      } else if (line.includes(':')) {
        const parts = line.split(':');
        target = parts[0].trim();
        replaceWith = parts[1]?.trim();
      } else {
        target = line.trim();
      }

      if (target) {
        if (!replaceWith) {
          // If no replacement provided, use a generic placeholder or keep it simple
          replaceWith = `VALUE_${autoVarIndex++}`;
        }
        ruleList.push({ target, replaceWith });
      }
    });

    // Sort by target length descending to avoid partial match replacement issues
    ruleList.sort((a, b) => b.target.length - a.target.length);

    ruleList.forEach(rule => {
      // Direct replacement without {{ }} wrappers
      if (rule.target) {
        processedText = processedText.split(rule.target).join(rule.replaceWith);
      }
    });

    setResult(processedText);
  };

  const clear = () => {
    setSource('');
    setRules('');
    setResult('');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 flex justify-between items-center shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">数据批量替换</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">根据自定义规则批量查找并替换文本中的特定内容。</p>
        </div>
        <div className="space-x-2">
            <button 
                onClick={loadSample}
                className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
            >
                加载示例
            </button>
            <button 
                onClick={clear}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
                清空
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left Column: Source */}
        <div className="flex flex-col gap-2">
           <label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex justify-between">
              <span>原始文本 (Source)</span>
              <span className="text-xs font-normal text-gray-400">输入待处理的报文或数据</span>
           </label>
           <textarea 
              className="flex-1 w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              placeholder="在此粘贴原始文本..."
              value={source}
              onChange={e => setSource(e.target.value)}
           />
        </div>

        {/* Right Column: Rules & Result */}
        <div className="flex flex-col gap-4">
            {/* Rules */}
            <div className="flex flex-col gap-2 h-1/3 min-h-[150px]">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex justify-between items-center">
                    <span>替换规则</span>
                    <span className="text-xs font-normal text-gray-400">格式: 查找内容 : 替换内容</span>
                </label>
                <textarea 
                    className="flex-1 w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm"
                    placeholder={`123456 : *****\n2023-01-01 -> 2024-01-01\nChina (未指定替换值则自动生成 VALUE_x)`}
                    value={rules}
                    onChange={e => setRules(e.target.value)}
                />
            </div>

            {/* Action */}
            <button 
                onClick={handleProcess}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-[0.99]"
            >
                执行批量替换 ↓
            </button>

            {/* Result */}
            <div className="flex flex-col gap-2 flex-1 min-h-[150px]">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex justify-between items-center">
                    <span>替换结果</span>
                    {result && (
                        <button 
                            onClick={() => navigator.clipboard.writeText(result)}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            复制结果
                        </button>
                    )}
                </label>
                <textarea 
                    readOnly
                    className="flex-1 w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 focus:outline-none resize-none font-mono text-sm leading-relaxed text-slate-800 dark:text-green-400"
                    placeholder="处理后的文本将显示在这里..."
                    value={result}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default TextTemplating;