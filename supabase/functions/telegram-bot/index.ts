// StudySwap Telegram bot: links a student's Telegram username to their account.
//
// Telegram sends every message to this function (webhook). A student arrives with
// /start <token> from the site's "Link Telegram" button; the function hands the token
// and the Telegram account to telegram_link_from_bot() and answers in the student's
// Telegram language (English, Russian or Kazakh).
//
// The reply goes back in the webhook response itself, so the bot token is not needed here.
// Secrets (Supabase → Edge Functions → Secrets): TELEGRAM_WEBHOOK_SECRET.
// Deployed with verify_jwt = false: Telegram does not send a Supabase JWT; the secret header is checked instead.

import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE_URL = 'https://studyswap-phi.vercel.app/profile';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

type Reply = 'linked' | 'no_username' | 'taken' | 'expired' | 'intro' | 'error';
type Lang = 'en' | 'ru' | 'kk';

const TEXT: Record<Lang, Record<Reply, string> & { button: string }> = {
  en: {
    linked: '✅ Done! @{handle} is now linked to StudySwap.\nGo back to the site: students can message you here now.',
    no_username:
      "You don't have a Telegram username yet.\nSet one in Settings → Username, then tap the link on StudySwap again.",
    taken: 'This Telegram account is already linked to another StudySwap student. Unlink it there first.',
    expired: 'This link has expired. Open StudySwap → Profile → Link Telegram to get a new one.',
    intro: 'Hi! I link your Telegram to StudySwap so other students can message you.\nOpen StudySwap → Profile → Link Telegram.',
    error: 'Something went wrong. Try again in a minute.',
    button: 'Open StudySwap',
  },
  ru: {
    linked: '✅ Готово! @{handle} привязан к StudySwap.\nВозвращайся на сайт: теперь студенты смогут писать тебе сюда.',
    no_username:
      'У тебя пока нет username в Telegram.\nЗадай его в Настройки → Имя пользователя и снова нажми ссылку на StudySwap.',
    taken: 'Этот Telegram уже привязан к другому аккаунту StudySwap. Сначала отвяжи его там.',
    expired: 'Ссылка устарела. Открой StudySwap → Profile → Link Telegram, чтобы получить новую.',
    intro: 'Привет! Я привязываю твой Telegram к StudySwap, чтобы студенты могли тебе писать.\nОткрой StudySwap → Profile → Link Telegram.',
    error: 'Что-то пошло не так. Попробуй через минуту.',
    button: 'Открыть StudySwap',
  },
  kk: {
    linked: '✅ Дайын! @{handle} StudySwap-қа байланыстырылды.\nСайтқа орал: енді студенттер саған осында жаза алады.',
    no_username:
      'Сенде әлі Telegram username жоқ.\nОны Баптаулар → Пайдаланушы аты бөлімінде қой да, StudySwap-тағы сілтемені қайта бас.',
    taken: 'Бұл Telegram басқа StudySwap аккаунтына байланыстырылған. Алдымен сол жерде ажырат.',
    expired: 'Сілтеменің мерзімі өтті. Жаңасын алу үшін StudySwap → Profile → Link Telegram аш.',
    intro: 'Сәлем! Мен сенің Telegram-ыңды StudySwap-қа байланыстырамын, сонда студенттер саған жаза алады.\nStudySwap → Profile → Link Telegram аш.',
    error: 'Бірдеңе дұрыс болмады. Бір минуттан кейін қайталап көр.',
    button: 'StudySwap-ты ашу',
  },
};

function language(code: unknown): Lang {
  if (typeof code !== 'string') return 'en';
  if (code.startsWith('kk')) return 'kk';
  if (code.startsWith('ru')) return 'ru';
  return 'en';
}

/** /start <token> from the site's link; tokens are 32 hex characters. */
const START_RE = /^\/start(?:@\w+)?\s+([a-f0-9]{32})\s*$/;

async function handle(message: Record<string, any>): Promise<{ reply: Reply; handle?: string }> {
  const match = typeof message.text === 'string' ? message.text.match(START_RE) : null;
  if (!match) return { reply: 'intro' };

  const username: string | null = message.from?.username ?? null;
  const { data, error } = await supabase.rpc('telegram_link_from_bot', {
    p_token: match[1],
    p_telegram_id: message.from.id,
    p_username: username,
  });
  if (error) {
    console.error('telegram_link_from_bot failed:', error.message);
    return { reply: 'error' };
  }
  return { reply: data as Reply, handle: username ?? undefined };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (req.method !== 'POST' || !secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('Forbidden', { status: 403 });
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  // Only private chats with a real sender; anything else is acknowledged and ignored.
  if (!message?.from || message.chat?.type !== 'private') return new Response('ok');

  const lang = language(message.from.language_code);
  const { reply, handle: username } = await handle(message);
  const text = TEXT[lang][reply].replace('{handle}', username ?? '');

  // Answer through the webhook response (Telegram runs this sendMessage for us).
  return Response.json({
    method: 'sendMessage',
    chat_id: message.chat.id,
    text,
    reply_markup: { inline_keyboard: [[{ text: TEXT[lang].button, url: SITE_URL }]] },
  });
});
