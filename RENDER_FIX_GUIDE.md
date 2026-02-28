# 🚀 Render Deployment Guide - Fix Sleeping Issue

## ⚠️ Problem: Website Still Sleeps on Paid Plan

If your website is still sleeping despite being on a $7/month paid plan, here's why and how to fix it:

---

## 🔍 Root Causes

### 1. **Only Backend is Paid (Frontend is Free)**
- Render has **separate services** for frontend and backend
- If your frontend is on the **free tier**, it will sleep after 15 minutes of inactivity
- Even though your backend is paid, users accessing the frontend will experience sleeping

### 2. **No External Pings**
- Render free tier sleeps without regular traffic
- Without scheduled pings, the frontend will still go idle

---

## ✅ Solutions

### **Solution 1: Upgrade BOTH Frontend and Backend to Paid Plans**

**This is the RECOMMENDED solution if you want zero downtime.**

#### In Render Dashboard:

1. **Check Your Current Services:**
   - Go to https://dashboard.render.com
   - Look at both your backend and frontend services
   - Check which plan each one is on

2. **Upgrade Frontend to Paid Plan:**
   - Click on your **frontend service** (ihmaket-frontend)
   - Go to **Settings** → **Instance Type**
   - Change from `Free` to `Starter ($7/month)`
   - Click **Save Changes**

3. **Verify Backend is on Paid Plan:**
   - Click on your **backend service** (ihmaket-backend)
   - Go to **Settings** → **Instance Type**
   - Ensure it shows `Starter ($7/month)` or higher
   - If not, upgrade it

**Total Cost: $14/month ($7 backend + $7 frontend) for zero downtime**

---

### **Solution 2: Use External Service (Free Alternative)**

You can use a free service like **UptimeRobot** or **Cron-job.org** to ping both your backend and frontend:

#### Using UptimeRobot (Free):

1. Go to https://uptimerobot.com
2. Sign up for a free account
3. Click **Add New Monitor**
4. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** iHmaket Backend
   - **URL:** https://ihmaket-backend.onrender.com/api/health
   - **Monitoring Interval:** 5 minutes (free tier)
5. Click **Create Monitor**
6. Repeat for frontend:
   - **URL:** https://ihmaket-frontend.onrender.com

**Note:** This only pings every 5 minutes (free tier), so there may still be brief cold starts.

---

## 🧪 Testing Your Fix

### 1. Check Backend Health
```bash
curl https://ihmaket-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "ServiceHub API is running"
}
```

### 2. Wait and Test

1. Wait 20+ minutes without accessing your site
2. Try to visit your website
3. If it loads instantly → **Fixed! ✅**
4. If it takes 15-30 seconds → Frontend is still on free tier

---

## 📊 Comparison of Solutions

| Solution | Backend Cost | Frontend Cost | Total Cost | Downtime | Setup Difficulty |
|----------|-------------|---------------|------------|----------|------------------|
| **Both Paid** | $7/mo | $7/mo | $14/mo | None | Easy |
| **UptimeRobot** | $7/mo | $0 | $7/mo | Occasional cold start | Easy |

---

## 🔧 Troubleshooting

### Backend Still Sleeping?

1. **Verify Plan:**
   - Go to Settings → Instance Type
   - Must be "Starter" ($7) or higher
   - Free plans ALWAYS sleep after 15 minutes

### Frontend Sleeping?

The frontend will **always sleep on free tier** after 15 minutes. You have two options:
- Upgrade to paid plan ($7/mo) - **Recommended**
- Accept 15-30 second cold starts on first visit

### UptimeRobot Not Working?

- Confirm the monitor status is **Up**
- Ensure the URL is correct and publicly accessible
- Set the interval to 5 minutes (free tier)

---

## 🎯 Recommended Action Plan

**For Best User Experience:**

1. ✅ Upgrade **both** frontend and backend to paid plans ($14/mo total)
2. ✅ Configure health checks for both services

**For Budget-Conscious:**

1. ✅ Keep backend paid ($7/mo)
2. ✅ Use UptimeRobot to ping backend and frontend
3. ✅ Accept occasional cold starts on frontend

---

## 📞 Additional Support

If you're still experiencing issues:

1. **Check Render Status:** https://status.render.com
2. **Contact Render Support:** help@render.com
3. **Share your logs:** Copy logs from Render dashboard

---

## 📝 Summary

**Your issue is likely:** Your **frontend is on the free tier**, not your backend.

**Quick fix:** Upgrade your frontend service to the Starter plan ($7/mo) in Render dashboard.

**Already done?** Add UptimeRobot monitors for both backend and frontend so they stay active.

---

Last Updated: February 26, 2026
