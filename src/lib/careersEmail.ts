import { isSmtpConfigured, createMailTransporter, smtpFromAddress } from "@/lib/mailer";

export interface CandidateApplicationEmailPayload {
    applicationId: number | string;
    jobTitle: string;
    department: string;
    fullName: string;
    email: string;
    phone: string;
    currentCity?: string;
    readyToRelocate?: string;
    highestQualification?: string;
    totalExperience?: string;
    currentCompany?: string;
    currentDesignation?: string;
    keySkills?: string;
    currentCtc?: string;
    expectedCtc?: string;
    noticePeriod?: string;
    resumeLink: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    coverNote?: string;
}

export async function sendApplicationEmails(payload: CandidateApplicationEmailPayload) {
    if (!isSmtpConfigured()) {
        console.warn("⚠️ SMTP credentials not configured. Skipping candidate confirmation email.");
        return { success: false, reason: "SMTP_NOT_CONFIGURED" };
    }

    try {
        const transporter = createMailTransporter();
        const fromEmail = smtpFromAddress();
        const companyRecipient = process.env.CAREERS_EMAIL || process.env.COMPANY_EMAIL || fromEmail;
        const appRef = `#APP-${payload.applicationId}`;
        const appliedDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

        // 1. Email to Candidate (Confirmation)
        const candidateHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Confirmation - Viros Entrepreneurs</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #06124f 0%, #081a63 100%); padding: 36px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">VIROS ENTREPRENEURS</h1>
              <p style="margin: 6px 0 0 0; color: #38bdf8; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Careers & Talent Acquisition</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a; font-weight: 600;">Dear ${payload.fullName},</p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for applying to join the team at <strong>Viros Entrepreneurs</strong>! We are pleased to confirm that we have successfully received your application.
              </p>

              <!-- Application Summary Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b; width: 140px;"><strong>Position:</strong></td>
                        <td style="padding: 4px 0; font-size: 14px; color: #06124f; font-weight: 700;">${payload.jobTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Department:</strong></td>
                        <td style="padding: 4px 0; font-size: 13px; color: #334155; font-weight: 600;">${payload.department}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Application Ref:</strong></td>
                        <td style="padding: 4px 0; font-size: 13px; color: #0284c7; font-weight: 600;">${appRef}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Date Submitted:</strong></td>
                        <td style="padding: 4px 0; font-size: 13px; color: #334155;">${appliedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps Section -->
              <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #06124f; font-weight: 700;">What happens next?</h3>
              <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; line-height: 1.65; color: #475569;">
                <li style="margin-bottom: 8px;"><strong>Review:</strong> Our Talent Acquisition team will carefully review your credentials, experience, and portfolio against the role's requirements.</li>
                <li style="margin-bottom: 8px;"><strong>Screening:</strong> If your profile is shortlisted, our recruitment team will reach out via email or phone within <strong>2 to 3 business days</strong> to arrange an introductory interview.</li>
                <li><strong>Updates:</strong> You will be notified regarding any stage progression in our recruitment process.</li>
              </ol>

              <div style="background-color: #ecfeff; border-left: 4px solid #06b6d4; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #0e7490; line-height: 1.5;">
                  <strong>Note:</strong> Please ensure your contact details (${payload.email} / ${payload.phone}) are accessible. For any queries, feel free to write to us with your application reference (${appRef}).
                </p>
              </div>

              <p style="margin: 0 0 4px 0; font-size: 14px; color: #334155;">Warm regards,</p>
              <p style="margin: 0; font-size: 14px; color: #06124f; font-weight: 700;">Talent Acquisition Team</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Viros Entrepreneurs | Smart AIDC & Industrial Automation</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                This is an automated confirmation of your application submission.<br>
                © ${new Date().getFullYear()} Viros Entrepreneurs. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        // 2. Email to HR / Recruitment Team
        const companyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Candidate Application - Viros</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #06124f; color: #ffffff; padding: 20px;">
      <h2 style="margin: 0; font-size: 18px;">🎯 New Job Application Received</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #38bdf8;">Application Ref: ${appRef}</p>
    </div>
    
    <div style="padding: 24px; font-size: 13px; line-height: 1.6;">
      <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #06124f;">Candidate Information</h3>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b; width: 140px;">Full Name:</td><td><strong>${payload.fullName}</strong></td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Job Role:</td><td><strong>${payload.jobTitle}</strong> (${payload.department})</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Email:</td><td><a href="mailto:${payload.email}">${payload.email}</a></td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Phone:</td><td><a href="tel:${payload.phone}">${payload.phone}</a></td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Location:</td><td>${payload.currentCity || "N/A"} (Relocate: ${payload.readyToRelocate || "N/A"})</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Qualification:</td><td>${payload.highestQualification || "N/A"}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Experience:</td><td>${payload.totalExperience || "N/A"} (Current: ${payload.currentCompany || "N/A"} - ${payload.currentDesignation || "N/A"})</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Key Skills:</td><td>${payload.keySkills || "N/A"}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Compensation:</td><td>Current: ${payload.currentCtc || "N/A"} | Expected: ${payload.expectedCtc || "N/A"}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Notice Period:</td><td>${payload.noticePeriod || "N/A"}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Resume Link:</td><td><a href="${payload.resumeLink}" target="_blank" style="color: #0284c7; font-weight: bold;">View / Download Resume ↗</a></td></tr>
        ${payload.linkedinUrl ? `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">LinkedIn:</td><td><a href="${payload.linkedinUrl}" target="_blank">${payload.linkedinUrl}</a></td></tr>` : ""}
        ${payload.portfolioUrl ? `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b;">Portfolio:</td><td><a href="${payload.portfolioUrl}" target="_blank">${payload.portfolioUrl}</a></td></tr>` : ""}
      </table>

      ${payload.coverNote ? `
      <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
        <strong style="color: #475569; display: block; margin-bottom: 4px;">Candidate Cover Note:</strong>
        <p style="margin: 0; white-space: pre-wrap; color: #334155;">${payload.coverNote}</p>
      </div>` : ""}
    </div>
  </div>
</body>
</html>
        `;

        // Send confirmation email to candidate
        const candidateMailPromise = transporter.sendMail({
            from: `"Viros Careers" <${fromEmail}>`,
            to: payload.email,
            subject: `Application Received: ${payload.jobTitle} - Viros Entrepreneurs (${appRef})`,
            html: candidateHtml
        });

        // Send notification email to HR team
        const companyMailPromise = transporter.sendMail({
            from: `"Viros Job Portal" <${fromEmail}>`,
            to: companyRecipient,
            subject: `🎯 New Candidate Application: ${payload.jobTitle} - ${payload.fullName} (${appRef})`,
            html: companyHtml
        });

        // Run concurrently
        await Promise.allSettled([candidateMailPromise, companyMailPromise]);
        console.log(`✅ Application confirmation email dispatched to candidate ${payload.email} for role ${payload.jobTitle}`);

        return { success: true };
    } catch (err: any) {
        console.error("❌ Error sending candidate application email:", err);
        return { success: false, error: err.message };
    }
}

export interface ApplicationStatusUpdatePayload {
    applicationId: number | string;
    jobTitle: string;
    department: string;
    fullName: string;
    email: string;
    newStatus: "shortlisted" | "rejected" | "interview" | "reviewed" | string;
}

export async function sendApplicationStatusUpdateEmail(payload: ApplicationStatusUpdatePayload) {
    if (!isSmtpConfigured()) {
        console.warn("⚠️ SMTP credentials not configured. Skipping status update email.");
        return { success: false, reason: "SMTP_NOT_CONFIGURED" };
    }

    if (!payload.email) {
        console.warn("⚠️ Candidate email missing. Cannot send status email.");
        return { success: false, reason: "EMAIL_MISSING" };
    }

    try {
        const transporter = createMailTransporter();
        const fromEmail = smtpFromAddress();
        const appRef = `#APP-${payload.applicationId}`;
        const statusUpper = payload.newStatus.toUpperCase();

        let subject = `Application Update: ${payload.jobTitle} - Viros Entrepreneurs`;
        let statusBadgeBg = "#10b981";
        let statusBadgeColor = "#ffffff";
        let mainHeading = `Application Status Update`;
        let bodyContent = "";

        if (payload.newStatus === "shortlisted") {
            subject = `🌟 Congratulations! You have been Shortlisted for ${payload.jobTitle} - Viros Entrepreneurs`;
            statusBadgeBg = "#059669";
            mainHeading = `You're Shortlisted!`;
            bodyContent = `
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Dear ${payload.fullName},</p>
              
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                We are thrilled to inform you that following a comprehensive review of your profile and qualifications, you have been <strong>Shortlisted</strong> for the position of <strong>${payload.jobTitle}</strong> at <strong>Viros Entrepreneurs</strong>!
              </p>

              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 700;">Next Steps in Your Hiring Journey:</h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #047857; line-height: 1.6;">
                  <li style="margin-bottom: 6px;">Our Talent Acquisition team will reach out to you shortly via phone or email to schedule your <strong>Technical / Screening Interview round</strong>.</li>
                  <li style="margin-bottom: 6px;">Please keep your portfolio, past project highlights, and resume readily accessible.</li>
                  <li>Feel free to reply to this email if you have any questions regarding the upcoming rounds.</li>
                </ul>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We are excited about the prospect of having you join our innovative team!
              </p>
            `;
        } else if (payload.newStatus === "rejected") {
            subject = `Update regarding your application for ${payload.jobTitle} - Viros Entrepreneurs`;
            statusBadgeBg = "#e11d48";
            mainHeading = `Application Status Update`;
            bodyContent = `
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Dear ${payload.fullName},</p>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                Thank you for your interest in <strong>Viros Entrepreneurs</strong> and for taking the time to apply for the position of <strong>${payload.jobTitle}</strong>.
              </p>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                We received many strong applications from talented candidates. After careful consideration and evaluation of all profiles against our current requirements, we regret to inform you that we will not be proceeding with your application for this specific role at this time.
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.55;">
                  <strong>Talent Pool:</strong> We have securely retained your resume in our talent repository. Should a future opportunity open that closely matches your skills and background, our recruitment team will be glad to reconnect with you.
                </p>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We sincerely appreciate your effort and wish you the very best in your professional endeavors and job search.
              </p>
            `;
        } else if (payload.newStatus === "interview") {
            subject = `📅 Interview Invitation: ${payload.jobTitle} - Viros Entrepreneurs`;
            statusBadgeBg = "#d97706";
            mainHeading = `Interview Round Invitation`;
            bodyContent = `
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Dear ${payload.fullName},</p>
              
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                We are pleased to invite you for an <strong>Interview Round</strong> for the position of <strong>${payload.jobTitle}</strong> at <strong>Viros Entrepreneurs</strong>.
              </p>

              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.55;">
                  Our Talent Acquisition coordinator will contact you shortly with the specific schedule, date, time, and meeting details.
                </p>
              </div>
            `;
        } else {
            // Generic update
            subject = `Application Update: ${payload.jobTitle} (${statusUpper}) - Viros Entrepreneurs`;
            statusBadgeBg = "#475569";
            mainHeading = `Application Status Update`;
            bodyContent = `
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Dear ${payload.fullName},</p>
              
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                Your application for <strong>${payload.jobTitle}</strong> has been updated to <strong>${statusUpper}</strong>.
              </p>
            `;
        }

        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #06124f 0%, #081a63 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">VIROS ENTREPRENEURS</h1>
              <p style="margin: 6px 0 0 0; color: #38bdf8; font-size: 13px; font-weight: 600; text-transform: uppercase;">${mainHeading}</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 30px;">
              
              <!-- Status Pill Banner -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="left">
                    <span style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                      Status: ${statusUpper}
                    </span>
                  </td>
                  <td align="right" style="font-size: 12px; color: #64748b;">
                    Ref: <strong>${appRef}</strong>
                  </td>
                </tr>
              </table>

              ${bodyContent}

              <!-- Application Summary Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 3px 0; font-size: 12px; color: #64748b; width: 130px;"><strong>Role:</strong></td>
                        <td style="padding: 3px 0; font-size: 13px; color: #06124f; font-weight: 600;">${payload.jobTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-size: 12px; color: #64748b;"><strong>Department:</strong></td>
                        <td style="padding: 3px 0; font-size: 13px; color: #334155;">${payload.department}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 4px 0; font-size: 14px; color: #334155;">Warm regards,</p>
              <p style="margin: 0; font-size: 14px; color: #06124f; font-weight: 700;">Talent Acquisition Team</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Viros Entrepreneurs | Smart AIDC & Industrial Automation</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                This notification is sent regarding your application at Viros Entrepreneurs.<br>
                © ${new Date().getFullYear()} Viros Entrepreneurs. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        await transporter.sendMail({
            from: `"Viros Careers" <${fromEmail}>`,
            to: payload.email,
            subject: subject,
            html: emailHtml
        });

        console.log(`✅ Status update (${statusUpper}) email sent to candidate ${payload.email}`);
        return { success: true };
    } catch (err: any) {
        console.error("❌ Error sending status update email to candidate:", err);
        return { success: false, error: err.message };
    }
}

export interface InterviewSchedulePayload {
    applicationId: number | string;
    jobTitle: string;
    department: string;
    fullName: string;
    email: string;
    interviewLevel: "Level 1" | "Level 2" | "Level 3" | string;
    interviewDate: string; // e.g. "2026-08-25"
    interviewTime: string; // e.g. "11:00 AM" or "14:30"
    interviewMode?: string; // e.g. "Google Meet / Online"
    interviewLink?: string; // URL or office address
    interviewNotes?: string; // preparation instructions
}

export async function sendInterviewScheduleEmail(payload: InterviewSchedulePayload) {
    if (!isSmtpConfigured()) {
        console.warn("⚠️ SMTP credentials not configured. Skipping interview schedule email.");
        return { success: false, reason: "SMTP_NOT_CONFIGURED" };
    }

    if (!payload.email) {
        console.warn("⚠️ Candidate email missing. Cannot send interview schedule email.");
        return { success: false, reason: "EMAIL_MISSING" };
    }

    try {
        const transporter = createMailTransporter();
        const fromEmail = smtpFromAddress();
        const appRef = `#APP-${payload.applicationId}`;

        // Format human readable date
        let formattedDate = payload.interviewDate;
        try {
            if (payload.interviewDate) {
                const d = new Date(payload.interviewDate);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    });
                }
            }
        } catch {}

        // Format level label
        const levelLabels: Record<string, string> = {
            "Level 1": "Level 1 (Initial Technical Screening / HR Round)",
            "Level 2": "Level 2 (Domain & Deep Technical Assessment)",
            "Level 3": "Level 3 (Final Leadership & Culture Fit Round)",
        };
        const levelFull = levelLabels[payload.interviewLevel] || payload.interviewLevel || "Interview Round";

        const subject = `📅 Interview Invitation: ${payload.jobTitle} - ${payload.interviewLevel} [Viros Entrepreneurs]`;

        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #06124f 0%, #081a63 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">VIROS ENTREPRENEURS</h1>
              <p style="margin: 6px 0 0 0; color: #38bdf8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Interview Schedule & Invitation</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 30px;">
              
              <!-- Status Pill Banner -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="left">
                    <span style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                      📅 ${payload.interviewLevel.toUpperCase()} SCHEDULED
                    </span>
                  </td>
                  <td align="right" style="font-size: 12px; color: #64748b;">
                    Ref: <strong>${appRef}</strong>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Dear ${payload.fullName},</p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                We are pleased to invite you for your <strong>${levelFull}</strong> for the <strong>${payload.jobTitle}</strong> position at <strong>Viros Entrepreneurs</strong>.
              </p>

              <!-- Interview Schedule Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h4 style="margin: 0 0 14px 0; color: #92400e; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      📌 Interview Details
                    </h4>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #78350f; width: 140px;"><strong>Interview Stage:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #1e293b; font-weight: 700;">${payload.interviewLevel}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #78350f;"><strong>Date:</strong></td>
                        <td style="padding: 5px 0; font-size: 14px; color: #06124f; font-weight: 700;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #78350f;"><strong>Time:</strong></td>
                        <td style="padding: 5px 0; font-size: 14px; color: #06124f; font-weight: 700;">${payload.interviewTime} (IST)</td>
                      </tr>
                      ${payload.interviewMode ? `
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #78350f;"><strong>Mode / Format:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #1e293b; font-weight: 600;">${payload.interviewMode}</td>
                      </tr>
                      ` : ""}
                      ${payload.interviewLink ? `
                      <tr>
                        <td style="padding: 8px 0 5px 0; font-size: 13px; color: #78350f;"><strong>Meeting Link / Room:</strong></td>
                        <td style="padding: 8px 0 5px 0; font-size: 13px;">
                          ${payload.interviewLink.startsWith("http") ? `
                            <a href="${payload.interviewLink}" target="_blank" style="display: inline-block; background-color: #06124f; color: #ffffff; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 12px;">
                              Join Meeting Link ↗
                            </a>
                          ` : `<span style="color: #06124f; font-weight: 600;">${payload.interviewLink}</span>`}
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              ${payload.interviewNotes ? `
              <!-- Notes & Guidelines -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #06124f; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px 0; color: #06124f; font-size: 13px; font-weight: 700;">Important Notes & Preparation:</h4>
                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${payload.interviewNotes}</p>
              </div>
              ` : ""}

              <!-- Tips -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 24px;">
                <h5 style="margin: 0 0 6px 0; font-size: 12px; color: #475569; text-transform: uppercase; font-weight: 700;">Interview Guidelines:</h5>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #64748b; line-height: 1.6;">
                  <li>Please join the call/meeting <strong>5 minutes prior</strong> to the scheduled time.</li>
                  <li>Ensure a stable internet connection and functioning webcam/microphone.</li>
                  <li>If you require rescheduling due to unavoidable circumstances, kindly reply to this email as soon as possible.</li>
                </ul>
              </div>

              <p style="margin: 0 0 4px 0; font-size: 14px; color: #334155;">Best regards,</p>
              <p style="margin: 0; font-size: 14px; color: #06124f; font-weight: 700;">Talent Acquisition Team</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Viros Entrepreneurs | Smart AIDC & Industrial Automation</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                This email was sent regarding your application ${appRef} at Viros Entrepreneurs.<br>
                © ${new Date().getFullYear()} Viros Entrepreneurs. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        await transporter.sendMail({
            from: `"Viros Careers" <${fromEmail}>`,
            to: payload.email,
            subject: subject,
            html: emailHtml
        });

        console.log(`✅ Interview schedule email sent to candidate ${payload.email} for ${payload.interviewLevel}`);
        return { success: true };
    } catch (err: any) {
        console.error("❌ Error sending interview schedule email to candidate:", err);
        return { success: false, error: err.message };
    }
}
