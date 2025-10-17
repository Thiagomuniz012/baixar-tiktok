import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'tiktok-video.mp4';

    if (!videoUrl || videoUrl.trim() === '') {
      console.log('URL vazia recebida:', videoUrl);
      return NextResponse.json({ error: 'URL do vídeo é obrigatória' }, { status: 400 });
    }

    console.log('Fazendo proxy download de:', videoUrl);

    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': 'https://www.tiktok.com/',
      },
      timeout: 30000,
    });

    let contentType = response.headers['content-type'] || 'video/mp4';
    
    if (filename.endsWith('.mp3') || filename.includes('mp3')) {
      contentType = 'audio/mpeg';
    } else if (filename.endsWith('.mp4') || filename.includes('mp4')) {
      contentType = 'video/mp4';
    } else if (filename.endsWith('.m4a') || filename.includes('m4a')) {
      contentType = 'audio/mp4';
    }
    
    const contentLength = response.headers['content-length'];

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache');
    headers.set('Access-Control-Allow-Origin', '*');
    
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    const stream = new ReadableStream({
      start(controller) {
        const dataStream = response.data as any;
        
        dataStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        
        dataStream.on('end', () => {
          controller.close();
        });
        
        dataStream.on('error', (error: Error) => {
          console.error('Erro no stream:', error);
          controller.error(error);
        });
      }
    });

    return new Response(stream, {
      headers,
      status: 200,
    });

  } catch (error) {
    console.error('Erro no proxy download:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer download do vídeo' 
    }, { status: 500 });
  }
}
