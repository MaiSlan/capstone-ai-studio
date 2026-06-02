import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const MODAL_BG_URL = "https://maislan-ai-studio--flufforia-bg-engine-fastapi-app.modal.run";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // 1. Initialize secure server-side Supabase client
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

    // 2. Verify User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    // 3. Verify Token Balance
    const { data: profile } = await supabase.from('profiles').select('tokens').eq('id', user.id).single();
    if (!profile || profile.tokens <= 0) {
      return NextResponse.json({ error: 'Insufficient tokens.' }, { status: 403 });
    }

    // 4. Extract the uploaded image
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
    }

    // 5. Send to Modal Engine
    const arrayBuffer = await imageFile.arrayBuffer();
    const modalRes = await fetch(MODAL_BG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: arrayBuffer
    });

    if (!modalRes.ok) throw new Error('Cloud Vision engine failed.');
    const processedImageBuffer = await modalRes.arrayBuffer();

    // 6. Deduct exactly 1 token securely on the server
    await supabase.from('profiles').update({ tokens: profile.tokens - 1 }).eq('id', user.id);

    // 7. Return the transparent PNG back to the frontend
    return new NextResponse(processedImageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': processedImageBuffer.byteLength.toString()
      }
    });

  } catch (err: any) {
    console.error("BG Remove Error:", err);
    return NextResponse.json({ error: 'An unexpected error occurred processing the asset.' }, { status: 500 });
  }
}