import React, { useState } from 'react';

type Mode = 'replace' | 'sql';

const TextTemplating: React.FC = () => {
  const [mode, setMode] = useState<Mode>('replace');
  const [source, setSource] = useState('');
  const [rules, setRules] = useState('');
  const [result, setResult] = useState('');

  // --- Sample Data: Batch Replace ---
  const sampleReplaceSource = `POST /api/v1/orders
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
Content-Type: application/json

{
  "orderId": "ORD-2023-001",
  "amount": 99.50,
  "currency": "USD",
  "userId": 10086
}`;

  const sampleReplaceRules = `ORD-2023-001 : <ORDER_ID>
99.50 : <PRICE>
10086 : <USER_ID>
eyJhbGciOiJIUzI1Ni... -> [TOKEN_REMOVED]`;

  // --- Sample Data: SQL Fill ---
  const sampleSqlSource = `select t.ins_id, t.ins_modify_index, max(t.ins_batch_serial_no) as ins_batch_serial_no
from hisbb_tinstruction a 
where a.ins_id in( ? , ? ) 
AND a.business_date >= ? 
AND a.business_date <= ? 
AND ( opa.operator_no = ?) 
LIMIT ?`;

  const sampleSqlParams = `Parameters: 20160625(Integer), 20160626(Integer), 20230101(Integer), 20231231(Integer), 1(String), 500(Integer)`;

  const loadSample = () => {
    if (mode === 'replace') {
        setSource(sampleReplaceSource);
        setRules(sampleReplaceRules);
    } else {
        setSource(sampleSqlSource);
        setRules(sampleSqlParams);
    }
    setResult('');
  };

  const processBatchReplace = () => {
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
          replaceWith = `VALUE_${autoVarIndex++}`;
        }
        ruleList.push({ target, replaceWith });
      }
    });

    // Sort by target length descending
    ruleList.sort((a, b) => b.target.length - a.target.length);

    ruleList.forEach(rule => {
      if (rule.target) {
        // Simple replaceAll via split/join
        processedText = processedText.split(rule.target).join(rule.replaceWith);
      }
    });

    setResult(processedText);
  };

  const processSqlFill = () => {
    if (!source) return;

    let paramsStr = rules.trim();
    // Remove "Parameters:" prefix (case insensitive)
    paramsStr = paramsStr.replace(/^Parameters:\s*/i, '');

    if (!paramsStr) {
        setResult(source);
        return;
    }

    // Split by comma
    // Note: This simple split might break if a string value contains a comma.
    // For standard Mybatis/Java logs, values are usually comma separated.
    const params = paramsStr.split(',').map(s => s.trim());

    let pIndex = 0;
    
    // Replace '?' with params sequentially
    const newSql = source.replace(/\?/g, (match) => {
        if (pIndex >= params.length) {
            return match; // Not enough params, keep '?'
        }

        const rawVal = params[pIndex++];

        // Match value and type: e.g. "123(Integer)" or "abc(String)"
        // Captures: 1=Value, 2=Type
        const typeMatch = rawVal.match(/^(.*)\((Integer|String|Long|Float|Double|Boolean|Byte|Short|Date|Time|Timestamp|BigDecimal)\)$/);

        if (typeMatch) {
            const val = typeMatch[1];
            const type = typeMatch[2];

            if (val === 'null') return 'null';

            // String-like types need quotes
            if (['String', 'Date', 'Time', 'Timestamp'].includes(type)) {
                return `'${val}'`;
            }
            // Number/Boolean return as is
            return val;
        }

        // Fallback: if no type annotation (e.g. user just pasted "1, 'abc'")
        return rawVal;
    });

    setResult(newSql);
  };

  const handleProcess = () => {
      if (mode === 'replace') {
          processBatchReplace();
      } else {
          processSqlFill();
      }
  };

  const clear = () => {
    setSource('');
    setRules('');
    setResult('');
  };

  // UI Texts based on mode
  const getLabels = () => {
      if (mode === 'replace') {
          return {
              title: '数据批量替换',
              desc: '根据自定义规则批量查找并替换文本中的特定内容。',
              leftLabel: '原始文本 (Source)',
              leftPlaceholder: '在此粘贴原始文本...',
              rightLabel: '替换规则',
              rightPlaceholder: `123456 : *****\n2023-01-01 -> 2024-01-01`,
              rightDesc: '格式: 查找内容 : 替换内容',
              btnText: '执行批量替换'
          };
      } else {
          return {
              title: 'SQL 参数填充',
              desc: '解析 MyBatis/Java 日志参数，按顺序替换 SQL 中的 "?" 占位符。',
              leftLabel: '带占位符的 SQL',
              leftPlaceholder: 'SELECT * FROM table WHERE id = ? AND name = ?',
              rightLabel: 'Parameters 参数',
              rightPlaceholder: `Parameters: 1001(Integer), admin(String)`,
              rightDesc: '支持格式: 值(Type), ...',
              btnText: '生成可执行 SQL'
          };
      }
  };

  const labels = getLabels();

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{labels.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels.desc}</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button 
                    onClick={() => { setMode('replace'); clear(); }}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${mode === 'replace' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    键值替换
                </button>
                <button 
                    onClick={() => { setMode('sql'); clear(); }}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${mode === 'sql' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    SQL 参数填充
                </button>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-slate-600 mx-1"></div>
            <button 
                onClick={loadSample}
                className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
            >
                示例
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
              <span>{labels.leftLabel}</span>
           </label>
           <textarea 
              className="flex-1 w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              placeholder={labels.leftPlaceholder}
              value={source}
              onChange={e => setSource(e.target.value)}
           />
        </div>

        {/* Right Column: Rules & Result */}
        <div className="flex flex-col gap-4">
            {/* Rules */}
            <div className="flex flex-col gap-2 h-1/3 min-h-[150px]">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex justify-between items-center">
                    <span>{labels.rightLabel}</span>
                    <span className="text-xs font-normal text-gray-400">{labels.rightDesc}</span>
                </label>
                <textarea 
                    className="flex-1 w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm"
                    placeholder={labels.rightPlaceholder}
                    value={rules}
                    onChange={e => setRules(e.target.value)}
                />
            </div>

            {/* Action */}
            <button 
                onClick={handleProcess}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-[0.99]"
            >
                {labels.btnText} ↓
            </button>

            {/* Result */}
            <div className="flex flex-col gap-2 flex-1 min-h-[150px]">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex justify-between items-center">
                    <span>处理结果</span>
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