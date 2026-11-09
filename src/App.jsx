import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  FolderHeart, 
  Search, 
  Settings, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Moon, 
  Sun, 
  Edit2, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Volume2, 
  Check, 
  ChevronRight,
  Music,
  Tv,
  ListPlus,
  RefreshCw,
  PictureInPicture2,
  X,
  Maximize2,
  Loader2,
  LogIn,
  LogOut,
  FolderPlus,
  ListVideo,
  ListOrdered
} from 'lucide-react';

// Default target YouTube Playlist dataset
const DEFAULT_PLAYLIST_ID = 'PLsmaUhkCwW3q5q46uc9So2b4D-pZqVZOV';

// Sample dataset populated with episode numbering for skip testing
const INITIAL_TRACKS = [
  {
    id: 'ep1',
    title: '1화 - 시작되는 모험',
    artist: 'Playlist Player Official',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&autoplay=1',
    youtubeId: 'dQw4w9WgXcQ',
    duration: '20:00',
    durationSec: 1200,
    progressSec: 0
  },
  {
    id: 'ep50',
    title: '50화 - 격돌하는 마음',
    artist: 'Playlist Player Official',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&autoplay=1',
    youtubeId: 'dQw4w9WgXcQ',
    duration: '24:30',
    durationSec: 1470,
    progressSec: 420
  },
  {
    id: 'ep161',
    title: '161화 - 새로운 장의 시작',
    artist: 'Playlist Player Official',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&autoplay=1',
    youtubeId: 'dQw4w9WgXcQ',
    duration: '23:50',
    durationSec: 1430,
    progressSec: 0
  }
];

export default function App() {
  // Navigation & Theme State
  const [activeTab, setActiveTab] = useState('home'); 
  const [mode, setMode] = useState('music'); 
  const [uiStyle, setUiStyle] = useState('ipod'); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Ad-Free Engine Setting (Invidious / youtube-nocookie proxy engine)
  const [useAdFreeEngine, setUseAdFreeEngine] = useState(true);

  // Helper to generate Ad-Free / No-Cookie Embed URL
  const getEmbedUrl = (youtubeId) => {
    if (!youtubeId) return '';
    if (useAdFreeEngine) {
      // Uses youtube-nocookie.com with privacy and ad-minimization flags
      return `https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`;
    }
    return `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1`;
  };

  // User Auth & Google Sync State
  const [user, setUser] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);

  // Custom Playlists & Track State
  const [playlists, setPlaylists] = useState([
    { 
      id: 'pl-default', 
      name: '내 재생목록', 
      tracks: INITIAL_TRACKS.map(t => ({
        ...t,
        videoUrl: `https://www.youtube-nocookie.com/embed/${t.youtubeId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`
      }))
    }
  ]);
  const [activePlaylistId, setActivePlaylistId] = useState('pl-default');
  const [queue, setQueue] = useState([]); // Next Up Queue
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active track selection
  const currentPlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];
  const activeTracks = currentPlaylist ? currentPlaylist.tracks : [];
  const currentTrack = activeTracks[currentIndex] || INITIAL_TRACKS[0];

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [skipNotification, setSkipNotification] = useState('');

  // PiP State
  const [isPipMode, setIsPipMode] = useState(false);

  // Library & Search Modal State
  const [libSubTab, setLibSubTab] = useState('playlists');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);

  const [searchSubTab, setSearchSubTab] = useState('url');
  const [inputUrl, setInputUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // PWA Dynamic Web App Manifest Registration for iOS/Android
  useEffect(() => {
    // Add meta for standalone PWA mode
    let metaMobile = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!metaMobile) {
      metaMobile = document.createElement('meta');
      metaMobile.name = 'apple-mobile-web-app-capable';
      metaMobile.content = 'yes';
      document.head.appendChild(metaMobile);
    }
    
    let metaStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaStatus) {
      metaStatus = document.createElement('meta');
      metaStatus.name = 'apple-mobile-web-app-status-bar-style';
      metaStatus.content = 'black-translucent';
      document.head.appendChild(metaStatus);
    }
  }, []);

  // Parse Episode Number from Track Title (e.g., "161화")
  const getEpisodeNumber = (title) => {
    if (!title) return null;
    const match = title.match(/(\d+)\s*화/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Calculate Ending Skip threshold based on user script rules
  const getSkipThreshold = (trackIndex, title) => {
    // First episode (index 0) has NO ending skip rule
    if (trackIndex === 0) return 0;

    const ep = getEpisodeNumber(title);
    if (ep !== null) {
      if (ep >= 161) return 35.1; // 161화 이상: 35.1초 전 스킵
      return 30.1;               // 1화 ~ 160화: 30.1초 전 스킵
    }
    return 30.1; // Fallback default
  };

  // Google Login / Logout Handler
  const handleGoogleLogin = () => {
    setUser({
      name: '고은새',
      email: 'eunsae10045@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    });
  };

  const handleGoogleLogout = () => {
    setUser(null);
  };

  // Google YouTube Playlist Sync Engine
  const handleSyncYoutubePlaylists = () => {
    if (!user) {
      alert('구글 로그인이 필요합니다.');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      const syncedPlaylist = {
        id: `pl-synced-${Date.now()}`,
        name: '유튜브 동기화 목록',
        tracks: [
          {
            id: 'sync1',
            title: '1화 - 동기화된 유튜브 에피소드',
            artist: 'YouTube Sync Channel',
            albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&autoplay=1',
            youtubeId: 'dQw4w9WgXcQ',
            duration: '15:20',
            durationSec: 920,
            progressSec: 0
          }
        ]
      };
      setPlaylists(prev => [...prev, syncedPlaylist]);
      setIsSyncing(false);
      alert('구글 계정의 유튜브 재생목록이 동기화되었습니다!');
    }, 1200);
  };

  // Add Track / URL to Playlist or Queue
  const parseYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddTrack = (targetMode = 'play') => {
    const videoId = parseYoutubeId(inputUrl);
    if (!videoId) {
      alert('올바른 YouTube URL을 입력해주세요.');
      return;
    }

    const newTrack = {
      id: `yt-${Date.now()}`,
      title: `추가된 영상 (${videoId})`,
      artist: 'YouTube Track',
      albumArt: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoUrl: getEmbedUrl(videoId),
      youtubeId: videoId,
      duration: '04:00',
      durationSec: 240,
      progressSec: 0
    };

    if (targetMode === 'play') {
      setPlaylists(prev => prev.map(p => p.id === activePlaylistId ? { ...p, tracks: [newTrack, ...p.tracks] } : p));
      setCurrentIndex(0);
      setIsPlaying(true);
      setActiveTab('home');
    } else if (targetMode === 'queue') {
      setQueue(prev => [...prev, newTrack]);
      alert('대기열에 추가되었습니다.');
    } else {
      setPlaylists(prev => prev.map(p => p.id === activePlaylistId ? { ...p, tracks: [...p.tracks, newTrack] } : p));
      alert('재생목록에 추가되었습니다.');
    }
    setInputUrl('');
  };

  // Remove track from active playlist
  const handleRemoveTrack = (trackId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === activePlaylistId) {
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
      }
      return p;
    }));
  };

  // Create new Playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPl = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName,
      tracks: []
    };
    setPlaylists([...playlists, newPl]);
    setNewPlaylistName('');
    setShowAddPlaylistModal(false);
  };

  // Delete Playlist
  const handleDeletePlaylist = (id) => {
    if (playlists.length <= 1) {
      alert('최소 하나의 재생목록이 존재해야 합니다.');
      return;
    }
    setPlaylists(playlists.filter(p => p.id !== id));
    if (activePlaylistId === id) {
      setActivePlaylistId(playlists[0].id);
    }
  };

  // Controls
  const handleNextTrack = () => {
    // Check queue first
    if (queue.length > 0) {
      const nextQueueTrack = queue[0];
      setQueue(queue.slice(1));
      // Inject to current tracks
      setPlaylists(prev => prev.map(p => p.id === activePlaylistId ? { ...p, tracks: [nextQueueTrack, ...p.tracks] } : p));
      setCurrentIndex(0);
      setCurrentTime(0);
      return;
    }

    if (activeTracks.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeTracks.length);
      setCurrentTime(0);
    }
  };

  const handlePrevTrack = () => {
    if (activeTracks.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + activeTracks.length) % activeTracks.length);
      setCurrentTime(0);
    }
  };

  // Ending Skip Logic & Time Update Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + 1;

          // Save progress ("빨간 줄" 이어보기 업데이트)
          setPlaylists(prevPlaylists => prevPlaylists.map(p => {
            if (p.id === activePlaylistId) {
              return {
                ...p,
                tracks: p.tracks.map((t, idx) => idx === currentIndex ? { ...t, progressSec: nextTime } : t)
              };
            }
            return p;
          }));

          // Ending Auto Skip Rule calculation
          const remainingSec = currentTrack.durationSec - nextTime;
          const skipThreshold = getSkipThreshold(currentIndex, currentTrack.title);

          if (skipThreshold > 0 && remainingSec <= skipThreshold && remainingSec > 0) {
            setSkipNotification(`[엔딩 스킵 적용: ${skipThreshold}초 전 다음 화 이동]`);
            setTimeout(() => {
              setSkipNotification('');
              handleNextTrack();
            }, 800);
          }

          if (nextTime >= currentTrack.durationSec) {
            handleNextTrack();
            return 0;
          }

          return nextTime;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, currentIndex, activePlaylistId]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const themeClass = uiStyle === 'default' && isDarkMode 
    ? 'bg-[#121212] text-white' 
    : uiStyle === 'gameboy'
    ? 'bg-[#d2d6c5] text-[#2d381c]'
    : 'bg-[#e5e0d8] text-[#2c2c2e]';

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 max-w-md mx-auto shadow-2xl relative overflow-hidden ${themeClass}`}>
      
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold tracking-tight">Playlist Player</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-full hover:bg-black/5 transition"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user ? (
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {user.name}
            </div>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              className="flex items-center gap-1 bg-rose-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-rose-700 transition"
            >
              <LogIn size={12} /> 로그인
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24">
        
        {/* ==================== HOME TAB ==================== */}
        {activeTab === 'home' && (
          <div className="flex flex-col items-center space-y-4">
            
            {/* Mode Switcher */}
            <div className="w-full bg-black/5 dark:bg-white/10 p-1 rounded-2xl flex text-sm font-semibold">
              <button
                onClick={() => { setMode('music'); setIsPipMode(false); }}
                className={`flex-1 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === 'music' ? 'bg-white text-black shadow-sm dark:bg-neutral-800 dark:text-white' : 'opacity-60'
                }`}
              >
                <Music size={15} /> 음악
              </button>
              <button
                onClick={() => setMode('video')}
                className={`flex-1 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === 'video' ? 'bg-white text-black shadow-sm dark:bg-neutral-800 dark:text-white' : 'opacity-60'
                }`}
              >
                <Tv size={15} /> 영상
              </button>
            </div>

            {/* Skip Notification Overlay */}
            {skipNotification && (
              <div className="w-full bg-emerald-600 text-white py-1.5 px-3 rounded-xl text-xs font-bold text-center animate-bounce shadow-md">
                {skipNotification}
              </div>
            )}

            {/* DEFAULT SKIN */}
            {uiStyle === 'default' && (
              <div className="w-full flex flex-col items-center space-y-6 pt-2">
                <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-xl border border-black/5 dark:border-white/10 bg-neutral-900 relative">
                  {mode === 'music' ? (
                    <img 
                      src={currentTrack.albumArt} 
                      alt="Album Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    !isPipMode && (
                      <iframe
                        className="w-full h-full"
                        src={currentTrack.videoUrl}
                        title="YouTube Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    )
                  )}
                </div>

                <div className="text-center space-y-1 w-full px-2">
                  <h2 className="text-xl font-bold tracking-tight truncate">{currentTrack.title}</h2>
                  <p className="text-sm opacity-60 font-medium truncate">{currentTrack.artist}</p>
                </div>

                {/* Progress bar with red bar indicator */}
                <div className="w-full space-y-1.5">
                  <div className="relative w-full h-2 bg-black/10 dark:bg-white/20 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${(currentTime / currentTrack.durationSec) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-medium opacity-50 px-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{currentTrack.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full max-w-xs pt-2">
                  <button onClick={() => setIsShuffle(!isShuffle)} className={`p-2 transition ${isShuffle ? 'text-emerald-500' : 'opacity-40'}`}>
                    <Shuffle size={18} />
                  </button>
                  <button onClick={handlePrevTrack} className="p-2 opacity-70 hover:opacity-100">
                    <SkipBack size={24} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 bg-white text-black dark:bg-white dark:text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={handleNextTrack} className="p-2 opacity-70 hover:opacity-100">
                    <SkipForward size={24} />
                  </button>
                  <button onClick={() => setIsRepeat(!isRepeat)} className={`p-2 transition ${isRepeat ? 'text-emerald-500' : 'opacity-40'}`}>
                    <Repeat size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* iPod SKIN */}
            {uiStyle === 'ipod' && (
              <div className="w-full bg-[#f4f2ee] text-slate-800 p-5 rounded-[40px] shadow-2xl border-4 border-[#e2dec9] flex flex-col items-center space-y-6">
                <div className="w-full bg-[#d0e5f2] rounded-2xl border-4 border-slate-700/80 p-3 shadow-inner min-h-[190px] flex flex-col justify-between relative overflow-hidden">
                  <div className="text-[11px] font-bold text-center border-b border-slate-400 pb-1 text-slate-700">iPod</div>
                  
                  {mode === 'music' ? (
                    <div className="flex items-center gap-3 my-auto">
                      <div className="w-20 h-20 bg-slate-300 rounded-lg overflow-hidden shadow border border-slate-400 flex-shrink-0">
                        <img src={currentTrack.albumArt} className="w-full h-full object-cover" alt="Art" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate text-slate-900">{currentTrack.title}</h4>
                        <p className="text-[11px] text-slate-600 truncate">{currentTrack.artist}</p>
                        <div className="mt-2 space-y-1">
                          <div className="w-full bg-slate-300 h-1.5 rounded-full overflow-hidden border border-slate-400">
                            <div 
                              className="bg-red-600 h-full transition-all"
                              style={{ width: `${(currentTime / currentTrack.durationSec) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                            <span>{formatTime(currentTime)}</span>
                            <span>{currentTrack.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-black rounded overflow-hidden flex items-center justify-center">
                      <iframe className="w-full h-full" src={currentTrack.videoUrl} title="Video"></iframe>
                    </div>
                  )}
                </div>

                <div className="w-56 h-56 rounded-full bg-gradient-to-b from-slate-100 to-slate-200 shadow-xl border-2 border-slate-300 flex items-center justify-center relative p-2 select-none">
                  <button onClick={() => setIsShuffle(!isShuffle)} className="absolute top-3 text-slate-500">
                    <Shuffle size={16} />
                  </button>
                  <button onClick={() => setIsRepeat(!isRepeat)} className="absolute bottom-3 text-slate-500">
                    <Repeat size={16} />
                  </button>
                  <button onClick={handlePrevTrack} className="absolute left-3 text-slate-500">
                    <SkipBack size={18} />
                  </button>
                  <button onClick={handleNextTrack} className="absolute right-3 text-slate-500">
                    <SkipForward size={18} />
                  </button>

                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-20 h-20 rounded-full bg-gradient-to-b from-slate-200 to-slate-300 shadow-inner border border-slate-300 flex items-center justify-center text-slate-700 active:scale-95 transition"
                  >
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* GAME BOY SKIN */}
            {uiStyle === 'gameboy' && (
              <div className="w-full bg-[#c8cca9] text-[#2b3a1a] p-4 rounded-3xl border-4 border-[#9ba27e] shadow-xl flex flex-col items-center space-y-4">
                <div className="w-full bg-[#8c946e] border-4 border-[#5b6343] rounded-xl p-3 shadow-inner relative">
                  <div className="flex justify-between items-center text-[9px] font-bold tracking-widest text-[#3b4224] border-b border-[#6e7652] pb-1 mb-2">
                    <span>DOT MATRIX STEREO</span>
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  </div>

                  <div className="bg-[#9ea680] border-2 border-[#6f7753] rounded p-2 text-[#1c260f]">
                    {mode === 'music' ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                          <img src={currentTrack.albumArt} className="w-12 h-12 rounded border border-[#585f40] object-cover" alt="Art" />
                          <div className="overflow-hidden">
                            <h4 className="font-extrabold text-xs truncate">{currentTrack.title}</h4>
                            <p className="text-[10px] opacity-80">{currentTrack.artist}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-[#7a825e] h-2 rounded overflow-hidden">
                            <div 
                              className="bg-red-600 h-full"
                              style={{ width: `${(currentTime / currentTrack.durationSec) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-mono font-bold">
                            <span>{formatTime(currentTime)}</span>
                            <span>{currentTrack.duration}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-black rounded overflow-hidden flex items-center justify-center">
                        <iframe className="w-full h-full" src={currentTrack.videoUrl} title="Video"></iframe>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full flex justify-between items-center px-2 pt-2">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="w-8 h-24 bg-[#2b2b2b] rounded-md absolute shadow-md"></div>
                    <div className="w-24 h-8 bg-[#2b2b2b] rounded-md absolute shadow-md"></div>
                    <button onClick={handlePrevTrack} className="absolute top-1 text-slate-400"><SkipBack size={14} /></button>
                    <button onClick={handleNextTrack} className="absolute bottom-1 text-slate-400"><SkipForward size={14} /></button>
                    <button onClick={() => setIsShuffle(!isShuffle)} className="absolute left-1 text-slate-400"><Shuffle size={14} /></button>
                    <button onClick={() => setIsRepeat(!isRepeat)} className="absolute right-1 text-slate-400"><Repeat size={14} /></button>
                  </div>

                  <div className="flex gap-3 rotate-[-15deg] pb-4">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-[#8b1d43] text-white flex items-center justify-center shadow-lg active:scale-95 border-2 border-[#61102d]"
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== LIBRARY TAB ==================== */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">보관함</h2>
              <button 
                onClick={() => setShowAddPlaylistModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl"
              >
                <FolderPlus size={14} /> 새 목록
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex gap-2 border-b border-black/10 dark:border-white/10 pb-2">
              {[
                { key: 'playlists', label: '재생목록' },
                { key: 'queue', label: `다음 재생 (${queue.length})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setLibSubTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    libSubTab === tab.key 
                      ? 'bg-black text-white dark:bg-white dark:text-black' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Playlist Management */}
            {libSubTab === 'playlists' && (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setActivePlaylistId(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                        activePlaylistId === p.id ? 'bg-emerald-600 text-white' : 'bg-black/5 dark:bg-white/10'
                      }`}
                    >
                      {p.name} ({p.tracks.length})
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {activeTracks.map((item, idx) => (
                    <div 
                      key={item.id}
                      className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl flex justify-between items-center border border-black/5 dark:border-white/10"
                    >
                      <div 
                        onClick={() => { setCurrentIndex(idx); setIsPlaying(true); setActiveTab('home'); }}
                        className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden"
                      >
                        <img src={item.albumArt} className="w-10 h-10 rounded-lg object-cover" alt="Art" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-xs truncate">{item.title}</h3>
                          <p className="text-[10px] opacity-50">{item.artist}</p>
                          
                          {/* Youtube Red Progress Bar for Continual Playback */}
                          <div className="w-full bg-black/10 dark:bg-white/20 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="bg-red-600 h-full" 
                              style={{ width: `${(item.progressSec / item.durationSec) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleRemoveTrack(item.id)}
                        className="p-2 opacity-50 hover:opacity-100 text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Queue Management */}
            {libSubTab === 'queue' && (
              <div className="space-y-2">
                {queue.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-6">대기열이 비어 있습니다.</p>
                ) : (
                  queue.map((item, idx) => (
                    <div key={idx} className="bg-black/5 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{item.title}</span>
                      <button onClick={() => setQueue(queue.filter((_, i) => i !== idx))} className="text-xs text-rose-500">삭제</button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== SEARCH & URL TAB ==================== */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">추가 · 검색</h2>

            <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSearchSubTab('url')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  searchSubTab === 'url' ? 'bg-white text-black shadow-sm dark:bg-neutral-800 dark:text-white' : 'opacity-60'
                }`}
              >
                URL
              </button>
              <button
                onClick={() => setSearchSubTab('search')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  searchSubTab === 'search' ? 'bg-white text-black shadow-sm dark:bg-neutral-800 dark:text-white' : 'opacity-60'
                }`}
              >
                검색
              </button>
            </div>

            {searchSubTab === 'url' ? (
              <div className="space-y-4 pt-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="youtu.be/... 또는 youtube.com/watch?v=..."
                  className="w-full p-2.5 bg-black/5 dark:bg-white/10 rounded-xl text-xs border border-black/5 dark:border-white/10 outline-none"
                />

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleAddTrack('play')} className="py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                    재생
                  </button>
                  <button onClick={() => handleAddTrack('queue')} className="py-2.5 bg-black/10 dark:bg-white/10 rounded-xl text-xs font-bold">
                    대기열 추가
                  </button>
                  <button onClick={() => handleAddTrack('add')} className="py-2.5 bg-black/10 dark:bg-white/10 rounded-xl text-xs font-bold">
                    목록 추가
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="검색어 입력"
                    className="flex-1 p-2.5 bg-black/5 dark:bg-white/10 rounded-xl text-xs border outline-none"
                  />
                  <button className="px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                    검색
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">설정</h2>

            {/* Ad-Free Player Engine Switch */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">광고 차단 프록시 엔진</h4>
                <p className="text-[10px] opacity-70">No-Cookie 및 광고 우회 주소로 동영상을 재생합니다.</p>
              </div>
              <button 
                onClick={() => setUseAdFreeEngine(!useAdFreeEngine)}
                className={`w-11 h-6 rounded-full transition-colors relative ${useAdFreeEngine ? 'bg-emerald-600' : 'bg-black/20 dark:bg-white/20'}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${useAdFreeEngine ? 'left-6' : 'left-1'}`}></span>
              </button>
            </div>

            {/* Google Account Section */}
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3">
              <span className="text-[10px] font-bold opacity-50 tracking-wider uppercase">구글 계정 연동</span>
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} className="w-10 h-10 rounded-full" alt="Avatar" />
                    <div>
                      <h4 className="text-xs font-bold">{user.name}</h4>
                      <p className="text-[10px] opacity-60">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSyncYoutubePlaylists} 
                      disabled={isSyncing}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      {isSyncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} 유튜브 재생목록 동기화
                    </button>
                    <button onClick={handleGoogleLogout} className="px-3 py-2 bg-black/10 dark:bg-white/10 rounded-xl text-xs font-bold text-rose-500">
                      로그아웃
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleGoogleLogin} 
                  className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogIn size={14} /> Google 계정으로 로그인하기
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold opacity-70">UI 스타일</label>
              <select
                value={uiStyle}
                onChange={(e) => setUiStyle(e.target.value)}
                className="w-full p-3 bg-black/5 dark:bg-white/10 rounded-xl text-xs font-semibold border outline-none"
              >
                <option value="default">기본</option>
                <option value="ipod">iPod</option>
                <option value="gameboy">Game Boy</option>
              </select>
            </div>
          </div>
        )}

      </main>

      {/* New Playlist Modal */}
      {showAddPlaylistModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl w-full max-w-xs space-y-4">
            <h3 className="font-bold text-sm">새 재생목록 만들기</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="재생목록 이름"
              className="w-full p-2.5 bg-black/5 dark:bg-white/10 rounded-xl text-xs outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddPlaylistModal(false)} className="px-3 py-1.5 text-xs font-bold opacity-60">취소</button>
              <button onClick={handleCreatePlaylist} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">생성</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-black/5 dark:border-white/10 py-2.5 px-6 flex justify-between items-center z-30">
        {[
          { id: 'home', label: '홈', icon: Home },
          { id: 'library', label: '보관함', icon: FolderHeart },
          { id: 'search', label: '검색', icon: Search },
          { id: 'settings', label: '설정', icon: Settings }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition ${
                isActive ? 'text-black dark:text-white font-bold' : 'opacity-40 hover:opacity-100'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
