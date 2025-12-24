
import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { Icons } from '../constants';

// 定义已保存密钥的结构
interface SavedKey {
  id: string;
  name: string;
  value: string;
  type: 'Base64' | 'UTF8'; 
}

type ToolTab = 'aes' | 'hash';
type AesMode = 'CBC' | 'ECB';
type OutputFormat = 'Base64' | 'Hex';
type InputDataType = 'UTF8' | 'Base64';
type HashType = 'MD5' | 'SHA1' | 'SHA256' | 'SHA512';

const CryptoTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('aes');

  // --- AES States ---
  const [secretKey, setSecretKey] = useState('');
  const [keyType, setKeyType] = useState<InputDataType>('Base64');
  const [showKey, setShowKey] = useState(false);
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [tempKeyName, setTempKeyName] = useState('');
  const [mode, setMode] = useState<AesMode>('CBC');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('Base64');
  const [iv, setIv] = useState('');
  const [ivFromData, setIvFromData] = useState(true);
  const [aesInput, setAesInput] = useState('');
  const [aesOutput, setAesOutput] = useState('');

  // --- Hash States ---
  const [hashInput, setHashInput] = useState('');
  const [hashType, setHashType] = useState<HashType>('SHA256');
  const [hashSalt, setHashSalt] = useState('');
  const [hashOutput, setHashOutput] = useState('');

  // --- Global Notification ---
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 初始化：加载已存密钥
  useEffect(() => {
    const storageKey = 'aes_saved_keys_prod_v1';
    const rawData = localStorage.getItem(storageKey);
    if (rawData) {
      try {
        setSavedKeys(JSON.parse(rawData));
      } catch (e) {
        console.error("加载本地密钥失败", e);
      }
    }
  }, []);

  const updateLocalStorage = (newKeys: SavedKey[]) => {
    setSavedKeys(newKeys);
    localStorage.setItem('aes_saved_keys_prod_v1', JSON.stringify(newKeys));
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- AES Logic ---
  const openSaveDialog = () => {
    if (!secretKey.trim()) {
      setError("请先在密钥框中输入内容再保存");
      return;
    }
    setTempKeyName(`密钥_${new Date().toLocaleDateString()}`);
    setIsSaveModalOpen(true);
  };

  const confirmSaveKey = () => {
    if (!tempKeyName.trim()) return;
    if (savedKeys.some(k => k.name === tempKeyName.trim())) {
      setError("名称已存在，请更换一个备注名");
      return;
    }
    const newKey: SavedKey = {
      id: Math.random().toString(36).substr(2, 9),
      name: tempKeyName.trim(),
      value: secretKey.trim(),
      type: keyType
    };
    const updated = [...savedKeys, newKey];
    updateLocalStorage(updated);
    setSelectedKeyId(newKey.id);
    setIsSaveModalOpen(false);
    showSuccess("密钥已安全存入本地浏览器缓存");
  };

  const handleDeleteKey = () => {
    if (!selectedKeyId) return;
    const updated = savedKeys.filter(k => k.id !== selectedKeyId);
    updateLocalStorage(updated);
    setSelectedKeyId('');
    setSecretKey('');
    showSuccess("密钥已移除");
  };

  const onKeySelect = (id: string) => {
    const target = savedKeys.find(k => k.id === id);
    if (target) {
      setSecretKey(target.value);
      setKeyType(target.type);
      setSelectedKeyId(id);
    }
  };

  const handleAesCrypto = (action: 'encrypt' | 'decrypt') => {
    setError(null);
    try {
      if (!secretKey) throw new Error("请输入密钥 (Key)");
      if (!aesInput) throw new Error("请输入待处理文本");

      let keyParsed;
      try {
        keyParsed = keyType === 'Base64' 
          ? CryptoJS.enc.Base64.parse(secretKey) 
          : CryptoJS.enc.Utf8.parse(secretKey.padEnd(32, '0'));
      } catch (e) {
        throw new Error("密钥解析失败，请确保格式选择正确（Base64 或 UTF8）");
      }

      const config: any = {
        mode: mode === 'CBC' ? CryptoJS.mode.CBC : CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      };

      let finalInput = aesInput.trim();
      let result = '';

      if (action === 'encrypt') {
        if (mode === 'CBC') {
          const rawIv = iv || secretKey;
          config.iv = CryptoJS.enc.Utf8.parse(rawIv.substring(0, 16).padEnd(16, '0'));
        }
        const encrypted = CryptoJS.AES.encrypt(finalInput, keyParsed, config);
        if (mode === 'CBC' && ivFromData) {
          const combined = config.iv.clone().concat(encrypted.ciphertext);
          result = outputFormat === 'Base64' ? CryptoJS.enc.Base64.stringify(combined) : combined.toString(CryptoJS.enc.Hex);
        } else {
          result = outputFormat === 'Base64' ? encrypted.toString() : encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        }
      } else {
        let cipherData;
        try {
          cipherData = outputFormat === 'Base64' ? CryptoJS.enc.Base64.parse(finalInput) : CryptoJS.enc.Hex.parse(finalInput);
        } catch (e) { throw new Error("密文格式不正确，请检查 Output 格式选择"); }

        if (mode === 'CBC' && ivFromData) {
          const extractedIv = CryptoJS.lib.WordArray.create(cipherData.words.slice(0, 4), 16);
          const extractedCipher = CryptoJS.lib.WordArray.create(cipherData.words.slice(4), cipherData.sigBytes - 16);
          config.iv = extractedIv;
          const decrypted = CryptoJS.AES.decrypt({ ciphertext: extractedCipher } as any, keyParsed, config);
          result = decrypted.toString(CryptoJS.enc.Utf8);
        } else {
          if (mode === 'CBC') config.iv = CryptoJS.enc.Utf8.parse(iv.padEnd(16, '0'));
          const decrypted = CryptoJS.AES.decrypt({ ciphertext: cipherData } as any, keyParsed, config);
          result = decrypted.toString(CryptoJS.enc.Utf8);
        }
        if (!result) throw new Error("解密失败：结果为空。通常是密钥或 IV 提取逻辑不匹配导致。");
      }
      setAesOutput(result);
    } catch (e: any) {
      setError(e.message);
      setAesOutput('');
    }
  };

  // --- Hash Logic ---
  const handleHash = () => {
    setError(null);
    if (!hashInput) {
      setHashOutput('');
      return;
    }
    try {
      // 盐值逻辑：将盐值附加到输入文本之后 (Salt + Input 或 Input + Salt 均可，这里采用拼接方式)
      const combinedInput = hashInput + hashSalt;
      let hashed;
      switch (hashType) {
        case 'MD5': hashed = CryptoJS.MD5(combinedInput); break;
        case 'SHA1': hashed = CryptoJS.SHA1(combinedInput); break;
        case 'SHA256': hashed = CryptoJS.SHA256(combinedInput); break;
        case 'SHA512': hashed = CryptoJS.SHA512(combinedInput); break;
        default: hashed = CryptoJS.SHA256(combinedInput);
      }
      setHashOutput(hashed.toString());
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 flex flex-col gap-6 animate-in fade-in duration-500 h-full">
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="bg-gray-200 dark:bg-slate-800 p-1 rounded-2xl flex w-full max-w-sm">
          <button 
            onClick={() => { setActiveTab('aes'); setError(null); }}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${activeTab === 'aes' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            AES 加解密
          </button>
          <button 
            onClick={() => { setActiveTab('hash'); setError(null); }}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${activeTab === 'hash' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            哈希函数 (MD5/SHA)
          </button>
        </div>
      </div>

      {activeTab === 'aes' ? (
        <div className="space-y-6">
          {/* 密钥配置区 */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">密钥内容</label>
                  <div className="flex bg-gray-100 dark:bg-slate-900 p-0.5 rounded-lg">
                    {(['Base64', 'UTF8'] as InputDataType[]).map(t => (
                      <button key={t} onClick={() => setKeyType(t)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${keyType === t ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-gray-400'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="relative group">
                  <input 
                    type={showKey ? "text" : "password"}
                    className="w-full pl-5 pr-12 py-4 bg-gray-50 dark:bg-slate-900 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm shadow-inner transition-all"
                    placeholder="在此输入或粘贴密钥..."
                    value={secretKey}
                    onChange={e => setSecretKey(e.target.value)}
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
                    {showKey ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">快速加载常用密钥</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedKeyId} 
                    onChange={e => onKeySelect(e.target.value)} 
                    className="flex-1 px-5 py-4 bg-gray-50 dark:bg-slate-900 border border-transparent rounded-2xl outline-none text-sm shadow-inner appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <option value="">点击查看收藏列表...</option>
                    {savedKeys.map(k => (
                      <option key={k.id} value={k.id}>{k.name} ({k.type})</option>
                    ))}
                  </select>
                  <button 
                    title="保存到本地"
                    onClick={openSaveDialog} 
                    className="p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 shadow-sm transition-all active:scale-90"
                  >
                    <Icons.Star className={`w-6 h-6 ${selectedKeyId ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    title="移除选中密钥"
                    onClick={handleDeleteKey} 
                    className="p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 shadow-sm transition-all active:scale-90"
                  >
                    <Icons.Trash className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 参数选项 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 space-y-3 shadow-sm">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">加密模式</label>
              <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
                {(['CBC', 'ECB'] as AesMode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === m ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-gray-400'}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 space-y-3 shadow-sm">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">输出格式</label>
              <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
                {(['Base64', 'Hex'] as OutputFormat[]).map(f => (
                  <button key={f} onClick={() => setOutputFormat(f)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${outputFormat === f ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="md:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 space-y-3 shadow-sm">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex justify-between">
                IV (偏移量) 逻辑
                <label className="flex items-center gap-1 cursor-pointer normal-case text-blue-500 font-bold">
                  <input type="checkbox" checked={ivFromData} onChange={e => setIvFromData(e.target.checked)} className="rounded" />
                  密文前16字节为IV (SQL 常用)
                </label>
              </label>
              <input 
                type="text" 
                disabled={mode === 'ECB' || ivFromData} 
                className={`w-full px-5 py-2 bg-gray-50 dark:bg-slate-900 border border-transparent rounded-xl outline-none text-sm font-mono shadow-inner transition-all ${(mode === 'ECB' || ivFromData) ? 'opacity-30 cursor-not-allowed' : 'hover:border-gray-200'}`}
                placeholder="手动输入 IV..."
                value={iv}
                onChange={e => setIv(e.target.value)}
              />
            </div>
          </div>

          {/* 工作区 */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/30">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">输入密文 / 明文</span>
                <button onClick={() => setAesInput('')} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">清空</button>
              </div>
              <textarea className="w-full h-40 p-6 outline-none bg-transparent resize-none font-mono text-sm leading-relaxed" placeholder="粘贴密文进行解密，或输入明文进行加密..." value={aesInput} onChange={e => setAesInput(e.target.value)} />
              <div className="p-6 bg-gray-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-4">
                <button onClick={() => handleAesCrypto('encrypt')} className="py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">加密 (Encrypt)</button>
                <button onClick={() => handleAesCrypto('decrypt')} className="py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-xl active:scale-[0.98] transition-all">解密 (Decrypt)</button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/30">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">处理结果</span>
                <button onClick={() => { if(aesOutput) { navigator.clipboard.writeText(aesOutput); showSuccess("结果已复制到剪贴板"); } }} className="text-xs text-blue-500 hover:underline font-bold">复制结果</button>
              </div>
              <textarea readOnly className="w-full h-32 p-6 outline-none bg-gray-50/10 dark:bg-slate-900/10 resize-none font-mono text-sm text-slate-800 dark:text-slate-200" placeholder="处理后的结果显示于此..." value={aesOutput} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hashing UI */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">算法选择</label>
                <div className="flex bg-gray-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-2 overflow-x-auto">
                  {(['MD5', 'SHA1', 'SHA256', 'SHA512'] as HashType[]).map(t => (
                    <button 
                      key={t} 
                      onClick={() => { setHashType(t); setHashOutput(''); }}
                      className={`flex-1 min-w-[80px] py-3 text-xs font-bold rounded-xl transition-all ${hashType === t ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">随机盐值 (Salt - 可选)</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-900 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm shadow-inner transition-all"
                  placeholder="例如：my_secure_salt_123"
                  value={hashSalt}
                  onChange={e => setHashSalt(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/30">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">输入文本 (待计算 Hash)</span>
                <button onClick={() => setHashInput('')} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">清空</button>
              </div>
              <textarea 
                className="w-full h-40 p-6 outline-none bg-transparent resize-none font-mono text-sm leading-relaxed" 
                placeholder="在此输入需要计算 Hash 的字符串..." 
                value={hashInput} 
                onChange={e => setHashInput(e.target.value)} 
              />
              <div className="p-6 bg-gray-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700">
                <button 
                  onClick={handleHash} 
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  计算 {hashType}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/30">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Hash 结果 (HEX)</span>
                <button onClick={() => { if(hashOutput) { navigator.clipboard.writeText(hashOutput); showSuccess("Hash 已复制"); } }} className="text-xs text-blue-500 hover:underline font-bold">复制结果</button>
              </div>
              <textarea 
                readOnly 
                className="w-full h-24 p-6 outline-none bg-gray-50/10 dark:bg-slate-900/10 resize-none font-mono text-sm text-slate-800 dark:text-slate-200" 
                placeholder="哈希值将在此处显示..." 
                value={hashOutput} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 提示组件 */}
      {(error || successMsg) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-4 animate-in slide-in-from-bottom-10 z-50">
          <div className={`${error ? 'bg-red-500' : 'bg-green-600'} text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3`}>
            <div className="p-2 bg-white/20 rounded-xl">
              {error ? <Icons.Trash className="w-5 h-5" /> : <Icons.Sun className="w-5 h-5" />}
            </div>
            <span className="font-bold flex-1 text-sm leading-snug">{error || successMsg}</span>
            <button onClick={() => { setError(null); setSuccessMsg(null); }} className="p-1 hover:bg-white/10 rounded">✕</button>
          </div>
        </div>
      )}

      {/* 自定义保存密钥模态框 */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">保存密钥备注</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">为该密钥设置一个便于识别的名字，它将保存在您的浏览器本地缓存中。</p>
            <input 
              type="text" 
              autoFocus
              className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-sm"
              placeholder="例如：生产数据库解析密钥"
              value={tempKeyName}
              onChange={e => setTempKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmSaveKey()}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmSaveKey}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-gray-400 dark:text-gray-600 space-y-1 py-4 uppercase tracking-widest font-medium">
        <p>AES-256 / MD5 / SHA-256 · 生产级加密工具</p>
        <p>本地存储密钥，确保离线安全使用</p>
      </div>
    </div>
  );
};

export default CryptoTool;
