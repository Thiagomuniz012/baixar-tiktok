import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    const audioApis = [
      {
        name: 'ssstik-audio',
        url: 'https://ssstik.io/abc?url=dl',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        data: `id=${encodeURIComponent(url)}&locale=pt&tt=audio`,
        parser: (html: string) => {
          const audioMatch = html.match(/href="([^"]*)" rel="nofollow">Audio<\/a>/);
          if (audioMatch) {
            return audioMatch[1];
          }
          return null;
        }
      },
      {
        name: 'tikmate-audio',
        url: 'https://tikmate.app/download',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        data: `url=${encodeURIComponent(url)}`,
        parser: (data: any) => {
          if (data.success && data.audio_url) {
            return data.audio_url;
          }
          return null;
        }
      },
      {
        name: 'snaptik-audio',
        url: 'https://snaptik.app/abc2',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        data: `url=${encodeURIComponent(url)}&token=audio`,
        parser: (data: any) => {
          try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (parsed.success && parsed.audio) {
              return parsed.audio;
            }
          } catch {
            const audioMatch = data.match(/class="audio-download"[^>]*href="([^"]*)"/) || 
                              data.match(/download[^>]*href="([^"]*mp3[^"]*)"/) ||
                              data.match(/href="([^"]*)" [^>]*audio/i);
            if (audioMatch) {
              return audioMatch[1];
            }
          }
          return null;
        }
      }
    ];

    for (const api of audioApis) {
      try {
        console.log(`Tentando extrair áudio com API: ${api.name}`);
        
        let response;
        if (api.method === 'POST') {
          response = await axios.post(api.url, api.data, {
            headers: api.headers,
            timeout: 15000,
          });
        } else {
          response = await axios.get(api.url, {
            headers: api.headers,
            timeout: 15000,
          });
        }

        const audioUrl = api.parser(response.data as any);
        
        if (audioUrl) {
          console.log(`Sucesso na extração de áudio com: ${api.name}`);
          
          if (audioUrl.startsWith('http')) {
            return NextResponse.json({
              success: true,
              audioUrl: audioUrl,
              source: api.name
            });
          }
        }
      } catch (error) {
        console.log(`Falha na API ${api.name}:`, error instanceof Error ? error.message : 'Erro desconhecido');
        continue;
      }
    }

    console.log('Tentando método alternativo para áudio...');
    
    try {
      const y2mateResponse = await axios.post('https://www.y2mate.com/mates/analyze/ajax', 
        `url=${encodeURIComponent(url)}&q_auto=1&ajax=1`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 15000,
      });

      const y2mateData = y2mateResponse.data as any;
      if (y2mateData && y2mateData.result) {
        const audioMatch = y2mateData.result.match(/data-ftype="mp3"[^>]*data-fquality="[^"]*"[^>]*>.*?<a[^>]*href="([^"]*)"/) ||
                          y2mateData.result.match(/mp3[^>]*href="([^"]*)"/) ||
                          y2mateData.result.match(/audio[^>]*href="([^"]*)"/) ||
                          y2mateData.result.match(/data-ftype="audio"[^>]*href="([^"]*)"/) ||
                          y2mateData.result.match(/href="([^"]*)"[^>]*mp3/);
        
        if (audioMatch) {
          console.log('Sucesso com Y2Mate para áudio');
          return NextResponse.json({
            success: true,
            audioUrl: audioMatch[1],
            source: 'y2mate'
          });
        }
      }
    } catch (error) {
      console.log('Falha no Y2Mate:', error instanceof Error ? error.message : 'Erro desconhecido');
    }

    return NextResponse.json({ 
      error: 'Não foi possível extrair áudio deste vídeo. Nem todos os vídeos do TikTok têm áudio disponível para download separado.' 
    }, { status: 404 });

  } catch (error) {
    console.error('Erro na extração de áudio:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao extrair áudio.' 
    }, { status: 500 });
  }
}
