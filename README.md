# EasySell BD

অনলাইনে আয় প্ল্যাটফর্ম — ল্যান্ডিং, রেজিস্টার/লগইন (১০০ দেশ), ড্যাশবোর্ড, কাজ, উইথড্র, রেফার।

## ডেমো লগইন
- মোবাইল: `01700000000`
- পাসওয়ার্ড: `123456`

## Render-এ ডিপ্লয়

1. [Render](https://render.com) → **New +** → **Web Service**
2. GitHub রিপো `tajhatAti/kei` কানেক্ট করুন
3. **Branch:** `arena/01a0760d-kei`
4. Settings:
   - **Runtime:** Python
   - **Build Command:** *(খালি রাখুন)*
   - **Start Command:**
     ```
     python3 -m http.server $PORT --bind 0.0.0.0 --directory site
     ```
5. **Create Web Service**

অথবা Blueprint: Dashboard → **New +** → **Blueprint** → এই `render.yaml` সিলেক্ট করুন।

লোকালে চালাতে:

```bash
python3 -m http.server 8080 --bind 0.0.0.0 --directory site
```
