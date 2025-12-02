import React, { useState } from 'react';
import { load, dump } from 'js-yaml';

type ConvertType = 'sql' | 'xml' | 'yaml' | 'csv';

const FormatConvert: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConvertType>('sql');
  const [leftInput, setLeftInput] = useState('');
  const [rightInput, setRightInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // --- SQL / XML / YAML / CSV Helpers ---

  // 0. JSON -> SQL DDL
  const jsonToSql = (jsonStr: string) => {
    let data;
    try {
        data = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error("无效的 JSON 格式");
    }

    let tableName = 'my_table';
    let item = data;

    // Handle Array: Use the first element to infer schema
    if (Array.isArray(data)) {
        if (data.length === 0) throw new Error("数组为空，无法推断表结构");
        item = data[0];
    }

    if (typeof item !== 'object' || item === null) {
        throw new Error("JSON 必须是对象或对象数组");
    }

    const lines = [];
    lines.push(`CREATE TABLE ${tableName} (`);
    
    const entries = Object.entries(item);
    const definitions = entries.map(([key, value]) => {
        let type = 'TEXT';
        let comment = '';

        if (value === null) {
            type = 'TEXT';
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                // Check for potential ID or large integers
                type = value > 2147483647 ? 'BIGINT' : 'INT';
            } else {
                type = 'DECIMAL(10, 2)';
            }
        } else if (typeof value === 'boolean') {
            type = 'BOOLEAN';
        } else if (typeof value === 'object') {
             // Array or Object
             type = 'TEXT'; 
             comment = ' -- JSON data';
        } else if (typeof value === 'string') {
            // Heuristic for Date? 
            // ISO 8601 date check could be added here, but keeping it simple for now.
            if (value.length > 255) type = 'TEXT';
            else type = 'VARCHAR(255)';
        }

        // Quote the key in case it's a reserved word
        return `    \`${key}\` ${type}${comment}`;
    });

    lines.push(definitions.join(',\n'));
    lines.push(`);`);

    return lines.join('\n');
  };

  // 1. JSON <-> YAML
  const jsonToYaml = (jsonStr: string) => {
    const obj = JSON.parse(jsonStr);
    return dump(obj);
  };

  const yamlToJson = (yamlStr: string) => {
    const obj = load(yamlStr);
    return JSON.stringify(obj, null, 2);
  };

  // 2. JSON <-> XML (Simple Implementation)
  const jsonToXml = (jsonStr: string) => {
    const obj = JSON.parse(jsonStr);
    const toXml = (v: any, name: string): string => {
      if (v === null) return `<${name} />`;
      if (Array.isArray(v)) {
        return v.map(item => toXml(item, name)).join('');
      }
      if (typeof v === 'object') {
        let inner = '';
        for (const k in v) {
          inner += toXml(v[k], k);
        }
        return `<${name}>${inner}</${name}>`;
      }
      return `<${name}>${v}</${name}>`;
    };
    
    // Wrap in root if not single object
    let xml = '';
    if (typeof obj === 'object' && !Array.isArray(obj)) {
        for (const k in obj) {
            xml += toXml(obj[k], k);
        }
        return `<root>${xml}</root>`;
    } else {
        return `<root>${toXml(obj, 'item')}</root>`;
    }
  };

  const xmlToJsonHelper = (xmlStr: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
    
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Invalid XML");
    }

    const xmlToObj = (node: Node): any => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.nodeValue?.trim();
        }
        
        // Element Node
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const obj: any = {};
            
            let hasChildren = false;
            for(let i = 0; i < element.childNodes.length; i++) {
                const child = element.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    if (child.nodeValue?.trim() === '') continue;
                    if (element.childNodes.length === 1) return child.nodeValue;
                }
                
                hasChildren = true;
                const childName = child.nodeName;
                const childVal = xmlToObj(child);

                if (obj[childName]) {
                    if (!Array.isArray(obj[childName])) {
                        obj[childName] = [obj[childName]];
                    }
                    obj[childName].push(childVal);
                } else {
                    obj[childName] = childVal;
                }
            }
            
            return hasChildren ? obj : "";
        }
    };
    
    const root = xmlDoc.documentElement;
    const result = { [root.nodeName]: xmlToObj(root) };
    return JSON.stringify(result, null, 2);
  };

  // 3. JSON <-> CSV
  const jsonToCsv = (jsonStr: string) => {
    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) throw new Error("JSON 必须是对象数组才能转换为 CSV");
    if (arr.length === 0) return "";

    const keys = Array.from(new Set(arr.flatMap(Object.keys)));
    const header = keys.join(',');
    const rows = arr.map(obj => {
        return keys.map(k => {
            const val = (obj as any)[k];
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',');
    });
    return [header, ...rows].join('\n');
  };

  const csvToJsonHelper = (csvStr: string) => {
    const lines = csvStr.trim().split('\n');
    if (lines.length < 1) return "[]";
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const rowData: string[] = [];
        let current = '';
        let inQuote = false;
        for(let char of lines[i]) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                rowData.push(current);
                current = '';
                continue;
            }
            current += char;
        }
        rowData.push(current);

        const obj: any = {};
        headers.forEach((h, index) => {
            let val = rowData[index]?.trim() || '';
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            if (!isNaN(Number(val)) && val !== '') {
                obj[h] = Number(val);
            } else if (val === 'true') {
                obj[h] = true;
            } else if (val === 'false') {
                obj[h] = false;
            } else {
                obj[h] = val;
            }
        });
        result.push(obj);
    }
    return JSON.stringify(result, null, 2);
  };

  const handleConvert = (direction: 'leftToRight' | 'rightToLeft') => {
    setError(null);
    try {
        if (direction === 'leftToRight') {
            // JSON -> Target
            if (!leftInput.trim()) return;
            switch (activeTab) {
                case 'sql': setRightInput(jsonToSql(leftInput)); break;
                case 'xml': setRightInput(jsonToXml(leftInput)); break;
                case 'yaml': setRightInput(jsonToYaml(leftInput)); break;
                case 'csv': setRightInput(jsonToCsv(leftInput)); break;
            }
        } else {
            // Target -> JSON
            if (activeTab === 'sql') {
                throw new Error("暂不支持 SQL 逆向转 JSON (SQL 解析太复杂啦)");
            }
            if (!rightInput.trim()) return;
            switch (activeTab) {
                case 'xml': setLeftInput(xmlToJsonHelper(rightInput)); break;
                case 'yaml': setLeftInput(yamlToJson(rightInput)); break;
                case 'csv': setLeftInput(csvToJsonHelper(rightInput)); break;
            }
        }
    } catch (e: any) {
        setError("转换失败: " + e.message);
    }
  };

  const getRightLabel = () => {
    switch (activeTab) {
        case 'sql': return 'SQL DDL';
        case 'xml': return 'XML';
        case 'yaml': return 'YAML';
        case 'csv': return 'CSV';
        default: return '';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {(['sql', 'xml', 'yaml', 'csv'] as ConvertType[]).map((t) => (
            <button
                key={t}
                onClick={() => { setActiveTab(t); setError(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors uppercase whitespace-nowrap ${activeTab === t ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                {t === 'sql' ? 'JSON → SQL' : `JSON ⇄ ${t.toUpperCase()}`}
            </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
          {/* Left: JSON */}
          <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">JSON</label>
                  <div className="space-x-2">
                      <button onClick={() => setLeftInput('')} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">清空</button>
                      <button onClick={() => navigator.clipboard.readText().then(setLeftInput)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">粘贴</button>
                  </div>
              </div>
              <textarea
                  className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  value={leftInput}
                  onChange={e => setLeftInput(e.target.value)}
                  placeholder={activeTab === 'sql' ? '{"id": 1, "name": "Test"}' : '[{"name": "Alice", "age": 30}]'}
              />
          </div>

          {/* Right: Target */}
          <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-600 dark:text-slate-400">{getRightLabel()}</label>
                  <div className="space-x-2">
                      <button onClick={() => setRightInput('')} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">清空</button>
                      <button onClick={() => navigator.clipboard.writeText(rightInput)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">复制</button>
                  </div>
              </div>
              <textarea
                  className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  value={rightInput}
                  onChange={e => setRightInput(e.target.value)}
                  placeholder={activeTab === 'csv' ? 'name,age\nAlice,30' : 'CREATE TABLE ...'}
              />
          </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-center gap-4 py-2">
          <button 
              onClick={() => handleConvert('leftToRight')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
              <span>JSON 转 {getRightLabel()}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
          
          <button 
              onClick={() => handleConvert('rightToLeft')}
              disabled={activeTab === 'sql'}
              className={`px-6 py-2 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2 ${activeTab === 'sql' ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-600 hover:bg-slate-700'}`}
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span>{getRightLabel()} 转 JSON</span>
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

export default FormatConvert;