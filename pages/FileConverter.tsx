import React, { useState, useRef } from 'react';
import { Icons } from '../constants';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

type Tab = 'img2pdf' | 'excelMerge' | 'pdfMerge' | 'xlsx2xmind';

interface FileItem {
  id: string;
  file: File;
  preview?: string;
}

const FileConverter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('img2pdf');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [xmindColumns, setXmindColumns] = useState('A,B,C,D'); // User input for columns
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Tab Config ---
  const tabConfig = {
    img2pdf: { label: '图片转 PDF', accept: 'image/png, image/jpeg, image/jpg', multiple: true, desc: '将多张 JPG/PNG 图片合并为一个 PDF 文件。' },
    excelMerge: { label: '表格合并', accept: '.xlsx, .csv', multiple: true, desc: '将多个 Excel/CSV 文件合并为一个 Excel 文件 (不同 Sheet)。' },
    pdfMerge: { label: 'PDF 合并', accept: '.pdf', multiple: true, desc: '将多个 PDF 文件按顺序合并为一个 PDF 文件。' },
    xlsx2xmind: { label: 'Excel 转 XMind', accept: '.xlsx', multiple: false, desc: '将 Excel 文件转换为 XMind 思维导图 (支持多 Sheet)。' }
  };

  const currentConfig = tabConfig[activeTab];

  // --- File Handling ---

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const added: FileItem[] = [];
    
    // For single file modes, clear previous
    if (!currentConfig.multiple) {
        setFiles([]);
    }

    Array.from(newFiles).forEach(file => {
      // Basic validation based on tab
      if (activeTab === 'img2pdf' && !file.type.startsWith('image/')) return;
      if (activeTab === 'pdfMerge' && file.type !== 'application/pdf') return;
      if (activeTab === 'xlsx2xmind' && !file.name.endsWith('.xlsx')) return;
      
      const item: FileItem = {
        id: Math.random().toString(36).substring(7),
        file,
        preview: activeTab === 'img2pdf' ? URL.createObjectURL(file) : undefined
      };
      added.push(item);
    });
    
    setFiles(prev => currentConfig.multiple ? [...prev, ...added] : added);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    setFiles(prev => {
        const target = prev.find(f => f.id === id);
        if (target && target.preview) {
            URL.revokeObjectURL(target.preview);
        }
        return prev.filter(f => f.id !== id);
    });
  };

  const clearFiles = () => {
    files.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    clearFiles();
  };

  // --- Helpers ---
  const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
      });
  };

  const getImageProperties = (url: string): Promise<{width: number, height: number}> => {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = reject;
          img.src = url;
      });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const genId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  const getColumnIndex = (str: string): number => {
    const s = str.trim().toUpperCase();
    if (!s) return -1;
    // Check if number (e.g., "0", "1")
    if (/^\d+$/.test(s)) return parseInt(s, 10); 
    
    // Excel column name to index (A->0, B->1, AA->26)
    let val = 0;
    for (let i = 0; i < s.length; i++) {
        val = val * 26 + (s.charCodeAt(i) - ('A'.charCodeAt(0) - 1));
    }
    return val - 1;
  };

  // --- Processing Logic ---

  const processImg2Pdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
        const doc = new jsPDF();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i].file;
            const imgData = await readFileAsDataURL(file);
            const imgProps = await getImageProperties(imgData);
            
            // Calculate dimensions to fit PDF (A4 default: 210 x 297 mm)
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            
            const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
            const w = imgProps.width * ratio;
            const h = imgProps.height * ratio;
            
            // Add page if not first
            if (i > 0) doc.addPage();
            
            doc.addImage(imgData, 'JPEG', (pdfWidth - w) / 2, (pdfHeight - h) / 2, w, h);
        }
        
        doc.save('merged_images.pdf');
    } catch (e: any) {
        alert("转换失败: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const processExcelMerge = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
        const wb = XLSX.utils.book_new();

        for (const fileItem of files) {
            const data = await readFileAsArrayBuffer(fileItem.file);
            const workbook = XLSX.read(data);
            
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                let newSheetName = `${fileItem.file.name.replace(/\.[^/.]+$/, "")}_${sheetName}`;
                newSheetName = newSheetName.replace(/[\\/?*[\]]/g, ""); 
                if (newSheetName.length > 31) {
                    newSheetName = newSheetName.substring(0, 31);
                }
                
                let uniqueName = newSheetName;
                let counter = 1;
                while (wb.SheetNames.includes(uniqueName)) {
                    const suffix = `_${counter}`;
                    const baseLen = 31 - suffix.length;
                    uniqueName = newSheetName.substring(0, baseLen) + suffix;
                    counter++;
                }

                XLSX.utils.book_append_sheet(wb, sheet, uniqueName);
            });
        }
        
        XLSX.writeFile(wb, 'merged_tables.xlsx');
    } catch (e: any) {
        alert("合并失败: " + e.message);
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  const processPdfMerge = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
        const mergedPdf = await PDFDocument.create();

        for (const fileItem of files) {
            const buffer = await readFileAsArrayBuffer(fileItem.file);
            const pdf = await PDFDocument.load(buffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, 'merged_documents.pdf');

    } catch (e: any) {
        alert("PDF 合并失败: " + e.message);
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  const processXlsxToXmind = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
        const file = files[0].file;
        const data = await readFileAsArrayBuffer(file);
        const workbook = XLSX.read(data);
        
        // Parse user columns config
        // "A,B,C" -> [0, 1, 2]
        const colIndices = xmindColumns.split(/[,，]/).map(getColumnIndex).filter(i => i >= 0);
        
        if (colIndices.length === 0) {
            throw new Error("请至少指定一列有效列（例如 A,B,C）");
        }

        const xmindSheets: any[] = [];

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            // Get raw data array of arrays, skipping header?
            // User requested: "xlsx的表头字段不转换" (Don't convert header)
            // So we skip the first row.
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            // Skip header row, start from index 1
            const jsonData = rawData.slice(1);
            
            if (jsonData.length === 0) return;

            // XMind Root Topic
            const rootId = genId();
            const rootTopic = {
                id: rootId,
                class: 'topic',
                title: sheetName,
                structureClass: 'org.xmind.ui.map.unbalanced',
                children: {
                    attached: [] as any[]
                }
            };

            for (let r = 0; r < jsonData.length; r++) {
                const row = jsonData[r];
                
                // Track the current parent for this row. 
                // We start at Root for every row and traverse down the columns.
                let currentParent: any = rootTopic;

                // Iterate through user-defined hierarchy levels (Columns)
                for (let level = 0; level < colIndices.length; level++) {
                    const colIndex = colIndices[level];
                    const cellVal = row[colIndex];

                    // Logic:
                    // If cell is NOT empty -> Create/Find node and make it the currentParent.
                    // If cell IS empty -> Do nothing. currentParent stays the same (linking previous level to next level).
                    
                    if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
                        const title = String(cellVal).trim();
                        
                        // Check if currentParent already has a child with this title (Grouping)
                        let existingNode = null;
                        if (currentParent.children && currentParent.children.attached) {
                             existingNode = currentParent.children.attached.find((child: any) => child.title === title);
                        }

                        if (existingNode) {
                            // Reuse existing node
                            currentParent = existingNode;
                        } else {
                            // Create new node
                            const newNode = {
                                id: genId(),
                                title: title,
                                class: 'topic',
                                children: { attached: [] }
                            };
                            
                            if (!currentParent.children) currentParent.children = { attached: [] };
                            if (!currentParent.children.attached) currentParent.children.attached = [];
                            
                            currentParent.children.attached.push(newNode);
                            currentParent = newNode;
                        }
                    }
                    // If empty, continue loop. 
                    // currentParent remains the node from the previous non-empty column.
                }
            }

            xmindSheets.push({
                id: genId(),
                class: 'sheet',
                title: sheetName,
                rootTopic: rootTopic
            });
        });

        // Pack into .xmind (ZIP)
        const zip = new JSZip();
        
        // manifest.json
        zip.file('manifest.json', JSON.stringify({
            "file-entries": {
                "content.json": {},
                "metadata.json": {}
            }
        }));

        // metadata.json
        zip.file('metadata.json', JSON.stringify({}));

        // content.json
        zip.file('content.json', JSON.stringify(xmindSheets));

        // Generate and download
        const blob = await zip.generateAsync({ type: "blob" });
        const fileName = file.name.replace(/\.xlsx$/i, '') + '.xmind';
        downloadBlob(blob, fileName);

    } catch (e: any) {
        alert("转换 XMind 失败: " + e.message);
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleProcess = () => {
      switch(activeTab) {
          case 'img2pdf': return processImg2Pdf();
          case 'excelMerge': return processExcelMerge();
          case 'pdfMerge': return processPdfMerge();
          case 'xlsx2xmind': return processXlsxToXmind();
      }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {(Object.keys(tabConfig) as Tab[]).map((tab) => (
            <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                {tabConfig[tab].label}
            </button>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
         <span className="text-xl">💡</span>
         {currentConfig.desc}
      </div>
      
      {/* Extra Config for XMind */}
      {activeTab === 'xlsx2xmind' && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  自定义列映射 (层级顺序)
              </label>
              <div className="flex gap-2 items-center">
                  <input 
                      type="text" 
                      value={xmindColumns}
                      onChange={e => setXmindColumns(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-sm"
                      placeholder="例如: A,B,C 或 0,1,2"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                      输入列号或字母，用逗号分隔。第一项为根节点下的一级节点，依此类推。
                      <br/>注：默认跳过第一行(表头)；若单元格为空，则自动跳过该层级。
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          
          {/* Left: Upload Area */}
          <div 
             className={`lg:col-span-2 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors ${
                 isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50'
             }`}
             onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
             onDragLeave={() => setIsDragging(false)}
             onDrop={handleDrop}
          >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                 <Icons.Upload className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                 点击或拖拽文件到此处
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                 支持 {currentConfig.accept.replace(/image\//g, '').replace(/\./g, '').toUpperCase()} 格式
              </p>
              
              <input 
                 type="file" 
                 className="hidden" 
                 ref={fileInputRef}
                 multiple={currentConfig.multiple}
                 accept={currentConfig.accept}
                 onChange={(e) => handleFiles(e.target.files)}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                  点击上传文件
              </button>
          </div>

          {/* Right: File List */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">文件列表 ({files.length})</h3>
                  {files.length > 0 && (
                      <button onClick={clearFiles} className="text-xs text-red-500 hover:text-red-700">清空列表</button>
                  )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                  {files.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                          <Icons.FileText className="w-12 h-12 mb-2 opacity-50" />
                          <span>暂无文件</span>
                      </div>
                  ) : (
                      files.map((item, index) => (
                          <div key={item.id} className="group relative bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex gap-3 items-center">
                              {/* Preview for Images */}
                              {item.preview ? (
                                  <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded overflow-hidden shrink-0">
                                      <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                                  </div>
                              ) : (
                                  <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center shrink-0 text-gray-400">
                                      <Icons.FileText className="w-6 h-6" />
                                  </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={item.file.name}>{item.file.name}</p>
                                  <p className="text-xs text-gray-500">{(item.file.size / 1024).toFixed(1)} KB</p>
                              </div>

                              <button 
                                onClick={() => handleRemove(item.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
                              >
                                  <Icons.Trash className="w-4 h-4" />
                              </button>
                          </div>
                      ))
                  )}
              </div>

              {/* Action Button */}
              <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-b-xl">
                  <button 
                    disabled={files.length === 0 || isProcessing}
                    onClick={handleProcess}
                    className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                        files.length === 0 || isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 active:scale-[0.99]'
                    }`}
                  >
                     {isProcessing ? (
                         <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            处理中...
                         </>
                     ) : (
                         <>开始转换 / 合并 ({files.length})</>
                     )}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default FileConverter;