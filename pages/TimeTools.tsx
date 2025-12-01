import React, { useState, useEffect } from 'react';

const TimeTools: React.FC = () => {
  const [now, setNow] = useState(Date.now());
  
  // Section 1: Timestamp to Date
  const [inputTs, setInputTs] = useState<string>('');
  const [tsUnit, setTsUnit] = useState<'ms' | 's'>('s');
  const [tsResult, setTsResult] = useState<{local: string, utc: string} | null>(null);

  // Section 2: Date to Timestamp
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [dateResult, setDateResult] = useState<number | null>(null);

  // Auto-update "Current Time"
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTsConvert = () => {
    if (!inputTs) return;
    let ts = parseInt(inputTs);
    if (isNaN(ts)) return;

    if (tsUnit === 's') ts *= 1000;
    
    const date = new Date(ts);
    setTsResult({
      local: date.toLocaleString(),
      utc: date.toISOString()
    });
  };

  const handleDateConvert = () => {
    if (!dateInput) return;
    // Combine date and time, default time to 00:00 if empty
    const timeStr = timeInput || '00:00';
    const dateObj = new Date(`${dateInput}T${timeStr}`);
    setDateResult(dateObj.getTime());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Current Time Dashboard */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">当前时间 (本地)</h2>
            <div className="text-3xl font-mono font-bold text-slate-800 dark:text-blue-400 mt-1">
                {new Date(now).toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-400">{new Date(now).toLocaleDateString()}</div>
         </div>
         <div className="text-right">
             <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">当前 Unix 时间戳</h2>
             <div className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                {Math.floor(now / 1000)} <span className="text-sm text-gray-400 font-normal">s</span>
             </div>
             <div className="text-sm font-mono text-gray-400">{now} ms</div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Timestamp -> Date */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                时间戳 <span className="text-gray-400">→</span> 日期时间
             </h3>
             <div className="space-y-4">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputTs}
                        onChange={(e) => setInputTs(e.target.value)}
                        placeholder="例如 1672531200"
                        className="flex-1 p-2 border rounded bg-transparent dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <select 
                        value={tsUnit}
                        onChange={(e) => setTsUnit(e.target.value as 'ms' | 's')}
                        className="p-2 border rounded bg-transparent dark:border-slate-600 dark:bg-slate-800"
                    >
                        <option value="s">秒 (s)</option>
                        <option value="ms">毫秒 (ms)</option>
                    </select>
                </div>
                <button 
                    onClick={handleTsConvert}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                    转换
                </button>
                {tsResult && (
                    <div className="mt-4 bg-gray-50 dark:bg-slate-900 p-4 rounded text-sm space-y-2 font-mono">
                        <div className="flex justify-between">
                            <span className="text-gray-500">本地时间:</span>
                            <span className="select-all">{tsResult.local}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
                            <span className="text-gray-500">UTC 时间:</span>
                            <span className="select-all text-blue-600 dark:text-blue-400">{tsResult.utc}</span>
                        </div>
                    </div>
                )}
             </div>
          </div>

          {/* Date -> Timestamp */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                日期时间 <span className="text-gray-400">→</span> 时间戳
             </h3>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="date" 
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="p-2 border rounded bg-transparent dark:border-slate-600 dark:[color-scheme:dark]"
                    />
                    <input 
                        type="time" 
                        step="1"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        className="p-2 border rounded bg-transparent dark:border-slate-600 dark:[color-scheme:dark]"
                    />
                </div>
                <button 
                    onClick={handleDateConvert}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                    转换
                </button>
                {dateResult !== null && (
                    <div className="mt-4 bg-gray-50 dark:bg-slate-900 p-4 rounded text-sm space-y-2 font-mono">
                        <div className="flex justify-between">
                            <span className="text-gray-500">秒级:</span>
                            <span className="select-all font-bold text-blue-600 dark:text-blue-400">{Math.floor(dateResult / 1000)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
                            <span className="text-gray-500">毫秒级:</span>
                            <span className="select-all">{dateResult}</span>
                        </div>
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default TimeTools;