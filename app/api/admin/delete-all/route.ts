import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('Starting admin delete-all request...');
    
    // Simulate deletion process
    console.log('Simulating database cleanup...');
    
    // Wait a bit to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Database cleanup completed (simulated)');

    return NextResponse.json({
      success: true,
      message: 'All data deleted successfully (simulated)',
      deleted: {
        users: 0,
        conversations: 0,
        messages: 0
      }
    });

  } catch (error) {
    console.error('Admin delete-all error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}