import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface TikTokVideoInfo {
  title: string;
  videoUrl: string;
  audioUrl: string;
  thumbnail: string;
  author: string;
}

interface TikTokApiData {
  code?: number;
  success?: boolean;
  data?: {
    title?: string;
    play?: string;
    hdplay?: string;
    wmplay?: string;
    hd_play?: string;
    music?: string;
    music_info?: {
      play?: string;
      url?: string;
      play_url?: string;
    };
    cover?: string;
    origin_cover?: string;
    author?: {
      unique_id?: string;
      nickname?: string;
    };
  };
}

async function getTikTokVideoInfo(url: string, quality: string): Promise<TikTokVideoInfo | null> {
  try {
    const apis = [
      {
        name: 'tikwm',
        url: quality === 'high'
          ? `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`
          : `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
        parser: (data: TikTokApiData) => {
          if (data.code === 0 && data.data) {
            const videoData = data.data;
            
            let audioUrl = '';
            if (videoData.music) {
              audioUrl = videoData.music;
            } else if (videoData.music_info?.play) {
              audioUrl = videoData.music_info.play;
            } else if (videoData.music_info?.url) {
              audioUrl = videoData.music_info.url;
            } else if (videoData.music_info?.play_url) {
              audioUrl = videoData.music_info.play_url;
            }
            
            let videoUrl = '';
            if (quality === 'high') {
              videoUrl = videoData.hdplay || videoData.play;
            } else if (quality === 'low') {
              videoUrl = videoData.play || videoData.wmplay;
            } else {
              videoUrl = videoData.play;
            }
            
            return {
              title: videoData.title || 'Vídeo TikTok',
              videoUrl: videoUrl,
              audioUrl: audioUrl,
              thumbnail: videoData.cover || videoData.origin_cover || '',
              author: videoData.author?.unique_id || videoData.author?.nickname || 'Desconhecido'
            };
          }
          return null;
        }
      },
      {
        name: 'tikwm-audio',
        url: quality === 'high'
          ? `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1&audio=1`
          : `https://tikwm.com/api/?url=${encodeURIComponent(url)}&audio=1`,
        parser: (data: TikTokApiData) => {
          if (data.code === 0 && data.data) {
            const videoData = data.data;
            
            let audioUrl = '';
            if (videoData.music) {
              audioUrl = videoData.music;
            } else if (videoData.music_info?.play) {
              audioUrl = videoData.music_info.play;
            } else if (videoData.music_info?.url) {
              audioUrl = videoData.music_info.url;
            } else if (videoData.music_info?.play_url) {
              audioUrl = videoData.music_info.play_url;
            } else if (videoData.play) {
              audioUrl = videoData.play;
            }
            
            let videoUrl = '';
            if (quality === 'high') {
              videoUrl = videoData.hdplay || videoData.play;
            } else if (quality === 'low') {
              videoUrl = videoData.play || videoData.wmplay;
            } else {
              videoUrl = videoData.play;
            }
            
            return {
              title: videoData.title || 'Vídeo TikTok',
              videoUrl: videoUrl,
              audioUrl: audioUrl,
              thumbnail: videoData.cover || videoData.origin_cover || '',
              author: videoData.author?.unique_id || videoData.author?.nickname || 'Desconhecido'
            };
          }
          return null;
        }
      },
      {
        name: 'snaptik',
        url: `https://snaptik.app/api/download?url=${encodeURIComponent(url)}`,
        parser: (data: TikTokApiData) => {
          if (data.success && data.data) {
            let videoUrl = '';
            if (quality === 'high') {
              videoUrl = data.data.hd_play || data.data.play;
            } else if (quality === 'low') {
              videoUrl = data.data.play;
            } else {
              videoUrl = data.data.play;
            }
            
            return {
              title: data.data.title || 'Vídeo TikTok',
              videoUrl: videoUrl,
              audioUrl: data.data.music || '',
              thumbnail: data.data.cover || '',
              author: data.data.author || 'Desconhecido'
            };
          }
          return null;
        }
      },
      {
        name: 'tiktokapi',
        url: `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}`,
        parser: (data: TikTokApiData) => {
          if (data.data) {
            let videoUrl = '';
            if (quality === 'high') {
              videoUrl = data.data.hdplay || data.data.play;
            } else if (quality === 'low') {
              videoUrl = data.data.play;
            } else {
              videoUrl = data.data.play;
            }
            
            return {
              title: data.data.title || 'Vídeo TikTok',
              videoUrl: videoUrl,
              audioUrl: data.data.music || '',
              thumbnail: data.data.cover || '',
              author: data.data.author?.unique_id || 'Desconhecido'
            };
          }
          return null;
        }
      }
    ];

    for (const api of apis) {
      try {
        console.log(`Tentando API: ${api.name}`);

        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Referer': 'https://www.tiktok.com/',
          'Origin': 'https://www.tiktok.com'
        };

        if (api.name === 'tiktokapi') {
          headers['X-RapidAPI-Key'] = process.env.RAPIDAPI_KEY || '';
          headers['X-RapidAPI-Host'] = 'tiktok-video-no-watermark2.p.rapidapi.com';
        }

        const response = await axios.get(api.url, {
          headers,
          timeout: 10000,
          validateStatus: (status: number) => status < 500
        });

        if (response.data) {
          const result = api.parser(response.data);
          if (result && result.videoUrl) {
            console.log(`Sucesso com API: ${api.name}`);
            console.log(`VideoUrl: ${result.videoUrl ? 'OK' : 'VAZIO'}`);
            console.log(`AudioUrl: ${result.audioUrl ? 'OK' : 'VAZIO'}`);
            return result;
          }
        }
      } catch (error) {
        console.log(`Falha na API ${api.name}:`, error instanceof Error ? error.message : 'Erro desconhecido');
        continue;
      }
    }

    throw new Error('Todas as APIs falharam');
  } catch (error) {
    console.error('Erro ao obter informações do TikTok:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, quality } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    if (!url.includes('tiktok.com')) {
      return NextResponse.json({ error: 'URL inválida. Por favor, insira uma URL válida do TikTok.' }, { status: 400 });
    }

    const videoInfo = await getTikTokVideoInfo(url, quality);

    if (!videoInfo) {
      return NextResponse.json({ error: 'Não foi possível obter informações do vídeo' }, { status: 404 });
    }

    let downloadUrl = '';
    let type = 'video';
    
    if (quality === 'audio') {
      if (videoInfo.audioUrl) {
        downloadUrl = videoInfo.audioUrl;
        type = 'audio';
      } else {
        console.log('AudioUrl não disponível, tentando extrair...');
        
        try {
          const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/extract-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          
          const audioData = await audioResponse.json();
          
          if (audioData.success && audioData.audioUrl) {
            downloadUrl = audioData.audioUrl;
            type = 'audio';
            console.log('Áudio extraído com sucesso via API específica');
          } else {
            downloadUrl = videoInfo.videoUrl;
            type = 'audio';
            console.log('Usando vídeo como fonte para áudio');
          }
        } catch (error) {
          console.log('Falha na extração de áudio, usando vídeo:', error);
          downloadUrl = videoInfo.videoUrl;
          type = 'audio';
        }
      }
    } else {
      downloadUrl = videoInfo.videoUrl;
      type = 'video';
    }

    if (!downloadUrl) {
      return NextResponse.json({ 
        error: 'Não foi possível obter URL de download para este vídeo' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        title: videoInfo.title,
        author: videoInfo.author,
        thumbnail: videoInfo.thumbnail,
        downloadUrl: downloadUrl,
        type: type
      }
    });

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor. Tente novamente.' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de download do TikTok funcionando!',
    endpoints: {
      POST: '/api/download - { url: string, quality: "high" | "low" | "audio" }'
    }
  });
}
