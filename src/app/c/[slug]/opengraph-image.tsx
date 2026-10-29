import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { parseCardCode } from '@/lib/cardLink';
import { fetchCardPreview } from '@/lib/cardPreview';
import type { Category } from '@/types/database';

/** The picture chat apps show under a card's link: the card itself, as in the Feed. */
export const alt = 'StudySwap card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Light-theme subject colours (same values as globals.css). */
const PALETTE: Record<Category, { bg: string; label: string; title: string; topic: string }> = {
  'CS & Dev': { bg: '#d9e1f1', label: '#274cb1', title: '#1e3a8a', topic: '#3c5fb1' },
  Languages: { bg: '#fdd5da', label: '#9e1842', title: '#881337', topic: '#ba1e50' },
  Humanities: { bg: '#fdeae2', label: '#994716', title: '#78350f', topic: '#a9521b' },
  Mathematics: { bg: '#cbc2f7', label: '#5b24b1', title: '#4c1d95', topic: '#652ac7' },
};
const EMPTY = { bg: '#f3effc', label: '#736a8e', title: '#2f274b', topic: '#5a5472' };

const FONT_FAMILY = "'Montserrat latin', 'Montserrat latin-ext', 'Montserrat cyrillic', 'Montserrat cyrillic-ext'";

/** Montserrat subsets (Latin, Cyrillic incl. Kazakh letters), bundled in assets/og. */
async function fonts() {
  const dir = join(process.cwd(), 'assets/og');
  const files = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'].flatMap((subset) =>
    ([500, 700] as const).map((weight) => ({ subset, weight })),
  );
  return Promise.all(
    files.map(async ({ subset, weight }) => ({
      // One family per subset: the image falls back through them glyph by glyph.
      name: `Montserrat ${subset}`,
      data: await readFile(join(dir, `montserrat-${subset}-${weight}-normal.woff`)),
      weight,
      style: 'normal' as const,
    })),
  );
}

async function logo(): Promise<string> {
  const svg = await readFile(join(process.cwd(), 'public/StudySwapLogo.svg'));
  return `data:image/svg+xml;base64,${svg.toString('base64')}`;
}

function initials(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return ((first?.[0] ?? 'S') + (second?.[0] ?? first?.[1] ?? 'T')).toUpperCase();
}

function Half({ label, title, topic, category }: { label: string; title: string; topic: string; category: Category | null }) {
  const p = (category && PALETTE[category]) || EMPTY;
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: p.bg, borderRadius: 24, padding: '20px 28px', height: 150 }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: p.label }}>{label}</div>
      <div style={{ fontSize: 42, fontWeight: 700, color: p.title, display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', paddingRight: 80 }}>
        {title}
      </div>
      <div style={{ fontSize: 24, fontWeight: 500, color: p.topic, display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', paddingRight: 80 }}>
        {topic}
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = parseCardCode(slug);
  const [card, fontList, logoSrc] = await Promise.all([code ? fetchCardPreview(code) : null, fonts(), logo()]);

  const page = (children: React.ReactNode) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_FAMILY,
        background: 'linear-gradient(135deg, #f3e8ff 0%, #fbf9ff 45%, #fde4f1 100%)',
      }}
    >
      {children}
    </div>
  );

  if (!card) {
    return new ImageResponse(
      page(
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <img src={logoSrc} width={120} height={120} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: '#1b1530' }}>StudySwap</div>
            <div style={{ fontSize: 30, fontWeight: 500, color: '#5a5472' }}>Academic barter for AITU students</div>
          </div>
        </div>,
      ),
      { ...size, fonts: fontList },
    );
  }

  const subtitle = `${card.major || 'Software Engineering'}, ${card.study_year ? `Year ${card.study_year}` : 'Teacher'}`;
  return new ImageResponse(
    page(
      <div
        style={{
          width: 1080,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          background: '#ffffff',
          borderRadius: 40,
          border: '2px solid #ece6f7',
          padding: 36,
          boxShadow: '0 30px 70px rgba(60,30,110,0.16)',
        }}
      >
        {/* Author and brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 999,
                background: '#f1e7ff',
                color: '#7a2fd0',
                fontSize: 28,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initials(card.author_name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: '#1b1530' }}>{card.author_name}</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: '#5a5472' }}>{subtitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={logoSrc} width={56} height={56} alt="" />
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1b1530' }}>StudySwap</div>
          </div>
        </div>

        {/* Needs help ⇄ Can teach */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
          <Half label="NEEDS HELP" title={card.needed_name} topic={card.needed_topic} category={card.needed_category} />
          <Half label="CAN TEACH" title={card.offered_name} topic={card.offered_topic} category={card.offered_category} />
          <div
            style={{
              position: 'absolute',
              right: 36,
              top: 125,
              width: 64,
              height: 64,
              borderRadius: 999,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            }}
          >
            <svg width="64" height="64" viewBox="0 0 51 51" fill="none">
              <defs>
                <linearGradient id="g" x1="5.3" y1="25.5" x2="45.7" y2="25.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#AD46FF" />
                  <stop offset="1" stopColor="#F6339A" />
                </linearGradient>
              </defs>
              <circle cx="25.5" cy="25.5" r="20.2" fill="url(#g)" />
              <path
                d="M22.5 33.8333L18.5 29.8333L22.5 25.8333M18.5 29.8333H32.5M28.5 25.1667L32.5 21.1667L28.5 17.1667M32.5 21.1667H18.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>,
    ),
    { ...size, fonts: fontList },
  );
}
