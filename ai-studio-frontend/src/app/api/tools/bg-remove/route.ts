import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 🚨 PASTE YOUR MODAL URL HERE 🚨
const MODAL_BG_URL = "https://maislan-ai-studio--flufforia-bg-engine-fastapi-app.modal.run";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { 
             try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (error) {} 
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('tokens').eq('id', user.id).single();
    if (!profile || profile.tokens <= 0) return NextResponse.json({ error: 'Insufficient tokens.' }, { status: 403 });

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    if (!imageFile) return NextResponse.json({ error: 'No image provided.' }, { status: 400 });

    const arrayBuffer = await imageFile.arrayBuffer();
    const modalRes = await fetch(MODAL_BG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: arrayBuffer
    });

    if (!modalRes.ok) throw new Error('Cloud Vision engine failed.');
    const processedImageBuffer = await modalRes.arrayBuffer();

    await supabase.from('profiles').update({ tokens: profile.tokens - 1 }).eq('id', user.id);

    return new NextResponse(processedImageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': processedImageBuffer.byteLength.toString()
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process asset.' }, { status: 500 });
  }
}