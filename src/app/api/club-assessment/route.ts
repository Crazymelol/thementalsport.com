import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['clubName', 'yourRole', 'sport', 'squadSize', 'biggestChallenge', 'email'];
    for (const field of requiredFields) {
      if (!body[field] || !body[field].toString().trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Save to database (Supabase, PostgreSQL, etc.)
    // 2. Send notification email to Giannis
    // 3. Send confirmation email to club
    // 4. Add to CRM/ConvertKit with tags
    
    // For now, log to console and simulate success
    console.log('Club assessment request:', {
      clubName: body.clubName,
      yourRole: body.yourRole,
      sport: body.sport,
      squadSize: body.squadSize,
      biggestChallenge: body.biggestChallenge,
      email: body.email,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // await sendEmail({
    //   to: 'hello@thementalsport.com',
    //   subject: `Club Assessment Request: ${body.clubName}`,
    //   html: generateEmailTemplate(body),
    // });

    return NextResponse.json(
      { success: true, message: 'Assessment request received' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Club assessment submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}