import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const ret = await db.updateReturn(id, body);

  if (!ret) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  return NextResponse.json(ret);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const success = await db.deleteReturn(id);

  if (!success) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
