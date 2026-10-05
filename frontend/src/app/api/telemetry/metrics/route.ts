import { NextRequest, NextResponse } from 'next/server';
import { generateTimeSeriesMetrics } from '@/lib/telemetry-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30m';
    
    let minutes = 30;
    if (range === '5m') minutes = 5;
    if (range === '15m') minutes = 15;
    if (range === '1h') minutes = 60;
    if (range === '6h') minutes = 360;
    if (range === '24h') minutes = 1440;

    const data = generateTimeSeriesMetrics(minutes);
    return NextResponse.json({
      range,
      points: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
