import React, { useState } from 'react';

const DataGenTool: React.FC = () => {
  const [output, setOutput] = useState('');
  
  // UUID Config
  const [uuidCount, setUuidCount] = useState(5);
  
  // Random String Config
  const [strLength, setStrLength] = useState(16);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSpecial, setUseSpecial] = useState(false);
  const [useChinese, setUseChinese] = useState(false);

  const getUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for non-secure contexts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateUUID = () => {
    let res = '';
    for(let i=0; i<uuidCount; i++) {
        res += getUUID() + '\n';
    }
    setOutput(res);
  };

  const generateRandomString = () => {
     let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
     if (useNumbers) chars += '0123456789';
     if (useSpecial) chars += '!@#$%^&*()_+';
     if (useChinese) {
         // Add common Chinese characters (approx 300) to ensure a good mix without overwhelming probability
         chars += '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取完举告至拉直认算利近形持名界受联入建';
     }

     let res = '';
     // Generate 5 examples
     for(let k=0; k<5; k++) {
         let s = '';
         for(let i=0; i<strLength; i++) {
            s += chars.charAt(Math.floor(Math.random() * chars.length));
         }
         res += s + '\n';
     }
     setOutput(res);
  };

  const generateUser = () => {
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const domains = ['gmail.com', 'test.com', 'example.org'];
    
    let res = [];
    for(let i=0; i<5; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        res.push(JSON.stringify({
            name: `${fn} ${ln}`,
            email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`,
            phone: `1${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 9000000 + 1000000)}`
        }));
    }
    setOutput(res.join('\n'));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* UUID Generator */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                <h3 className="font-bold mb-3 text-slate-800 dark:text-slate-100">UUID 生成</h3>
                <div className="flex gap-2 mb-3">
                    <input 
                        type="number" 
                        min="1" max="50" 
                        value={uuidCount} 
                        onChange={e => setUuidCount(parseInt(e.target.value))}
                        className="w-20 p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                    />
                    <span className="self-center text-sm text-gray-500">个</span>
                </div>
                <button onClick={generateUUID} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">生成 UUID</button>
            </div>

            {/* Random Strings */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                <h3 className="font-bold mb-3 text-slate-800 dark:text-slate-100">随机字符串</h3>
                <div className="space-y-2 mb-3">
                     <div className="flex justify-between">
                         <label className="text-sm">长度</label>
                         <input type="number" value={strLength} onChange={e => setStrLength(parseInt(e.target.value))} className="w-16 p-1 border rounded text-right dark:bg-slate-700 dark:border-slate-600"/>
                     </div>
                     <label className="flex items-center gap-2 text-sm">
                         <input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)} />
                         包含数字
                     </label>
                     <label className="flex items-center gap-2 text-sm">
                         <input type="checkbox" checked={useSpecial} onChange={e => setUseSpecial(e.target.checked)} />
                         包含特殊字符
                     </label>
                     <label className="flex items-center gap-2 text-sm">
                         <input type="checkbox" checked={useChinese} onChange={e => setUseChinese(e.target.checked)} />
                         包含中文
                     </label>
                </div>
                <button onClick={generateRandomString} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">生成字符串</button>
            </div>

             {/* User Data */}
             <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                <h3 className="font-bold mb-3 text-slate-800 dark:text-slate-100">模拟用户数据</h3>
                <p className="text-xs text-gray-500 mb-3">生成姓名、邮箱、手机号 (JSON 格式)</p>
                <button onClick={generateUser} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded">生成用户数据</button>
            </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-gray-600 dark:text-slate-300">生成结果</label>
                <button 
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    复制结果
                </button>
            </div>
            <textarea 
                readOnly
                className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none resize-none"
                value={output}
                placeholder="结果将显示在这里..."
            />
        </div>
    </div>
  );
};

export default DataGenTool;