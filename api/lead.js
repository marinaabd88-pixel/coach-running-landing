function pickFirst(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj[k] != null && String(obj[k]).trim() !== "") return String(obj[k]).trim();
  }
  return "";
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  var apiKey = process.env.RESEND_API_KEY;
  var toEmail = process.env.TO_EMAIL;
  var fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey || !toEmail) {
    return res.status(500).json({ ok: false, error: "missing_env" });
  }

  try {
    var chunks = [];
    for await (var chunk of req) chunks.push(chunk);
    var raw = Buffer.concat(chunks).toString("utf8");

    var contentType = (req.headers["content-type"] || "").toLowerCase();
    var data = {};

    // We submit using multipart/form-data (FormData) from the browser.
    // Vercel Node runtime doesn't parse it automatically, so we also support urlencoded as a fallback.
    if (contentType.indexOf("application/x-www-form-urlencoded") !== -1) {
      var params = new URLSearchParams(raw);
      params.forEach(function (v, k) {
        data[k] = v;
      });
    } else if (contentType.indexOf("multipart/form-data") !== -1) {
      // Minimal multipart parser (fallback when clients send multipart).
      var boundaryMatch = contentType.match(/boundary\s*=\s*([^;]+)/i);
      if (boundaryMatch) {
        var boundaryRaw = boundaryMatch[1].trim().replace(/^[\"']|[\"']$/g, "");
        var boundary = "--" + boundaryRaw;
        var parts = raw.split(boundary);
        parts.forEach(function (p) {
          var nameMatch = p.match(/name=\"([^\"]+)\"/);
          if (!nameMatch) return;
          var key = nameMatch[1];
          var sep = p.indexOf("\r\n\r\n");
          if (sep === -1) sep = p.indexOf("\n\n");
          if (sep === -1) return;
          var head = p.slice(0, sep);
          var bodyPart = p.slice(sep);
          if (head.indexOf("filename=") !== -1) return;
          bodyPart = bodyPart.replace(/^\r\n\r\n|^\n\n/, "");
          var value = bodyPart.replace(/\r\n--\s*$/, "").replace(/\n--\s*$/, "").trim();
          if (value) data[key] = value;
        });
      }
    }

    // Honeypot (bots)
    if (pickFirst(data, ["_honey", "honey", "honeypot"]).length) {
      return res.status(200).json({ ok: true });
    }

    var name = pickFirst(data, ["שם", "name"]);
    var phone = pickFirst(data, ["טלפון", "phone"]);
    var email = pickFirst(data, ["אימייל", "email"]);
    var track = pickFirst(data, ["מסלול", "program", "track"]);
    var message = pickFirst(data, ["הודעה", "message"]);

    if (!name || !phone || !track) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    var subject = "פנייה חדשה מאתר — מקסים קוגן מאמן ריצה";
    var text =
      "שם: " +
      name +
      "\nטלפון: " +
      phone +
      (email ? "\nאימייל: " + email : "") +
      "\nמסלול: " +
      track +
      (message ? "\n\nהודעה:\n" + message : "");

    var html =
      "<div dir=\"rtl\" style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.6\">" +
      "<h2 style=\"margin:0 0 12px\">פנייה חדשה מאתר</h2>" +
      "<p style=\"margin:0 0 8px\"><strong>שם:</strong> " +
      escapeHtml(name) +
      "</p>" +
      "<p style=\"margin:0 0 8px\"><strong>טלפון:</strong> " +
      escapeHtml(phone) +
      "</p>" +
      (email
        ? "<p style=\"margin:0 0 8px\"><strong>אימייל:</strong> " +
          escapeHtml(email) +
          "</p>"
        : "") +
      "<p style=\"margin:0 0 8px\"><strong>מסלול:</strong> " +
      escapeHtml(track) +
      "</p>" +
      (message
        ? "<p style=\"margin:12px 0 0\"><strong>הודעה:</strong><br/>" +
          escapeHtml(message).replace(/\n/g, "<br/>") +
          "</p>"
        : "") +
      "</div>";

    var resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: subject,
        text: text,
        html: html,
        reply_to: email || undefined,
      }),
    });

    if (!resendResp.ok) {
      var errText = await resendResp.text();
      return res.status(502).json({ ok: false, error: "resend_failed", detail: errText });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
};

