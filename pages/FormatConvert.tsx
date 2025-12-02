import React, { useState, useRef } from 'react';
import { load, dump } from 'js-yaml';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
// @ts-ignore
import * as ofdLib from 'ofd.js';

type ConvertType = 'sql' | 'xml' | 'yaml' | 'csv' | 'ofd';

interface OfdFileItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress?: number; // 0-100
  resultUrl?: string; // Blob URL for PDF
  errorMsg?: string;
}

const FormatConvert: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConvertType>('sql');
  const [leftInput, setLeftInput] = useState('');
  const [rightInput, setRightInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // OFD State
  const [ofdFiles, setOfdFiles] = useState<OfdFileItem[]>([]);
  const ofdContainerRef = useRef<HTMLDivElement>(null);

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

  // --- OFD Helpers ---
  
  // Helper to safely access ofd.js functions
  const getOfd = () => {
    const lib: any = ofdLib;
    // Handle different export types (ESM default, named, or CommonJS)
    const parse = lib.parseOfdDocument || lib.default?.parseOfdDocument || (window as any).ofd?.parseOfdDocument;
    const render = lib.renderOfd || lib.default?.renderOfd || (window as any).ofd?.renderOfd;
    
    if (!parse || !render) {
        throw new Error("ofd.js 库加载失败，请刷新页面重试");
    }
    return { parse, render };
  };

  const parseOfdPromise = (file: File) => {
      return new Promise(async (resolve, reject) => {
          let isFinished = false;

          // 1. Timeout Mechanism: Prevent hanging forever
          const timer = setTimeout(() => {
              if (!isFinished) {
                  isFinished = true;
                  reject(new Error("OFD 解析超时 (20秒)，文件可能损坏或不兼容"));
              }
          }, 20000);

          try {
              const { parse } = getOfd();
              
              // 2. Read as ArrayBuffer FIRST
              // Fixes 'b.on is not a function' error caused by JSZip trying to read File object in browser environment
              const arrayBuffer = await file.arrayBuffer();

              parse({
                  ofd: arrayBuffer,
                  success: (res: any) => {
                      if (isFinished) return;
                      isFinished = true;
                      clearTimeout(timer);
                      resolve(res);
                  },
                  fail: (err: any) => {
                      if (isFinished) return;
                      isFinished = true;
                      clearTimeout(timer);
                      console.error("OFD Parse Error:", err);
                      reject(new Error("OFD 解析失败: " + (err.message || "未知错误")));
                  }
              });
          } catch (e: any) {
              if (isFinished) return;
              isFinished = true;
              clearTimeout(timer);
              console.error("OFD Setup Error:", e);
              reject(e);
          }
      });
  };

  const handleOfdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        status: 'pending' as const
      }));
      setOfdFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = ''; // Reset input
  };

  const processSingleOfd = async (item: OfdFileItem) => {
      try {
          // 1. Update status
          setOfdFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 10 } : f));

          // 2. Parse OFD using Promise wrapper with Timeout
          const res = await parseOfdPromise(item.file);
          
          setOfdFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: 30 } : f));

          // 3. Render
          const screenWidth = 1000; // Increased width for better resolution
          const { render } = getOfd();
          const divs = render(screenWidth, res); // returns object array [{id, div, ...}]

          if (!divs || !Array.isArray(divs) || divs.length === 0) {
              throw new Error("无法渲染 OFD 内容 (空页面)");
          }

          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          
          // Prepare container
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          container.style.top = '0';
          container.style.width = `${screenWidth}px`;
          // Important for styling to match original doc
          container.className = 'ofd-render-container';
          container.style.fontFamily = 'SimSun, Arial, sans-serif'; 
          document.body.appendChild(container);

          for (let i = 0; i < divs.length; i++) {
              const pageObj = divs[i];
              const pageDiv = pageObj.div;
              
              if (!pageDiv) continue;
              
              // Clear previous and mount
              container.innerHTML = '';
              container.appendChild(pageDiv);

              // Update progress
              const progress = 30 + Math.floor(((i + 1) / divs.length) * 60);
              setOfdFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress } : f));

              // Capture with html2canvas
              // Wait a tiny bit for DOM to settle
              await new Promise(r => setTimeout(r, 100));

              const canvas = await html2canvas(pageDiv, {
                  scale: 1.5, // Trade-off between quality and speed
                  useCORS: true,
                  logging: false,
                  backgroundColor: '#ffffff'
              });

              const imgData = canvas.toDataURL('image/jpeg', 0.8);
              const imgProps = pdf.getImageProperties(imgData);
              const ratio = imgProps.width / imgProps.height;
              const renderHeight = pdfWidth / ratio;

              if (i > 0) pdf.addPage();
              
              pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, renderHeight);
          }

          // Clean up
          document.body.removeChild(container);

          // 4. Save
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);

          setOfdFiles(prev => prev.map(f => f.id === item.id ? { 
              ...f, 
              status: 'done', 
              progress: 100, 
              resultUrl: url 
          } : f));

      } catch (err: any) {
          console.error(err);
          setOfdFiles(prev => prev.map(f => f.id === item.id ? { 
              ...f, 
              status: 'error', 
              errorMsg: err.message || '转换失败，请重试' 
          } : f));
      }
  };

  const convertAllOfd = async () => {
      // Process pending files one by one to avoid memory spikes
      const pending = ofdFiles.filter(f => f.status === 'pending');
      if (pending.length === 0) {
           return;
      }
      
      for (const item of pending) {
          await processSingleOfd(item);
      }
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
        {(['sql', 'xml', 'yaml', 'csv', 'ofd'] as ConvertType[]).map((t) => (
            <button
                key={t}
                onClick={() => { setActiveTab(t); setError(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors uppercase whitespace-nowrap ${activeTab === t ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                {t === 'ofd' ? 'OFD 转 PDF' : t === 'sql' ? 'JSON → SQL' : `JSON ⇄ ${t.toUpperCase()}`}
            </button>
        ))}
      </div>

      {activeTab === 'ofd' ? (
          <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full p-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">OFD 转 PDF 工具</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                      纯前端转换，文件不上传服务器。支持多文件批量转换。
                      <br/>
                      <span className="text-xs opacity-80">* 依赖浏览器渲染能力，复杂版式可能会有差异。解析较大文件可能需要较长时间，请耐心等待。</span>
                  </p>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-gray-50 dark:bg-slate-800/50">
                  <input 
                      type="file" 
                      id="ofd-upload" 
                      multiple 
                      accept=".ofd" 
                      className="hidden" 
                      onChange={handleOfdUpload}
                  />
                  <label htmlFor="ofd-upload" className="cursor-pointer flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span className="text-lg font-medium text-slate-700 dark:text-slate-200">点击上传 OFD 文件</span>
                      <span className="text-sm text-gray-500 mt-1">支持拖拽或多选</span>
                  </label>
              </div>

              {/* File List */}
              {ofdFiles.length > 0 && (
                  <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-700 dark:text-slate-300">文件列表 ({ofdFiles.length})</h4>
                          <div className="flex gap-2">
                             <button 
                                onClick={() => setOfdFiles([])} 
                                className="text-sm text-gray-500 hover:text-red-500 px-3 py-1"
                             >
                                清空
                             </button>
                             <button 
                                onClick={convertAllOfd} 
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow disabled:opacity-50"
                                disabled={ofdFiles.every(f => f.status === 'done' || f.status === 'processing')}
                             >
                                开始转换
                             </button>
                          </div>
                      </div>

                      <div className="grid gap-3">
                          {ofdFiles.map(file => (
                              <div key={file.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-lg flex items-center gap-4">
                                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center text-red-500 font-bold text-xs shrink-0">
                                      OFD
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between mb-1">
                                          <span className="font-medium truncate text-slate-800 dark:text-slate-200">{file.file.name}</span>
                                          <span className={`text-xs font-bold ${
                                              file.status === 'done' ? 'text-green-600' :
                                              file.status === 'error' ? 'text-red-600' :
                                              file.status === 'processing' ? 'text-blue-600' :
                                              'text-gray-400'
                                          }`}>
                                              {file.status === 'done' ? '完成' : 
                                               file.status === 'error' ? '失败' : 
                                               file.status === 'processing' ? `转换中 ${file.progress}%` : 
                                               '等待中'}
                                          </span>
                                      </div>
                                      {/* Progress Bar */}
                                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                          <div 
                                              className={`h-full transition-all duration-300 ${file.status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} 
                                              style={{ width: `${file.status === 'done' ? 100 : file.progress || 0}%` }}
                                          />
                                      </div>
                                      {file.errorMsg && <p className="text-xs text-red-500 mt-1">{file.errorMsg}</p>}
                                  </div>
                                  
                                  {file.status === 'done' && file.resultUrl && (
                                      <a 
                                          href={file.resultUrl} 
                                          download={`${file.file.name.replace('.ofd', '')}.pdf`}
                                          className="shrink-0 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-medium rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                                      >
                                          下载 PDF
                                      </a>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      ) : (
          /* Normal Format Convert (JSON <-> CSV/XML/SQL/YAML) */
          <>
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
          </>
      )}
    </div>
  );
};

export default FormatConvert;