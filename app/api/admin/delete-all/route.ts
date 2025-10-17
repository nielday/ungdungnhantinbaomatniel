import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('Starting admin delete-all request...');
    
    // Call the actual backend API to delete data
    const backendUrl = 'https://ungdungnhantinbaomatniel-production.up.railway.app/api/admin/delete-all';
    
    console.log('Calling backend API:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Backend deletion successful:', result);
      
      return NextResponse.json({
        success: true,
        message: 'All data deleted successfully',
        deleted: result.deleted || {
          users: 0,
          conversations: 0,
          messages: 0
        }
      });
    } else {
      const errorData = await response.json();
      console.error('Backend deletion failed:', errorData);
      
      return NextResponse.json(
        { 
          error: 'Backend deletion failed',
          details: errorData.message || 'Unknown error'
        },
        { status: 500 }
      );
    }

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