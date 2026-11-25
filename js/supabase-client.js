/**
 * ==============================================================================
 * FATAMA FIGHTING DRAGONS - SUPABASE CLIENT INTEGRATION
 * ==============================================================================
 */

const SUPABASE_URL = 'https://zldvusuiwzntcunuklbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2PTXcabDyXgH4iCtC1ejOQ_NEw8YRp5';

// Capture password recovery state synchronously BEFORE createClient() consumes/clears location.hash
if (typeof window !== 'undefined') {
  try {
    const initHash = window.location.hash || '';
    const initSearch = window.location.search || '';
    if (initHash.includes('type=recovery') || initSearch.includes('type=recovery')) {
      window.__FFD_RECOVERY_DETECTED__ = true;
      sessionStorage.setItem('ffd_password_recovery', '1');
    }
  } catch (e) {}
}

// Initialize Supabase Client instance
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
    try {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          window.__FFD_RECOVERY_DETECTED__ = true;
          try { sessionStorage.setItem('ffd_password_recovery', '1'); } catch (e) {}
          window.dispatchEvent(new CustomEvent('ffd:password-recovery', { detail: { session } }));
        }
      });
    } catch (e) {}
    return supabaseClient;
  }
  console.warn('[Supabase] Supabase JS library is not yet loaded.');
  return null;
}

// Auto-initialize if library is present
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    getSupabaseClient();
  });
}

// Known Premade Instructors Map
const PRESET_INSTRUCTORS = {
  'faciolnorros@gmail.com': { name: 'Bruce Stephen Norros Faciol', firstName: 'Bruce Stephen', lastName: 'Norros Faciol', rank: 'Black Belt (5th Dan)' },
  'bruce@fatama.com': { name: 'Bruce Stephen Norros Faciol', firstName: 'Bruce Stephen', lastName: 'Norros Faciol', rank: 'Black Belt (5th Dan)' },
  'beanna@fatama.com': { name: 'Beanna Pauline Faciol', firstName: 'Beanna Pauline', lastName: 'Faciol', rank: 'Black Belt (3rd Dan)' },
  'norbe@fatama.com': { name: 'Norbe Faciol', firstName: 'Norbe', lastName: 'Faciol', rank: 'Black Belt (8th Dan)' }
};

/**
 * Sync and Auto-hydrate session between localStorage and sessionStorage
 */
function syncStoredSession() {
  try {
    // Proactively self-heal / migrate any stale placeholder instructor name
    const storedName = localStorage.getItem('ffd_user_name') || sessionStorage.getItem('ffd_user_name');
    if (storedName === 'Bruce Dela Cruz' || storedName === 'Master Bruce Dela Cruz') {
      localStorage.setItem('ffd_user_name', 'Bruce Stephen Norros Faciol');
      sessionStorage.setItem('ffd_user_name', 'Bruce Stephen Norros Faciol');
    }

    const localRole = localStorage.getItem('ffd_active_role');
    const localName = localStorage.getItem('ffd_user_name');
    const localEmail = localStorage.getItem('ffd_user_email');
    const localId = localStorage.getItem('ffd_user_id');
    const localRank = localStorage.getItem('ffd_user_rank');
    const localAvatar = localStorage.getItem('ffd_user_avatar');
    const sessionAvatar = sessionStorage.getItem('ffd_user_avatar');

    if (localRole && !sessionStorage.getItem('ffd_active_role')) {
      sessionStorage.setItem('ffd_active_role', localRole);
    }
    if (localName && !sessionStorage.getItem('ffd_user_name')) {
      sessionStorage.setItem('ffd_user_name', localName);
    }
    if (localEmail && !sessionStorage.getItem('ffd_user_email')) {
      sessionStorage.setItem('ffd_user_email', localEmail);
    }
    if (localId && !sessionStorage.getItem('ffd_user_id')) {
      sessionStorage.setItem('ffd_user_id', localId);
    }
    if (localRank && !sessionStorage.getItem('ffd_user_rank')) {
      sessionStorage.setItem('ffd_user_rank', localRank);
    }
    if (localAvatar && !sessionAvatar) {
      sessionStorage.setItem('ffd_user_avatar', localAvatar);
    } else if (sessionAvatar && !localAvatar) {
      localStorage.setItem('ffd_user_avatar', sessionAvatar);
    }
  } catch (e) {
    console.warn('[Supabase] syncStoredSession storage error:', e);
  }
}

// Run immediately upon script load
syncStoredSession();

/**
 * Save user session to both sessionStorage and localStorage (device persistence)
 */
function saveUserSession({ role, fullName, email, id, rank, avatarUrl }, remember = true) {
  try {
    localStorage.removeItem('ffd_logged_out');
    sessionStorage.removeItem('ffd_logged_out');

    const effectiveRole = role || 'student';
    const effectiveName = fullName || email || 'Member';

    // Always keep current tab session hydrated
    sessionStorage.setItem('ffd_active_role', effectiveRole);
    sessionStorage.setItem('ffd_user_name', effectiveName);
    if (email) sessionStorage.setItem('ffd_user_email', email);
    if (id) sessionStorage.setItem('ffd_user_id', id);
    if (rank) sessionStorage.setItem('ffd_user_rank', rank);
    if (avatarUrl) {
      sessionStorage.setItem('ffd_user_avatar', avatarUrl);
    } else if (avatarUrl === '') {
      sessionStorage.removeItem('ffd_user_avatar');
    }

    // Persist to device localStorage if remember is true
    if (remember) {
      localStorage.setItem('ffd_active_role', effectiveRole);
      localStorage.setItem('ffd_user_name', effectiveName);
      if (email) localStorage.setItem('ffd_user_email', email);
      if (id) localStorage.setItem('ffd_user_id', id);
      if (rank) localStorage.setItem('ffd_user_rank', rank);
      if (avatarUrl) {
        localStorage.setItem('ffd_user_avatar', avatarUrl);
      } else if (avatarUrl === '') {
        localStorage.removeItem('ffd_user_avatar');
      }
      localStorage.setItem('ffd_remember_device', 'true');
      localStorage.setItem('ffd_session_active', 'true');
    } else {
      localStorage.removeItem('ffd_active_role');
      localStorage.removeItem('ffd_user_name');
      localStorage.removeItem('ffd_user_email');
      localStorage.removeItem('ffd_user_id');
      localStorage.removeItem('ffd_user_rank');
      if (avatarUrl === '') {
        localStorage.removeItem('ffd_user_avatar');
      }
      localStorage.removeItem('ffd_remember_device');
      localStorage.removeItem('ffd_session_active');
    }
  } catch (e) {
    console.warn('[Supabase] saveUserSession error:', e);
  }
}

/**
 * Get synchronously stored user session from storage
 */
function getStoredUserSession() {
  try {
    if (localStorage.getItem('ffd_logged_out') === 'true' || sessionStorage.getItem('ffd_logged_out') === 'true') {
      return null;
    }
  } catch (e) {}
  syncStoredSession();
  try {
    if (localStorage.getItem('ffd_logged_out') === 'true' || sessionStorage.getItem('ffd_logged_out') === 'true') {
      return null;
    }

    const role = sessionStorage.getItem('ffd_active_role') || localStorage.getItem('ffd_active_role');
    const fullName = sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name');
    const email = sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email');
    const id = sessionStorage.getItem('ffd_user_id') || localStorage.getItem('ffd_user_id');
    const rank = sessionStorage.getItem('ffd_user_rank') || localStorage.getItem('ffd_user_rank');
    const avatarUrl = sessionStorage.getItem('ffd_user_avatar') || localStorage.getItem('ffd_user_avatar');

    if (!role && !fullName && !email) {
      return null;
    }

    return {
      role: role || 'student',
      fullName: fullName || email || 'Member',
      email: email || '',
      id: id || '',
      rank: rank || (role === 'instructor' ? 'Instructor' : 'White Belt (10th-Gup)'),
      avatarUrl: avatarUrl || ''
    };
  } catch (e) {
    return null;
  }
}

/**
 * Asynchronously retrieve active session, checking localStorage and Supabase auth token
 */
async function getActiveSessionAsync() {
  try {
    if (localStorage.getItem('ffd_logged_out') === 'true' || sessionStorage.getItem('ffd_logged_out') === 'true') {
      return null;
    }
  } catch (e) {}
  const cached = getStoredUserSession();
  if (cached) return cached;

  // Only attempt background session restore if device persistence was enabled and user hasn't signed out
  const rememberDevice = localStorage.getItem('ffd_remember_device') === 'true';
  const hasLocalRole = !!localStorage.getItem('ffd_active_role');
  if (!rememberDevice && !hasLocalRole) {
    return null;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session || !session.user) return null;

    const email = (session.user.email || '').toLowerCase();
    const isPresetInstructor = !!PRESET_INSTRUCTORS[email];
    let role = session.user.user_metadata?.role || (isPresetInstructor ? 'instructor' : 'student');
    let fullName = session.user.user_metadata?.full_name || (isPresetInstructor ? PRESET_INSTRUCTORS[email].name : email);
    let rank = isPresetInstructor ? PRESET_INSTRUCTORS[email].rank : '';

    let avatarUrl = session.user.user_metadata?.avatar_url || '';

    try {
      const profile = await getProfile(session.user.id);
      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.full_name) fullName = profile.full_name;
        if (profile.belt_rank || profile.proficiency) rank = profile.belt_rank || profile.proficiency;
        if (profile.avatar_url) avatarUrl = profile.avatar_url;
      }
    } catch (pe) {
      console.warn('[Supabase] profile lookup during session restore:', pe);
    }

    const sessionData = { role, fullName, email: session.user.email, id: session.user.id, rank, avatarUrl };
    saveUserSession(sessionData, true);
    return sessionData;
  } catch (err) {
    console.warn('[Supabase] getActiveSessionAsync error:', err);
    return null;
  }
}

/**
 * Sign In User with Email & Password
 */
async function signInUser(email, password, remember = true) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not loaded. Please check your internet connection.');

  const cleanEmail = email.trim().toLowerCase();
  const isPresetInstructor = !!PRESET_INSTRUCTORS[cleanEmail];

  const { data, error } = await client.auth.signInWithPassword({
    email: cleanEmail,
    password: password
  });

  if (error) throw error;

  // Determine user role and details
  let role = data.user?.user_metadata?.role || (isPresetInstructor ? 'instructor' : 'student');
  let fullName = data.user?.user_metadata?.full_name || (isPresetInstructor ? PRESET_INSTRUCTORS[cleanEmail].name : email);
  let rank = isPresetInstructor ? PRESET_INSTRUCTORS[cleanEmail].rank : '';
  let avatarUrl = data.user?.user_metadata?.avatar_url || '';

  // Fetch full profile info (including registrations fallback and self-healing)
  try {
    const profile = await getProfile(data.user.id);
    if (profile) {
      if (profile.role) role = profile.role;
      if (profile.full_name) fullName = profile.full_name;
      if (profile.belt_rank || profile.proficiency) rank = profile.belt_rank || profile.proficiency;
      if (profile.avatar_url) avatarUrl = profile.avatar_url;
    }
  } catch (err) {
    console.log('[Supabase] Profile lookup info:', err);
  }

  // Auto-sync instructor role and metadata if matching known instructor
  if (isPresetInstructor) {
    role = 'instructor';
    if (!fullName || fullName === email) {
      fullName = PRESET_INSTRUCTORS[cleanEmail].name;
    }
    if (!rank) {
      rank = PRESET_INSTRUCTORS[cleanEmail].rank;
    }
    try {
      await client.from('profiles').update({
        role: 'instructor'
      }).eq('id', data.user.id);
    } catch (e) {
      console.warn('[Supabase] Auto-sync instructor profile error:', e);
    }
  }

  // Check if Two-Factor Authentication (Email 2FA) is enabled for this user
  let twoFactorEnabled = false;
  try {
    const { data: secRow } = await client
      .from('profiles')
      .select('two_factor_enabled')
      .eq('id', data.user.id)
      .maybeSingle();
    twoFactorEnabled = !!secRow?.two_factor_enabled;
  } catch (e) {}

  if (twoFactorEnabled) {
    await sendPortalEmail('send_2fa_code', {
      userId: data.user.id,
      email: data.user.email,
      fullName
    });
    return {
      requires2FA: true,
      user: data.user,
      session: data.session,
      role,
      fullName,
      rank,
      avatarUrl,
      remember
    };
  }

  // Store in sessionStorage and localStorage for device persistence
  saveUserSession({
    role,
    fullName,
    email: data.user.email,
    id: data.user.id,
    rank,
    avatarUrl
  }, remember);

  // Check if this is a new device and send login activity alert
  checkAndRecordLoginDevice(data.user.id, data.user.email, fullName).catch(() => {});

  return { user: data.user, session: data.session, role, fullName, rank, avatarUrl };
}

/**
 * Invoke Supabase Edge Function `send-email` (non-throwing by default for background notifications)
 */
async function sendPortalEmail(action, payload = {}, throwOnError = false) {
  try {
    let userAccessToken = '';
    const client = getSupabaseClient();
    if (client) {
      try {
        let { data: { session } } = await client.auth.getSession();
        if (!session?.access_token) {
          const refreshed = await client.auth.refreshSession().catch(() => null);
          session = refreshed?.data?.session || null;
        }
        if (session?.access_token) userAccessToken = session.access_token;
      } catch (e) {}
    }
    console.info('[Email] invoking', action, 'auth=', userAccessToken ? 'user_jwt' : 'anon_key');
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action, payload, accessToken: userAccessToken || undefined })
    });

    const json = await resp.json().catch(() => ({}));
    console.info('[Email]', action, resp.status, json);
    if (!resp.ok || json?.ok === false) {
      const msg = json?.error || `Email service error (${resp.status})`;
      if (throwOnError) throw new Error(msg);
      console.warn('[Email] sendPortalEmail warning:', action, msg);
      return { ok: false, error: msg };
    }
    return json;
  } catch (err) {
    if (throwOnError) throw err;
    console.warn('[Email] sendPortalEmail exception:', action, err);
    return { ok: false, error: err?.message || String(err) };
  }
}

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem('ffd_device_id');
    if (!id) {
      id = 'dev-' + (crypto?.randomUUID ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2, 10)));
      localStorage.setItem('ffd_device_id', id);
    }
    return id;
  } catch (e) {
    return 'dev-browser';
  }
}

function getReadableDeviceLabel() {
  try {
    const ua = navigator.userAgent || '';
    const os = /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : 'Linux';
    const browser = /Edg\//i.test(ua) ? 'Edge' : /Chrome\//i.test(ua) ? 'Chrome' : /Firefox\//i.test(ua) ? 'Firefox' : /Safari\//i.test(ua) ? 'Safari' : 'Browser';
    return `${browser} on ${os}`;
  } catch (e) {
    return 'Web Browser';
  }
}

async function checkAndRecordLoginDevice(userId, email, fullName) {
  const client = getSupabaseClient();
  if (!client || !userId || !email) return;

  const deviceId = getOrCreateDeviceId();
  const deviceLabel = getReadableDeviceLabel();

  try {
    const { data: existing, error } = await client
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) return;

    if (existing) {
      await client
        .from('user_devices')
        .update({ last_seen_at: new Date().toISOString(), device_label: deviceLabel })
        .eq('id', existing.id);
    } else {
      await client
        .from('user_devices')
        .insert({ user_id: userId, device_id: deviceId, device_label: deviceLabel });

      await sendPortalEmail('new_device_login', {
        email,
        fullName,
        deviceLabel
      });
    }
  } catch (e) {
    console.warn('[Security] checkAndRecordLoginDevice warning:', e);
  }
}

async function verifyLogin2FACode(userId, code) {
  return await sendPortalEmail('verify_2fa_code', { userId, code }, true);
}

async function completeSignInAfter2FA(pendingAuth) {
  if (!pendingAuth || !pendingAuth.user) throw new Error('Missing pending authentication.');
  saveUserSession({
    role: pendingAuth.role,
    fullName: pendingAuth.fullName,
    email: pendingAuth.user.email,
    id: pendingAuth.user.id,
    rank: pendingAuth.rank,
    avatarUrl: pendingAuth.avatarUrl
  }, pendingAuth.remember !== false);

  checkAndRecordLoginDevice(pendingAuth.user.id, pendingAuth.user.email, pendingAuth.fullName).catch(() => {});
  return pendingAuth;
}

/**
 * ==============================================================================
 * VALIDATION UTILITIES: INVISIBLE CHARS, EMAIL PROVIDER, PH PHONE, BIRTHDAY
 * ==============================================================================
 */

/**
 * Detect/strip invisible, zero-width, control, format, line/paragraph separator,
 * non-ASCII whitespace, and blank filler characters (e.g. U+200B, U+FEFF, U+00AD,
 * U+3164, U+2800, U+00A0, U+034F, U+180E, tags, variation selectors, etc.).
 */
const DISALLOWED_INVISIBLE_BASE_RE = /(?:[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Zl}\p{Zp}\u034F\u115F\u1160\u17B4\u17B5\u180E\u2800\u3164\uFE00-\uFE0F\uFFA0\uFFFC\uFFFD\u{E0000}-\u{E01EF}]|(?! )\p{Zs})/gu;
const DISALLOWED_INVISIBLE_NOSPACE_RE = /(?:[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}\u034F\u115F\u1160\u17B4\u17B5\u180E\u2800\u3164\uFE00-\uFE0F\uFFA0\uFFFC\uFFFD\u{E0000}-\u{E01EF}])/gu;

function getInvisibleRegex(allowSpace = true) {
  return allowSpace ? DISALLOWED_INVISIBLE_BASE_RE : DISALLOWED_INVISIBLE_NOSPACE_RE;
}

function hasInvisibleChars(str, { allowSpace = true } = {}) {
  if (typeof str !== 'string' || !str) return false;
  const re = getInvisibleRegex(allowSpace);
  re.lastIndex = 0;
  return re.test(str);
}

function stripInvisibleChars(str, { allowSpace = true } = {}) {
  if (typeof str !== 'string') return '';
  const re = getInvisibleRegex(allowSpace);
  re.lastIndex = 0;
  return str.replace(re, '');
}

function attachNoInvisibleFilter(inputElem, { allowSpace = true, transform = null, onClean = null } = {}) {
  if (!inputElem) return;
  inputElem.addEventListener('input', () => {
    const prev = inputElem.value;
    const cursor = inputElem.selectionStart ?? prev.length;
    const stripped = stripInvisibleChars(prev, { allowSpace });
    const cleaned = transform ? transform(stripped) : stripped;
    if (cleaned !== prev) {
      let removedBefore = 0;
      const before = prev.slice(0, cursor);
      const re = getInvisibleRegex(allowSpace);
      re.lastIndex = 0;
      const m = before.match(re);
      if (m) removedBefore = m.join('').length;
      if (transform) {
        const prefixClean = transform(stripInvisibleChars(before, { allowSpace }));
        removedBefore = Math.max(0, before.length - prefixClean.length);
      }
      inputElem.value = cleaned;
      if (typeof inputElem.setSelectionRange === 'function') {
        try {
          const nextPos = Math.max(0, cursor - removedBefore);
          inputElem.setSelectionRange(nextPos, nextPos);
        } catch (e) {}
      }
    }
    if (onClean) onClean(inputElem);
  });
}

/**
 * Validate that an email is from a legitimate, recognized email provider
 * Rejects typos (e.g. gmai.com), disposable/temporary domains, and dummy domains.
 */
function validateEmailProvider(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email address is required.' };
  }
  if (hasInvisibleChars(email, { allowSpace: false })) {
    return { valid: false, message: 'Email address cannot contain spaces, invisible, or control characters.' };
  }
  const cleanEmail = email.trim().toLowerCase();

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, message: 'Please enter a valid email format (e.g. name@example.com).' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Invalid email address.' };
  }
  const domain = parts[1].toLowerCase();

  // 1. Detect common misspellings / typos
  const commonTypos = {
    'gmai.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gamil.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com.ph': 'yahoo.com.ph',
    'yahoo.con': 'yahoo.com',
    'outlok.com': 'outlook.com',
    'outluk.com': 'outlook.com',
    'hotmial.com': 'hotmail.com',
    'hotmaill.com': 'hotmail.com',
    'iclud.com': 'icloud.com',
    'icld.com': 'icloud.com'
  };

  if (commonTypos[domain]) {
    return {
      valid: false,
      message: `Did you mean @${commonTypos[domain]}? Please verify your email provider.`
    };
  }

  // 2. Reject disposable / temporary / dummy email domains
  const disposableDomains = new Set([
    'tempmail.com', 'temp-mail.org', '10minutemail.com', 'mailinator.com',
    'guerrillamail.com', 'throwawaymail.com', 'yopmail.com', 'trashmail.com',
    'sharklasers.com', 'dispostable.com', 'getairmail.com', 'mohmal.com',
    'fake.com', 'test.com', 'example.com', 'asdf.com', 'dummy.com',
    'inboxkitten.com', 'mytemp.email', 'nada.ltd', 'burnermail.io', 'fakemailgenerator.com'
  ]);

  if (disposableDomains.has(domain)) {
    return {
      valid: false,
      message: 'Temporary or disposable email addresses are not permitted. Please use your active email.'
    };
  }

  // 3. Recognized reputable email providers
  const recognizedProviders = new Set([
    // Google
    'gmail.com', 'googlemail.com',
    // Yahoo
    'yahoo.com', 'yahoo.com.ph', 'ymail.com', 'rocketmail.com',
    // Microsoft
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'outlook.ph',
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // Privacy & Business
    'proton.me', 'protonmail.com', 'zoho.com', 'aol.com', 'mail.com',
    'gmx.com', 'gmx.net', 'fastmail.com', 'yandex.com',
    // Academy internal
    'fatama.com'
  ]);

  const isEduOrGov = domain.endsWith('.edu') ||
                     domain.endsWith('.edu.ph') ||
                     domain.endsWith('.org.ph') ||
                     domain.endsWith('.gov.ph') ||
                     domain.endsWith('.ac.ph') ||
                     domain.endsWith('.ac.uk');

  if (!recognizedProviders.has(domain) && !isEduOrGov) {
    return {
      valid: false,
      message: 'Please provide an email from a valid provider (e.g., Gmail, Yahoo, Outlook, or iCloud).'
    };
  }

  return { valid: true, cleanEmail, domain };
}

/**
 * Validate Philippine Mobile Number format
 * Accepts: 09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX, 9XXXXXXXXX (with or without spaces/dashes)
 */
function validatePhilippinePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Mobile phone number is required.' };
  }
  if (hasInvisibleChars(phone, { allowSpace: true })) {
    return { valid: false, message: 'Phone number cannot contain invisible or control characters.' };
  }

  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '').trim();

  if (cleaned.startsWith('+63')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  const phMobileRegex = /^09\d{9}$/;
  if (!phMobileRegex.test(cleaned)) {
    return {
      valid: false,
      message: 'Please enter a valid Philippine mobile number (e.g. 0900 000 0000).'
    };
  }

  const formatted = `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;

  return { valid: true, cleaned, formatted };
}

/**
 * Validate Reasonable & Possible Birthdays
 * Restricts future dates, toddlers under 3, unrealistic ages (>100), and checks minor status.
 */
function validateBirthday(dobString, isChild = false) {
  if (!dobString) {
    return { valid: false, message: 'Date of birth is required.' };
  }

  const birthDate = new Date(dobString + 'T00:00:00');
  if (isNaN(birthDate.getTime())) {
    return { valid: false, message: 'Please enter a valid calendar date.' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate > today) {
    return { valid: false, message: 'Date of birth cannot be in the future.' };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 3) {
    return {
      valid: false,
      message: 'Student must be at least 3 years old to register.'
    };
  }

  if (age > 100) {
    return {
      valid: false,
      message: 'Please enter a realistic date of birth (age must be 100 or below).'
    };
  }

  if (isChild && age >= 18) {
    return {
      valid: false,
      message: `Child registration is for minors (under 18). This student is ${age} years old. Please select 'Registering for Myself'.`
    };
  }

  if (!isChild && age < 10) {
    return {
      valid: false,
      message: `Students under 10 years old must be registered by a parent or guardian. Please select 'Registering for My Child'.`
    };
  }

  let category = 'Student';
  if (age >= 4 && age <= 11) category = 'Cadet / Child';
  else if (age >= 12 && age <= 17) category = 'Junior / Teen';
  else if (age >= 18) category = 'Senior / Adult';

  return { valid: true, age, category, birthDate };
}

/**
 * Initiate Registration with Email Confirmation Gate
 * Account is NOT added to official masterlist or database until email is confirmed.
 */
async function initiateRegistration(formData) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not loaded. Please check your internet connection.');

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    dob,
    gender,
    address,
    proficiency,
    registrationType = 'self',
    parentName = null,
    relationship = null,
    parentPhone = null,
    parentEmail = null,
    prevClub = null,
    emergencyName = null,
    emergencyPhone = null
  } = formData;

  const textFieldsToCheck = [
    ['First name', firstName],
    ['Last name', lastName],
    ['Password', password],
    ['Address', address],
    ['Parent / Guardian name', parentName],
    ['Relationship', relationship],
    ['Previous club', prevClub],
    ['Emergency contact name', emergencyName]
  ];
  for (const [label, val] of textFieldsToCheck) {
    if (typeof val === 'string' && hasInvisibleChars(val, { allowSpace: true })) {
      throw new Error(`${label} cannot contain invisible, control, or unsupported whitespace characters.`);
    }
  }

  // Validation 1: Student Email Provider
  const emailVal = validateEmailProvider(email);
  if (!emailVal.valid) throw new Error(emailVal.message);

  // Validation 2: Student Phone Format
  const phoneVal = validatePhilippinePhone(phone);
  if (!phoneVal.valid) throw new Error(phoneVal.message);

  // Validation 3: Birthday Restrictions
  const isChild = registrationType === 'child';
  const dobVal = validateBirthday(dob, isChild);
  if (!dobVal.valid) throw new Error(dobVal.message);

  // Validation 4: Parent checks if child registration
  if (isChild) {
    if (parentEmail) {
      const pEmailVal = validateEmailProvider(parentEmail);
      if (!pEmailVal.valid) throw new Error(`Parent email: ${pEmailVal.message}`);
    }
    if (parentPhone) {
      const pPhoneVal = validatePhilippinePhone(parentPhone);
      if (!pPhoneVal.valid) throw new Error(`Parent mobile: ${pPhoneVal.message}`);
    }
  }

  // Validation 5: Emergency Phone Format
  if (emergencyPhone) {
    const emergVal = validatePhilippinePhone(emergencyPhone);
    if (!emergVal.valid) throw new Error(`Emergency contact phone: ${emergVal.message}`);
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const cleanEmail = emailVal.cleanEmail;
  const formattedPhone = phoneVal.cleaned;

  // Compute email redirect URL pointing to login.html with confirmed parameter
  let confirmRedirectUrl = '';
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const loginPath = path.substring(0, path.lastIndexOf('/') + 1) + 'login.html';
    confirmRedirectUrl = `${origin}${loginPath}?confirmed=true`;
  }

  // 1. Start pre-verification (stores pending registration + sends 6-digit OTP; no auth.users row created yet)
  const metadata = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    phone: formattedPhone,
    dob: dob,
    gender: gender,
    address: address,
    address_parts: formData.addressParts || null,
    proficiency: proficiency || 'White Belt (Beginner)',
    role: 'student',
    registration_type: registrationType,
    parent_name: parentName,
    parent_phone: parentPhone,
    parent_email: parentEmail,
    relationship: relationship,
    emergency_name: emergencyName,
    emergency_phone: emergencyPhone
  };

  await sendPortalEmail('start_pending_registration', {
    email: cleanEmail,
    password: password,
    metadata
  }, true);

  // Prepare normalized registration payload for confirmation finalization
  const pendingPayload = {
    userId: null,
    email: cleanEmail,
    password: password,
    firstName,
    lastName,
    fullName,
    phone: formattedPhone,
    dob,
    gender,
    address,
    addressParts: formData.addressParts || null,
    proficiency: proficiency || 'White Belt (Beginner)',
    registrationType,
    parentName,
    relationship,
    parentPhone,
    parentEmail,
    prevClub,
    emergencyName,
    emergencyPhone
  };

  // Cache pending registration in storage so it can be finalized upon confirmation
  try {
    sessionStorage.setItem('ffd_pending_registration', JSON.stringify(pendingPayload));
    localStorage.setItem('ffd_pending_registration', JSON.stringify(pendingPayload));
  } catch (e) {}

  return {
    confirmed: false,
    email: cleanEmail,
    message: 'Verification code sent. Please enter the 6-digit code from your email to create your account.'
  };
}

/**
 * Verify 6-Digit Email OTP Token and Create + Finalize Verified Account
 */
async function verifyEmailOtp(email, token) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not loaded.');

  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  // Verify code via Edge Function — creates the verified auth.users record only now
  const verifyRes = await sendPortalEmail('verify_pending_registration', {
    email: cleanEmail,
    code: cleanToken
  }, true);

  // Retrieve pending registration payload (includes password to sign in)
  let pendingData = null;
  try {
    const raw = sessionStorage.getItem('ffd_pending_registration') || localStorage.getItem('ffd_pending_registration');
    if (raw) pendingData = JSON.parse(raw);
  } catch (e) {}

  let authUser = verifyRes?.user || null;
  let authSession = null;

  if (pendingData?.password) {
    const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: pendingData.password
    });
    if (!signInErr && signInData?.user) {
      authUser = signInData.user;
      authSession = signInData.session;
      saveUserSession({
        role: 'student',
        fullName: pendingData.fullName || authUser.user_metadata?.full_name || '',
        email: cleanEmail,
        id: authUser.id,
        rank: pendingData.proficiency || 'White Belt (10th-Gup)'
      }, true);
    }
    delete pendingData.password;
  }

  // Finalize official student record now that email is confirmed
  await finalizeAccountCreation(authUser, pendingData);

  return {
    success: true,
    user: authUser,
    session: authSession
  };
}

/**
 * Resend Confirmation / Verification Email
 */
async function resendConfirmationEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  await sendPortalEmail('resend_pending_registration', { email: cleanEmail }, true);
  return { success: true };
}

/**
 * Finalize Account Creation:
 * ONLY called after email has been confirmed (via OTP or email link)
 */
async function finalizeAccountCreation(user, regData = null) {
  const client = getSupabaseClient();
  const userId = user?.id || regData?.userId;
  const email = (user?.email || regData?.email || '').trim().toLowerCase();
  const meta = user?.user_metadata || {};

  const firstName = regData?.firstName || meta.first_name || '';
  const lastName = regData?.lastName || meta.last_name || '';
  const fullName = regData?.fullName || meta.full_name || `${firstName} ${lastName}`.trim() || email;
  const phone = regData?.phone || meta.phone || '';
  const dob = regData?.dob || meta.dob || null;
  const gender = regData?.gender || meta.gender || '';
  const address = regData?.address || meta.address || '';
  const proficiency = regData?.proficiency || meta.proficiency || 'White Belt (Beginner)';
  const registrationType = regData?.registrationType || meta.registration_type || 'self';
  const parentName = regData?.parentName || meta.parent_name || null;
  const relationship = regData?.relationship || meta.relationship || null;
  const parentPhone = regData?.parentPhone || meta.parent_phone || null;
  const parentEmail = regData?.parentEmail || meta.parent_email || null;
  const prevClub = regData?.prevClub || meta.prev_club || null;
  const emergencyName = regData?.emergencyName || meta.emergency_name || null;
  const emergencyPhone = regData?.emergencyPhone || meta.emergency_phone || null;

  // 1. Insert confirmed record into registrations table & mark profile verified
  if (client) {
    if (userId) {
      try {
        await client.from('profiles').upsert({
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          role: 'student',
          proficiency: proficiency || 'White Belt (Beginner)',
          belt_rank: proficiency || 'White Belt',
          email_verified: true,
          ...(dob ? { dob } : {}),
          ...(phone ? { phone } : {}),
          ...(gender ? { gender } : {}),
          ...(address ? { address } : {}),
          ...(parentName || emergencyName ? { guardian_name: parentName || emergencyName } : {}),
          ...(relationship ? { guardian_relation: relationship } : (emergencyName ? { guardian_relation: 'Emergency Contact' } : {})),
          ...(emergencyName ? { emergency_name: emergencyName } : {}),
          ...(emergencyPhone ? { emergency_phone: emergencyPhone } : {})
        }, { onConflict: 'id' });
      } catch (verErr) {
        console.warn('[Supabase] finalizeAccountCreation profile upsert:', verErr);
      }
    }
    try {
      await client.from('registrations').insert({
        user_id: userId || null,
        registration_type: registrationType,
        student_name: fullName,
        student_email: email,
        student_phone: phone,
        dob: dob || null,
        gender: gender,
        address: address,
        parent_name: parentName,
        relationship: relationship,
        parent_phone: parentPhone,
        parent_email: parentEmail,
        proficiency: proficiency,
        prev_club: prevClub,
        emergency_name: emergencyName,
        emergency_phone: emergencyPhone,
        status: 'confirmed'
      });
    } catch (regErr) {
      console.warn('[Supabase] finalizeAccountCreation registrations insert:', regErr);
    }
  }

  // 1B. Send proof of registration (1st Free Training Pass) + Instructor notification (once per email)
  try {
    const sentKey = 'ffd_reg_email_sent_' + (email || userId || '');
    if (email && !localStorage.getItem(sentKey)) {
      localStorage.setItem(sentKey, '1');
      sendPortalEmail('new_registration', {
        studentName: fullName,
        studentEmail: email,
        phone,
        proficiency,
        registrationType,
        registrationId: userId ? ('FFD-' + userId.slice(0, 8).toUpperCase()) : ('FFD-TRIAL-' + Date.now().toString().slice(-6))
      }).catch(() => {});
    }
  } catch (e) {}

  // 2. Add confirmed student to masterlist in local storage
  try {
    const regList = JSON.parse(localStorage.getItem('ffd_registered_students') || '[]');
    const newStudent = {
      id: userId || ('REG-' + Date.now()),
      user_id: userId || null,
      firstName,
      lastName,
      belt: (proficiency || 'White Belt').split(' ')[0],
      keup: proficiency || 'White Belt (10th-Gup)',
      batch: '',
      email: email,
      phone: phone || '',
      dob: dob || '',
      address: address || '',
      guardianName: parentName || emergencyName || 'Guardian',
      guardianPhone: parentPhone || emergencyPhone || phone || '',
      guardianRelation: relationship || 'Parent',
      emergencyContact: `${parentName || emergencyName || 'Guardian'} (${parentPhone || emergencyPhone || phone || 'N/A'})`,
      joinedDate: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      attendanceRate: 100,
      attendanceHrs: 0,
      duesBalance: 0,
      duesStatus: 'Cleared',
      achievements: []
    };

    const existingIdx = regList.findIndex(r =>
      (email && (r.email || '').toLowerCase() === email) ||
      (userId && (r.id === userId || r.user_id === userId))
    );
    if (existingIdx >= 0) {
      regList[existingIdx] = { ...regList[existingIdx], ...newStudent };
    } else {
      regList.unshift(newStudent);
    }
    localStorage.setItem('ffd_registered_students', JSON.stringify(regList));

    // Cache student profile immediately so Profile Settings hydrates on first visit
    const studentCache = {
      first: firstName,
      last: lastName,
      fullName: fullName,
      email: email,
      phone: phone || '',
      dob: dob || '',
      address: address || '',
      addressParts: regData?.addressParts || null,
      guardian: parentName || emergencyName || '',
      relation: relationship || (emergencyName ? 'Emergency Contact' : ''),
      emergencyPhone: emergencyPhone || parentPhone || '',
      proficiency: proficiency || 'White Belt (10th-Gup)',
      gender: gender || '',
      signupDate: new Date().toISOString()
    };
    localStorage.setItem('ffd_student_profile_cache', JSON.stringify(studentCache));
    sessionStorage.setItem('ffd_student_profile_cache', JSON.stringify(studentCache));
  } catch (e) {
    console.warn('[Supabase] finalizeAccountCreation localStorage error:', e);
  }

  // 3. Clear pending registration payload
  try {
    sessionStorage.removeItem('ffd_pending_registration');
    localStorage.removeItem('ffd_pending_registration');
  } catch (e) {}

  // 4. Save active student session
  saveUserSession({
    role: 'student',
    fullName,
    email,
    id: userId,
    rank: proficiency || 'White Belt'
  }, true);

  return true;
}

/**
 * Register New User & Free Trial Booking (Full Flow)
 */
async function registerUser(formData) {
  return await initiateRegistration(formData);
}

/**
 * Sign Out User - Thorough storage purge & history replacement
 */
function clearStoragePreservingPersistentKeys() {
  try {
    const preserved = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k === 'ffd_device_id' || k.startsWith('ffd_viewed_'))) {
        preserved[k] = localStorage.getItem(k);
      }
    }
    localStorage.clear();
    sessionStorage.clear();
    Object.entries(preserved).forEach(([k, v]) => {
      if (v !== null) localStorage.setItem(k, v);
    });
    localStorage.setItem('ffd_logged_out', 'true');
    sessionStorage.setItem('ffd_logged_out', 'true');
  } catch (e) {
    console.warn('[Supabase] storage cleanup error:', e);
  }
}

async function signOutUser(redirect = true) {
  _cachedUser = null;
  _cachedUserTime = 0;
  _pendingUserPromise = null;

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('[Supabase] Sign out error:', err);
    }
  }

  // Synchronous and thorough storage purge (preserving device ID & viewed notification state)
  clearStoragePreservingPersistentKeys();

  if (redirect) {
    // Crucial: Use window.location.replace so the protected page cannot be navigated back to
    if (window.location.pathname.includes('landing_page.html')) {
      window.location.replace('landing_page.html');
    } else {
      window.location.replace('login.html?logout=true');
    }
  }
}

/**
 * Require active authentication on protected pages
 */
async function enforceAuth(requiredRole = null) {
  syncStoredSession();
  const cachedRole = sessionStorage.getItem('ffd_active_role') || localStorage.getItem('ffd_active_role');
  const cachedEmail = (sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email') || '').toLowerCase();
  const cachedId = sessionStorage.getItem('ffd_user_id') || localStorage.getItem('ffd_user_id');

  if (!cachedRole || (!cachedEmail && !cachedId)) {
    if (document.body) document.body.style.display = 'none';
    window.location.replace('login.html');
    return false;
  }

  // Strict role enforcement
  if (requiredRole && cachedRole && cachedRole !== requiredRole) {
    const isPresetInst = ['faciolnorros@gmail.com', 'bruce@fatama.com', 'beanna@fatama.com', 'norbe@fatama.com'].indexOf(cachedEmail) !== -1;
    if (requiredRole === 'instructor' && !isPresetInst) {
      if (document.body) document.body.style.display = 'none';
      window.location.replace('dashboard.html');
      return false;
    } else if (requiredRole === 'student' && (cachedRole === 'instructor' || isPresetInst)) {
      if (document.body) document.body.style.display = 'none';
      window.location.replace('instructor_dashboard.html');
      return false;
    }
  }
  return true;
}

let _cachedUser = null;
let _cachedUserTime = 0;
let _pendingUserPromise = null;

/**
 * Get current authenticated user details and profile
 * Uses local session first (0ms synchronous lookup) and short in-memory cache to prevent redundant HTTP roundtrips
 */
async function getCurrentUser(force = false) {
  const now = Date.now();
  if (!force && _cachedUser && (now - _cachedUserTime < 30000)) {
    return _cachedUser;
  }
  if (!force && _pendingUserPromise) {
    return _pendingUserPromise;
  }

  const client = getSupabaseClient();
  if (!client) {
    const fallbackId = sessionStorage.getItem('ffd_user_id') || localStorage.getItem('ffd_user_id');
    const fallbackEmail = sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email');
    return (fallbackId || fallbackEmail) ? { id: fallbackId, email: fallbackEmail } : null;
  }

  _pendingUserPromise = (async () => {
    try {
      // 1. Fast local session lookup from localStorage (0ms, no network latency)
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        _cachedUser = session.user;
        _cachedUserTime = Date.now();
        return _cachedUser;
      }
      // 2. Fallback to network getUser() call if session isn't in memory
      const { data: { user }, error } = await client.auth.getUser();
      if (!error && user) {
        _cachedUser = user;
        _cachedUserTime = Date.now();
        return user;
      }
      return null;
    } catch (err) {
      console.warn('[Supabase] getCurrentUser error:', err);
      return null;
    } finally {
      _pendingUserPromise = null;
    }
  })();

  return _pendingUserPromise;
}

/**
 * ITF Belt Rank Index Resolver (0: White Belt to 10: 1st Dan Black Belt)
 */
function resolveITFIndex(rankStr) {
  if (!rankStr) return 0;
  const s = String(rankStr).toLowerCase();
  if (s.includes('4th dan') || s.includes('4th-dan')) return 13;
  if (s.includes('3rd dan') || s.includes('3rd-dan')) return 12;
  if (s.includes('2nd dan') || s.includes('2nd-dan')) return 11;
  if ((s.includes('red') && (s.includes('black') || s.includes('choong-moo'))) || s.includes('1st-gup') || s.includes('1st keup') || s.includes('1st gup')) return 9;
  if (s.includes('1st dan') || s.includes('1st-dan') || s.includes('black') || s.includes('kwang-gae')) return 10;
  if ((s.includes('red') && !s.includes('blue')) || s.includes('2nd-gup') || s.includes('2nd keup') || s.includes('2nd gup') || s.includes('hwa-rang')) return 8;
  if ((s.includes('blue') && s.includes('red')) || s.includes('3rd-gup') || s.includes('3rd keup') || s.includes('3rd gup') || s.includes('toi-gye')) return 7;
  if ((s.includes('blue') && !s.includes('green')) || s.includes('4th-gup') || s.includes('4th keup') || s.includes('4th gup') || s.includes('joon-gun')) return 6;
  if ((s.includes('green') && s.includes('blue')) || s.includes('5th-gup') || s.includes('5th keup') || s.includes('5th gup') || s.includes('yul-gok')) return 5;
  if ((s.includes('green') && !s.includes('yellow')) || s.includes('6th-gup') || s.includes('6th keup') || s.includes('6th gup') || s.includes('won-hyu')) return 4;
  if ((s.includes('yellow') && s.includes('green')) || s.includes('7th-gup') || s.includes('7th keup') || s.includes('7th gup') || s.includes('do-san')) return 3;
  if ((s.includes('yellow') && !s.includes('white')) || s.includes('8th-gup') || s.includes('8th keup') || s.includes('8th gup') || s.includes('dan-gun')) return 2;
  if ((s.includes('white') && s.includes('yellow')) || s.includes('9th-gup') || s.includes('9th keup') || s.includes('9th gup') || s.includes('chon-ji')) return 1;
  return 0;
}

/**
 * Resolve consistent visual styling details for an ITF Taekwondo belt rank.
 * Matches the canonical pill appearance across landing page, dashboard, and settings.
 */
function getBeltVisualDetails(rankStr, isInstructor = false) {
  if (isInstructor) {
    return {
      key: 'black',
      beltName: 'Black Belt',
      keup: 'Dan Rank',
      colorName: 'Black & Gold',
      barClass: 'belt-bar--black-gold',
      accentColor: '#d4a017',
      bgTint: 'rgba(212, 160, 23, 0.16)',
      borderColor: 'rgba(212, 160, 23, 0.45)',
      textColor: '#f1c40f'
    };
  }

  const idx = resolveITFIndex(rankStr);
  const keupMatch = String(rankStr || '').match(/\((.*?)\)/);
  const keupFromStr = keupMatch ? `(${keupMatch[1]})` : '';

  const palette = [
    {
      key: 'white',
      beltName: 'White Belt',
      keup: '(10th-Gup)',
      colorName: 'White',
      barClass: 'belt-bar--white',
      accentColor: '#ffffff',
      bgTint: 'rgba(255, 255, 255, 0.12)',
      borderColor: 'rgba(255, 255, 255, 0.35)',
      textColor: '#f3f4f6'
    },
    {
      key: 'white-yellow',
      beltName: 'White Yellow Belt',
      keup: '(9th-Gup)',
      colorName: 'White & Yellow',
      barClass: 'belt-bar--white-yellow',
      accentColor: '#ffffff',
      bgTint: 'rgba(255, 255, 255, 0.12)',
      borderColor: 'rgba(255, 255, 255, 0.35)',
      textColor: '#f3f4f6'
    },
    {
      key: 'yellow',
      beltName: 'Yellow Belt',
      keup: '(8th-Gup)',
      colorName: 'Yellow',
      barClass: 'belt-bar--yellow',
      accentColor: '#f1c40f',
      bgTint: 'rgba(241, 196, 15, 0.16)',
      borderColor: 'rgba(241, 196, 15, 0.45)',
      textColor: '#fde047'
    },
    {
      key: 'yellow-green',
      beltName: 'Yellow Green Belt',
      keup: '(7th-Gup)',
      colorName: 'Yellow & Green',
      barClass: 'belt-bar--yellow-green',
      accentColor: '#f1c40f',
      bgTint: 'rgba(241, 196, 15, 0.16)',
      borderColor: 'rgba(241, 196, 15, 0.45)',
      textColor: '#fde047'
    },
    {
      key: 'green',
      beltName: 'Green Belt',
      keup: '(6th-Gup)',
      colorName: 'Green',
      barClass: 'belt-bar--green',
      accentColor: '#1e824c',
      bgTint: 'rgba(30, 130, 76, 0.18)',
      borderColor: 'rgba(46, 204, 113, 0.48)',
      textColor: '#4ade80'
    },
    {
      key: 'green-blue',
      beltName: 'Green Blue Belt',
      keup: '(5th-Gup)',
      colorName: 'Green & Blue',
      barClass: 'belt-bar--green-blue',
      accentColor: '#1e824c',
      bgTint: 'rgba(30, 130, 76, 0.18)',
      borderColor: 'rgba(46, 204, 113, 0.45)',
      textColor: '#4ade80'
    },
    {
      key: 'blue',
      beltName: 'Blue Belt',
      keup: '(4th-Gup)',
      colorName: 'Blue',
      barClass: 'belt-bar--blue',
      accentColor: '#0044cc',
      bgTint: 'rgba(0, 68, 204, 0.16)',
      borderColor: 'rgba(0, 68, 204, 0.45)',
      textColor: '#60a5fa'
    },
    {
      key: 'blue-red',
      beltName: 'Blue Red Belt',
      keup: '(3rd-Gup)',
      colorName: 'Blue & Red',
      barClass: 'belt-bar--blue-red',
      accentColor: '#0044cc',
      bgTint: 'rgba(0, 68, 204, 0.16)',
      borderColor: 'rgba(0, 68, 204, 0.45)',
      textColor: '#60a5fa'
    },
    {
      key: 'red',
      beltName: 'Red Belt',
      keup: '(2nd-Gup)',
      colorName: 'Red',
      barClass: 'belt-bar--red',
      accentColor: '#cc1111',
      bgTint: 'rgba(204, 17, 17, 0.16)',
      borderColor: 'rgba(204, 17, 17, 0.45)',
      textColor: '#ff6b6b'
    },
    {
      key: 'red-black',
      beltName: 'Red Black Belt',
      keup: '(1st-Gup)',
      colorName: 'Red & Black',
      barClass: 'belt-bar--red-black',
      accentColor: '#cc1111',
      bgTint: 'rgba(204, 17, 17, 0.16)',
      borderColor: 'rgba(204, 17, 17, 0.45)',
      textColor: '#ff6b6b'
    },
    {
      key: 'black',
      beltName: '1st Dan Black Belt',
      keup: '(1st-Dan)',
      colorName: 'Black',
      barClass: 'belt-bar--black-gold',
      accentColor: '#d4a017',
      bgTint: 'rgba(212, 160, 23, 0.16)',
      borderColor: 'rgba(212, 160, 23, 0.45)',
      textColor: '#f1c40f'
    }
  ];

  const base = palette[Math.min(idx, palette.length - 1)] || palette[0];
  return {
    ...base,
    keup: keupFromStr || base.keup
  };
}

/**
 * Fetch profile from public.profiles table, registrations, and Supabase auth user_metadata
 */
async function getProfile(userId = null) {
  const client = getSupabaseClient();
  if (!client) return null;

  let currentUser = null;
  try {
    currentUser = await getCurrentUser();
  } catch (e) { }

  const targetId = userId || currentUser?.id || sessionStorage.getItem('ffd_user_id') || localStorage.getItem('ffd_user_id');
  const targetEmail = currentUser?.email || sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email');

  let dbData = {};
  const isUuid = targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
  if (isUuid) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (!error && data) {
        dbData = data;
      }
    } catch (err) {
      console.warn('[Supabase] getProfile db error:', err);
    }
  }

  // If profile not found by UUID, try lookup by email in public.profiles
  if ((!dbData || !dbData.id) && targetEmail) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .ilike('email', targetEmail.trim())
        .maybeSingle();

      if (!error && data) {
        dbData = data;
      }
    } catch (err) {
      console.warn('[Supabase] getProfile email lookup error:', err);
    }
  }

  // Always query registrations table for authoritative enrollment & promoted rank
  const preResolvedName = dbData.full_name || currentUser?.user_metadata?.full_name || sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name') || '';
  let regData = {};
  if (targetId || targetEmail || preResolvedName) {
    try {
      let regList = [];

      // 1. Query by user_id if valid UUID
      if (client && isUuid) {
        try {
          const { data, error } = await client
            .from('registrations')
            .select('*')
            .eq('user_id', targetId)
            .order('created_at', { ascending: false })
            .limit(1);
          if (!error && data && data.length > 0) regList.push(...data);
        } catch (e) {}
      }

      // 2. Query by student_email
      if (client && regList.length === 0 && targetEmail) {
        try {
          const { data, error } = await client
            .from('registrations')
            .select('*')
            .ilike('student_email', targetEmail.trim())
            .order('created_at', { ascending: false })
            .limit(1);
          if (!error && data && data.length > 0) regList.push(...data);
        } catch (e) {}
      }

      // 3. Direct REST fetch fallback using publishable anon key
      if (regList.length === 0 && (targetEmail || isUuid)) {
        try {
          const filter = targetEmail 
            ? `student_email=ilike.${encodeURIComponent(targetEmail.trim())}` 
            : `user_id=eq.${targetId}`;
          const directResp = await fetch(`${SUPABASE_URL}/rest/v1/registrations?${filter}&order=created_at.desc&limit=1`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          if (directResp.ok) {
            const arr = await directResp.json();
            if (Array.isArray(arr) && arr.length > 0) regList.push(...arr);
          }
        } catch (e) {}
      }

      // 4. Query by student_name fallback
      if (client && regList.length === 0 && preResolvedName && preResolvedName !== 'Student' && preResolvedName !== 'Member') {
        try {
          const { data, error } = await client
            .from('registrations')
            .select('*')
            .ilike('student_name', preResolvedName.trim())
            .order('created_at', { ascending: false })
            .limit(1);
          if (!error && data && data.length > 0) regList.push(...data);
        } catch (e) {}
      }

      if (regList.length > 0) {
        const reg = regList[0];
        const parts = (reg.student_name || '').trim().split(' ');
        const regFirst = parts[0] || '';
        const regLast = parts.slice(1).join(' ') || '';
        regData = {
          first_name: regFirst,
          last_name: regLast,
          full_name: reg.student_name,
          phone: reg.student_phone,
          dob: reg.dob,
          gender: reg.gender,
          address: reg.address,
          proficiency: reg.proficiency,
          parent_name: reg.parent_name,
          relationship: reg.relationship,
          guardian_name: reg.parent_name,
          guardian_relation: reg.relationship,
          emergency_name: reg.emergency_name,
          emergency_phone: reg.emergency_phone || reg.parent_phone,
          medical_notes: reg.medical_notes,
          program_focus: reg.program_focus,
          training_goal: reg.program_focus
        };

        // Self-heal: If profile didn't exist in public.profiles, auto-insert it now!
        if (targetId && client && (!dbData || Object.keys(dbData).length === 0)) {
          try {
            await client.from('profiles').upsert({
              id: targetId,
              email: targetEmail || currentUser?.email || '',
              first_name: regFirst,
              last_name: regLast,
              full_name: reg.student_name,
              phone: reg.student_phone,
              dob: reg.dob,
              gender: reg.gender,
              address: reg.address,
              proficiency: reg.proficiency || 'White Belt (10th-Gup)',
              role: 'student'
            });
          } catch (autoErr) {
            console.warn('[Supabase] auto-upsert profile warning:', autoErr);
          }
        }
      }
    } catch (regErr) {
      console.warn('[Supabase] getProfile reg lookup warning:', regErr);
    }
  }

  const meta = currentUser?.user_metadata || {};
  const mergedFullName = dbData.full_name || regData.full_name || meta.full_name || sessionStorage.getItem('ffd_user_name') || '';
  let first = dbData.first_name || regData.first_name || meta.first_name || '';
  let last = dbData.last_name || regData.last_name || meta.last_name || '';
  if (!first && mergedFullName) {
    const parts = mergedFullName.split(' ');
    first = parts[0];
    last = parts.slice(1).join(' ');
  }

  const targetEmailLower = (targetEmail || currentUser?.email || '').toLowerCase();
  const presetInst = PRESET_INSTRUCTORS[targetEmailLower];

  // Self-heal: Proactively update instructor role in public.profiles if needed
  if (presetInst && targetId && dbData.role !== 'instructor') {
    try {
      await client.from('profiles').update({
        role: 'instructor'
      }).eq('id', targetId);
    } catch (instSyncErr) {
      console.warn('[Supabase] Auto-sync instructor in getProfile:', instSyncErr);
    }
  }

  const resolvedName = dbData.full_name || meta.full_name || sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name') || (presetInst ? presetInst.name : '') || mergedFullName || 'Member';
  const resolvedFirst = dbData.first_name || meta.first_name || first || (resolvedName ? resolvedName.split(' ')[0] : (presetInst ? presetInst.firstName : ''));
  const resolvedLast = dbData.last_name || meta.last_name || last || (resolvedName ? resolvedName.split(' ').slice(1).join(' ') : (presetInst ? presetInst.lastName : ''));

  // Calculate highest rank across database and promotions
  const resolvedProficiency = (() => {
    let candidateRanks = [];
    if (dbData.proficiency) candidateRanks.push(dbData.proficiency);
    if (dbData.belt_rank) candidateRanks.push(dbData.belt_rank);
    if (regData.proficiency) candidateRanks.push(regData.proficiency);
    const sessRank = sessionStorage.getItem('ffd_user_rank');
    if (sessRank) candidateRanks.push(sessRank);
    const locRank = localStorage.getItem('ffd_user_rank');
    if (locRank) candidateRanks.push(locRank);

    // Check promoMap
    try {
      const promoMap = JSON.parse(localStorage.getItem('ffd_student_promotions_map') || '{}');
      if (targetId && promoMap[targetId]) candidateRanks.push(promoMap[targetId]);
      if (targetEmail && promoMap[targetEmail.toLowerCase().trim()]) candidateRanks.push(promoMap[targetEmail.toLowerCase().trim()]);
      if (resolvedName && promoMap[resolvedName.toLowerCase().trim()]) candidateRanks.push(promoMap[resolvedName.toLowerCase().trim()]);
    } catch (e) {}

    try {
      const promoList = JSON.parse(localStorage.getItem('ffd_belt_promotions') || '[]');
      if (Array.isArray(promoList)) {
        promoList.forEach(p => {
          const matchesId = targetId && (p.student_id === targetId || p.user_id === targetId);
          const matchesEmail = targetEmail && p.student_email && p.student_email.toLowerCase() === targetEmail.toLowerCase();
          const matchesName = resolvedName && p.student_name && p.student_name.toLowerCase().trim() === resolvedName.toLowerCase().trim();
          if (matchesId || matchesEmail || matchesName) {
            if (p.proficiency) candidateRanks.push(p.proficiency);
            if (p.belt) candidateRanks.push(p.belt);
          }
        });
      }
    } catch (e) {}

    try {
      const sCache = JSON.parse(localStorage.getItem('ffd_all_students_cache') || localStorage.getItem('ffd_instructor_students') || '[]');
      if (Array.isArray(sCache)) {
        sCache.forEach(s => {
          const matchesId = targetId && (s.id === targetId || s.user_id === targetId);
          const matchesEmail = targetEmail && s.email && s.email.toLowerCase() === targetEmail.toLowerCase();
          const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
          const matchesName = resolvedName && sName && (sName === resolvedName.toLowerCase().trim() || resolvedName.toLowerCase().trim().includes(sName));
          if (matchesId || matchesEmail || matchesName) {
            if (s.proficiency) candidateRanks.push(s.proficiency);
            if (s.belt) candidateRanks.push(`${s.belt} Belt`);
          }
        });
      }
    } catch (e) {}

    let bestRank = presetInst ? presetInst.rank : 'White Belt (10th-Gup)';
    let bestIdx = 0;
    candidateRanks.forEach(r => {
      if (!r) return;
      const idx = resolveITFIndex(r);
      if (idx >= bestIdx) {
        bestIdx = idx;
        bestRank = r;
      }
    });

    // Standardize to official ITF Belt name
    if (!presetInst) {
      const itfLadder = [
        'White Belt (10th-Gup)',
        'White Yellow Belt (9th-Gup)',
        'Yellow Belt (8th-Gup)',
        'Yellow Green Belt (7th-Gup)',
        'Green Belt (6th-Gup)',
        'Green Blue Belt (5th-Gup)',
        'Blue Belt (4th-Gup)',
        'Blue Red Belt (3rd-Gup)',
        'Red Belt (2nd-Gup)',
        'Red Black Belt (1st-Gup)',
        '1st Dan Black Belt (1st-Dan)'
      ];
      if (itfLadder[bestIdx]) {
        bestRank = itfLadder[bestIdx];
      }
    }

    // Self-heal: If student has promoted rank from registrations/promotions, update profiles in Supabase
    if (client && targetId && isUuid && bestRank && !presetInst && bestRank !== dbData.proficiency) {
      client.from('profiles').update({
        proficiency: bestRank,
        belt_rank: bestRank,
        updated_at: new Date().toISOString()
      }).eq('id', targetId).then(() => {}).catch(() => {});
    }

    try {
      const activeEmail = (sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email') || '').toLowerCase();
      const activeId = sessionStorage.getItem('ffd_user_id') || localStorage.getItem('ffd_user_id');
      const activeName = (sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name') || '').toLowerCase().trim();
      if ((targetEmail && activeEmail && targetEmail.toLowerCase() === activeEmail) ||
          (targetId && activeId && targetId === activeId) ||
          (resolvedName && activeName && resolvedName.toLowerCase().trim() === activeName) ||
          !activeEmail) {
        sessionStorage.setItem('ffd_user_rank', bestRank);
        localStorage.setItem('ffd_user_rank', bestRank);
      }
    } catch (e) {}

    return bestRank;
  })();

  return {
    email: targetEmail || currentUser?.email || '',
    ...meta,
    ...regData,
    ...dbData,
    first_name: resolvedFirst,
    last_name: resolvedLast,
    full_name: resolvedName,
    phone: dbData.phone || regData.phone || meta.phone || '',
    dob: dbData.dob || regData.dob || meta.dob || '',
    gender: dbData.gender || regData.gender || meta.gender || '',
    address: dbData.address || regData.address || meta.address || '',
    guardian_name: dbData.guardian_name || regData.guardian_name || regData.emergency_name || meta.guardian_name || meta.parent_name || meta.emergency_name || '',
    guardian_relation: dbData.guardian_relation || regData.guardian_relation || meta.guardian_relation || meta.relationship || (regData.emergency_name || meta.emergency_name ? 'Emergency Contact' : ''),
    emergency_name: dbData.emergency_name || regData.emergency_name || meta.emergency_name || '',
    emergency_phone: dbData.emergency_phone || regData.emergency_phone || meta.emergency_phone || meta.parent_phone || '',
    weight_kg: dbData.weight_kg || meta.weight_kg || meta.weight || '',
    medical_notes: dbData.medical_notes || regData.medical_notes || meta.medical_notes || '',
    training_goal: dbData.training_goal || regData.training_goal || meta.training_goal || meta.program_focus || 'competition',
    training_batch: dbData.training_batch || meta.training_batch || 'mwf',
    avatar_url: dbData.avatar_url || meta.avatar_url || '',
    proficiency: resolvedProficiency,
    belt_rank: resolvedProficiency,
    role: dbData.role || (presetInst ? 'instructor' : (meta.role || sessionStorage.getItem('ffd_active_role') || 'student'))
  };
}

/**
 * Update user profile in public.profiles and auth user_metadata
 */
async function updateProfile(fields) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not loaded.');

  const user = await getCurrentUser();
  const userId = user?.id || sessionStorage.getItem('ffd_user_id');
  if (!userId) throw new Error('You must be logged in to update your profile.');

  for (const [key, val] of Object.entries(fields || {})) {
    if (key !== 'avatar_url' && typeof val === 'string' && hasInvisibleChars(val, { allowSpace: true })) {
      throw new Error(`Invalid input in ${key}: invisible, control, or unsupported whitespace characters are not allowed.`);
    }
  }

  // 1. Sync auth user_metadata first (guarantees data persistence even if Postgres schema differs)
  try {
    await client.auth.updateUser({
      data: fields
    });
  } catch (metaErr) {
    console.warn('[Supabase] updateUser metadata sync error:', metaErr);
  }

  // 2. Update public.profiles table
  let dbResult = null;
  try {
    const { data, error } = await client
      .from('profiles')
      .update({
        ...fields,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.warn('[Supabase] public.profiles update error (trying safe fallback):', error.message);
      // Fallback: If some columns don't exist in table yet, save standard columns only
      const safeFields = {
        first_name: fields.first_name,
        last_name: fields.last_name,
        full_name: fields.full_name,
        phone: fields.phone,
        dob: fields.dob,
        address: fields.address,
        gender: fields.gender,
        proficiency: fields.proficiency,
        belt_rank: fields.belt_rank,
        updated_at: new Date().toISOString()
      };
      // Remove undefined
      Object.keys(safeFields).forEach(k => safeFields[k] === undefined && delete safeFields[k]);
      await client.from('profiles').update(safeFields).eq('id', userId);
    } else {
      dbResult = data;
    }
  } catch (err) {
    console.warn('[Supabase] public.profiles update exception:', err);
  }

  // 3. Update session storage and local storage
  if (fields.full_name) {
    sessionStorage.setItem('ffd_user_name', fields.full_name);
    localStorage.setItem('ffd_user_name', fields.full_name);

    // Keep instructor profile cache in sync
    try {
      const instProf = JSON.parse(localStorage.getItem('ffd_instructor_profile') || '{}');
      instProf.fullName = fields.full_name;
      if (fields.phone) instProf.phone = fields.phone;
      localStorage.setItem('ffd_instructor_profile', JSON.stringify(instProf));
    } catch (e) {}

    // Keep user session cache in sync
    try {
      const sess = JSON.parse(localStorage.getItem('ffd_user_session') || '{}');
      sess.fullName = fields.full_name;
      localStorage.setItem('ffd_user_session', JSON.stringify(sess));
    } catch (e) {}

    // Proactively update Supabase Auth user metadata so future getCurrentUser() calls reflect the change
    try {
      await client.auth.updateUser({
        data: { full_name: fields.full_name }
      });
    } catch (metaErr) {
      console.warn('[Supabase] Auth metadata sync error:', metaErr);
    }
  }
  if (fields.role) {
    sessionStorage.setItem('ffd_active_role', fields.role);
    localStorage.setItem('ffd_active_role', fields.role);
  }
  if (fields.avatar_url !== undefined) {
    if (fields.avatar_url) {
      sessionStorage.setItem('ffd_user_avatar', fields.avatar_url);
      localStorage.setItem('ffd_user_avatar', fields.avatar_url);
    } else {
      sessionStorage.removeItem('ffd_user_avatar');
      localStorage.removeItem('ffd_user_avatar');
    }
  }

  return dbResult || fields;
}

/**
 * Change Supabase Account Password
 */
async function changePassword(newPassword) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not loaded.');

  const { data, error } = await client.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;

  const userEmail = data?.user?.email || sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email') || '';
  const userName = data?.user?.user_metadata?.full_name || sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name') || 'Member';
  if (userEmail) {
    sendPortalEmail('password_changed', { email: userEmail, fullName: userName }).catch(() => {});
  }

  return data;
}

/**
 * Send custom branded password reset email via Edge Function
 */
async function requestPasswordReset(email, redirectTo) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('Please enter your registered email address.');

  return await sendPortalEmail('send_password_reset', {
    email: cleanEmail,
    redirectTo
  }, true);
}

/**
 * Complete password reset during a Supabase PASSWORD_RECOVERY session
 */
async function completePasswordReset(newPassword) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not loaded.');

  const { data: sessionCheck } = await client.auth.getSession();
  if (!sessionCheck?.session) {
    throw new Error('Your password reset link has expired or is invalid. Please request a new reset link.');
  }

  const { data, error } = await client.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;

  const userEmail = data?.user?.email || sessionCheck.session.user?.email || '';
  const userName = data?.user?.user_metadata?.full_name || sessionCheck.session.user?.user_metadata?.full_name || 'Member';
  if (userEmail) {
    sendPortalEmail('password_changed', { email: userEmail, fullName: userName }).catch(() => {});
  }

  // Sign out recovery session so the user signs in cleanly with their new password
  try {
    await client.auth.signOut();
  } catch (e) {}
  clearStoragePreservingPersistentKeys(sessionStorage);
  clearStoragePreservingPersistentKeys(localStorage);

  return { user: data?.user || null, email: userEmail };
}

/**
 * ==============================================================================
 * ANNOUNCEMENTS API
 * ==============================================================================
 */

/**
 * Fetch all announcements sorted by pinned first, then newest
 */
async function getAnnouncements() {
  const getCachedAnnouncements = () => {
    try {
      const raw = localStorage.getItem('ffd_announcements') || localStorage.getItem('ffd_instructor_announcements');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  };

  const client = getSupabaseClient();
  if (!client) return getCachedAnnouncements();

  try {
    const { data, error } = await client
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] getAnnouncements query warning:', error.message);
      return getCachedAnnouncements();
    }

    if (data && Array.isArray(data)) {
      localStorage.setItem('ffd_announcements', JSON.stringify(data));
      localStorage.setItem('ffd_instructor_announcements', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] getAnnouncements error:', err);
  }

  return getCachedAnnouncements();
}

/**
 * Create and publish a new announcement (subject title and text body only)
 */
async function createAnnouncement({
  title,
  body,
  authorName = null,
  pinned = false
}) {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  const effectiveAuthor = (authorName || sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name') || 'Instructor').replace(/^Master\s+/i, '').trim();

  const record = {
    author_id: user?.id || null,
    author_name: effectiveAuthor,
    title: (title || '').trim(),
    body: (body || '').trim(),
    category: 'general',
    priority: 'standard',
    audience: 'All Trainees',
    event_date: null,
    venue: null,
    pinned: !!pinned,
    created_at: new Date().toISOString()
  };

  let insertedData = null;
  if (client) {
    try {
      const { data, error } = await client
        .from('announcements')
        .insert(record)
        .select()
        .single();

      if (!error && data) {
        insertedData = data;
      }
      if (error) console.warn('[Supabase] createAnnouncement DB insert warning:', error.message);
    } catch (err) {
      console.warn('[Supabase] createAnnouncement error:', err);
    }
  }

  // Update local caches immediately (both student and instructor keys)
  const localList = JSON.parse(localStorage.getItem('ffd_announcements') || localStorage.getItem('ffd_instructor_announcements') || '[]');
  const fallbackRecord = insertedData || { ...record, id: 'ANN-' + Date.now() };
  if (!insertedData) {
    localList.unshift(fallbackRecord);
  } else {
    const exists = localList.some(a => a.id === insertedData.id);
    if (!exists) localList.unshift(insertedData);
  }
  localStorage.setItem('ffd_announcements', JSON.stringify(localList));
  localStorage.setItem('ffd_instructor_announcements', JSON.stringify(localList));

  sendPortalEmail('announcement', {
    title: record.title,
    body: record.body,
    authorName: effectiveAuthor
  }).catch(() => {});

  return insertedData || fallbackRecord;
}

/**
 * Toggle pinned status for an announcement
 */
async function togglePinAnnouncement(id, currentPinned) {
  const client = getSupabaseClient();
  const newPinned = !currentPinned;

  if (client && typeof id === 'string' && id.includes('-') && !id.startsWith('ANN-')) {
    try {
      const { error } = await client
        .from('announcements')
        .update({ pinned: newPinned, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.warn('[Supabase] togglePinAnnouncement error:', error.message);
    } catch (err) {
      console.warn('[Supabase] togglePinAnnouncement err:', err);
    }
  }

  // Update local cache
  const localList = JSON.parse(localStorage.getItem('ffd_announcements') || localStorage.getItem('ffd_instructor_announcements') || '[]');
  const target = localList.find(a => a.id === id);
  if (target) {
    target.pinned = newPinned;
    localList.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    localStorage.setItem('ffd_announcements', JSON.stringify(localList));
    localStorage.setItem('ffd_instructor_announcements', JSON.stringify(localList));
  }
  return newPinned;
}

/**
 * Delete an announcement
 */
async function deleteAnnouncement(id) {
  const client = getSupabaseClient();
  if (client && typeof id === 'string' && id.includes('-') && !id.startsWith('ANN-')) {
    try {
      await client.from('announcements').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] deleteAnnouncement error:', err);
    }
  }

  // Remove from local storage
  let localList = JSON.parse(localStorage.getItem('ffd_announcements') || localStorage.getItem('ffd_instructor_announcements') || '[]');
  localList = localList.filter(a => a.id !== id);
  localStorage.setItem('ffd_announcements', JSON.stringify(localList));
  localStorage.setItem('ffd_instructor_announcements', JSON.stringify(localList));
  return true;
}

/**
 * ==============================================================================
 * LEARNING MATERIALS API
 * ==============================================================================
 */

/**
 * Fetch all learning materials sorted by pinned first, then newest
 */
async function getLearningMaterials() {
  const getCachedMaterials = () => {
    try {
      const raw = localStorage.getItem('ffd_learning_materials') || localStorage.getItem('ffd_instructor_learning_materials');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  };

  const client = getSupabaseClient();
  if (!client) return getCachedMaterials();

  try {
    const { data, error } = await client
      .from('learning_materials')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] getLearningMaterials query warning:', error.message);
      return getCachedMaterials();
    }

    if (data && Array.isArray(data)) {
      localStorage.setItem('ffd_learning_materials', JSON.stringify(data));
      localStorage.setItem('ffd_instructor_learning_materials', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] getLearningMaterials error:', err);
  }

  return getCachedMaterials();
}

/**
 * Upload an image file for a learning material.
 * Uploads to Supabase Storage bucket `learning-materials` and falls back to
 * Data URL for images <= 4MB when Storage is unavailable.
 */
async function uploadLearningMaterialFile(file) {
  if (!file) return null;

  const fileName = file.name || 'material-file';
  const mime = (file.type || '').toLowerCase();
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'bmp']);
  const docExts = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv']);
  const videoExts = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogg', 'ogv', 'avi', 'mkv']);

  const isImage = mime.startsWith('image/') || imageExts.has(ext);
  const isDocument = docExts.has(ext)
    || mime === 'application/pdf'
    || mime === 'application/msword'
    || mime.startsWith('application/vnd.openxmlformats-officedocument.')
    || mime === 'application/vnd.ms-excel'
    || mime === 'application/vnd.ms-powerpoint'
    || mime === 'text/plain'
    || mime === 'text/csv';
  const isVideo = mime.startsWith('video/') || videoExts.has(ext);

  if (isVideo) {
    throw new Error('Video uploads are disabled. Please paste a YouTube, Vimeo, or Google Drive link in Resource Link instead.');
  }

  if (!isImage && !isDocument) {
    throw new Error('Unsupported file format. Please upload an image (PNG, JPG, WEBP, GIF, SVG, AVIF) or document (PDF, DOC, DOCX, PPTX, XLSX, TXT, CSV).');
  }

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File is too large. Maximum size is 10MB.');
  }

  const mediaType = isImage ? 'image' : 'document';
  const client = getSupabaseClient();
  let lastStorageError = '';

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `materials/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const contentType = file.type || (ext === 'pdf' ? 'application/pdf' : (isImage ? 'image/png' : 'application/octet-stream'));
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/learning-materials/${objectPath}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/learning-materials/${objectPath}`;

  try {
    let authToken = SUPABASE_ANON_KEY;
    if (client) {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.access_token) authToken = session.access_token;
      } catch (e) {}
    }

    let uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': contentType,
        'cache-control': '31536000',
        'x-upsert': 'false'
      },
      body: file
    });

    // If user JWT is stale/rejected, retry once with anon key
    if (!uploadResp.ok && authToken !== SUPABASE_ANON_KEY && (uploadResp.status === 400 || uploadResp.status === 401 || uploadResp.status === 403)) {
      uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': contentType,
          'cache-control': '31536000',
          'x-upsert': 'false'
        },
        body: file
      });
    }

    if (uploadResp.ok) {
      return {
        url: publicUrl,
        mediaType,
        fileName
      };
    }

    const errText = await uploadResp.text();
    try {
      const errJson = JSON.parse(errText);
      lastStorageError = errJson.message || errJson.error || `HTTP ${uploadResp.status}`;
    } catch (e) {
      lastStorageError = errText || `HTTP ${uploadResp.status}`;
    }
    console.warn('[Supabase] Direct storage upload warning:', uploadResp.status, lastStorageError);
  } catch (storageErr) {
    lastStorageError = storageErr?.message || String(storageErr);
    console.warn('[Supabase] Storage upload exception:', storageErr);
  }

  // Fallback to inline Data URL for smaller files if Storage bucket isn't ready
  if ((isImage || isDocument) && file.size <= 4 * 1024 * 1024) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
    return {
      url: dataUrl,
      mediaType,
      fileName
    };
  }

  if (lastStorageError) {
    throw new Error(`Upload failed: ${lastStorageError}`);
  }
  throw new Error('Video upload requires the Supabase "learning-materials" Storage bucket. Please run the updated SQL in supabase_schema.sql.');
}

/**
 * Create and publish a new learning material
 */
async function createLearningMaterial({
  title,
  description,
  category = 'Forms & Poomsae',
  beltLevel = 'All Belts',
  materialType = 'Guide',
  resourceUrl = '',
  mediaUrl = '',
  mediaType = '',
  mediaName = '',
  authorName = null,
  pinned = false
}) {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  const effectiveAuthor = (authorName || sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name') || 'Instructor').replace(/^Master\s+/i, '').trim();

  const cleanUrl = (resourceUrl || '').trim();
  const cleanMediaUrl = (mediaUrl || '').trim();
  const record = {
    author_id: user?.id || null,
    author_name: effectiveAuthor,
    title: (title || '').trim(),
    description: (description || '').trim(),
    category: (category || 'Forms & Poomsae').trim(),
    belt_level: (beltLevel || 'All Belts').trim(),
    material_type: (materialType || 'Guide').trim(),
    resource_url: cleanUrl || null,
    media_url: cleanMediaUrl || null,
    media_type: (mediaType || '').trim() || null,
    media_name: (mediaName || '').trim() || null,
    pinned: !!pinned,
    created_at: new Date().toISOString()
  };

  let insertedData = null;
  if (client) {
    try {
      const { data, error } = await client
        .from('learning_materials')
        .insert(record)
        .select()
        .single();

      if (!error && data) {
        insertedData = data;
      }
      if (error) console.warn('[Supabase] createLearningMaterial DB insert warning:', error.message);
    } catch (err) {
      console.warn('[Supabase] createLearningMaterial error:', err);
    }
  }

  const localList = JSON.parse(localStorage.getItem('ffd_learning_materials') || localStorage.getItem('ffd_instructor_learning_materials') || '[]');
  const fallbackRecord = insertedData || { ...record, id: 'MAT-' + Date.now() };
  if (!insertedData) {
    localList.unshift(fallbackRecord);
  } else if (!localList.some(m => m.id === insertedData.id)) {
    localList.unshift(insertedData);
  }
  localStorage.setItem('ffd_learning_materials', JSON.stringify(localList));
  localStorage.setItem('ffd_instructor_learning_materials', JSON.stringify(localList));

  const finalRecord = insertedData || fallbackRecord;
  let portalUrl = '';
  try {
    if (typeof window !== 'undefined' && window.location) {
      const targetUrl = new URL('dashboard.html', window.location.href);
      if (finalRecord?.id) targetUrl.searchParams.set('material', finalRecord.id);
      targetUrl.hash = 'materials';
      portalUrl = targetUrl.href;
    }
  } catch (e) {}

  sendPortalEmail('learning_material', {
    materialId: finalRecord?.id || '',
    title: record.title,
    description: record.description,
    category: record.category,
    beltLevel: record.belt_level,
    resourceUrl: record.resource_url || '',
    mediaUrl: record.media_url || '',
    portalUrl,
    authorName: effectiveAuthor
  }).catch(() => {});

  return finalRecord;
}

/**
 * Toggle pinned status for a learning material
 */
async function togglePinLearningMaterial(id, currentPinned) {
  const client = getSupabaseClient();
  const newPinned = !currentPinned;

  if (client && typeof id === 'string' && id.includes('-') && !id.startsWith('MAT-')) {
    try {
      const { error } = await client
        .from('learning_materials')
        .update({ pinned: newPinned, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.warn('[Supabase] togglePinLearningMaterial error:', error.message);
    } catch (err) {
      console.warn('[Supabase] togglePinLearningMaterial err:', err);
    }
  }

  const localList = JSON.parse(localStorage.getItem('ffd_learning_materials') || localStorage.getItem('ffd_instructor_learning_materials') || '[]');
  const target = localList.find(m => m.id === id);
  if (target) {
    target.pinned = newPinned;
    localList.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    localStorage.setItem('ffd_learning_materials', JSON.stringify(localList));
    localStorage.setItem('ffd_instructor_learning_materials', JSON.stringify(localList));
  }
  return newPinned;
}

/**
 * Extract Supabase Storage bucket and object path from a storage URL
 */
function extractStorageBucketAndPath(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.startsWith('data:')) return null;
  const match = fileUrl.match(/\/storage\/v1\/object\/(?:public\/|authenticated\/|sign\/)?([^/]+)\/(.+?)(?:\?.*)?$/);
  if (!match) return null;
  return {
    bucket: decodeURIComponent(match[1]),
    objectPath: decodeURIComponent(match[2])
  };
}

/**
 * Delete a file from Supabase Storage by its public/object URL
 */
async function deleteLearningMaterialFile(fileUrl) {
  const parsed = extractStorageBucketAndPath(fileUrl);
  if (!parsed) return false;

  const { bucket, objectPath } = parsed;
  const client = getSupabaseClient();

  if (client?.storage) {
    try {
      const { data, error } = await client.storage.from(bucket).remove([objectPath]);
      if (!error && Array.isArray(data) && data.length > 0) return true;
      if (error) {
        console.warn('[Supabase] SDK storage remove warning:', error.message);
      } else {
        console.warn('[Supabase] SDK storage remove returned empty list (check storage DELETE policy / auth):', objectPath);
      }
    } catch (err) {
      console.warn('[Supabase] SDK storage remove error:', err);
    }
  }

  // Direct REST fallback (mirrors uploadLearningMaterialFile)
  try {
    let authToken = SUPABASE_ANON_KEY;
    if (client) {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.access_token) authToken = session.access_token;
      } catch (e) {}
    }

    const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;
    let resp = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!resp.ok && authToken !== SUPABASE_ANON_KEY && (resp.status === 400 || resp.status === 401 || resp.status === 403 || resp.status === 404)) {
      resp = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
    }

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      console.warn('[Supabase] Direct storage delete failed:', resp.status, errBody);
    }
    return resp.ok;
  } catch (err) {
    console.warn('[Supabase] deleteLearningMaterialFile error:', err);
    return false;
  }
}

/**
 * Delete a learning material (and its uploaded video/image in Supabase Storage)
 */
async function deleteLearningMaterial(id, mediaUrl = '') {
  const client = getSupabaseClient();
  let localList = JSON.parse(localStorage.getItem('ffd_learning_materials') || localStorage.getItem('ffd_instructor_learning_materials') || '[]');
  const localItem = localList.find(m => m.id === id);
  let targetMediaUrl = (mediaUrl || localItem?.media_url || '').trim();

  if (client && typeof id === 'string' && id.includes('-') && !id.startsWith('MAT-')) {
    try {
      if (!targetMediaUrl) {
        const { data: existing } = await client
          .from('learning_materials')
          .select('media_url')
          .eq('id', id)
          .maybeSingle();
        if (existing?.media_url) targetMediaUrl = existing.media_url;
      }
      await client.from('learning_materials').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] deleteLearningMaterial error:', err);
    }
  }

  if (targetMediaUrl) {
    await deleteLearningMaterialFile(targetMediaUrl);
  }

  localList = localList.filter(m => m.id !== id);
  localStorage.setItem('ffd_learning_materials', JSON.stringify(localList));
  localStorage.setItem('ffd_instructor_learning_materials', JSON.stringify(localList));
  return true;
}

/**
 * ==============================================================================
 * PAYMENTS & DUES API
 * ==============================================================================
 */

/**
 * Fetch all payments with optional status filter ('all', 'pending', 'confirmed')
 */
async function getPayments(filter = 'all') {
  const client = getSupabaseClient();
  let result = [];

  if (client) {
    try {
      let query = client.from('payments').select('*').order('created_at', { ascending: false });
      if (filter && filter !== 'all') {
        query = query.eq('status', filter);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        result = data;
        if (!filter || filter === 'all') {
          localStorage.setItem('ffd_payments', JSON.stringify(data));
          localStorage.setItem('ffd_instructor_payments', JSON.stringify(data));
        }
        return result;
      }
    } catch (err) {
      console.warn('[Supabase] getPayments error:', err);
    }
  }

  // Fallback to local storage cache
  result = JSON.parse(localStorage.getItem('ffd_payments') || '[]');
  if (filter && filter !== 'all') {
    result = result.filter(p => p.status === filter);
  }
  return result;
}

/**
 * Record a new payment or bill a student
 */
async function recordPayment({
  studentId = null,
  studentName,
  studentEmail = null,
  item,
  amount,
  channel = 'E-Wallet',
  refNumber = null,
  status = 'pending',
  proofUrl = null,
  notes = null
}) {
  const client = getSupabaseClient();
  const ref = refNumber || ('TXN-' + Math.floor(100000000 + Math.random() * 900000000));
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let resolvedStudentId = (typeof studentId === 'string' && uuidRegex.test(studentId.trim())) ? studentId.trim() : null;

  if (!resolvedStudentId && client) {
    try {
      const { data: { session } } = await client.auth.getSession();
      const authUser = session?.user;
      if (authUser?.id && (!studentEmail || (authUser.email || '').toLowerCase() === studentEmail.trim().toLowerCase())) {
        resolvedStudentId = authUser.id;
      }
    } catch (e) {}
  }

  const record = {
    student_id: resolvedStudentId,
    student_name: studentName,
    student_email: studentEmail,
    item,
    amount: parseFloat(amount) || 0,
    channel,
    ref_number: ref,
    status,
    proof_url: proofUrl,
    notes,
    created_at: new Date().toISOString()
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('payments')
        .insert(record)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
      if (error) console.warn('[Supabase] recordPayment insert warning:', error.message);
    } catch (err) {
      console.warn('[Supabase] recordPayment error:', err);
    }
  }

  // Fallback to local storage
  const localList = JSON.parse(localStorage.getItem('ffd_payments') || '[]');
  const fallbackRecord = { ...record, id: 'PAY-' + Date.now() };
  localList.unshift(fallbackRecord);
  localStorage.setItem('ffd_payments', JSON.stringify(localList));
  return fallbackRecord;
}

/**
 * Approve and confirm a payment
 */
async function confirmPayment(paymentId, notes = null) {
  const client = getSupabaseClient();
  const confirmedAt = new Date().toISOString();

  if (client && typeof paymentId === 'string' && paymentId.includes('-') && !paymentId.startsWith('PAY-')) {
    try {
      const payload = {
        status: 'confirmed',
        confirmed_at: confirmedAt
      };
      if (notes) payload.notes = notes;
      const { data, error } = await client
        .from('payments')
        .update(payload)
        .eq('id', paymentId)
        .select()
        .single();

      if (!error) return data;
    } catch (err) {
      console.warn('[Supabase] confirmPayment error:', err);
    }
  }

  // Local storage update
  const localList = JSON.parse(localStorage.getItem('ffd_payments') || '[]');
  const item = localList.find(p => p.id === paymentId);
  if (item) {
    item.status = 'confirmed';
    item.confirmed_at = confirmedAt;
    if (notes) item.notes = notes;
    localStorage.setItem('ffd_payments', JSON.stringify(localList));
    return item;
  }
  return null;
}

/**
 * Reject a payment submission
 */
async function rejectPayment(paymentId, reason = 'Verification rejected') {
  const client = getSupabaseClient();

  if (client && typeof paymentId === 'string' && paymentId.includes('-') && !paymentId.startsWith('PAY-')) {
    try {
      const { data, error } = await client
        .from('payments')
        .update({
          status: 'rejected',
          notes: reason
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (!error) return data;
    } catch (err) {
      console.warn('[Supabase] rejectPayment error:', err);
    }
  }

  // Local storage update
  const localList = JSON.parse(localStorage.getItem('ffd_payments') || '[]');
  const item = localList.find(p => p.id === paymentId);
  if (item) {
    item.status = 'rejected';
    item.notes = reason;
    localStorage.setItem('ffd_payments', JSON.stringify(localList));
    return item;
  }
  return null;
}

/**
 * Delete a payment record (e.g. when reverting session attendance from present to absent)
 */
async function deletePayment(paymentId) {
  const client = getSupabaseClient();
  if (client && typeof paymentId === 'string' && paymentId.includes('-') && !paymentId.startsWith('PAY-')) {
    try {
      await client.from('payments').delete().eq('id', paymentId);
    } catch (err) {
      console.warn('[Supabase] deletePayment error:', err);
    }
  }

  const localList = JSON.parse(localStorage.getItem('ffd_payments') || '[]');
  const filtered = localList.filter(p => p.id !== paymentId);
  localStorage.setItem('ffd_payments', JSON.stringify(filtered));
  return true;
}

/**
 * Fetch payments for a specific student (for Student Portal dashboard)
 */
async function getStudentPayments(studentId = null, studentEmail = null) {
  const client = getSupabaseClient();
  const targetId = studentId || sessionStorage.getItem('ffd_user_id') || localStorage.getItem('ffd_user_id');
  const targetEmail = (studentEmail || sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email') || '').toLowerCase().trim();
  const isUuid = targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

  if (client && (isUuid || targetEmail)) {
    try {
      let query = client.from('payments').select('*');
      if (isUuid) {
        query = query.eq('student_id', targetId);
      } else if (targetEmail) {
        query = query.ilike('student_email', targetEmail);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        localStorage.setItem('ffd_payments', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[Supabase] getStudentPayments error:', err);
    }
  }

  // Fallback to local storage (both student and instructor cache)
  const localList = JSON.parse(localStorage.getItem('ffd_payments') || localStorage.getItem('ffd_instructor_payments') || '[]');
  return localList.filter(p => {
    if (isUuid) {
      return p.student_id === targetId || p.studentId === targetId;
    }
    return targetEmail && (((p.student_email || '').toLowerCase() === targetEmail) || ((p.studentEmail || '').toLowerCase() === targetEmail));
  });
}

/**
 * Update a pending due with student's payment settlement details (ref number, channel)
 */
async function settleDuePayment({ paymentId, refNumber, channel = 'E-Wallet', notes = null }) {
  const client = getSupabaseClient();
  const updateData = {
    status: 'pending',
    channel,
    ref_number: refNumber,
    notes: notes || `Settlement submitted with Ref #${refNumber}`
  };

  if (client && typeof paymentId === 'string' && paymentId.includes('-') && !paymentId.startsWith('PAY-')) {
    try {
      const { data, error } = await client
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();
      if (!error) return data;
    } catch (e) {
      console.warn('[Supabase] settleDuePayment error:', e);
    }
  }

  // Update in local cache
  const localList = JSON.parse(localStorage.getItem('ffd_payments') || localStorage.getItem('ffd_instructor_payments') || '[]');
  const item = localList.find(p => p.id === paymentId);
  if (item) {
    Object.assign(item, updateData, { refNumber });
    localStorage.setItem('ffd_payments', JSON.stringify(localList));
    localStorage.setItem('ffd_instructor_payments', JSON.stringify(localList));
    return item;
  }
  return null;
}

/**
 * Record an in-person payment (settles an existing pending fee or creates a confirmed receipt)
 */
async function recordInPersonPayment({
  paymentId = null,
  studentId = null,
  studentName,
  studentEmail = null,
  item = 'Sunday Training Session Fee',
  amount = 200,
  channel = 'In-Person Cash',
  refNumber = null,
  notes = 'Paid in person to instructor',
  paymentDate = null
}) {
  const client = getSupabaseClient();
  const confirmedAt = paymentDate ? new Date(`${paymentDate}T12:00:00`).toISOString() : new Date().toISOString();
  const receiptRef = refNumber || ('CASH-' + Date.now().toString().slice(-6));

  if (paymentId) {
    const updatePayload = {
      status: 'confirmed',
      channel,
      confirmed_at: confirmedAt,
      notes: notes || 'Paid in person to instructor'
    };
    if (refNumber) updatePayload.ref_number = refNumber;

    if (client && typeof paymentId === 'string' && paymentId.includes('-') && !paymentId.startsWith('PAY-')) {
      try {
        const { data, error } = await client
          .from('payments')
          .update(updatePayload)
          .eq('id', paymentId)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('[Supabase] recordInPersonPayment update error:', err);
      }
    }

    const localList = JSON.parse(localStorage.getItem('ffd_payments') || localStorage.getItem('ffd_instructor_payments') || '[]');
    const existing = localList.find(p => p.id === paymentId);
    if (existing) {
      Object.assign(existing, updatePayload, { refNumber: updatePayload.ref_number || existing.refNumber || existing.ref_number });
      localStorage.setItem('ffd_payments', JSON.stringify(localList));
      localStorage.setItem('ffd_instructor_payments', JSON.stringify(localList));
      return existing;
    }
  }

  return recordPayment({
    studentId,
    studentName,
    studentEmail,
    item,
    amount,
    channel,
    refNumber: receiptRef,
    status: 'confirmed',
    notes
  });
}

/**
 * Upsert an attendance record for a student on a specific session date
 */
async function upsertAttendanceRecord({
  studentId = null,
  studentName = '',
  studentEmail = null,
  belt = '',
  sessionDate,
  status = 'present',
  remarks = ''
}) {
  if (!sessionDate) return null;
  const normalizedStatus = status === 'absent' ? 'absent' : 'present';
  const feeAmount = normalizedStatus === 'present' ? 200 : 0;

  // Always update local cache so instructor & same-browser views stay instant
  try {
    const localAtt = JSON.parse(localStorage.getItem('ffd_instructor_attendance') || '{}');
    if (!localAtt[sessionDate]) localAtt[sessionDate] = {};
    if (studentId) {
      localAtt[sessionDate][studentId] = {
        status: normalizedStatus,
        remarks: remarks || '',
        studentName,
        studentEmail: studentEmail || '',
        belt: belt || '',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('ffd_instructor_attendance', JSON.stringify(localAtt));
    }
  } catch (e) {}

  const client = getSupabaseClient();
  const isUuid = typeof studentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
  if (client && isUuid) {
    try {
      const { data, error } = await client
        .from('attendance_logs')
        .upsert({
          student_id: studentId,
          student_name: studentName || 'Trainee',
          student_email: studentEmail || null,
          belt_rank: belt || null,
          session_date: sessionDate,
          status: normalizedStatus,
          fee_amount: feeAmount,
          remarks: remarks || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,session_date' })
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[Supabase] upsertAttendanceRecord warning:', err);
    }
  }
  return { student_id: studentId, session_date: sessionDate, status: normalizedStatus, fee_amount: feeAmount, remarks };
}

/**
 * Fetch all attendance logs (Supabase first, localStorage fallback)
 */
async function getAttendanceRecords() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('attendance_logs')
        .select('*')
        .order('session_date', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn('[Supabase] getAttendanceRecords warning:', err);
    }
  }

  // Fallback to localStorage map
  const rows = [];
  try {
    const localAtt = JSON.parse(localStorage.getItem('ffd_instructor_attendance') || '{}');
    Object.entries(localAtt).forEach(([sessionDate, byStudent]) => {
      Object.entries(byStudent || {}).forEach(([studentId, rec]) => {
        rows.push({
          student_id: studentId,
          student_name: rec.studentName || '',
          student_email: rec.studentEmail || '',
          belt_rank: rec.belt || '',
          session_date: sessionDate,
          status: rec.status || 'present',
          fee_amount: (rec.status || 'present') === 'present' ? 200 : 0,
          remarks: rec.remarks || ''
        });
      });
    });
  } catch (e) {}
  return rows;
}

/**
 * Fetch attendance logs for a single student (Supabase + localStorage + session fee fallback)
 */
async function getStudentAttendanceRecords(studentId = null, studentEmail = null) {
  const targetId = studentId || null;
  const targetEmail = (studentEmail || '').trim().toLowerCase();
  const isUuid = typeof targetId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

  const client = getSupabaseClient();
  if (client && (isUuid || targetEmail)) {
    try {
      let query = client
        .from('attendance_logs')
        .select('*')
        .order('session_date', { ascending: false });
      if (isUuid && targetEmail) {
        query = query.or(`student_id.eq.${targetId},student_email.ilike.${targetEmail}`);
      } else if (isUuid) {
        query = query.eq('student_id', targetId);
      } else {
        query = query.ilike('student_email', targetEmail);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[Supabase] getStudentAttendanceRecords warning:', err);
    }
  }

  const allLocal = await getAttendanceRecords();
  return allLocal.filter(r => {
    if (isUuid && (r.student_id === targetId || r.studentId === targetId)) return true;
    if (targetEmail && (r.student_email || '').toLowerCase() === targetEmail) return true;
    return false;
  });
}

/**
 * ==============================================================================
 * ACHIEVEMENTS & BELT PROMOTION API
 * ==============================================================================
 */

/**
 * Fetch achievements (all or for a specific student)
 */
async function getAchievements(studentId = null) {
  const client = getSupabaseClient();
  let result = [];

  if (client) {
    try {
      let query = client.from('achievements').select('*').order('created_at', { ascending: false });
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        result = data;
        localStorage.setItem('ffd_achievements', JSON.stringify(data));
        return result;
      }
    } catch (err) {
      console.warn('[Supabase] getAchievements error:', err);
    }
  }

  result = JSON.parse(localStorage.getItem('ffd_achievements') || localStorage.getItem('ffd_instructor_awards') || '[]');
  if (studentId) {
    result = result.filter(a => a.student_id === studentId || a.studentId === studentId);
  }
  return result;
}

/**
 * Award a custom achievement freely typed by the instructor with custom emoji
 */
async function awardCustomAchievement({
  studentId,
  studentName,
  title,
  description,
  emoji = '🥋',
  category = 'custom',
  awardedByName = 'Master Bruce Stephen Norros Faciol',
  awardedDate = null
}) {
  const client = getSupabaseClient();
  const user = await getCurrentUser();

  const record = {
    student_id: studentId,
    student_name: studentName,
    title: title.trim(),
    description: (description || '').trim(),
    emoji: emoji.trim() || '🥋',
    category,
    awarded_by: user?.id || null,
    awarded_by_name: awardedByName,
    awarded_date: awardedDate || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('achievements')
        .insert(record)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
      if (error) console.warn('[Supabase] awardCustomAchievement insert warning:', error.message);
    } catch (err) {
      console.warn('[Supabase] awardCustomAchievement error:', err);
    }
  }

  // Fallback to local storage
  const localList = JSON.parse(localStorage.getItem('ffd_achievements') || '[]');
  const fallbackRecord = { ...record, id: 'AWD-' + Date.now() };
  localList.unshift(fallbackRecord);
  localStorage.setItem('ffd_achievements', JSON.stringify(localList));
  return fallbackRecord;
}

/**
 * Revoke/delete an achievement
 */
async function revokeAchievement(id) {
  const client = getSupabaseClient();
  if (client && typeof id === 'string' && id.includes('-') && !id.startsWith('AWD-')) {
    try {
      await client.from('achievements').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] revokeAchievement error:', err);
    }
  }

  // Update local storage
  let localList = JSON.parse(localStorage.getItem('ffd_achievements') || '[]');
  localList = localList.filter(a => a.id !== id);
  localStorage.setItem('ffd_achievements', JSON.stringify(localList));
  return true;
}

/**
 * Promote Student Belt Rank (Updates profile proficiency, registrations table & persistent sync)
 */
async function promoteStudentBelt({
  studentId,
  userId = null,
  studentName = '',
  studentEmail = '',
  newBelt,
  newKeup = '',
  examDate = null,
  presidingMaster = 'Master Bruce Stephen Norros Faciol',
  notes = ''
}) {
  const client = getSupabaseClient();
  const cleanBelt = (newBelt || '').replace(' Belt', '').trim();
  const proficiencyString = newKeup ? `${cleanBelt} (${newKeup})` : cleanBelt;
  const isStudentIdUuid = studentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
  const isUserIdUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  // 1. Update student's public.profiles table in Supabase
  if (client) {
    try {
      const updateData = {
        belt_rank: cleanBelt,
        proficiency: proficiencyString,
        updated_at: new Date().toISOString()
      };
      if (isStudentIdUuid) {
        const res = await client.from('profiles').update(updateData).eq('id', studentId);
        if (res.error) {
          await client.from('profiles').update({ proficiency: proficiencyString, updated_at: new Date().toISOString() }).eq('id', studentId);
        }
      }
      if (isUserIdUuid && userId !== studentId) {
        const res = await client.from('profiles').update(updateData).eq('id', userId);
        if (res.error) {
          await client.from('profiles').update({ proficiency: proficiencyString, updated_at: new Date().toISOString() }).eq('id', userId);
        }
      }
      if (studentEmail) {
        const res = await client.from('profiles').update(updateData).ilike('email', studentEmail.trim());
        if (res.error) {
          await client.from('profiles').update({ proficiency: proficiencyString, updated_at: new Date().toISOString() }).ilike('email', studentEmail.trim());
        }
      }
    } catch (profErr) {
      console.warn('[Supabase] promoteStudentBelt profile update error:', profErr);
    }

    // 2. Also update public.registrations table if record exists
    try {
      if (studentEmail) {
        await client
          .from('registrations')
          .update({ proficiency: proficiencyString })
          .ilike('student_email', studentEmail.trim());
      }
      if (isStudentIdUuid) {
        await client
          .from('registrations')
          .update({ proficiency: proficiencyString })
          .eq('id', studentId);
      }
      if (isUserIdUuid) {
        await client
          .from('registrations')
          .update({ proficiency: proficiencyString })
          .eq('user_id', userId);
      }
    } catch (regErr) {
      console.warn('[Supabase] promoteStudentBelt registrations update error:', regErr);
    }
  }

  // 3. Direct REST update using active user JWT as additional redundancy
  try {
    let authToken = null;
    if (client) {
      const { data: { session } } = await client.auth.getSession();
      authToken = session?.access_token || null;
    }
    if (studentEmail && authToken) {
      fetch(`${SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(studentEmail.trim())}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          belt_rank: cleanBelt,
          proficiency: proficiencyString,
          updated_at: new Date().toISOString()
        })
      }).catch(() => {});

      fetch(`${SUPABASE_URL}/rest/v1/registrations?student_email=ilike.${encodeURIComponent(studentEmail.trim())}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          proficiency: proficiencyString
        })
      }).catch(() => {});
    }
  } catch (e) { }

  // 4. Save belt promotion record to persistent ffd_belt_promotions store
  try {
    const promoList = JSON.parse(localStorage.getItem('ffd_belt_promotions') || '[]');
    const filteredPromos = promoList.filter(p => {
      if (studentId && (p.student_id === studentId || p.user_id === studentId)) return false;
      if (userId && (p.student_id === userId || p.user_id === userId)) return false;
      if (studentEmail && p.student_email && p.student_email.toLowerCase() === studentEmail.toLowerCase()) return false;
      return true;
    });

    filteredPromos.unshift({
      student_id: studentId,
      user_id: userId || null,
      student_name: studentName,
      student_email: studentEmail ? studentEmail.toLowerCase().trim() : '',
      belt: cleanBelt,
      keup: newKeup,
      proficiency: proficiencyString,
      date: examDate || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      presiding: presidingMaster,
      notes
    });
    localStorage.setItem('ffd_belt_promotions', JSON.stringify(filteredPromos));
  } catch (e) { }

  // 5. Update student in all local caches (ffd_all_students_cache, ffd_instructor_students, ffd_registered_students)
  ['ffd_all_students_cache', 'ffd_instructor_students', 'ffd_registered_students'].forEach(k => {
    try {
      const list = JSON.parse(localStorage.getItem(k) || '[]');
      let changed = false;
      if (Array.isArray(list)) {
        list.forEach(s => {
          const match = (studentId && (s.id === studentId || s.user_id === studentId)) ||
                        (userId && (s.id === userId || s.user_id === userId)) ||
                        (studentEmail && s.email && s.email.toLowerCase() === studentEmail.toLowerCase()) ||
                        (studentName && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === studentName.toLowerCase());
          if (match) {
            s.belt = cleanBelt;
            s.keup = newKeup;
            s.proficiency = proficiencyString;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(k, JSON.stringify(list));
        }
      }
    } catch (e) { }
  });

  // 6. Update student promotion records for instant cross-tab & student portal reflection
  try {
    localStorage.setItem('ffd_latest_promotion_rank', proficiencyString);
    localStorage.setItem('ffd_user_rank', proficiencyString);

    const promoMap = JSON.parse(localStorage.getItem('ffd_student_promotions_map') || '{}');
    if (studentId) promoMap[studentId] = proficiencyString;
    if (userId) promoMap[userId] = proficiencyString;
    if (studentEmail) promoMap[studentEmail.toLowerCase().trim()] = proficiencyString;
    if (studentName) promoMap[studentName.toLowerCase().trim()] = proficiencyString;
    localStorage.setItem('ffd_student_promotions_map', JSON.stringify(promoMap));

    const activeEmail = (sessionStorage.getItem('ffd_user_email') || localStorage.getItem('ffd_user_email') || '').toLowerCase().trim();
    const activeId = sessionStorage.getItem('ffd_user_id') || localStorage.getItem('ffd_user_id');
    const activeName = (sessionStorage.getItem('ffd_user_name') || localStorage.getItem('ffd_user_name') || '').toLowerCase().replace(/^master\s+/i, '').trim();
    const matchName = studentName && activeName && (studentName.toLowerCase().trim() === activeName || activeName.includes(studentName.toLowerCase().trim()));
    if ((studentEmail && activeEmail && studentEmail.toLowerCase() === activeEmail) ||
        (studentId && activeId && (studentId === activeId || userId === activeId)) ||
        matchName) {
      sessionStorage.setItem('ffd_user_rank', proficiencyString);
    }
  } catch (e) { }

  return { success: true, proficiency: proficiencyString, belt: cleanBelt, keup: newKeup };
}

/**
 * ==============================================================================
 * STUDENT ROSTER API
 * ==============================================================================
 */

/**
 * Helper to identify and purge any random placeholder/mock student records
 */
function isMockStudent(s) {
  if (!s) return true;
  const mockIds = ['STU-001', 'STU-002', 'STU-003', 'STU-004', 'STU-005'];
  const mockEmails = [
    'marcus.vance@gmail.com',
    'samantha.cruz@yahoo.com',
    'rafael.santos@gmail.com',
    'liam.garcia@gmail.com',
    'chloe.bautista@outlook.com',
    'test_probe_user_99@fatama.com'
  ];
  const mockNames = ['marcus vance', 'samantha cruz', 'rafael santos', 'liam garcia', 'chloe bautista', 'test probe'];
  const id = (s.id || '').trim();
  const email = (s.email || s.student_email || '').toLowerCase().trim();
  const name = (s.fullName || s.full_name || s.name || s.student_name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase().trim();
  if (mockIds.includes(id)) return true;
  if (mockEmails.includes(email)) return true;
  if (mockNames.includes(name)) return true;
  return false;
}

// Purge any stale mock student objects from localStorage
try {
  ['ffd_registered_students', 'ffd_all_students_cache', 'ffd_instructor_students'].forEach(k => {
    const raw = localStorage.getItem(k);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const cleaned = arr.filter(s => !isMockStudent(s));
        localStorage.setItem(k, JSON.stringify(cleaned));
      }
    }
  });
} catch (e) { }

function getCanonicalNameTokens(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join('|');
}

/**
 * Fetch all authentic students from public.profiles and registrations in Supabase.
 * Robust deduplication ensures each student appears only once even if they exist in
 * both profiles and registrations tables or local storage.
 */
async function getAllStudents() {
  const client = getSupabaseClient();
  const studentsList = [];
  const instructorEmails = new Set(['faciolnorros@gmail.com', 'bruce@fatama.com', 'beanna@fatama.com', 'norbe@fatama.com']);

  function addOrMergeStudent(s, mergeOnly = false) {
    if (!s || isMockStudent(s)) return;
    const email = (s.email || s.student_email || '').toLowerCase().trim();
    if (email && instructorEmails.has(email)) return; // Exclude instructors from student directory
    if (s.role === 'instructor') return; // Exclude instructors
    if (s.email_verified === false) return; // Exclude users waiting for email verification
    if (s.status === 'pending' && !s.user_id && !s.id) return; // Exclude unconfirmed pending registrations

    const rawName = s.fullName || s.full_name || s.name || s.student_name || `${s.first_name || s.firstName || ''} ${s.last_name || s.lastName || ''}`.trim() || 'Student';
    const nameTokens = getCanonicalNameTokens(rawName);

    const rawId = (s.id || '').trim();
    const isRealUuid = typeof rawId === 'string' && rawId.includes('-') && !rawId.startsWith('REG-') && !rawId.startsWith('STU-');
    const userId = (s.user_id || (isRealUuid ? rawId : '')).trim();

    // Check if matching student already exists in studentsList
    const existing = studentsList.find(ex => {
      // 1. Exact raw ID match
      if (rawId && ex.id === rawId) return true;
      // 2. User ID match (links registrations table with profiles auth UUID)
      if (userId && (ex.id === userId || ex.user_id === userId)) return true;
      if (ex.user_id && (rawId === ex.user_id || s.user_id === ex.user_id)) return true;
      // 3. Email match (user accounts are unique by email)
      if (email && ex.email && email === ex.email) return true;
      // 4. Normalized name match (tokens match and neither email conflicts)
      if (nameTokens && ex.nameTokens && nameTokens === ex.nameTokens) {
        if (!email || !ex.email || email === ex.email) return true;
      }
      return false;
    });

    // Parse first and last names smartly (honor separated first/last names first, fallback to parsing full name)
    let first = s.first_name || s.firstName || '';
    let last = s.last_name || s.lastName || '';
    if (!first && !last && rawName) {
      const parts = rawName.replace(/,/g, ' ').trim().split(/\s+/);
      if (parts.length > 1) {
        first = parts.slice(0, -1).join(' ');
        last = parts[parts.length - 1];
      } else {
        first = parts[0] || 'Student';
        last = '';
      }
    }

    if (existing) {
      // Merge: Keep official profile names & UUIDs over registration strings
      if (s.first_name && s.last_name) {
        existing.firstName = s.first_name;
        existing.lastName = s.last_name;
      }
      if (isRealUuid && (!existing.id || existing.id.startsWith('REG-') || existing.id.startsWith('STU-'))) {
        existing.id = rawId;
      }
      if (userId) existing.user_id = userId;
      if (!existing.email && email) existing.email = email;
      if (!existing.phone && (s.phone || s.student_phone)) existing.phone = s.phone || s.student_phone;
      if ((!existing.guardianName || existing.guardianName === 'Guardian') && (s.guardian_name || s.guardianName || s.emergency_name || s.emergencyName || s.parent_name)) {
        existing.guardianName = s.guardian_name || s.guardianName || s.emergency_name || s.emergencyName || s.parent_name;
      }
      if ((!existing.emergencyName || existing.emergencyName === 'Guardian') && (s.emergency_name || s.emergencyName || s.guardian_name || s.guardianName || s.parent_name)) {
        existing.emergencyName = s.emergency_name || s.emergencyName || s.guardian_name || s.guardianName || s.parent_name;
      }
      if (!existing.guardianPhone && (s.emergency_phone || s.emergencyPhone || s.guardian_phone || s.guardianPhone || s.parent_phone)) {
        existing.guardianPhone = s.emergency_phone || s.emergencyPhone || s.guardian_phone || s.guardianPhone || s.parent_phone;
      }
      if (!existing.emergencyPhone && (s.emergency_phone || s.emergencyPhone || s.guardian_phone || s.guardianPhone || s.parent_phone)) {
        existing.emergencyPhone = s.emergency_phone || s.emergencyPhone || s.guardian_phone || s.guardianPhone || s.parent_phone;
      }
      if ((!existing.guardianRelation || existing.guardianRelation === 'Parent') && (s.guardian_relation || s.guardianRelation || s.relationship)) {
        existing.guardianRelation = s.guardian_relation || s.guardianRelation || s.relationship;
      }
      if ((!existing.address || existing.address === 'Metro Manila') && s.address) {
        existing.address = s.address;
      }
      if (!existing.bloodType && (s.blood_type || s.bloodType)) {
        existing.bloodType = s.blood_type || s.bloodType;
      }
      if (!existing.medicalNotes && (s.medical_notes || s.medicalNotes)) {
        existing.medicalNotes = s.medical_notes || s.medicalNotes;
      }
      if (!existing.gender && s.gender) {
        existing.gender = s.gender;
      }
      if (!existing.birthDate && (s.dob || s.birthDate || s.birth_date)) {
        existing.birthDate = s.dob || s.birthDate || s.birth_date;
        existing.dob = existing.birthDate;
      }
      if (s.weight_kg && !existing.weight) existing.weight = s.weight_kg;
      if (s.weight_class && !existing.weightClass) existing.weightClass = s.weight_class;
      const candRank = s.proficiency || s.belt_rank || s.belt;
      if (candRank && !candRank.toLowerCase().includes('beginner')) {
        const curIdx = resolveITFIndex(existing.belt || existing.proficiency);
        const newIdx = resolveITFIndex(candRank);
        if (newIdx >= curIdx) {
          const ladder = [
            'White Belt (10th-Gup)',
            'White Yellow Belt (9th-Gup)',
            'Yellow Belt (8th-Gup)',
            'Yellow Green Belt (7th-Gup)',
            'Green Belt (6th-Gup)',
            'Green Blue Belt (5th-Gup)',
            'Blue Belt (4th-Gup)',
            'Blue Red Belt (3rd-Gup)',
            'Red Belt (2nd-Gup)',
            'Red Black Belt (1st-Gup)',
            '1st Dan Black Belt (1st-Dan)'
          ];
          const stdRank = ladder[newIdx] || candRank;
          const cleanB = stdRank.replace(' Belt', '').split(' (')[0].trim();
          const kMatch = stdRank.match(/\((.*?)\)/);
          existing.belt = cleanB;
          existing.keup = kMatch ? kMatch[1] : `${cleanB} Belt`;
          existing.proficiency = stdRank;
        }
      }
      return;
    }

    if (mergeOnly) return;

    // Standardize belt name and keup
    const rawRank = (s.belt_rank || s.proficiency || s.belt || 'White Belt (10th-Gup)').toLowerCase();
    let belt = 'White';
    let keup = '10th-Gup';
    if (rawRank.includes('black') || rawRank.includes('1st-dan') || rawRank.includes('dan')) {
      belt = 'Black'; keup = '1st-Dan';
    } else if (rawRank.includes('red-black') || (rawRank.includes('red') && rawRank.includes('black')) || rawRank.includes('1st-gup')) {
      belt = 'Red-Black'; keup = '1st-Gup';
    } else if (rawRank.includes('red') && !rawRank.includes('blue')) {
      belt = 'Red'; keup = '2nd-Gup';
    } else if (rawRank.includes('blue-red') || (rawRank.includes('blue') && rawRank.includes('red')) || rawRank.includes('3rd-gup')) {
      belt = 'Blue-Red'; keup = '3rd-Gup';
    } else if (rawRank.includes('blue') && !rawRank.includes('green')) {
      belt = 'Blue'; keup = '4th-Gup';
    } else if (rawRank.includes('green-blue') || (rawRank.includes('green') && rawRank.includes('blue')) || rawRank.includes('5th-gup')) {
      belt = 'Green-Blue'; keup = '5th-Gup';
    } else if (rawRank.includes('green') && !rawRank.includes('yellow')) {
      belt = 'Green'; keup = '6th-Gup';
    } else if (rawRank.includes('yellow-green') || (rawRank.includes('yellow') && rawRank.includes('green')) || rawRank.includes('7th-gup')) {
      belt = 'Yellow-Green'; keup = '7th-Gup';
    } else if (rawRank.includes('yellow') && !rawRank.includes('white')) {
      belt = 'Yellow'; keup = '8th-Gup';
    } else if (rawRank.includes('white-yellow') || (rawRank.includes('white') && rawRank.includes('yellow')) || rawRank.includes('9th-gup')) {
      belt = 'White-Yellow'; keup = '9th-Gup';
    } else {
      belt = 'White'; keup = '10th-Gup';
    }

    // Dynamic Age calculation from Date of Birth
    let age = 18;
    const dob = s.dob || s.birth_date || s.birthDate || '';
    if (dob) {
      const bd = new Date(dob);
      if (!isNaN(bd.getTime())) {
        const now = new Date();
        age = now.getFullYear() - bd.getFullYear();
        const m = now.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
      }
    } else if (s.age) {
      age = parseInt(s.age, 10) || 18;
    }

    const weightKg = s.weight_kg || s.weight || 58;
    let weightClass = s.weightClass || s.weight_class;
    if (!weightClass) {
      if (weightKg < 54) weightClass = 'Flyweight';
      else if (weightKg < 58) weightClass = 'Featherweight';
      else if (weightKg < 63) weightClass = 'Bantamweight';
      else if (weightKg < 70) weightClass = 'Welterweight';
      else if (weightKg < 80) weightClass = 'Middleweight';
      else weightClass = 'Heavyweight';
    }

    const guardianName = s.guardian_name || s.guardianName || s.emergency_name || s.emergencyName || s.parent_name || '';
    const emergencyName = s.emergency_name || s.emergencyName || guardianName;
    const guardianPhone = s.emergency_phone || s.emergencyPhone || s.guardian_phone || s.guardianPhone || s.parent_phone || '';
    const guardianRelation = s.guardian_relation || s.guardianRelation || s.relationship || '';
    const rawAddress = (s.address && s.address !== 'Metro Manila') ? s.address : '';

    const duesBalance = s.duesBalance !== undefined ? parseFloat(s.duesBalance) : 0;
    const duesStatus = s.duesStatus || (duesBalance > 0 ? `Due: ₱${duesBalance.toLocaleString()}` : 'Cleared');

    const canonicalId = userId || rawId || (email ? 'STU-' + email : 'STU-' + Math.random().toString(36).substring(2, 8));

    studentsList.push({
      id: canonicalId,
      user_id: userId,
      nameTokens: nameTokens,
      firstName: formatProperName(first || 'Student'),
      lastName: formatProperName(last || ''),
      belt: belt,
      keup: keup,
      batch: s.training_batch || s.batch || '',
      age: age,
      birthDate: dob,
      dob: dob,
      gender: s.gender || '',
      weight: weightKg,
      weightClass: weightClass,
      email: email,
      phone: s.phone || s.student_phone || '',
      address: rawAddress,
      guardianName: guardianName || 'Guardian',
      emergencyName: emergencyName || '',
      guardianPhone: guardianPhone,
      emergencyPhone: guardianPhone,
      guardianRelation: guardianRelation || 'Parent',
      bloodType: s.blood_type || s.bloodType || '',
      medicalNotes: s.medical_notes || s.medicalNotes || '',
      emergencyContact: s.emergencyContact || `${guardianName || 'Guardian'} (${guardianPhone || 'N/A'})`,
      joinedDate: s.joinedDate || (s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : '2026-10-23'),
      created_at: s.created_at || new Date().toISOString(),
      sparringRecord: s.sparringRecord || 'Novice (0W - 0L - 0D)',
      attendanceRate: s.attendanceRate !== undefined ? s.attendanceRate : 100,
      attendanceHrs: s.attendanceHrs !== undefined ? s.attendanceHrs : 0,
      duesBalance: duesBalance,
      duesStatus: duesStatus,
      achievements: Array.isArray(s.achievements) ? s.achievements : []
    });
  }

  let profilesFetchSucceeded = false;
  let restAuthToken = null;
  try {
    const client = getSupabaseClient();
    if (client) {
      const { data: { session } } = await client.auth.getSession();
      restAuthToken = session?.access_token || null;
    }
  } catch (e) {}

  // 1. Direct fetch from Supabase REST endpoint using active user JWT (Profiles first)
  try {
    if (restAuthToken) {
      const directResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${restAuthToken}`
        }
      });
      if (directResp.ok) {
        const directProfiles = await directResp.json();
        if (Array.isArray(directProfiles)) {
          profilesFetchSucceeded = true;
          directProfiles.forEach(p => {
            if (p.role === 'instructor') return;
            if (p.email_verified === false) return;
            addOrMergeStudent(p);
          });
        }
      }
    }
  } catch (directErr) {
    console.warn('[Supabase] Direct REST profiles fetch error:', directErr);
  }

  // Direct fetch registrations (fills missing details; only creates standalone entries if profiles fetch failed)
  try {
    if (restAuthToken) {
      const regResp = await fetch(`${SUPABASE_URL}/rest/v1/registrations?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${restAuthToken}`
        }
      });
      if (regResp.ok) {
        const directRegs = await regResp.json();
        if (Array.isArray(directRegs)) {
          directRegs.forEach(r => addOrMergeStudent(r, profilesFetchSucceeded));
        }
      }
    }
  } catch (regDirectErr) {
    console.warn('[Supabase] Direct REST registrations fetch error:', regDirectErr);
  }

  // 2. SDK fetch fallback if initialized
  if (client) {
    try {
      const { data: profiles, error: pErr } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pErr && Array.isArray(profiles)) {
        profilesFetchSucceeded = true;
        profiles.forEach(p => {
          if (p.role === 'instructor') return;
          if (p.email_verified === false) return;
          addOrMergeStudent(p);
        });
      }
    } catch (err) {
      console.warn('[Supabase] profiles fetch in getAllStudents:', err);
    }

    try {
      const { data: regs, error: rErr } = await client
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!rErr && regs && regs.length > 0) {
        regs.forEach(r => addOrMergeStudent(r, profilesFetchSucceeded));
      }
    } catch (regErr) {
      console.warn('[Supabase] registrations fetch in getAllStudents:', regErr);
    }
  }

  // 3. Merge authentic locally registered students if any (and prune deleted users when profiles synced)
  try {
    const registered = JSON.parse(localStorage.getItem('ffd_registered_students') || '[]');
    if (Array.isArray(registered)) {
      registered.forEach(s => {
        if (!isMockStudent(s)) addOrMergeStudent(s, profilesFetchSucceeded);
      });
      if (profilesFetchSucceeded) {
        const activeIds = new Set(studentsList.map(st => st.id).filter(Boolean));
        const activeEmails = new Set(studentsList.map(st => (st.email || '').toLowerCase()).filter(Boolean));
        const prunedRegistered = registered.filter(s => {
          const sId = (s.user_id || s.id || '').trim();
          const sEmail = (s.email || s.student_email || '').toLowerCase().trim();
          return (sId && activeIds.has(sId)) || (sEmail && activeEmails.has(sEmail));
        });
        localStorage.setItem('ffd_registered_students', JSON.stringify(prunedRegistered));
      }
    }
  } catch (e) { }

  // 4. Overlay persistent belt promotions (only matching same user UUID, never stale deleted-user promotions)
  try {
    const promoList = JSON.parse(localStorage.getItem('ffd_belt_promotions') || '[]');
    if (Array.isArray(promoList) && promoList.length > 0) {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const activePromos = [];
      promoList.forEach(p => {
        const promoUuid = [p.student_id, p.user_id].find(v => typeof v === 'string' && uuidRe.test(v));
        const match = studentsList.find(st => {
          if (promoUuid) {
            return st.id === promoUuid || st.user_id === promoUuid;
          }
          if (p.student_id && (st.id === p.student_id || st.user_id === p.student_id)) return true;
          if (p.user_id && (st.id === p.user_id || st.user_id === p.user_id)) return true;
          if (p.student_email && st.email && p.student_email.toLowerCase() === st.email.toLowerCase()) return true;
          if (p.student_name && `${st.firstName || ''} ${st.lastName || ''}`.trim().toLowerCase() === p.student_name.toLowerCase()) return true;
          return false;
        });
        if (match) {
          activePromos.push(p);
          const cleanB = (p.belt || '').replace(' Belt', '').trim();
          match.belt = cleanB;
          match.keup = p.keup || `${cleanB} Belt`;
          match.proficiency = p.proficiency || `${cleanB} (${match.keup})`;
        } else if (!profilesFetchSucceeded || !promoUuid) {
          activePromos.push(p);
        }
      });
      if (profilesFetchSucceeded && activePromos.length !== promoList.length) {
        localStorage.setItem('ffd_belt_promotions', JSON.stringify(activePromos));
      }
    }
  } catch (e) { }

  try {
    if (profilesFetchSucceeded || studentsList.length > 0) {
      localStorage.setItem('ffd_all_students_cache', JSON.stringify(studentsList));
      localStorage.setItem('ffd_instructor_students', JSON.stringify(studentsList));
    }
  } catch (e) { }

  return studentsList;
}

// Global exports
function formatProperName(str) {
  return String(str || '')
    .trim()
    .replace(/\S+/g, word => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase());
}

async function verifyInstructorSession() {
  const client = getSupabaseClient();
  if (!client) return { ok: false, reason: 'no_client' };
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return { ok: false, reason: 'unauthenticated' };
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role === 'instructor') {
      return { ok: true, user };
    }
    return { ok: false, reason: 'not_instructor', role: profile?.role || 'student' };
  } catch (e) {
    return { ok: false, reason: 'error' };
  }
}

window.FFD_SUPABASE = {
  getClient: getSupabaseClient,
  signInUser,
  sendPortalEmail,
  verifyLogin2FACode,
  completeSignInAfter2FA,
  registerUser,
  initiateRegistration,
  verifyEmailOtp,
  resendConfirmationEmail,
  finalizeAccountCreation,
  // Form Field Validators
  hasInvisibleChars,
  stripInvisibleChars,
  attachNoInvisibleFilter,
  validateEmailProvider,
  validatePhilippinePhone,
  validateBirthday,
  signOutUser,
  clearStoragePreservingPersistentKeys,
  enforceAuth,
  getCurrentUser,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  completePasswordReset,
  // Session & Device Persistence
  syncStoredSession,
  saveUserSession,
  getStoredUserSession,
  getActiveSessionAsync,
  verifyInstructorSession,
  formatProperName,
  // Announcements
  getAnnouncements,
  createAnnouncement,
  togglePinAnnouncement,
  deleteAnnouncement,
  // Learning Materials
  getLearningMaterials,
  uploadLearningMaterialFile,
  createLearningMaterial,
  togglePinLearningMaterial,
  deleteLearningMaterial,
  // Payments & Attendance
  getPayments,
  recordPayment,
  recordInPersonPayment,
  settleDuePayment,
  confirmPayment,
  rejectPayment,
  deletePayment,
  getStudentPayments,
  upsertAttendanceRecord,
  getAttendanceRecords,
  getStudentAttendanceRecords,
  // Achievements & Belt Promotion
  getAchievements,
  awardCustomAchievement,
  revokeAchievement,
  promoteStudentBelt,
  resolveITFIndex,
  getBeltVisualDetails,
  // Student Roster
  getAllStudents
};

/**
 * Shared Custom Red Video Player (No side letterbox bars, site red accent)
 */
(function initFfdMediaHelper() {
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getExternalVideoEmbedUrl(rawUrl) {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) return '';
    let parsed;
    try {
      parsed = new URL(trimmed);
    } catch (e) {
      return '';
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    // YouTube (watch, shorts, live, embed, youtu.be)
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be') {
      let videoId = '';
      if (host === 'youtu.be') {
        videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
      } else if (parsed.pathname.startsWith('/watch')) {
        videoId = parsed.searchParams.get('v') || '';
      } else {
        const match = parsed.pathname.match(/^\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{6,20})/);
        if (match) videoId = match[1];
      }
      if (/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
      }
    }

    // Vimeo
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const match = parsed.pathname.match(/\/(?:video\/)?(\d{5,15})(?:$|\/)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }

    // Google Drive file links
    if (host === 'drive.google.com') {
      const pathMatch = parsed.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]{10,100})/);
      const fileId = (pathMatch && pathMatch[1]) || parsed.searchParams.get('id') || '';
      if (/^[a-zA-Z0-9_-]{10,100}$/.test(fileId)) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    return '';
  }

  function renderExternalVideoEmbedHtml(rawUrl) {
    const embedUrl = getExternalVideoEmbedUrl(rawUrl);
    if (!embedUrl) return '';
    const safeEmbed = escapeAttr(embedUrl);
    return `
      <div class="ffd-media-frame">
        <div class="ffd-video-player ffd-video-embed" style="width:100%;aspect-ratio:16/9;">
          <iframe src="${safeEmbed}" title="Learning material video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen style="width:100%;height:100%;border:0;display:block;"></iframe>
        </div>
      </div>
    `;
  }

  function renderVideoPlayerHtml(src) {
    const safeSrc = escapeAttr(src);
    return `
      <div class="ffd-media-frame">
        <div class="ffd-video-player" data-ffd-player="1">
          <video preload="none" playsinline src="${safeSrc}"></video>
          <div class="ffd-video-controls">
            <button type="button" class="ffd-vc-btn ffd-vc-play" aria-label="Play video" title="Play / Pause">
              <svg class="ffd-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
              <svg class="ffd-icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <input type="range" class="ffd-vc-seek" min="0" max="100" step="0.1" value="0" aria-label="Seek video">
            <span class="ffd-vc-time">0:00 / 0:00</span>
            <button type="button" class="ffd-vc-btn ffd-vc-mute" aria-label="Mute / Unmute" title="Mute / Unmute">
              <svg class="ffd-icon-vol" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <svg class="ffd-icon-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            </button>
            <input type="range" class="ffd-vc-vol" min="0" max="1" step="0.05" value="1" aria-label="Volume">
            <button type="button" class="ffd-vc-btn ffd-vc-fs" aria-label="Fullscreen" title="Fullscreen">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function initVideoPlayers(root) {
    const scope = root || document;
    scope.querySelectorAll('.ffd-video-player[data-ffd-player="1"]').forEach(player => {
      if (player.dataset.ffdBound === '1') return;
      player.dataset.ffdBound = '1';

      const video = player.querySelector('video');
      const playBtn = player.querySelector('.ffd-vc-play');
      const iconPlay = player.querySelector('.ffd-icon-play');
      const iconPause = player.querySelector('.ffd-icon-pause');
      const seek = player.querySelector('.ffd-vc-seek');
      const timeEl = player.querySelector('.ffd-vc-time');
      const muteBtn = player.querySelector('.ffd-vc-mute');
      const iconVol = player.querySelector('.ffd-icon-vol');
      const iconMuted = player.querySelector('.ffd-icon-muted');
      const vol = player.querySelector('.ffd-vc-vol');
      const fsBtn = player.querySelector('.ffd-vc-fs');

      if (!video) return;

      let hideControlsTimer = null;
      const showControls = (autoHide = true) => {
        player.classList.remove('ffd-controls-hidden');
        if (hideControlsTimer) {
          clearTimeout(hideControlsTimer);
          hideControlsTimer = null;
        }
        if (autoHide && !video.paused && !video.ended) {
          hideControlsTimer = setTimeout(() => {
            if (!video.paused && !video.ended) {
              player.classList.add('ffd-controls-hidden');
            }
          }, 2500);
        }
      };

      const syncPlayIcons = () => {
        const paused = video.paused || video.ended;
        if (iconPlay) iconPlay.style.display = paused ? '' : 'none';
        if (iconPause) iconPause.style.display = paused ? 'none' : '';
        showControls(!paused);
      };

      const syncTimeAndSeek = () => {
        const dur = video.duration || 0;
        const cur = video.currentTime || 0;
        const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
        if (seek) {
          seek.value = pct;
          seek.style.setProperty('--seek-pct', `${pct}%`);
        }
        if (timeEl) {
          timeEl.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
        }
      };

      const togglePlay = () => {
        if (video.paused || video.ended) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      };

      video.addEventListener('click', togglePlay);
      if (playBtn) playBtn.addEventListener('click', togglePlay);
      video.addEventListener('play', syncPlayIcons);
      video.addEventListener('pause', syncPlayIcons);
      video.addEventListener('ended', syncPlayIcons);
      video.addEventListener('loadedmetadata', syncTimeAndSeek);
      video.addEventListener('timeupdate', syncTimeAndSeek);

      if (seek) {
        seek.addEventListener('input', () => {
          const dur = video.duration || 0;
          if (dur > 0) {
            video.currentTime = (parseFloat(seek.value) / 100) * dur;
          }
          seek.style.setProperty('--seek-pct', `${seek.value}%`);
        });
      }

      const syncMuteIcons = () => {
        const muted = video.muted || video.volume === 0;
        if (iconVol) iconVol.style.display = muted ? 'none' : '';
        if (iconMuted) iconMuted.style.display = muted ? '' : 'none';
        if (vol) {
          const pct = muted ? 0 : Math.round((video.volume ?? 1) * 100);
          vol.style.setProperty('--vol-pct', `${pct}%`);
        }
      };

      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          video.muted = !video.muted;
          if (!video.muted && video.volume === 0) {
            video.volume = 0.7;
            if (vol) vol.value = '0.7';
          }
          syncMuteIcons();
        });
      }

      if (vol) {
        vol.addEventListener('input', () => {
          video.volume = parseFloat(vol.value);
          video.muted = video.volume === 0;
          syncMuteIcons();
        });
      }
      syncMuteIcons();

      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          if (document.fullscreenElement === player) {
            document.exitFullscreen?.();
          } else {
            player.requestFullscreen?.();
          }
          showControls(true);
        });
      }

      ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach(evt => {
        player.addEventListener(evt, () => showControls(true), { passive: true });
      });
      player.addEventListener('mouseleave', () => {
        if (!video.paused && !video.ended) {
          if (hideControlsTimer) clearTimeout(hideControlsTimer);
          hideControlsTimer = setTimeout(() => {
            if (!video.paused && !video.ended) {
              player.classList.add('ffd-controls-hidden');
            }
          }, 800);
        }
      });
      document.addEventListener('fullscreenchange', () => showControls(true));
    });
  }

  window.FFD_MEDIA = {
    getExternalVideoEmbedUrl,
    renderExternalVideoEmbedHtml,
    renderVideoPlayerHtml,
    initVideoPlayers
  };
})();

