import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('tiktok.com')) {
      return NextResponse.json({ error: 'URL do TikTok é obrigatória' }, { status: 400 });
    }

    console.log('Tentando obter áudio do TikTok:', url);

    const audioApis = [
      {
        name: 'ssstik-audio',
        call: async () => {
          const response = await axios.post('https://ssstik.io/abc?url=dl', 
            `id=${encodeURIComponent(url)}&locale=pt&tt=audio`, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://ssstik.io/'
            },
            timeout: 15000,
          });
          
          const html = response.data as string;
          const audioMatch = html.match(/href="([^"]*)" [^>]*download[^>]*>Audio<\/a>/) ||
                            html.match(/href="([^"]*mp3[^"]*)"/) ||
                            html.match(/class="audio[^"]*"[^>]*href="([^"]*)"/) ||
                            html.match(/download[^>]*href="([^"]*)"[^>]*audio/i);
          
          if (audioMatch && audioMatch[1]) {
            return audioMatch[1];
          }
          return null;
        }
      },
      {
        name: 'snaptik-audio',
        call: async () => {
          const response = await axios.post('https://snaptik.app/abc2', 
            `url=${encodeURIComponent(url)}&token=audio`, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://snaptik.app/'
            },
            timeout: 15000,
          });

          const data = response.data as string | { success?: boolean; audio?: string };
          try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (parsed.success && parsed.audio) {
              return parsed.audio;
            }
          } catch {
            const audioMatch = data.match(/class="audio-download"[^>]*href="([^"]*)"/) ||
                              data.match(/href="([^"]*mp3[^"]*)"/) ||
                              data.match(/download[^>]*href="([^"]*)"[^>]*audio/i);
            if (audioMatch && audioMatch[1]) {
              return audioMatch[1];
            }
          }
          return null;
        }
      },
      {
        name: 'tikmate-audio',
        call: async () => {
          const response = await axios.post('https://tikmate.app/download', 
            `url=${encodeURIComponent(url)}&format=audio`, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://tikmate.app/'
            },
            timeout: 15000,
          });

          const data = response.data as string | { success?: boolean; audio_url?: string };
          if (data.success && data.audio_url) {
            return data.audio_url;
          }
          
          if (typeof data === 'string') {
            const audioMatch = data.match(/href="([^"]*)"[^>]*>.*?Audio.*?<\/a>/) ||
                              data.match(/href="([^"]*mp3[^"]*)"/) ||
                              data.match(/class="download-audio"[^>]*href="([^"]*)"/) ||
                              data.match(/download[^>]*href="([^"]*)"[^>]*audio/i);
            if (audioMatch && audioMatch[1]) {
              return audioMatch[1];
            }
          }
          return null;
        }
      }
    ];

    for (const api of audioApis) {
      try {
        console.log(`Tentando extrair áudio real com: ${api.name}`);
        const audioUrl = await api.call();
        
        if (audioUrl && audioUrl.startsWith('http')) {
          console.log(`Sucesso - áudio real encontrado com ${api.name}:`, audioUrl);
          
          if (audioUrl.includes('mp3') || audioUrl.includes('m4a') || audioUrl.includes('audio')) {
            const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
              timeout: 5000
            });
            const data = response.data as {
              data?: {
                title?: string;
                author?: { unique_id?: string; nickname?: string };
                cover?: string;
                origin_cover?: string;
                duration?: number;
              };
            };
            
            return NextResponse.json({
              success: true,
              data: {
                title: data?.data?.title || 'TikTok Audio',
                author: data?.data?.author?.unique_id || data?.data?.author?.nickname || 'Desconhecido',
                audioUrl: audioUrl,
                thumbnail: data?.data?.cover || data?.data?.origin_cover || '',
                duration: data?.data?.duration || 0,
                isRealAudio: true
              }
            });
          }
        }
      } catch (error) {
        console.log(`Falha na API ${api.name}:`, error instanceof Error ? error.message : 'Erro desconhecido');
        continue;
      }
    }

    const apiUrl = 'https://www.tikwm.com/api/';
    
    try {
      const response = await axios.post(apiUrl, {
        url: url,
        hd: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Referer': 'https://www.tikwm.com/',
          'Origin': 'https://www.tikwm.com'
        },
        timeout: 15000,
      });

      const responseData = response.data as {
        code?: number;
        data?: {
          music?: string;
          music_info?: { play?: string; url?: string };
          audio?: string;
          title?: string;
          author?: { unique_id?: string; nickname?: string };
          cover?: string;
          origin_cover?: string;
          duration?: number;
        };
      };
      if (responseData && responseData.code === 0 && responseData.data) {
        const data = responseData.data;
        
        let audioUrl = null;
        
        if (data.music) {
          audioUrl = data.music;
        } else if (data.music_info && data.music_info.play) {
          audioUrl = data.music_info.play;
        } else if (data.music_info && data.music_info.url) {
          audioUrl = data.music_info.url;
        } else if (data.audio) {
          audioUrl = data.audio;
        }

        if (audioUrl) {
          console.log('URL de áudio encontrada:', audioUrl);
          
          return NextResponse.json({
            success: true,
            data: {
              title: data.title || 'TikTok Audio',
              author: data.author?.unique_id || data.author?.nickname || 'Desconhecido',
              audioUrl: audioUrl,
              thumbnail: data.cover || data.origin_cover || '',
              duration: data.duration || 0
            }
          });
        } else {
          console.log('Não há áudio separado disponível');
          return NextResponse.json({ 
            error: 'Este vídeo não tem áudio separado disponível. Tente baixar o vídeo completo.' 
          }, { status: 404 });
        }
      }
    } catch (error) {
      console.log('Erro na API principal:', error instanceof Error ? error.message : 'Erro desconhecido');
    }

    try {
      console.log('Tentando API alternativa...');
      
      const response2 = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.tikwm.com/'
        },
        timeout: 15000,
      });

      const responseData2 = response2.data as {
        code?: number;
        data?: {
          music?: string;
          title?: string;
          author?: { unique_id?: string; nickname?: string };
          cover?: string;
          origin_cover?: string;
          duration?: number;
        };
      };
      if (responseData2 && responseData2.code === 0 && responseData2.data) {
        const data = responseData2.data;
        
        if (data.music && (data.music.includes('mp3') || data.music.includes('m4a') || data.music.includes('audio'))) {
          return NextResponse.json({
            success: true,
            data: {
              title: data.title || 'TikTok Audio',
              author: data.author?.unique_id || data.author?.nickname || 'Desconhecido',
              audioUrl: data.music,
              thumbnail: data.cover || data.origin_cover || '',
              duration: data.duration || 0,
              isRealAudio: true
            }
          });
        } else {
          console.log('API alternativa não tem áudio real');
        }
      }
    } catch (error) {
      console.log('Erro na API alternativa:', error instanceof Error ? error.message : 'Erro desconhecido');
    }

    return NextResponse.json({ 
      error: 'Não foi possível obter áudio deste vídeo do TikTok. Tente novamente ou use a opção de vídeo.' 
    }, { status: 404 });

  } catch (error) {
    console.error('Erro na API de áudio TikTok:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor.' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de áudio TikTok funcionando!',
    usage: 'POST { "url": "https://tiktok.com/..." }'
  });
}
