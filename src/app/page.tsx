'use client';

import { useState } from 'react';
import Image from 'next/image';


interface VideoInfo {
  title: string;
  author: string;
  thumbnail: string;
  downloadUrl: string;
  type: 'video' | 'audio';
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<'high' | 'low' | 'audio'>('high');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);


  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Por favor, insira uma URL do TikTok');
      return;
    }

    if (!url.includes('tiktok.com')) {
      setError('Por favor, insira uma URL válida do TikTok');
      return;
    }

    // Download direto sem anúncios
    await performDownload();
  };

  const performDownload = async () => {
    setLoading(true);
    setError('');
    setVideoInfo(null);

    try {
      let response: Response, data: any;

      if (quality === 'audio') {
        console.log('Baixando áudio...');
        response = await fetch('/api/tiktok-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(data.error || 'Este vídeo não tem áudio separado. Tente baixar o vídeo completo.');
          }
          throw new Error(data.error || 'Erro ao processar áudio');
        }

        if (data.success) {
          const audioData: VideoInfo = {
            title: data.data.title,
            author: data.data.author,
            thumbnail: data.data.thumbnail,
            downloadUrl: data.data.audioUrl,
            type: 'audio' as const
          };

          setVideoInfo(audioData);

          if (!audioData.downloadUrl || audioData.downloadUrl.trim() === '') {
            setError('Não foi possível obter áudio para este TikTok. Tente baixar o vídeo completo.');

            return;
          }

          setTimeout(() => {
            const cleanTitle = audioData.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50) || 'tiktok-audio';
            const filename = `${cleanTitle}.mp3`;
            const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(audioData.downloadUrl)}&filename=${encodeURIComponent(filename)}`;

            const link = document.createElement('a');
            link.href = proxyUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 1500);
        }
      } else {
        console.log('Baixando vídeo...');
        response = await fetch('/api/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, quality }),
        });

        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao processar o vídeo');
        }

        if (data.success) {
          setVideoInfo(data.data);

          if (!data.data.downloadUrl || data.data.downloadUrl.trim() === '') {
            setError(`Não foi possível obter ${quality === 'high' ? 'vídeo HD' : 'vídeo'} para este TikTok. Tente uma qualidade diferente.`);

            return;
          }

          setTimeout(() => {
            const cleanTitle = data.data.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50) || 'tiktok-video';
            const filename = `${cleanTitle}.mp4`;
            const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.data.downloadUrl)}&filename=${encodeURIComponent(filename)}`;

            const link = document.createElement('a');
            link.href = proxyUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 1500);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDownload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05' fill-rule='nonzero'%3E%3Ccircle cx='6' cy='6' r='6'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="text-center mb-12 md:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight px-4">
            TikTok 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Downloader</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            A forma mais elegante de baixar seus vídeos favoritos do TikTok
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8">
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <label htmlFor="url" className="text-base sm:text-lg font-semibold text-gray-800">
                  Cole o link do TikTok
                </label>
              </div>
              <div className="relative">
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="https://www.tiktok.com/@usuario/video/..."
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-gray-50/50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400 text-base sm:text-lg shadow-inner"
                />
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <label className="text-base sm:text-lg font-semibold text-gray-800">
                  Escolha o formato
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => setQuality('high')}
                  className={`group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden ${
                    quality === 'high'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-lg sm:scale-105'
                      : 'border-gray-200 bg-white/50 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50 sm:hover:scale-102'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-2 sm:mb-3">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${quality === 'high' ? 'bg-blue-500' : 'bg-gray-100 group-hover:bg-blue-100'} transition-colors duration-300`}>
                        <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${quality === 'high' ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v2m0 0v2a1 1 0 01-1 1H8a1 1 0 01-1-1V4m8 0H8m8 0h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1">HD Video</h3>
                    <p className="text-xs sm:text-sm opacity-70">Alta qualidade • MP4</p>
                  </div>
                  {quality === 'high' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
                  )}
                </button>

                <button
                  onClick={() => setQuality('low')}
                  className={`group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden ${
                    quality === 'low'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg sm:scale-105'
                      : 'border-gray-200 bg-white/50 text-gray-700 hover:border-green-300 hover:bg-green-50/50 sm:hover:scale-102'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-2 sm:mb-3">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${quality === 'low' ? 'bg-green-500' : 'bg-gray-100 group-hover:bg-green-100'} transition-colors duration-300`}>
                        <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${quality === 'low' ? 'text-white' : 'text-gray-600 group-hover:text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1">SD Video</h3>
                    <p className="text-xs sm:text-sm opacity-70">Menor tamanho • MP4</p>
                  </div>
                  {quality === 'low' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 animate-pulse"></div>
                  )}
                </button>

                <button
                  onClick={() => setQuality('audio')}
                  className={`group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden ${
                    quality === 'audio'
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 shadow-lg sm:scale-105'
                      : 'border-gray-200 bg-white/50 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50 sm:hover:scale-102'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-2 sm:mb-3">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${quality === 'audio' ? 'bg-purple-500' : 'bg-gray-100 group-hover:bg-purple-100'} transition-colors duration-300`}>
                        <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${quality === 'audio' ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1">Audio</h3>
                    <p className="text-xs sm:text-sm opacity-70">Apenas música • MP3</p>
                  </div>
                  {quality === 'audio' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-300 disabled:cursor-not-allowed transform sm:hover:scale-102 active:scale-98 shadow-lg hover:shadow-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              <div className="relative flex items-center justify-center gap-2">
                {loading && (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {!loading && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                )}
                <span className="text-sm sm:text-base">
                  {loading ? 'Processando...' : 'Baixar Agora'}
                </span>
              </div>
            </button>

            {error && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-xl sm:rounded-2xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
                </div>
              </div>
            )}
          </div>

          {videoInfo && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    Download Concluído!
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Seu arquivo está sendo baixado
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="relative flex-shrink-0 w-full sm:w-auto">
                  <div className="relative w-full sm:w-24 lg:w-28 h-32 sm:h-24 lg:h-28 max-w-xs mx-auto sm:mx-0 sm:max-w-none overflow-hidden rounded-xl sm:rounded-2xl shadow-lg bg-gradient-to-br from-gray-100 to-gray-200">
                    {videoInfo.thumbnail ? (
                      <>
          <Image
                          src={videoInfo.thumbnail}
                          alt="Thumbnail do vídeo"
                          fill
                          className="object-cover transition-opacity duration-500"
                          sizes="(max-width: 640px) 320px, 112px"
                          onError={(e) => {
                            console.log('Erro ao carregar thumbnail');
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.opacity = '1';
                          }}
                          style={{ opacity: 0 }}
                          priority={false}
                          unoptimized={true}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </>
                    ) : null}

                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8 sm:w-6 sm:h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-2 truncate">
                    {videoInfo.title}
                  </h4>
                  <p className="text-gray-600 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {videoInfo.author}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                      videoInfo.type === 'audio' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {videoInfo.type === 'audio' ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                      {videoInfo.type === 'audio' ? 'Áudio MP3' : 'Vídeo MP4'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const cleanTitle = videoInfo.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50) || 'tiktok-video';
                      const filename = `${cleanTitle}.${videoInfo.type === 'audio' ? 'mp3' : 'mp4'}`;
                      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(videoInfo.downloadUrl)}&filename=${encodeURIComponent(filename)}`;
                      
                      const link = document.createElement('a');
                      link.href = proxyUrl;
                      link.download = filename;
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform sm:hover:scale-105 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Baixar Novamente
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

    </div>
  );
}
