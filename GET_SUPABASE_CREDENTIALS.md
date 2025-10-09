# 🗄️ Get Your Supabase Credentials

Since you've restored your Supabase instance, follow these steps to get your credentials and connect the real database:

## 📋 **Step-by-Step Instructions:**

### **Step 1: Go to Supabase Dashboard**
1. Visit: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Sign in** to your account
3. **Select your Recruily project** (the one you just restored)

### **Step 2: Get Your Project URL**
1. In your project dashboard, click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** in the settings menu
3. Find the **"Project URL"** section
4. **Copy the URL** (looks like: `https://abcdefghijk.supabase.co`)

### **Step 3: Get Your API Keys**
In the same API settings page:

1. **Anon Key** (public, safe to use in frontend):
   - Look for **"Project API keys"** section
   - Find the **"anon"** key marked as **"public"**
   - **Copy this key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

2. **Service Role Key** (secret, server-only):
   - In the same section, find **"service_role"** key
   - **Copy this key** (also starts with `eyJhbGciOiJIUzI1NiIs...`)

## 🔧 **Step 4: Update Your .env.local File**

Open your `.env.local` file and replace the placeholder values:

```bash
# Replace these with your actual values:
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...your_actual_service_role_key
```

## ✅ **Step 5: Test the Connection**

After updating your credentials:

1. **Restart your application**:
   ```bash
   # Stop your current server (Ctrl+C)
   npm run dev
   ```

2. **Test database connection**:
   - Visit: `http://localhost:3000/api/test-database`
   - You should see: `"status": "connected"` instead of `"mock_mode"`

3. **Test CV upload**:
   - Go to: Jobs Tab → Open Workspace → Invite Candidates
   - Upload: `StefanMüller.pdf`
   - Should now save to **real database** instead of demo mode

## 🎯 **What Changes After Setup:**

- ✅ **Real database storage** instead of demo mode
- ✅ **Persistent candidate data** (survives app restarts)
- ✅ **File uploads** to Supabase Storage
- ✅ **Full functionality** without mock limitations

## 🔒 **Security Notes:**

- ✅ **Project URL & Anon Key**: Safe to use (public)
- ⚠️ **Service Role Key**: Keep secret (server-only, never expose in frontend)
- ✅ **Git ignored**: Your `.env.local` file won't be committed to GitHub

## 🚨 **If You Need Help:**

If you can't find your credentials or have issues:
1. Double-check your Supabase project is **active** (not paused)
2. Make sure you're in the **correct project** in the dashboard
3. Verify your **API settings page** shows the keys
4. Try **refreshing** the Supabase dashboard page

---

**💡 Once configured, your CV upload system will use the real database and you'll have full persistence of candidate data!**