import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    totalFiles: 310, totalBrands: 75, totalTaste: 17,
    totalTags: 517, totalTopics: 13,
    topics: ['typography', 'color', 'layout', 'animation', 'components', 'accessibility', 'responsive', 'branding', 'luxury', 'tech', 'minimal', 'creative', 'corporate'],
  });
}
