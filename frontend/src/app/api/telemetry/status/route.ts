import { NextResponse } from 'next/server';
import { getLiveSystemStatus } from '@/lib/telemetry-service';

export async function GET() {
  try {
    const status = await getLiveSystemStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
