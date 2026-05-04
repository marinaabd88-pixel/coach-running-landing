(function () {
  var cfg = window.SITE_CONFIG || {};
  var base = (cfg.siteUrl || "").replace(/\/$/, "");

  function applyConfig() {
    var pageBase = "";
    try {
      // Prefer explicit siteUrl if set (and not placeholder); otherwise derive from current URL.
      var cfgUrl = (base || "").trim();
      if (cfgUrl && cfgUrl.indexOf("example.com") === -1) {
        pageBase = new URL(cfgUrl.replace(/\/?$/, "/")).toString();
      } else {
        // Works for GitHub Pages subpaths too (e.g. /repo-name/).
        pageBase = new URL(".", window.location.href).toString();
      }
    } catch (e) {
      try {
        pageBase = new URL(".", window.location.href).toString();
      } catch (e2) {
        pageBase = "";
      }
    }

    // Lead form submits to /api/lead (Vercel) – no client-side override needed.
    var nextInput = document.getElementById("form-next-url");
    if (nextInput) {
      if (pageBase) {
        nextInput.value = new URL("?sent=1", pageBase).toString();
      } else {
        nextInput.value = "?sent=1";
      }
    }
    if (pageBase) {
      var canon = document.getElementById("canonical-link");
      if (canon) {
        canon.setAttribute("href", pageBase);
      }
      var ogUrl = document.getElementById("og-url");
      if (ogUrl) {
        ogUrl.setAttribute("content", pageBase);
      }
      var ogImg = document.getElementById("og-image");
      if (ogImg) {
        ogImg.setAttribute("content", new URL("images/og-cover.jpg", pageBase).toString());
      }
    }
    document.querySelectorAll(".js-ig").forEach(function (a) {
      if (cfg.instagramUrl) {
        a.setAttribute("href", cfg.instagramUrl);
      }
    });
    document.querySelectorAll(".js-fb").forEach(function (a) {
      if (cfg.facebookUrl) {
        a.setAttribute("href", cfg.facebookUrl);
      }
    });
    var waHref = cfg.whatsappUrl || "https://wa.me/message/PKCKL7OAYAHHG1";
    document.querySelectorAll(".js-wa-prefill").forEach(function (a) {
      a.setAttribute("href", waHref);
    });
  }

  applyConfig();

  // Submit lead form via fetch (no redirect) to avoid 404s and work on all hosts.
  (function initLeadForm() {
    var form = document.getElementById("lead-form");
    if (!form) return;
    var ok = document.getElementById("form-success");
    var toast = document.getElementById("toast-success");
    var err = document.getElementById("form-error");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }

      var btn = form.querySelector("button[type=\"submit\"]");
      var prevText = btn ? btn.textContent : "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = "שולח…";
      }

      fetch(form.action || "/api/lead", {
        method: "POST",
        body: new FormData(form),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("bad_status");
          return r.json().catch(function () {
            return { ok: true };
          });
        })
        .then(function (data) {
          if (data && data.ok === false) throw new Error(data.error || "error");

          form.hidden = true;
          if (ok) ok.hidden = false;

          if (toast) {
            toast.hidden = false;
            toast.classList.add("is-open");
            window.requestAnimationFrame(function () {
              toast.classList.add("is-visible");
            });
            var dismissed = false;
            var dismiss = function () {
              if (dismissed) return;
              dismissed = true;
              toast.classList.remove("is-open");
              toast.classList.remove("is-visible");
              toast.classList.add("is-hiding");
              window.setTimeout(function () {
                toast.hidden = true;
                toast.classList.remove("is-hiding");
              }, 220);
            };
            toast.addEventListener("click", dismiss, { once: true });
            window.setTimeout(dismiss, 3000);
          }
        })
        .catch(function () {
          if (err) {
            err.hidden = false;
            err.textContent =
              "לא הצלחנו לשלוח כרגע. נסו שוב בעוד רגע או כתבו בוואטסאפ.";
          }
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = prevText || "שלחו — ואחזור אליכם";
          }
        });
    });
  })();

  if (typeof window.location.search !== "undefined" && window.location.search.indexOf("sent=1") !== -1) {
    var formEl = document.getElementById("lead-form");
    var ok = document.getElementById("form-success");
    if (formEl) {
      formEl.hidden = true;
    }
    if (ok) {
      ok.hidden = false;
    }

    var toast = document.getElementById("toast-success");
    if (toast) {
      toast.hidden = false;
      toast.classList.add("is-open");
      window.requestAnimationFrame(function () {
        toast.classList.add("is-visible");
      });
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        window.scrollTo(0, 0);
      }
      try {
        var url0 = new URL(window.location.href);
        url0.searchParams.delete("sent");
        window.history.replaceState({}, "", url0.toString());
      } catch (e) {}
      var dismissed = false;
      var dismiss = function () {
        if (dismissed) return;
        dismissed = true;
        toast.classList.remove("is-open");
        toast.classList.remove("is-visible");
        toast.classList.add("is-hiding");
        window.setTimeout(function () {
          toast.hidden = true;
          toast.classList.remove("is-hiding");
        }, 220);
      };
      toast.addEventListener("click", dismiss, { once: true });
      window.setTimeout(dismiss, 3000);
    }
  }

  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var GALLERY_PAGE_SIZE = 6;

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
  }

  function renderStarsHtml(rating) {
    var n = Math.round(Number(rating) || 0);
    if (n < 0) n = 0;
    if (n > 5) n = 5;
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out +=
        '<span class="google-star' + (i <= n ? " is-on" : "") + '">★</span>';
    }
    return out;
  }

  function placeDisplayName(data) {
    if (!data || !data.displayName) return "";
    var d = data.displayName;
    if (typeof d === "string") return d;
    if (d.text) return d.text;
    return "";
  }

  function initGoogleReviews() {
    var placeId = (cfg.googlePlaceId || "").trim().replace(/^places\//, "");
    var apiKey = (cfg.googlePlacesApiKey || "").trim();
    var mapsUrl = (cfg.googleMapsReviewUrl || "").trim();
    var limit = Number(cfg.googleReviewsLimit);
    if (!limit || limit < 1) limit = 6;
    if (limit > 20) limit = 20;

    var block = document.getElementById("google-reviews-block");
    var summaryEl = document.getElementById("google-reviews-summary");
    var gridEl = document.getElementById("google-reviews-grid");
    var errEl = document.getElementById("google-reviews-error");
    if (!block || !summaryEl || !gridEl || !errEl) return;

    var showBlock = (placeId && apiKey) || mapsUrl;
    if (!showBlock) return;
    block.hidden = false;

    if (!placeId || !apiKey) {
      summaryEl.textContent = "";
      var wrapOnly = document.createElement("div");
      wrapOnly.className = "google-reviews-summary-inner";
      var lead = document.createElement("p");
      lead.className = "google-reviews-lead";
      lead.textContent = "ביקורות מאומתות בגוגל מפות";
      wrapOnly.appendChild(lead);
      if (mapsUrl) {
        var aOnly = document.createElement("a");
        aOnly.className = "btn btn-outline google-reviews-cta";
        aOnly.href = mapsUrl;
        aOnly.target = "_blank";
        aOnly.rel = "noopener noreferrer";
        aOnly.textContent = "צפייה בהמלצות בגוגל";
        wrapOnly.appendChild(aOnly);
      }
      summaryEl.appendChild(wrapOnly);
      return;
    }

    summaryEl.textContent = "טוען ביקורות מגוגל…";
    gridEl.innerHTML = "";
    errEl.hidden = true;
    errEl.textContent = "";

    var url =
      "https://places.googleapis.com/v1/places/" + encodeURIComponent(placeId);
    fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "rating,userRatingCount,reviews,displayName,googleMapsUri",
      },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("google");
        return r.json();
      })
      .then(function (data) {
        errEl.hidden = true;
        var name = placeDisplayName(data);
        var rating = data.rating;
        var count = data.userRatingCount;
        var uri = data.googleMapsUri || mapsUrl;
        var reviews = Array.isArray(data.reviews)
          ? data.reviews.slice(0, limit)
          : [];

        var summaryHtml =
          '<div class="google-reviews-summary-inner">' +
          (name
            ? '<div class="google-reviews-place">' + escapeHtml(name) + "</div>"
            : "") +
          '<div class="google-reviews-meta">' +
          '<span class="google-reviews-stars" aria-label="דירוג בגוגל">' +
          renderStarsHtml(rating) +
          "</span>" +
          (rating != null
            ? '<span class="google-reviews-score">' +
              escapeHtml(String(rating)) +
              "</span>"
            : "") +
          (count != null
            ? '<span class="google-reviews-count">' +
              escapeHtml(String(count)) +
              " ביקורות</span>"
            : "") +
          "</div>" +
          (uri
            ? '<a class="btn btn-outline google-reviews-cta" href="' +
              escapeHtml(uri) +
              '" target="_blank" rel="noopener noreferrer">כל הביקורות בגוגל</a>'
            : "") +
          "</div>";
        summaryEl.innerHTML = summaryHtml;

        gridEl.innerHTML = "";
        reviews.forEach(function (rev) {
          var author =
            (rev.authorAttribution && rev.authorAttribution.displayName) ||
            "מבקר/ת";
          var photo =
            rev.authorAttribution && rev.authorAttribution.photoUri
              ? rev.authorAttribution.photoUri
              : "";
          var textBody = "";
          if (rev.text && rev.text.text) textBody = rev.text.text;
          else if (rev.originalText && rev.originalText.text) {
            textBody = rev.originalText.text;
          }
          var timeDesc = rev.relativePublishTimeDescription || "";
          var revRating = rev.rating;

          var fig = document.createElement("figure");
          fig.className = "testimonial card testimonial--google";
          var head = document.createElement("div");
          head.className = "testimonial-google-head";
          if (photo) {
            var im = document.createElement("img");
            im.className = "testimonial-google-avatar";
            im.src = photo;
            im.alt = "";
            im.width = 40;
            im.height = 40;
            im.loading = "lazy";
            im.decoding = "async";
            im.referrerPolicy = "no-referrer";
            head.appendChild(im);
          }
          var meta = document.createElement("div");
          meta.className = "testimonial-google-meta";
          var strong = document.createElement("strong");
          strong.className = "testimonial-google-author";
          strong.textContent = author;
          meta.appendChild(strong);
          if (timeDesc || revRating != null) {
            var small = document.createElement("div");
            small.className = "testimonial-google-sub";
            small.textContent =
              (revRating != null ? "דירוג " + revRating + " · " : "") +
              timeDesc;
            meta.appendChild(small);
          }
          head.appendChild(meta);
          var bq = document.createElement("blockquote");
          bq.textContent = textBody;
          var cap = document.createElement("figcaption");
          cap.className = "google-review-source";
          cap.textContent = "ביקורת מגוגל";
          fig.appendChild(head);
          fig.appendChild(bq);
          fig.appendChild(cap);
          gridEl.appendChild(fig);
        });

        if (!reviews.length) {
          var empty = document.createElement("p");
          empty.className = "google-reviews-empty";
          empty.textContent =
            "אין טקסט ביקורות זמין להצגה כאן — ניתן לצפות בכרטיס העסק בגוגל.";
          gridEl.appendChild(empty);
        }
      })
      .catch(function () {
        summaryEl.innerHTML = "";
        errEl.hidden = false;
        errEl.textContent = "";
        errEl.appendChild(
          document.createTextNode(
            "לא ניתן לטעון ביקורות אוטומטית (מפתח API, הפעלת Places API, או הגבלות רשת/דפדפן). "
          )
        );
        if (mapsUrl) {
          var aErr = document.createElement("a");
          aErr.href = mapsUrl;
          aErr.target = "_blank";
          aErr.rel = "noopener noreferrer";
          aErr.textContent = "פתיחת ביקורות בגוגל";
          errEl.appendChild(aErr);
        }
        gridEl.innerHTML = "";
      });
  }

  function isVideoSrc(src) {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src || "");
  }

  function galleryMediaUrl(src) {
    if (!src) return src;
    try {
      return src
        .split("/")
        .map(function (part) {
          return encodeURIComponent(part);
        })
        .join("/");
    } catch (e) {
      return src;
    }
  }

  function normalizeGalleryItems(raw) {
    if (!raw || !raw.length) return [];
    return raw
      .map(function (item) {
        if (typeof item === "string") return { src: item };
        return { src: (item && item.src) || "" };
      })
      .filter(function (x) {
        return x.src;
      });
  }

  function loadGalleryManifest(cfg) {
    var v =
      cfg.galleryManifestVersion != null ? cfg.galleryManifestVersion : 1;
    var url = "assets/data/gallery-manifest.json?v=" + v;
    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("manifest");
        return r.json();
      })
      .then(function (data) {
        return normalizeGalleryItems(Array.isArray(data) ? data : []);
      });
  }

  function initGallery() {
    var root = document.getElementById("gallery-root");
    var prevBtn = document.getElementById("gallery-prev");
    var nextBtn = document.getElementById("gallery-next");
    var hintEl = document.getElementById("gallery-hint");
    var lightbox = document.getElementById("gallery-lightbox");
    var lightboxStage = document.getElementById("gallery-lightbox-stage");
    var lightboxCounter = document.getElementById("gallery-lightbox-counter");
    var lightboxClose = document.getElementById("gallery-lightbox-close");
    var lightboxPrev = document.getElementById("gallery-lightbox-prev");
    var lightboxNext = document.getElementById("gallery-lightbox-next");
    var lightboxBackdrop = lightbox
      ? lightbox.querySelector("[data-lightbox-close]")
      : null;
    if (!root || !prevBtn || !nextBtn) return;

    var items = [];
    var page = 0;
    var lbIndex = 0;
    var prevFocus = null;
    var expandIconSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';

    function totalPages() {
      if (!items.length) return 1;
      return Math.ceil(items.length / GALLERY_PAGE_SIZE);
    }

    function renderLightboxMedia() {
      if (!lightboxStage || !items.length) return;
      var n = items.length;
      lbIndex = Math.max(0, Math.min(Number(lbIndex) || 0, n - 1));
      lightboxStage.querySelectorAll("video").forEach(function (v) {
        v.pause();
      });
      lightboxStage.innerHTML = "";
      var item = items[lbIndex];
      if (!item) return;
      var src = item.src;
      var url = galleryMediaUrl(src);
      if (isVideoSrc(src)) {
        var v = document.createElement("video");
        v.className = "gallery-lightbox__media";
        v.src = url;
        v.controls = true;
        v.setAttribute("playsinline", "");
        v.setAttribute("preload", "metadata");
        lightboxStage.appendChild(v);
      } else {
        var im = document.createElement("img");
        im.className = "gallery-lightbox__media";
        im.src = url;
        im.alt = "";
        lightboxStage.appendChild(im);
      }
      if (lightboxCounter) {
        lightboxCounter.textContent = lbIndex + 1 + " / " + items.length;
      }
      var single = items.length <= 1;
      if (lightboxPrev) lightboxPrev.disabled = single;
      if (lightboxNext) lightboxNext.disabled = single;
    }

    function closeLightbox() {
      if (!lightbox || lightbox.hidden) return;
      if (lightboxStage) {
        lightboxStage.querySelectorAll("video").forEach(function (v) {
          v.pause();
        });
        lightboxStage.innerHTML = "";
      }
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("gallery-lightbox-open");
      document.removeEventListener("keydown", onLightboxKeydown);
      if (prevFocus && typeof prevFocus.focus === "function") {
        try {
          prevFocus.focus();
        } catch (e1) {}
      }
      prevFocus = null;
    }

    function openLightbox(globalIdx) {
      if (!lightbox || !lightboxStage || !items.length) return;
      var idx = Number(globalIdx);
      if (globalIdx == null || globalIdx === "" || isNaN(idx)) return;
      if (idx < 0 || idx >= items.length) return;
      root.querySelectorAll("video").forEach(function (v) {
        v.pause();
      });
      lbIndex = idx;
      prevFocus = document.activeElement;
      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("gallery-lightbox-open");
      renderLightboxMedia();
      document.addEventListener("keydown", onLightboxKeydown);
      if (lightboxClose && typeof lightboxClose.focus === "function") {
        try {
          lightboxClose.focus();
        } catch (e2) {}
      }
    }

    function stepLightbox(delta) {
      var n = items.length;
      if (!n || n <= 1) return;
      var cur = Number(lbIndex) || 0;
      lbIndex = (cur + delta + n) % n;
      renderLightboxMedia();
    }

    function onLightboxKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepLightbox(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepLightbox(1);
      }
    }

    if (lightbox && lightboxClose) {
      lightboxClose.addEventListener("click", function () {
        closeLightbox();
      });
    }
    if (lightboxBackdrop) {
      lightboxBackdrop.addEventListener("click", function () {
        closeLightbox();
      });
    }
    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", function () {
        stepLightbox(-1);
      });
    }
    if (lightboxNext) {
      lightboxNext.addEventListener("click", function () {
        stepLightbox(1);
      });
    }

    function attachOpenButton(figure, src, globalIndex) {
      var openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "gallery-item__open";
      openBtn.setAttribute(
        "aria-label",
        isVideoSrc(src) ? "פתיחת וידאו בתצוגה מורחבת" : "פתיחת תמונה בתצוגה מורחבת"
      );
      var icon = document.createElement("span");
      icon.className = "gallery-item__open-icon";
      icon.innerHTML = expandIconSvg;
      openBtn.appendChild(icon);
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openLightbox(globalIndex);
      });
      figure.appendChild(openBtn);
    }

    function render() {
      root.querySelectorAll("video").forEach(function (v) {
        v.pause();
      });
      root.innerHTML = "";

      var start = page * GALLERY_PAGE_SIZE;
      var slice = items.slice(start, start + GALLERY_PAGE_SIZE);

      slice.forEach(function (item, idx) {
        var globalIndex = start + idx;
        var article = document.createElement("article");
        article.className = "gallery-item";
        var figure = document.createElement("figure");
        var src = item.src;
        var url = galleryMediaUrl(src);

        if (isVideoSrc(src)) {
          var video = document.createElement("video");
          video.className = "gallery-media";
          video.src = url;
          video.muted = true;
          video.setAttribute("playsinline", "");
          video.setAttribute("preload", "metadata");
          figure.appendChild(video);
        } else {
          var img = document.createElement("img");
          img.className = "gallery-media";
          img.src = url;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          img.onerror = function () {
            if (img.parentNode) img.parentNode.removeChild(img);
            var ph = document.createElement("div");
            ph.className = "gallery-placeholder";
            ph.textContent = "לא נטען: " + src;
            figure.appendChild(ph);
          };
          figure.appendChild(img);
        }

        attachOpenButton(figure, src, globalIndex);

        article.appendChild(figure);
        root.appendChild(article);
      });

      var tp = totalPages();
      prevBtn.disabled = page <= 0;
      nextBtn.disabled = page >= tp - 1 || items.length === 0;

      if (hintEl) {
        if (!items.length) {
          hintEl.innerHTML =
            "אין קבצים להצגה. הוסיפו תמונות/סרטונים ל־<code>images/gallery/Gallery/</code> והריצו <code>npm run gallery:manifest</code> (או ערכו את הרשימה ב־<code>gallery-data.js</code>).";
        } else {
          hintEl.textContent =
            "עמוד " +
            (page + 1) +
            " מתוך " +
            tp +
            " · " +
            items.length +
            " קבצים · לחצו על פריט לתצוגה מורחבת";
        }
      }
    }

    function go(delta) {
      var tp = totalPages();
      var n = page + delta;
      if (n < 0 || n >= tp) return;
      page = n;
      render();
    }

    prevBtn.addEventListener("click", function () {
      go(-1);
    });
    nextBtn.addEventListener("click", function () {
      go(1);
    });

    loadGalleryManifest(cfg)
      .catch(function () {
        return null;
      })
      .then(function (list) {
        var fromManifest = Array.isArray(list) ? list : null;
        var merged;
        if (fromManifest === null) {
          merged = normalizeGalleryItems(window.GALLERY_ITEMS || []);
        } else if (fromManifest.length > 0) {
          merged = fromManifest;
        } else {
          merged = normalizeGalleryItems(window.GALLERY_ITEMS || []);
        }
        items = merged;
        page = 0;
        render();
      });
  }

  initGoogleReviews();
  initGallery();
})();
