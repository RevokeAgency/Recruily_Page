# 🤖 Gemini AI Setup Guide

This guide will help you set up the free Google Gemini API key required for AI-powered CV parsing and candidate matching.

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Your Free API Key
1. **Visit Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Sign in** with your Google account (create one if needed)
3. **Click "Create API key"** button
4. **Copy the generated key** (starts with "AIza...")

### Step 2: Configure Your Application
1. **Open the file** `.env.local` in your project root
2. **Replace** `your_actual_api_key_here` with your copied API key:
   ```
   GEMINI_API_KEY=AIzaSyYourActualApiKeyHere...
   ```
3. **Save the file**
4. **Restart your application** (stop and run `npm run dev` again)

### Step 3: Test the Integration
1. Go to **Jobs Tab** → **Open Workspace** → **Invite Candidates**
2. Upload a CV file (use the test files: `test-cv-john-doe.txt`, etc.)
3. Watch the real-time AI extraction in action! 🎉

## ✅ What You Get (FREE)

- **15 requests per minute** (perfect for testing and small usage)
- **1 million tokens per day** (handles hundreds of CVs)
- **No credit card required** for the free tier
- **Real-time CV data extraction** from PDF, DOC, DOCX, TXT files
- **AI-powered job matching** with weighted scoring algorithm

## 🔐 Security Best Practices

- ✅ **DO**: Keep your API key in `.env.local` (this file is not committed to git)
- ✅ **DO**: Use API key restrictions in Google Cloud Console for production
- ❌ **DON'T**: Share your API key publicly or commit it to version control
- ❌ **DON'T**: Use the API key in client-side/frontend code

## 🛠 Troubleshooting

### "API key not valid" Error
- Double-check you copied the complete key from Google AI Studio
- Ensure there are no extra spaces in your `.env.local` file
- Restart your application after making changes

### Rate Limit Errors
- The free tier allows 15 requests per minute
- Our system processes CVs sequentially to avoid hitting this limit
- For production, consider upgrading to paid tier for higher limits

### File Upload Issues
- Supported formats: PDF, DOC, DOCX, TXT
- Maximum file size: 10MB per file
- Maximum files: 10 files at once (processed sequentially)

## 🆙 Upgrading (Optional)

If you need higher limits for production:

1. **Visit**: [Google AI Studio Pricing](https://ai.google.dev/pricing)
2. **Enable billing** in Google Cloud Console
3. **Choose pay-as-you-go** pricing (very affordable)
4. **Get higher rate limits** and usage quotas

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your API key is correctly set in `.env.local`
3. Try uploading one of the test CV files first
4. Ensure your internet connection is stable

---

**🎯 Ready to test?** Use the provided test files:
- `test-cv-john-doe.txt` (Software Engineer)
- `test-cv-sarah-johnson.txt` (Data Scientist)  
- `test-cv-alex-chen.txt` (Product Manager)

The system will extract candidate data and calculate job match scores automatically! 🚀