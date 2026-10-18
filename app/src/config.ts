// Deployment settings.
//
// The database is the GRA Moissanite Supabase project, shared on purpose so the
// family can reuse its working SMS sign-in. The family tables are separate:
// see supabase/schema.sql.
//
// The publishable key is MEANT to be public: it identifies the project and
// grants nothing on its own; the rules in schema.sql decide what anyone can do.
// Never put the service_role / secret key here.

export const CONFIG = {
  supabaseUrl: 'https://lrkksouipioygqijkqdy.supabase.co',
  supabaseAnonKey: 'sb_publishable_vxsaVhVJZhGZxksmEmr2Jg_AbxJEXGQ',
  /** Digits in the SMS code. Must match "SMS OTP Length" in Supabase (shared with GRA). */
  otpLength: 6,
};

/** Cloud mode = one shared calendar. Build with VITE_LOCAL_MODE=1 to keep data in the browser (design and testing only). */
export const CLOUD = !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) && !import.meta.env.VITE_LOCAL_MODE;
