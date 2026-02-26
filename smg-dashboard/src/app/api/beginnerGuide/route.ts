import {
  BeginnerGuideItem,
  createBeginnerGuideItem,
  deleteBeginnerGuideItem,
  getBeginnerGuideItems,
  updateBeginnerGuideItem,
} from '@/lib/api/beginnerGuides';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const items = await getBeginnerGuideItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch beginner guide items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beginner guide items' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const newItem = await createBeginnerGuideItem(body);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Failed to create beginner guide item:', error);
    return NextResponse.json(
      { error: 'Failed to create beginner guide item' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { guide_item_id, ...updateData } = body;

    if (!guide_item_id) {
      return NextResponse.json(
        { error: 'guide_item_id is required' },
        { status: 400 },
      );
    }

    const updatedItem = await updateBeginnerGuideItem(
      guide_item_id,
      updateData,
    );
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Failed to update beginner guide item:', error);
    return NextResponse.json(
      { error: 'Failed to update beginner guide item' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const guide_item_id = searchParams.get('guide_item_id');

    if (!guide_item_id) {
      return NextResponse.json(
        { error: 'guide_item_id is required' },
        { status: 400 },
      );
    }

    await deleteBeginnerGuideItem(guide_item_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete beginner guide item:', error);
    return NextResponse.json(
      { error: 'Failed to delete beginner guide item' },
      { status: 500 },
    );
  }
}
