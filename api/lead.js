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

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on("data", function (chunk) {
      chunks.push(chunk);
    });
    req.on("end", function () {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

function looksLikeEmail(s) {
  if (!s || String(s).length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  var apiKey = String(process.env.RESEND_API_KEY || "").trim();
  var toEmail = String(process.env.TO_EMAIL || "").trim();
  var fromEmail = String(
    process.env.FROM_EMAIL || "onboarding@resend.dev"
  ).trim();

  if (!apiKey || !toEmail) {
    console.error("lead: missing RESEND_API_KEY or TO_EMAIL");
    return res.status(500).json({ ok: false, error: "missing_env" });
  }

  try {
    var raw = await readBody(req);

    var contentType = (req.headers["content-type"] || "").toLowerCase();
    var data = {};

    if (contentType.indexOf("application/x-www-form-urlencoded") !== -1) {
      var params = new URLSearchParams(raw);
      params.forEach(function (v, k) {
        data[k] = v;
      });
    } else if (contentType.indexOf("multipart/form-data") !== -1) {
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

    var payload = {
      from: fromEmail,
      to: [toEmail],
      subject: subject,
      text: text,
      html: html,
    };

    if (looksLikeEmail(email)) {
      payload.reply_to = email;
    }

    var resendResp;
    try {
      resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          // Required by Resend; requests without User-Agent return 403 (error 1010)
          "User-Agent": "coach-running-landing/1.0 (contact-form)",
        },
        body: JSON.stringify(payload),
      });
    } catch (netErr) {
      console.error("lead: fetch to Resend failed", netErr && netErr.message);
      return res.status(500).json({ ok: false, error: "upstream_unreachable" });
    }

    if (!resendResp.ok) {
      var errText = await resendResp.text();
      console.error(
        "lead: Resend HTTP",
        resendResp.status,
        errText.slice(0, 800)
      );
      return res.status(502).json({
        ok: false,
        error: "resend_failed",
        detail: errText.slice(0, 500),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("lead: server_error", e && e.message);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
};
