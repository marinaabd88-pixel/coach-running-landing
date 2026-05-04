/**
 * עדכן כאן פעם אחת — שאר האתר יסתנכרן (וואטסאפ, רשתות, טופס).
 */
window.SITE_CONFIG = {
  whatsappUrl: "https://wa.me/message/PKCKL7OAYAHHG1",
  instagramUrl: "https://www.instagram.com/maxkogank?igsh=aTVxdWkweHZvaXdh",
  facebookUrl: "https://www.facebook.com/share/1AgWuvfi3K/",
  /** אימייל ל-FormSubmit: https://formsubmit.co */
  formSubmitEmail: "marinaabd88@gmail.com",
  /** כתובת האתר הסופית (לקנוניקל ול-og:url אחרי פרסום) */
  siteUrl: "",

  /**
   * גרסת מטמון ל־assets/data/gallery-manifest.json — העלו אחרי עדכון הגלריה (npm run gallery:manifest).
   */
  galleryManifestVersion: 4,

  /**
   * ביקורות Google (Places API — New). ב-Google Cloud: הפעלת Places API, מפתח עם הגבלה ל-HTTP referrer של האתר.
   * Place ID: מזהה ChIJ... מכרטיס העסק בגוגל מפות (פרטים → העתקת מזהה מקום).
   * השאירו ריקים כדי להסתיר את בלוק הביקורות האוטומטי (נשאר קישור ידני אם הוגדר googleMapsReviewUrl).
   */
  googlePlaceId: "",
  googlePlacesApiKey: "",
  /** קישור לדף הביקורות/כרטיס העסק בגוגל (גיבוי וכפתור "עוד בגוגל") */
  googleMapsReviewUrl: "",
  /** כמה ביקורות מגוגל להציג בכל הטעינה (מקס׳ מה-API) */
  googleReviewsLimit: 6,

  /**
   * תמונת רקע בראש העמוד — נתיבים יחסיים ל-index.html.
   * הסקריפט מנסה לפי הסדר עד שקובץ נטען (jpg/jpeg/png/webp, תיקייה או שטוח).
   */
  heroImageCandidates: [
    "images/gallery/Header/Header.jpg",
    "images/gallery/Header/Header.jpeg",
    "images/gallery/Header/Header.png",
    "images/gallery/Header/Header.webp",
    "images/gallery/Header/header.jpg",
    "images/gallery/Header/header.jpeg",
    "images/gallery/Header.JPG",
    "images/gallery/Header.jpg",
    "images/gallery/header.jpg",
  ],
};
