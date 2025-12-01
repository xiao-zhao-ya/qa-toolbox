import React, { useState, useMemo } from 'react';

interface StatusCode {
  code: number;
  phrase: string;
  desc: string;
}

const STATUS_CODES: StatusCode[] = [
  // 1xx
  { code: 100, phrase: 'Continue', desc: '客户端应继续其请求。' },
  { code: 101, phrase: 'Switching Protocols', desc: '服务器根据客户端的请求切换协议（如 WebSocket 升级）。' },
  
  // 2xx
  { code: 200, phrase: 'OK', desc: '请求成功。一般用于 GET 与 POST 请求。' },
  { code: 201, phrase: 'Created', desc: '请求成功并且服务器创建了新的资源。' },
  { code: 202, phrase: 'Accepted', desc: '服务器已接受请求，但尚未处理。' },
  { code: 204, phrase: 'No Content', desc: '服务器成功处理了请求，但不需要返回任何实体内容。' },
  { code: 206, phrase: 'Partial Content', desc: '服务器已经成功处理了部分 GET 请求（断点续传）。' },

  // 3xx
  { code: 301, phrase: 'Moved Permanently', desc: '永久重定向。请求的资源已被永久移动到新 URI。' },
  { code: 302, phrase: 'Found', desc: '临时重定向。资源临时移动到新 URI，客户端应继续使用原有 URI。' },
  { code: 304, phrase: 'Not Modified', desc: '资源未修改。客户端可使用缓存的版本。' },
  { code: 307, phrase: 'Temporary Redirect', desc: '临时重定向。与 302 类似，但要求使用相同的方法（POST 不会变 GET）。' },
  { code: 308, phrase: 'Permanent Redirect', desc: '永久重定向。与 301 类似，但要求使用相同的方法。' },

  // 4xx
  { code: 400, phrase: 'Bad Request', desc: '客户端请求的语法错误，服务器无法理解。' },
  { code: 401, phrase: 'Unauthorized', desc: '请求要求用户的身份认证（未登录或 Token 无效）。' },
  { code: 403, phrase: 'Forbidden', desc: '服务器理解请求客户端的请求，但是拒绝执行此请求（无权限）。' },
  { code: 404, phrase: 'Not Found', desc: '服务器无法根据客户端的请求找到资源（网页）。' },
  { code: 405, phrase: 'Method Not Allowed', desc: '客户端请求中的方法被禁止（如只允许 POST 但用了 GET）。' },
  { code: 408, phrase: 'Request Timeout', desc: '服务器等待客户端发送的请求时间过长，超时。' },
  { code: 409, phrase: 'Conflict', desc: '请求与当前服务器端资源状态冲突（如重复提交）。' },
  { code: 413, phrase: 'Payload Too Large', desc: '请求提交的实体数据大小超过了服务器愿意或能够处理的界限。' },
  { code: 414, phrase: 'URI Too Long', desc: 'URL 过长，服务器无法处理。' },
  { code: 415, phrase: 'Unsupported Media Type', desc: '不支持的媒体格式（如 Content-Type 不正确）。' },
  { code: 417, phrase: 'Expectation Failed', desc: '服务器无法满足 Expect 请求头字段的要求。较少见。' },
  { code: 422, phrase: 'Unprocessable Entity', desc: '请求格式正确，但是由于含有语义错误，无法响应。' },
  { code: 429, phrase: 'Too Many Requests', desc: '客户端发送的请求过多（触发限流）。' },

  // 5xx
  { code: 500, phrase: 'Internal Server Error', desc: '服务器内部错误，无法完成请求。' },
  { code: 501, phrase: 'Not Implemented', desc: '服务器不支持请求的功能，无法完成请求。' },
  { code: 502, phrase: 'Bad Gateway', desc: '作为网关或代理工作的服务器尝试执行请求时，从上游服务器接收到无效的响应。' },
  { code: 503, phrase: 'Service Unavailable', desc: '系统维护或超载，服务器暂时无法处理请求。' },
  { code: 504, phrase: 'Gateway Timeout', desc: '作为网关或代理工作的服务器，未及时从上游服务器获取请求。' },
];

const HttpStatusTool: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | '1xx' | '2xx' | '3xx' | '4xx' | '5xx'>('ALL');
  const [search, setSearch] = useState('');

  const filteredCodes = useMemo(() => {
    return STATUS_CODES.filter(item => {
      // 1. Filter by category
      if (filter !== 'ALL') {
         const prefix = filter.charAt(0);
         if (!item.code.toString().startsWith(prefix)) return false;
      }

      // 2. Filter by search term
      if (search.trim()) {
        const term = search.toLowerCase();
        return (
            item.code.toString().includes(term) ||
            item.phrase.toLowerCase().includes(term) ||
            item.desc.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [filter, search]);

  const getColorClass = (code: number) => {
      if (code >= 500) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      if (code >= 400) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      if (code >= 300) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      if (code >= 200) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  };

  return (
    <div className="h-full flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
            {['ALL', '1xx', '2xx', '3xx', '4xx', '5xx'].map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        filter === cat 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                    {cat === 'ALL' ? '全部' : cat}
                </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
             </div>
             <input
                type="text"
                placeholder="搜索状态码 (e.g., 502, timeout)"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
             />
          </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
          {filteredCodes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  未找到匹配的状态码。
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-3">
                  {filteredCodes.map(item => (
                      <div 
                        key={item.code} 
                        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center gap-4 hover:shadow-sm transition-shadow bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700`}
                      >
                          <div className={`flex items-center justify-center w-16 h-16 rounded-lg text-xl font-bold border ${getColorClass(item.code)} shrink-0`}>
                              {item.code}
                          </div>
                          <div className="flex-1">
                              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                  {item.phrase}
                                  {/* Quick Tags for special ones */}
                                  {item.code === 417 && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">冷门</span>}
                                  {(item.code === 502 || item.code === 504) && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">网关错误</span>}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {item.desc}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default HttpStatusTool;
