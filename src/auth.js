import { createClient } from '@supabase/supabase-js';

const env = import.meta.env ?? {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function accessState(user, profile) {
  if (!user) return { status: 'signed-out' };
  if (!profile || profile.user_id !== user.id || profile.active !== true) {
    return { status: 'not-authorized' };
  }
  return { status: 'authorized', role: profile.role };
}

export async function currentEditorialAccess() {
  if (!supabase) return { status: 'not-configured' };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { status: 'signed-out' };

  const { data: profile, error: profileError } = await supabase
    .from('editorial_profiles')
    .select('user_id, role, active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) return { status: 'profile-error', message: profileError.message };
  return { ...accessState(user, profile), user };
}

export async function sendMagicLink(email) {
  if (!supabase) throw new Error('A integração Supabase ainda não foi configurada.');
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
