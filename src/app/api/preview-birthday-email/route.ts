import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate email preview
 * POST /api/preview-birthday-email
 * Body: { name, celebrationTime?, department? }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, celebrationTime, department } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required for preview' },
                { status: 400 }
            );
        }

        // Read template
        const templatePath = path.join(process.cwd(), 'email-templates', 'birthday-wishes.html');
        let template = await fs.readFile(templatePath, 'utf-8');
        
        // Replace placeholders
        template = template.replace(/\[Employee Name\]/g, name);
        template = template.replace(/\[Time\]/g, celebrationTime || '3:00 PM');
        template = template.replace(/\[Department Name \/ Manager Name\]/g, department || 'VIROS Team');
        template = template.replace(/VIROS/g, process.env.COMPANY_NAME || 'VIROS');

        // Return HTML for preview
        return new NextResponse(template, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });

    } catch (error: any) {
        console.error('Error generating preview:', error);
        return NextResponse.json(
            { error: 'Failed to generate preview', details: error.message },
            { status: 500 }
        );
    }
}
