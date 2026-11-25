// Supabase Edge Function: send-email
// Sends Fatama Fighting Dragons portal notifications & 2FA codes via Gmail SMTP.
// Required Secrets:
//   supabase secrets set GMAIL_USER=yourdojo@gmail.com GMAIL_APP_PASSWORD=your16charapppassword

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

function buildCorsHeaders(req?: Request): Record<string, string> {
  const allowedRaw = Deno.env.get("ALLOWED_ORIGINS") || "";
  const allowed = allowedRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req?.headers.get("origin") || "";
  const isLocalLoopback = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const allowOrigin = allowed.length > 0
    ? (allowed.includes(origin) || isLocalLoopback ? origin : allowed[0])
    : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
  });
}

async function getAuthenticatedUser(req: Request, admin: ReturnType<typeof createClient>, bodyAccessToken?: unknown) {
  const bodyToken = typeof bodyAccessToken === "string" ? bodyAccessToken.trim() : "";
  const authHeader = req.headers.get("authorization") || "";
  const headerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const token = bodyToken || headerToken;
  if (!token) {
    console.warn("[send-email] getAuthenticatedUser: missing bearer token");
    return null;
  }
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    console.warn("[send-email] getAuthenticatedUser failed:", error?.message || "no user", "tokenPrefix:", token.slice(0, 12));
    return null;
  }
  return data.user;
}

async function isInstructorUser(userId: string, admin: ReturnType<typeof createClient>) {
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "instructor";
}

function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapEmailLayout(title: string, bodyHtml: string): string {
  const displayFont = `Arial, Helvetica, sans-serif`;
  const bodyFont = `Arial, Helvetica, sans-serif`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 520px) {
      .ffd-card-pad { padding: 18px 16px !important; }
      .ffd-stack-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        padding-left: 0 !important;
        padding-top: 4px !important;
      }
      .ffd-btn {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
        margin: 0 0 8px 0 !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0;">
  <div style="font-family:${bodyFont}; padding:24px 12px;">
    <div style="max-width:600px; margin:0 auto; background:#1f1c1d; border:1px solid #352b2c; border-radius:14px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.35);">
      <div class="ffd-card-pad" style="background:linear-gradient(135deg,#8b0e14,#c8141c); padding:20px 24px;">
        <div style="font-family:${bodyFont}; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#ffd7d7; font-weight:700;">Fatama Fighting Dragons</div>
        <h1 style="margin:6px 0 0; font-family:${displayFont}; font-size:22px; font-weight:800; text-transform:uppercase; color:#ffffff; line-height:1.2;">${escapeHtml(title)}</h1>
      </div>
      <div class="ffd-card-pad" style="padding:24px; font-family:${bodyFont}; font-size:14px; font-weight:400; line-height:1.6; color:#d6ceca;">
        ${bodyHtml}
      </div>
      <div class="ffd-card-pad" style="padding:14px 24px; background:#171415; border-top:1px solid #2d2526; font-family:${bodyFont}; font-size:12px; font-weight:400; color:#a99f98;">
        Fatama Fighting Dragons &bull; Automated Dojo Notification
      </div>
    </div>
  </div>
</body>
</html>`;
}

function createTransporter() {
  const user = Deno.env.get("GMAIL_USER");
  const pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD secret.");
  }
  return {
    from: `"Fatama Fighting Dragons" <${user}>`,
    transporter: nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    }),
  };
}

serve(async (req) => {
  const respond = (body: unknown, status = 200) => jsonResponse(body, status, req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCorsHeaders(req) });
  }
  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  try {
    const { action, payload = {}, accessToken } = await req.json();
    const jsonResponse = (body: unknown, status = 200, _req?: Request) => respond(body, status);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const instructorActions = new Set(["announcement", "learning_material", "test_smtp"]);
    const authUserActions = new Set(["password_changed", "new_device_login", "send_2fa_code", "verify_2fa_code"]);

    let callerUser: Awaited<ReturnType<typeof getAuthenticatedUser>> = null;
    if (instructorActions.has(action) || authUserActions.has(action)) {
      callerUser = await getAuthenticatedUser(req, admin, accessToken);
      if (!callerUser) {
        return jsonResponse({ ok: false, error: "Authentication required." }, 401, req);
      }
    }

    if (instructorActions.has(action)) {
      const okInstructor = callerUser ? await isInstructorUser(callerUser.id, admin) : false;
      if (!okInstructor) {
        return jsonResponse({ ok: false, error: "Instructor privileges required." }, 403, req);
      }
    }

    if (action === "verify_2fa_code") {
      const { userId, code } = payload;
      if (!userId || !code) {
        return jsonResponse({ ok: false, error: "Missing userId or code." }, 400, req);
      }
      if (callerUser && callerUser.id !== userId) {
        return jsonResponse({ ok: false, error: "Forbidden." }, 403, req);
      }

      const { data: latestRows, error } = await admin
        .from("login_2fa_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !latestRows || latestRows.length === 0) {
        return jsonResponse({ ok: false, error: "Invalid or expired 2FA code." }, 400, req);
      }

      const latest = latestRows[0];
      const submitted = String(code).trim();
      if (latest.code !== submitted) {
        const nextAttempts = Number(latest.failed_attempts || 0) + 1;
        await admin
          .from("login_2fa_codes")
          .update({
            failed_attempts: nextAttempts,
            used: nextAttempts >= 5,
          })
          .eq("id", latest.id);
        return jsonResponse({
          ok: false,
          error: nextAttempts >= 5
            ? "Too many invalid attempts. Please request a new 2FA code."
            : "Invalid or expired 2FA code.",
        }, 400, req);
      }

      await admin.from("login_2fa_codes").update({ used: true }).eq("id", latest.id);
      return jsonResponse({ ok: true }, 200, req);
    }

    const { from, transporter } = createTransporter();

    const clockIconHtml = `<img src="https://zldvusuiwzntcunuklbj.supabase.co/storage/v1/object/public/learning-materials/assets/clock-gray.png" width="13" height="13" alt="" style="vertical-align:-2px; margin-right:4px; display:inline-block;">`;

    const formatSentStamp = () =>
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).replace(/, (\d{1,2}:)/, " • $1");

    if (action === "test_smtp") {
      await transporter.verify();
      return jsonResponse({ ok: true, message: "SMTP connection verified!" });
    }

    if (action === "announcement") {
      const { title, body, authorName } = payload;
      const { data: students, error: stuErr } = await admin
        .from("profiles")
        .select("email")
        .eq("role", "student")
        .or("remind_announcements.is.null,remind_announcements.eq.true");

      if (stuErr) {
        throw new Error(`Failed to query student emails: ${stuErr.message}`);
      }

      const emails = (students || []).map((s) => s.email).filter(Boolean);
      console.log("[send-email] announcement recipients:", emails.length);
      if (emails.length === 0) return jsonResponse({ ok: true, sent: 0, reason: "No matching student emails" });

      const sentStamp = formatSentStamp();

      const html = wrapEmailLayout(
        "New Dojo Announcement",
        `
          <div>
            <h2 style="margin:0 0 6px 0; font-family:Arial, Helvetica, sans-serif; font-size:20px; font-weight:800; text-transform:uppercase; color:#ffffff; line-height:1.25;">${escapeHtml(title)}</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px; font-size:12px; font-weight:400; color:#a99f98;">
              <tr>
                <td class="ffd-stack-cell" style="text-align:left; vertical-align:middle; font-weight:400; color:#a99f98;">
                  Posted by: <strong style="color:#a99f98; font-weight:700;">${escapeHtml(authorName || "Instructor")}</strong>
                </td>
                <td class="ffd-stack-cell" style="text-align:right; vertical-align:middle; color:#a99f98; font-weight:600; white-space:nowrap;">
                  ${clockIconHtml}Sent: ${escapeHtml(sentStamp)}
                </td>
              </tr>
            </table>
            <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:400; line-height:1.6; color:#d6ceca; white-space:pre-wrap;">${escapeHtml(body)}</p>
          </div>
        `,
      );

      await transporter.sendMail({
        from,
        to: from,
        bcc: emails,
        subject: `[Fatama Dojo] Announcement: ${title}`,
        headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
        html,
      });
      return jsonResponse({ ok: true, sent: emails.length });
    }

    if (action === "learning_material") {
      const { title, description, category, beltLevel, authorName, portalUrl, resourceUrl, mediaUrl } = payload;
      const { data: students, error: stuErr } = await admin
        .from("profiles")
        .select("email")
        .eq("role", "student")
        .or("remind_announcements.is.null,remind_announcements.eq.true");

      if (stuErr) {
        throw new Error(`Failed to query student emails: ${stuErr.message}`);
      }

      const emails = (students || []).map((s) => s.email).filter(Boolean);
      console.log("[send-email] learning_material recipients:", emails.length);
      if (emails.length === 0) return jsonResponse({ ok: true, sent: 0, reason: "No matching student emails" });

      const sentStamp = formatSentStamp();
      const safePortalLink = /^https?:\/\//i.test(String(portalUrl || "")) ? String(portalUrl) : "";
      const directResource = String(resourceUrl || "").trim();
      const safeDirectLink = /^https?:\/\//i.test(directResource) ? directResource : "";

      const linksHtml = (safePortalLink || safeDirectLink)
        ? `<div style="margin-top:16px;">
            ${safePortalLink ? `<a class="ffd-btn" href="${escapeHtml(safePortalLink)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:9px 16px; border-radius:8px; background:#c8141c; color:#ffffff; font-size:13px; font-weight:700; text-decoration:none; margin-right:8px;">View Learning Material</a>` : ""}
            ${safeDirectLink ? `<a class="ffd-btn" href="${escapeHtml(safeDirectLink)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:9px 16px; border-radius:8px; background:#2b2627; border:1px solid #4a3f41; color:#f4eee7; font-size:13px; font-weight:700; text-decoration:none;">Open Attached Resource</a>` : ""}
          </div>`
        : "";

      const html = wrapEmailLayout(
        "New Learning Material Posted",
        `
          <p style="margin:0 0 14px 0; font-size:12px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#a99f98;">A NEW LEARNING MATERIAL IS NOW AVAILABLE IN YOUR STUDENT PORTAL:</p>
          <div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
              <tr>
                <td class="ffd-stack-cell" style="text-align:left; vertical-align:middle;">
                  <h2 style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:20px; font-weight:800; text-transform:uppercase; color:#ffffff; line-height:1.25;">${escapeHtml(title)}</h2>
                </td>
                <td class="ffd-stack-cell" style="text-align:right; vertical-align:middle; font-size:12px; color:#f5c451; font-weight:700; white-space:nowrap; padding-left:12px;">
                  ${escapeHtml(category || "Training")} &bull; ${escapeHtml(beltLevel || "All Belts")}
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px; font-size:12px; font-weight:400; color:#a99f98;">
              <tr>
                <td class="ffd-stack-cell" style="text-align:left; vertical-align:middle; font-weight:400; color:#a99f98;">
                  Posted by: <strong style="color:#a99f98; font-weight:700;">${escapeHtml(authorName || "Instructor")}</strong>
                </td>
                <td class="ffd-stack-cell" style="text-align:right; vertical-align:middle; color:#a99f98; font-weight:600; white-space:nowrap;">
                  ${clockIconHtml}Sent: ${escapeHtml(sentStamp)}
                </td>
              </tr>
            </table>
            <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:400; line-height:1.6; white-space:pre-wrap; color:#d6ceca;">${escapeHtml(description)}</p>
            ${linksHtml}
          </div>
        `,
      );

      await transporter.sendMail({
        from,
        to: from,
        bcc: emails,
        subject: `[Fatama Dojo] New Learning Material: ${title}`,
        headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
        html,
      });
      return jsonResponse({ ok: true, sent: emails.length });
    }

    if (action === "new_registration") {
      const { studentName, studentEmail, phone, proficiency, registrationType, registrationId } = payload;
      const passRef = registrationId || `FFD-TRIAL-${Date.now().toString().slice(-6)}`;

      // 1. Send 1st Free Training Proof of Registration Pass to the Student
      if (studentEmail) {
        const studentHtml = wrapEmailLayout(
          "1st Free Training Pass — Proof of Registration",
          `
            <p style="margin-top:0;">Welcome to <strong>Fatama Fighting Dragons</strong>, <strong>${escapeHtml(studentName || "Trainee")}</strong>!</p>
            <p>Your registration is confirmed. Present this email at the dojo to claim your <strong>1st Free Training Session</strong>:</p>
            <div style="background:#161314; border:1px dashed #f5c451; border-radius:10px; padding:16px; margin:16px 0;">
              <div style="font-size:11px; color:#f5c451; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Official Free Trial Pass</div>
              <div style="font-family:'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; font-size:22px; font-weight:800; color:#ffffff; margin:4px 0;">${escapeHtml(passRef)}</div>
              <div style="font-size:13px; color:#d6ceca;">Trainee: <strong>${escapeHtml(studentName)}</strong></div>
              <div style="font-size:13px; color:#d6ceca;">Starting Rank: ${escapeHtml(proficiency || "White Belt (10th-Gup)")}</div>
              <div style="font-size:13px; color:#d6ceca;">Schedule: Sundays (Present this pass upon check-in)</div>
            </div>
            <p style="margin-bottom:0;">See you on the mat!</p>
          `,
        );

        await transporter.sendMail({
          from,
          to: studentEmail,
          subject: "Your 1st Free Training Pass — Fatama Fighting Dragons",
          html: studentHtml,
        });
      }

      // 2. Notify all Instructors of the new registration
      const { data: instructors } = await admin
        .from("profiles")
        .select("email")
        .eq("role", "instructor");

      const instEmails = (instructors || []).map((i) => i.email).filter(Boolean);
      if (instEmails.length > 0) {
        const instHtml = wrapEmailLayout(
          "New Student Registered",
          `
            <p style="margin-top:0;">A new trainee has registered on the Fatama Fighting Dragons portal:</p>
            <ul style="background:#161314; padding:16px 24px; border-radius:10px; border:1px solid #2e2627; list-style:none; color:#d6ceca;">
              <li><strong>Name:</strong> ${escapeHtml(studentName)}</li>
              <li><strong>Email:</strong> ${escapeHtml(studentEmail)}</li>
              <li><strong>Phone:</strong> ${escapeHtml(phone || "N/A")}</li>
              <li><strong>Rank / Experience:</strong> ${escapeHtml(proficiency || "Beginner")}</li>
              <li><strong>Registration Type:</strong> ${escapeHtml(registrationType || "self")}</li>
              <li><strong>Pass Ref:</strong> ${escapeHtml(passRef)}</li>
            </ul>
          `,
        );

        await transporter.sendMail({
          from,
          bcc: instEmails,
          subject: `[Instructor Alert] New Student Registered: ${studentName}`,
          html: instHtml,
        });
      }

      return jsonResponse({ ok: true, notifiedInstructors: instEmails.length });
    }

    if (action === "password_changed") {
      const { email, fullName } = payload;
      if (!email) return jsonResponse({ ok: false, error: "Missing email" }, 400);

      const html = wrapEmailLayout(
        "Password Changed Confirmation",
        `
          <p style="margin-top:0;">Hi <strong>${escapeHtml(fullName || "Member")}</strong>,</p>
          <p>Your Fatama Fighting Dragons account password was just updated on <strong>${escapeHtml(new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }))}</strong>.</p>
          <p style="margin-bottom:0; color:#ffb4b4; font-weight:600;">If you did not make this change, please reset your password immediately or contact an instructor.</p>
        `,
      );

      await transporter.sendMail({
        from,
        to: email,
        subject: "[Security Notice] Your Password Was Changed",
        html,
      });
      return jsonResponse({ ok: true });
    }

    if (action === "send_password_reset") {
      const cleanEmail = String(payload.email || "").trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return jsonResponse({ ok: false, error: "Please enter a valid email address." }, 400, req);
      }

      const rawRedirect = String(payload.redirectTo || "").trim();
      const safeRedirectTo = /^https?:\/\//i.test(rawRedirect) ? rawRedirect : undefined;

      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
        options: safeRedirectTo ? { redirectTo: safeRedirectTo } : undefined,
      });

      if (linkErr || !linkData?.properties?.action_link) {
        const msg = linkErr?.message || "";
        // Do not leak whether an email is registered
        if (/not found|no user|unable to find|user not found/i.test(msg)) {
          return jsonResponse({ ok: true }, 200, req);
        }
        throw new Error(msg || "Failed to generate password reset link.");
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .ilike("email", cleanEmail)
        .maybeSingle();

      const fullName = profile?.full_name || "Member";
      const resetLink = linkData.properties.action_link;

      const html = wrapEmailLayout(
        "Password Reset Request",
        `
          <p style="margin-top:0;">Hi <strong>${escapeHtml(fullName)}</strong>,</p>
          <p>We received a request to reset the password for your Fatama Fighting Dragons account (<strong>${escapeHtml(cleanEmail)}</strong>).</p>
          <p>Click the button below to choose a new password:</p>
          <div style="margin:20px 0;">
            <a class="ffd-btn" href="${escapeHtml(resetLink)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:12px 22px; border-radius:8px; background:#c8141c; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none;">Reset My Password</a>
          </div>
          <div style="background:#161314; padding:14px; border-radius:8px; border:1px solid #2e2627; color:#d6ceca; margin-bottom:14px;">
            <div style="font-size:12px; color:#a99f98; margin-bottom:6px;">
              This link expires in <strong style="color:#f5c451;">1 hour</strong> and can only be used once. If the button above doesn't work, copy and paste this link into your browser:
            </div>
            <div style="font-size:11px; word-break:break-all; color:#f5c451;">${escapeHtml(resetLink)}</div>
          </div>
          <p style="margin-bottom:0; color:#a99f98; font-size:12px;">If you did not request a password reset, you can safely ignore this email &mdash; your password will remain unchanged.</p>
        `,
      );

      await transporter.sendMail({
        from,
        to: cleanEmail,
        subject: "Reset Your Fatama Fighting Dragons Password",
        headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
        html,
      });

      return jsonResponse({ ok: true }, 200, req);
    }

    if (action === "new_device_login") {
      const { email, fullName, deviceLabel } = payload;
      if (!email) return jsonResponse({ ok: false, error: "Missing email" }, 400);

      const html = wrapEmailLayout(
        "New Device Login Detected",
        `
          <p style="margin-top:0;">Hi <strong>${escapeHtml(fullName || "Member")}</strong>,</p>
          <p>Your account was just signed into from a new browser or device:</p>
          <div style="background:#161314; padding:14px; border-radius:8px; border:1px solid #2e2627; color:#d6ceca;">
            <div><strong>Device / Browser:</strong> ${escapeHtml(deviceLabel || "Unknown Device")}</div>
            <div><strong>Time:</strong> ${escapeHtml(new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }))}</div>
          </div>
          <p style="margin-bottom:0; color:#ffb4b4; font-weight:600;">If this wasn't you, change your password right away in Profile &amp; Settings.</p>
        `,
      );

      await transporter.sendMail({
        from,
        to: email,
        subject: "[Security Alert] New Device Login to Your Fatama Account",
        html,
      });
      return jsonResponse({ ok: true });
    }

    if (action === "send_2fa_code") {
      const { userId, email, fullName } = payload;
      if (!userId || !email) return jsonResponse({ ok: false, error: "Missing userId or email" }, 400);

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await admin.from("login_2fa_codes").insert({
        user_id: userId,
        email,
        code,
        expires_at: expiresAt,
        used: false,
      });

      const html = wrapEmailLayout(
        "Your 2FA Verification Code",
        `
          <p style="margin-top:0;">Hi <strong>${escapeHtml(fullName || "Member")}</strong>,</p>
          <p>Use the 6-digit verification code below to complete your sign-in. It expires in <strong>10 minutes</strong>:</p>
          <div style="text-align:center; margin:18px 0;">
            <span style="display:inline-block; font-size:28px; font-weight:800; letter-spacing:6px; padding:12px 24px; background:#161314; border:1px solid #f5c451; border-radius:10px; color:#f5c451;">${code}</span>
          </div>
          <p style="margin-bottom:0; color:#a99f98; font-size:12px;">If you did not try to sign in, you can safely ignore this email and consider changing your password.</p>
        `,
      );

      await transporter.sendMail({
        from,
        to: email,
        subject: `${code} is your Fatama Fighting Dragons 2FA Code`,
        html,
      });
      return jsonResponse({ ok: true });
    }

    if (action === "start_pending_registration") {
      const { email, password, metadata = {} } = payload;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const pwdStr = String(password || "");
      const isStrongPwd = pwdStr.length >= 8 && /[A-Z]/.test(pwdStr) && /[a-z]/.test(pwdStr) && /[0-9]/.test(pwdStr) && /[^A-Za-z0-9]/.test(pwdStr);
      if (!cleanEmail || !isStrongPwd) {
        return jsonResponse({ ok: false, error: "Valid email and strong password (8+ chars with uppercase, lowercase, number, and symbol) are required." }, 400);
      }

      // Clean up expired pending registrations
      await admin.from("pending_registrations").delete().lt("expires_at", new Date().toISOString());

      // Check if an account already exists in profiles
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        return jsonResponse({ ok: false, error: "An account with this email already exists. Please log in instead." }, 409);
      }

      // Rate limit resends/re-submits to 45 seconds per email
      const { data: existingPending } = await admin
        .from("pending_registrations")
        .select("id, last_sent_at")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingPending?.last_sent_at) {
        const elapsedMs = Date.now() - new Date(existingPending.last_sent_at).getTime();
        if (elapsedMs < 45 * 1000) {
          const waitSec = Math.ceil((45 * 1000 - elapsedMs) / 1000);
          return jsonResponse({ ok: false, error: `Please wait ${waitSec}s before requesting another verification code.` }, 429);
        }
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { error: upsertErr } = await admin
        .from("pending_registrations")
        .upsert({
          email: cleanEmail,
          password_plain: String(password),
          code,
          payload: metadata,
          attempts: 0,
          last_sent_at: nowIso,
          expires_at: expiresAt,
        }, { onConflict: "email" });

      if (upsertErr) {
        throw new Error(`Failed to save pending registration: ${upsertErr.message}`);
      }

      const studentName = String(metadata.full_name || metadata.first_name || "Future Dragon").trim();
      const html = wrapEmailLayout(
        "Verify Your Registration",
        `
          <p style="margin-top:0;">Hi <strong>${escapeHtml(studentName)}</strong>,</p>
          <p>Enter the 6-digit verification code below to confirm your email and create your Fatama Fighting Dragons student account. This code expires in <strong>15 minutes</strong>:</p>
          <div style="text-align:center; margin:18px 0;">
            <span style="display:inline-block; font-size:28px; font-weight:800; letter-spacing:6px; padding:12px 24px; background:#161314; border:1px solid #f5c451; border-radius:10px; color:#f5c451;">${code}</span>
          </div>
          <p style="margin-bottom:0; color:#a99f98; font-size:12px;">If you did not request this registration, you can safely ignore this email — no account has been created.</p>
        `,
      );

      await transporter.sendMail({
        from,
        to: cleanEmail,
        subject: `${code} is your Fatama Fighting Dragons Verification Code`,
        html,
      });

      return jsonResponse({ ok: true });
    }

    if (action === "resend_pending_registration") {
      const cleanEmail = String(payload.email || "").trim().toLowerCase();
      if (!cleanEmail) {
        return jsonResponse({ ok: false, error: "Email is required." }, 400);
      }

      const { data: pending, error: pErr } = await admin
        .from("pending_registrations")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (pErr || !pending) {
        return jsonResponse({ ok: false, error: "Pending registration expired. Please submit the registration form again." }, 404);
      }

      const elapsedMs = Date.now() - new Date(pending.last_sent_at).getTime();
      if (elapsedMs < 45 * 1000) {
        const waitSec = Math.ceil((45 * 1000 - elapsedMs) / 1000);
        return jsonResponse({ ok: false, error: `Please wait ${waitSec}s before resending.` }, 429);
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await admin
        .from("pending_registrations")
        .update({ code, attempts: 0, last_sent_at: new Date().toISOString(), expires_at: expiresAt })
        .eq("id", pending.id);

      const studentName = String(pending.payload?.full_name || pending.payload?.first_name || "Future Dragon").trim();
      const html = wrapEmailLayout(
        "Your New Verification Code",
        `
          <p style="margin-top:0;">Hi <strong>${escapeHtml(studentName)}</strong>,</p>
          <p>Here is your new 6-digit verification code (expires in <strong>15 minutes</strong>):</p>
          <div style="text-align:center; margin:18px 0;">
            <span style="display:inline-block; font-size:28px; font-weight:800; letter-spacing:6px; padding:12px 24px; background:#161314; border:1px solid #f5c451; border-radius:10px; color:#f5c451;">${code}</span>
          </div>
        `,
      );

      await transporter.sendMail({
        from,
        to: cleanEmail,
        subject: `${code} is your Fatama Fighting Dragons Verification Code`,
        html,
      });

      return jsonResponse({ ok: true });
    }

    if (action === "verify_pending_registration") {
      const cleanEmail = String(payload.email || "").trim().toLowerCase();
      const cleanCode = String(payload.code || "").trim();
      if (!cleanEmail || !cleanCode) {
        return jsonResponse({ ok: false, error: "Email and verification code are required." }, 400);
      }

      const { data: pending, error: pErr } = await admin
        .from("pending_registrations")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (pErr || !pending) {
        return jsonResponse({ ok: false, error: "No pending registration found. Please submit the form again." }, 404);
      }

      if (new Date(pending.expires_at).getTime() < Date.now()) {
        await admin.from("pending_registrations").delete().eq("id", pending.id);
        return jsonResponse({ ok: false, error: "Verification code expired. Please submit the registration form again." }, 400);
      }

      if ((pending.attempts || 0) >= 5) {
        await admin.from("pending_registrations").delete().eq("id", pending.id);
        return jsonResponse({ ok: false, error: "Too many incorrect attempts. Please submit the registration form again." }, 429);
      }

      if (String(pending.code).trim() !== cleanCode) {
        await admin.from("pending_registrations").update({ attempts: (pending.attempts || 0) + 1 }).eq("id", pending.id);
        return jsonResponse({ ok: false, error: "Invalid verification code. Please check your email and try again." }, 400);
      }

      // Clean up any orphaned remnants from a previously deleted account with this email
      await admin.from("payments").delete().is("student_id", null).ilike("student_email", cleanEmail);
      await admin.from("registrations").delete().is("user_id", null).ilike("student_email", cleanEmail);

      // Code matches — now create the verified user in auth.users
      const meta = pending.payload || {};
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: pending.password_plain,
        email_confirm: true,
        user_metadata: meta,
      });

      if (createErr) {
        if (/already|registered|exists/i.test(createErr.message || "")) {
          await admin.from("pending_registrations").delete().eq("id", pending.id);
          return jsonResponse({ ok: false, error: "An account with this email already exists. Please log in instead." }, 409);
        }
        throw new Error(createErr.message || "Failed to create verified account.");
      }

      // Ensure public.profiles has all registration fields immediately (bypasses client RLS timing)
      if (created?.user?.id) {
        const gName = meta.parent_name || meta.emergency_name || null;
        const gRel = meta.relationship || (meta.emergency_name ? "Emergency Contact" : null);
        await admin.from("profiles").upsert({
          id: created.user.id,
          email: cleanEmail,
          first_name: meta.first_name || "",
          last_name: meta.last_name || "",
          full_name: meta.full_name || cleanEmail,
          role: "student",
          phone: meta.phone || "",
          gender: meta.gender || "",
          dob: meta.dob || null,
          address: meta.address || "",
          proficiency: meta.proficiency || "White Belt (Beginner)",
          belt_rank: meta.proficiency || "White Belt",
          guardian_name: gName,
          guardian_relation: gRel,
          emergency_name: meta.emergency_name || null,
          emergency_phone: meta.emergency_phone || meta.parent_phone || null,
          email_verified: true,
        }, { onConflict: "id" });
      }

      await admin.from("pending_registrations").delete().eq("id", pending.id);
      return jsonResponse({ ok: true, user: created.user });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400, req);
  } catch (err) {
    console.error("[send-email] error:", err);
    return jsonResponse({ ok: false, error: err?.message || String(err) }, 500, req);
  }
});
