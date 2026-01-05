
import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlatformType, 
  Resolution, 
  GeneratedPost, 
  AppState 
} from './types';
import { generateSocialImages, generateCaption } from './services/geminiService';
import { WatermarkCanvas } from './components/WatermarkCanvas';
import { 
  Key, 
  Sparkles, 
  Download, 
  Copy, 
  RefreshCw, 
  Layers, 
  Layout, 
  Type, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    apiKeySelected: false,
    isGenerating: false,
    statusMessage: '',
    posts: [],
    settings: {
      platform: PlatformType.IG_SQUARE,
      resolution: Resolution.RES_1K,
      style: '現代簡約',
      count: 1,
      watermark: '@SocialGenAI',
      watermarkOpacity: 0.6,
      showWatermark: true,
    }
  });

  const [prompt, setPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stylePresets = [
    { name: '現代簡約', icon: '✨' },
    { name: '日系雜誌', icon: '📖' },
    { name: '底片懷舊', icon: '🎞️' },
    { name: '美式復古', icon: '🇺🇸' },
    { name: '賽博龐克', icon: '🌃' },
    { name: '自然清新', icon: '🌿' },
    { name: '療癒插畫', icon: '🎨' },
    { name: '奢華質感', icon: '💎' },
  ];

  useEffect(() => {
    const checkKeyStatus = async () => {
      if (typeof window.aistudio !== 'undefined' && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          setState(prev => ({ ...prev, apiKeySelected: true }));
        }
      } else if (process.env.API_KEY) {
        setState(prev => ({ ...prev, apiKeySelected: true }));
      }
    };
    checkKeyStatus();
  }, []);

  const handleOpenKeySelector = async () => {
    if (typeof window.aistudio !== 'undefined' && window.aistudio.openSelectKey) {
      window.aistudio.openSelectKey();
      // 規範要求：呼叫後應立即假設成功並進入
      setState(prev => ({ ...prev, apiKeySelected: true }));
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      statusMessage: 'AI 正在為您構思視覺設計...',
      posts: [] 
    }));

    try {
      const imageUrls = await generateSocialImages(
        prompt,
        state.settings.platform,
        state.settings.resolution,
        state.settings.style,
        state.settings.count
      );
      
      const newPosts: GeneratedPost[] = await Promise.all(imageUrls.map(async (url, idx) => {
        const caption = await generateCaption(prompt, state.settings.style);
        return {
          id: `${Date.now()}-${idx}`,
          originalUrl: url,
          processedUrl: url,
          prompt: prompt,
          caption: caption
        };
      }));

      setState(prev => ({ 
        ...prev, 
        posts: newPosts, 
        isGenerating: false, 
        statusMessage: '設計已準備就緒！' 
      }));

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      const isEntityNotFound = error.message?.includes("Requested entity was not found.");
      if (isEntityNotFound) {
        setState(prev => ({ ...prev, isGenerating: false, apiKeySelected: false }));
        handleOpenKeySelector();
      } else {
        setState(prev => ({ ...prev, isGenerating: false, statusMessage: `生成出錯: ${error.message}` }));
      }
    }
  };

  const updateProcessedUrl = useCallback((postId: string, newUrl: string) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? { ...p, processedUrl: newUrl } : p)
    }));
  }, []);

  const downloadImage = (url: string, format: 'png' | 'jpg') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `social-post-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!state.apiKeySelected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6 text-center">
        <div className="max-w-md w-full space-y-10 p-12 bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-600/20 rounded-3xl">
              <Sparkles className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">SocialGen AI</h1>
            <p className="text-slate-400 text-lg font-light leading-relaxed">釋放 AI 創意，生成具有設計感的社群圖文。</p>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-3"
          >
            <Key className="w-5 h-5" />
            設定 API 金鑰開始
          </button>
          <p className="text-xs text-slate-500">
            需要具備付款方式的 API Key。
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-400 hover:underline ml-1">查看文件</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 flex flex-col font-sans">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900/50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight hidden sm:inline-block">SocialGen <span className="text-blue-500">AI</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleOpenKeySelector}
            title="管理 API Key"
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full transition-all text-slate-400 hover:text-blue-400 active:scale-90"
          >
            <Key className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* 左側：控制面板 */}
        <aside className="w-full lg:w-[400px] space-y-8 flex-shrink-0">
          <section className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md space-y-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                <Type className="w-4 h-4" /> 貼文主題描述
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="輸入您想生成的場景，例如：夏日午後的咖啡廳，極簡雜誌風格..."
                className="w-full h-36 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-slate-200 text-base placeholder:text-slate-800"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                <Layout className="w-4 h-4" /> 尺寸比例
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: PlatformType.IG_SQUARE, label: '1:1', sub: '正方形' },
                  { type: PlatformType.IG_STORY, label: '9:16', sub: '限時動態' },
                  { type: PlatformType.FB_POST, label: '4:3', sub: 'FB貼文' },
                  { type: PlatformType.X_POST, label: '16:9', sub: '橫向寬屏' }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, platform: item.type }}))}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${state.settings.platform === item.type ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="text-[10px] opacity-60 font-medium">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                <Layers className="w-4 h-4" /> 設計風格
              </label>
              <div className="grid grid-cols-2 gap-2">
                {stylePresets.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, style: style.name }}))}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-bold transition-all ${state.settings.style === style.name ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <span>{style.icon}</span>
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">品牌浮水印</label>
              <input 
                type="text"
                value={state.settings.watermark}
                onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, watermark: e.target.value }}))}
                placeholder="@YourAccount"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-300"
              />
            </div>

            <button 
              disabled={state.isGenerating || !prompt}
              onClick={handleGenerate}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-blue-900/30 active:scale-95 flex items-center justify-center gap-3"
            >
              {state.isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  設計師正在思考中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成專業設計
                </>
              )}
            </button>
          </section>
        </aside>

        {/* 右側：生成結果展示區 */}
        <section id="results-section" className="flex-1 space-y-12">
          {state.isGenerating && (
            <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-slate-300">正在調用 Gemini 創意模型</p>
                <p className="text-slate-500 text-sm">{state.statusMessage}</p>
              </div>
            </div>
          )}

          {!state.isGenerating && state.posts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
              <Layout className="w-32 h-32 mb-8 text-slate-700" />
              <p className="text-2xl font-black text-slate-700 tracking-tighter uppercase">Waiting for your ideas</p>
            </div>
          )}

          {state.posts.map((post) => (
            <div key={post.id} className="group flex flex-col xl:flex-row gap-10 items-start animate-in slide-in-from-bottom-8 fade-in duration-700">
              <div className="w-full xl:flex-1 relative">
                <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group-hover:shadow-blue-900/10 transition-shadow">
                  <img 
                    src={post.processedUrl} 
                    alt="AI Designed Post" 
                    className="w-full h-auto" 
                  />
                  <WatermarkCanvas 
                    imageUrl={post.originalUrl}
                    text={state.settings.watermark}
                    opacity={state.settings.watermarkOpacity}
                    show={state.settings.showWatermark}
                    onProcessed={(url) => updateProcessedUrl(post.id, url)}
                  />
                </div>
                
                <div className="mt-6 flex gap-4">
                  <button 
                    onClick={() => downloadImage(post.processedUrl, 'png')}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" /> 下載圖片
                  </button>
                </div>
              </div>

              <div className="w-full xl:w-96 p-8 bg-slate-900/40 rounded-[2rem] border border-slate-800/60 backdrop-blur-sm space-y-6 self-stretch flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> AI 撰寫文案
                  </h3>
                  <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-bold uppercase">
                    Professional
                  </div>
                </div>
                <div className="flex-1 text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap font-medium bg-slate-950/40 p-5 rounded-2xl border border-slate-800/30">
                  {post.caption}
                </div>
                <button 
                  onClick={() => copyToClipboard(post.caption, post.id)}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${copiedId === post.id ? 'bg-green-600 text-white' : 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20'}`}
                >
                  {copiedId === post.id ? (
                    <><CheckCircle2 className="w-4 h-4" /> 已複製到剪貼簿</>
                  ) : (
                    <><Copy className="w-4 h-4" /> 複製文案</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="w-full py-10 border-t border-slate-900/50 flex flex-col items-center gap-2">
        <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.5em]">SocialGen AI • Aesthetic Generator</p>
        <p className="text-slate-800 text-[9px]">Powered by Gemini-3 Models</p>
      </footer>
    </div>
  );
};

export default App;
