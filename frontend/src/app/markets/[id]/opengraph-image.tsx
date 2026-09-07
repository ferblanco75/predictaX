import { ImageResponse } from 'next/og';

import { getServerMarket } from '@/lib/api/server-markets';
import { getCategoryById } from '@/lib/data/categories';

// server-markets.ts only uses fetch + AbortSignal.timeout (no Node-only APIs),
// so this can safely run on the edge runtime for faster OG image generation.
export const runtime = 'edge';

export const alt = 'NeuroPredict - Vista previa del mercado';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#0a0e17';

function Fallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG,
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
        NeuroPredict
      </div>
      <div style={{ display: 'flex', fontSize: 32, color: '#94a3b8', marginTop: 16 }}>
        Mercados de predicción en América Latina
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const market = await getServerMarket(id);
    if (!market) {
      return new ImageResponse(<Fallback />, size);
    }

    const category = getCategoryById(market.category);
    const categoryColor = category?.color || '#6b7280';
    const categoryName = category?.name || market.category;
    const probability = Math.round(market.probability);

    const titleLength = market.title.length;
    const titleFontSize =
      titleLength > 100 ? 42 : titleLength > 70 ? 50 : titleLength > 40 ? 60 : 72;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: BG,
            backgroundImage: 'linear-gradient(135deg, #0a0e17 0%, #131a2b 100%)',
            padding: '56px 64px',
            color: '#ffffff',
          }}
        >
          {/* Header: category badge + brand */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '10px 24px',
                borderRadius: 999,
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
                fontSize: 28,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {categoryName}
            </div>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
              NeuroPredict
            </div>
          </div>

          {/* Market question */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              width: '100%',
              padding: '32px 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: titleFontSize,
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#ffffff',
              }}
            >
              {market.title}
            </div>
          </div>

          {/* Probability */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
              <div style={{ display: 'flex', fontSize: 140, fontWeight: 800, color: categoryColor }}>
                {probability}%
              </div>
            </div>
            <div style={{ display: 'flex', fontSize: 30, color: '#94a3b8', marginTop: -8 }}>
              Probabilidad actual
            </div>
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: 14,
                borderRadius: 7,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                marginTop: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: `${probability}%`,
                  height: '100%',
                  borderRadius: 7,
                  backgroundColor: categoryColor,
                }}
              />
            </div>
          </div>
        </div>
      ),
      size
    );
  } catch {
    return new ImageResponse(<Fallback />, size);
  }
}
