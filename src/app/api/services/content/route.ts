import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET services page content
export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM services_page_content ORDER BY updated_at DESC LIMIT 1');
        
        if (rows.length === 0) {
            return NextResponse.json({ error: 'No content found' }, { status: 404 });
        }
        
        // Parse process_steps JSON if it's a string
        const content = rows[0];
        if (typeof content.process_steps === 'string') {
            content.process_steps = JSON.parse(content.process_steps);
        }
        
        return NextResponse.json(content);
    } catch (error: any) {
        console.error('Error fetching services page content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}

// PUT services page content
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        
        // Check if content exists
        const [rows]: any = await pool.query('SELECT id FROM services_page_content LIMIT 1');
        
        const {
            hero_badge,
            hero_title,
            hero_description,
            process_badge,
            process_title,
            process_description,
            process_steps,
            cta_title,
            cta_description,
            cta_primary_button,
            cta_secondary_button,
            inquiry_product_name,
            inquiry_product_category,
            inquiry_product_description
        } = body;
        
        // Convert process_steps to JSON string if it's an object
        const processStepsJson = typeof process_steps === 'string' 
            ? process_steps 
            : JSON.stringify(process_steps);
        
        if (rows.length === 0) {
            // Insert new content
            await pool.query(
                `INSERT INTO services_page_content (
                    hero_badge, hero_title, hero_description,
                    process_badge, process_title, process_description, process_steps,
                    cta_title, cta_description, cta_primary_button, cta_secondary_button,
                    inquiry_product_name, inquiry_product_category, inquiry_product_description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    hero_badge, hero_title, hero_description,
                    process_badge, process_title, process_description, processStepsJson,
                    cta_title, cta_description, cta_primary_button, cta_secondary_button,
                    inquiry_product_name, inquiry_product_category, inquiry_product_description
                ]
            );
        } else {
            // Update existing content
            const updates = [];
            const values = [];
            
            if (hero_badge !== undefined) { updates.push('hero_badge = ?'); values.push(hero_badge); }
            if (hero_title !== undefined) { updates.push('hero_title = ?'); values.push(hero_title); }
            if (hero_description !== undefined) { updates.push('hero_description = ?'); values.push(hero_description); }
            if (process_badge !== undefined) { updates.push('process_badge = ?'); values.push(process_badge); }
            if (process_title !== undefined) { updates.push('process_title = ?'); values.push(process_title); }
            if (process_description !== undefined) { updates.push('process_description = ?'); values.push(process_description); }
            if (process_steps !== undefined) { updates.push('process_steps = ?'); values.push(processStepsJson); }
            if (cta_title !== undefined) { updates.push('cta_title = ?'); values.push(cta_title); }
            if (cta_description !== undefined) { updates.push('cta_description = ?'); values.push(cta_description); }
            if (cta_primary_button !== undefined) { updates.push('cta_primary_button = ?'); values.push(cta_primary_button); }
            if (cta_secondary_button !== undefined) { updates.push('cta_secondary_button = ?'); values.push(cta_secondary_button); }
            if (inquiry_product_name !== undefined) { updates.push('inquiry_product_name = ?'); values.push(inquiry_product_name); }
            if (inquiry_product_category !== undefined) { updates.push('inquiry_product_category = ?'); values.push(inquiry_product_category); }
            if (inquiry_product_description !== undefined) { updates.push('inquiry_product_description = ?'); values.push(inquiry_product_description); }
            
            if (updates.length > 0) {
                values.push(rows[0].id);
                await pool.query(`UPDATE services_page_content SET ${updates.join(', ')} WHERE id = ?`, values);
            }
        }
        
        // Fetch and return updated content
        const [updated]: any = await pool.query('SELECT * FROM services_page_content ORDER BY updated_at DESC LIMIT 1');
        
        if (typeof updated[0].process_steps === 'string') {
            updated[0].process_steps = JSON.parse(updated[0].process_steps);
        }
        
        return NextResponse.json(updated[0]);
    } catch (error: any) {
        console.error('Error updating services page content:', error);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
