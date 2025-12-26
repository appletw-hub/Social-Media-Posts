import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlatformType, 
  Resolution, 
  GeneratedPost, 
  AppState 
} from './types';
import { generateSocialImages, generateCaption } from './services/geminiService';
import { WatermarkCanvas } from './components/WatermarkCanvas';

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

  // Styles presets - Updated "觸覺感" to "手繪感" as requested
  const stylePresets = [
    '現代簡約', '日系雜誌', '底片懷舊', 
    '美式復古', '賽博龐克', '自然清新', 
    '溫馨感', '手繪感', '療癒系'
  ];

  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof window.aistudio !== 'undefined' && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setState(prev => ({ ...prev, apiKeySelected: hasKey }));
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (typeof window.aistudio !== 'undefined' && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setState(prev => ({ ...prev, apiKeySelected: true }));
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      statusMessage: 'AI 正在為您設計專屬社群圖文...',
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
        statusMessage: '生成完成！' 
      }));

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error(error);
      const isEntityNotFound = error.message?.includes("Requested entity was not found.");
      if (isEntityNotFound) {
        setState(prev => ({ ...prev, isGenerating: false, apiKeySelected: false }));
        if (typeof window.aistudio !== 'undefined' && window.aistudio.openSelectKey) {
          window.aistudio.openSelectKey();
        }
      } else {
        setState(prev => ({ ...prev, isGenerating: false, statusMessage: '發生錯誤，請稍後再試' }));
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

  if (!state.apiKeySelected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="max-w-md w-full space-y-8 p-10 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic tracking-tight">Social Media Posts</h1>
            <p className="text-slate-400 text-lg">一鍵解鎖您的社群設計影響力</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-900/40"
            >
              設定 API Key 以開始
            </button>
            <p className="text-xs text-slate-500">
              使用高階生成模型需選取具備付款方式的 API Key。
              <br />
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                查看帳單文件 (Billing Documentation)
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center">
      {/* Header - Centered Layout */}
      <header className="w-full max-w-5xl px-6 py-16 flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent tracking-tighter">
          Social Media Posts
        </h1>
        <div className="px-6 py-1.5 bg-blue-600/10 rounded-full text-[11px] font-black text-blue-400 border border-blue-500/30 uppercase tracking-[0.4em] backdrop-blur-sm">
          Ready to Design
        </div>
      </header>

      <main className="w-full max-w-4xl px-6 pb-24 space-y-12">
        {/* Main Control Panel */}
        <section className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[3rem] shadow-2xl backdrop-blur-md space-y-10">
          {/* Prompt Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">貼文核心主題</label>
              <span className="text-[10px] text-slate-600 font-medium">使用繁體中文描述效果最佳</span>
            </div>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="輸入您的貼文靈魂... (例如：在城市頂樓看夜景，手拿著一杯氣泡飲，冷色調氛圍)"
              className="w-full h-36 bg-slate-950/80 border border-slate-800 rounded-[2rem] p-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-slate-200 text-lg placeholder:text-slate-800 shadow-inner"
            />
          </div>

          <div className="space-y-10">
            {/* Platform Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">發布平台尺寸</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { type: PlatformType.IG_SQUARE, label: 'IG 貼文', sub: '1:1' },
                  { type: PlatformType.IG_STORY, label: 'IG 限動', sub: '9:16' },
                  { type: PlatformType.FB_POST, label: 'FB 貼文', sub: '4:3' },
                  { type: PlatformType.X_POST, label: 'X 貼文', sub: '16:9' }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, platform: item.type }}))}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${state.settings.platform === item.type ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="text-[10px] opacity-50 font-mono mt-1">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Count & Resolution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">生成張數</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, count: num }}))}
                      className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${state.settings.count === num ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-slate-800'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">影像解析度</label>
                <div className="flex gap-2">
                  {[
                    { val: Resolution.RES_1K, label: '1K' },
                    { val: Resolution.RES_2K, label: '2K' },
                    { val: Resolution.RES_4K, label: '4K' }
                  ].map((res) => (
                    <button
                      key={res.val}
                      onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, resolution: res.val }}))}
                      className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${state.settings.resolution === res.val ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-slate-800'}`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Selection - 3 per row Grid Layout */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">設計風格</label>
              <div className="grid grid-cols-3 gap-3">
                {stylePresets.map((style) => (
                  <button
                    key={style}
                    onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, style: style }}))}
                    className={`flex items-center justify-center py-3.5 rounded-2xl border text-[13px] font-bold transition-all ${state.settings.style === style ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Watermark Control */}
            <div className="p-6 bg-slate-950/30 rounded-[2rem] border border-slate-800/50 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${state.settings.showWatermark ? 'bg-blue-600' : 'bg-slate-800'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
                  </div>
                  <span className="text-sm font-bold">品牌 Logo / 浮水印</span>
                </div>
                <button 
                  onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, showWatermark: !prev.settings.showWatermark }}))}
                  className={`w-14 h-7 rounded-full transition-colors relative ${state.settings.showWatermark ? 'bg-blue-600' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${state.settings.showWatermark ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
              {state.settings.showWatermark && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">標示文字</span>
                    <input 
                      type="text"
                      value={state.settings.watermark}
                      onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, watermark: e.target.value }}))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-sm"
                      placeholder="例如：@YourBrand"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">透明度</span>
                      <span className="text-[10px] font-bold text-blue-500">{Math.round(state.settings.watermarkOpacity * 100)}%</span>
                    </div>
                    <div className="pt-2">
                      <input 
                        type="range" min="0" max="1" step="0.1"
                        value={state.settings.watermarkOpacity}
                        onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, watermarkOpacity: parseFloat(e.target.value) }}))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            disabled={state.isGenerating || !prompt}
            onClick={handleGenerate}
            className="w-full py-6 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-black text-xl rounded-3xl transition-all shadow-2xl shadow-blue-900/30 group active:scale-[0.98]"
          >
            {state.isGenerating ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                正在注入美感靈魂...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                開始設計
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </span>
            )}
          </button>
        </section>

        {/* Results Section */}
        <section id="results-section" className="space-y-16">
          {state.posts.length > 0 && (
            <div className="grid grid-cols-1 gap-20">
              {state.posts.map((post, idx) => (
                <div key={post.id} className="animate-in slide-in-from-bottom-10 fade-in duration-1000">
                  <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-6">
                      <div className="relative rounded-[3rem] overflow-hidden bg-black shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] border border-slate-800">
                        <img 
                          src={post.processedUrl} 
                          alt="AI Result" 
                          className="w-full h-auto object-cover" 
                        />
                        <WatermarkCanvas 
                          imageUrl={post.originalUrl}
                          text={state.settings.watermark}
                          opacity={state.settings.watermarkOpacity}
                          show={state.settings.showWatermark}
                          onProcessed={(url) => updateProcessedUrl(post.id, url)}
                        />
                        <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-2xl">
                          Option {idx + 1}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => downloadImage(post.processedUrl, 'png')}
                          className="flex flex-col items-center gap-2 py-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-3xl transition-all group/dl"
                        >
                          <div className="p-2 bg-blue-500/10 rounded-lg group-hover/dl:bg-blue-500/20 transition-colors">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          </div>
                          <span className="font-bold text-xs">下載 PNG 格式</span>
                        </button>
                        <button 
                          onClick={() => downloadImage(post.processedUrl, 'jpg')}
                          className="flex flex-col items-center gap-2 py-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-3xl transition-all group/dl"
                        >
                          <div className="p-2 bg-emerald-500/10 rounded-lg group-hover/dl:bg-emerald-500/20 transition-colors">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          </div>
                          <span className="font-bold text-xs">下載 JPG 格式</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full lg:w-80 space-y-8">
                      <div className="p-8 bg-slate-900/60 rounded-[2.5rem] border border-slate-800/80 space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">AI 文案靈感</h3>
                        </div>
                        <div className="text-slate-200 text-sm leading-[1.8] font-light whitespace-pre-wrap">
                          {post.caption}
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(post.caption);
                            alert('文案已複製！');
                          }}
                          className="w-full py-3 bg-slate-950 hover:bg-black rounded-xl text-[10px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest border border-slate-800"
                        >
                          複製完整文案
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3 px-4">
                        <div className="flex -space-x-3">
                          {[1,2,3].map(i => <div key={i} className={`w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950`} />)}
                        </div>
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">Verified AI Aesthetic</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!state.posts.length && !state.isGenerating && (
            <div className="py-32 text-center space-y-6 opacity-20">
              <div className="text-8xl flex justify-center">✨</div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em]">Waiting for your creation</p>
            </div>
          )}
        </section>
      </main>

      <footer className="w-full py-12 border-t border-slate-900/50 flex flex-col items-center gap-4">
        <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">Powered by Gemini 3.0 Technology</p>
      </footer>
    </div>
  );
};

export default App;
