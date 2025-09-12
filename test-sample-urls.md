# 🧪 Sample URLs for Testing Job Scraping

Here are some sample job URLs you can use to test the enhanced URL scraping functionality:

## 🔗 **Test URLs for Job Scraping**

### **Indeed Jobs**
```
https://www.indeed.com/viewjob?jk=1234567890abcdef
https://indeed.com/jobs?q=software+developer&l=San+Francisco%2C+CA
```

### **LinkedIn Jobs** 
```
https://www.linkedin.com/jobs/view/3445678901/
https://linkedin.com/jobs/collections/recommended/?currentJobId=3234567890
```

### **Glassdoor Jobs**
```
https://www.glassdoor.com/job-listing/software-engineer-company-JV_IC1147401_KO0,17_KE18,25.htm
```

### **Company Career Pages**
```
https://careers.google.com/jobs/results/1234567890/
https://jobs.apple.com/en-us/details/200123456/software-engineer
https://www.microsoft.com/en-us/careers/search?rt=professional&q=developer
```

### **Generic Job Boards**
```
https://angel.co/company/startup-name/jobs/1234567-software-engineer
https://stackoverflow.com/jobs/123456/senior-developer
https://dice.com/jobs/detail/1234567890abcdef
```

## 🧪 **How to Test**

1. **Navigate** to Dashboard → Jobs → Create Job
2. **Select "URL" option** in the wizard
3. **Paste any job URL** from above (or any real job posting URL)
4. **Click "Scrape URL"** and watch it:
   - Extract job information automatically
   - Auto-redirect to Review section 
   - Pre-populate all form fields
5. **Review extracted data** and make any necessary edits
6. **Continue to Activate** and publish the job

## ✅ **Expected Extraction Results**

The enhanced scraper should now extract:

- **📝 Job Title**: "Software Engineer", "Frontend Developer", etc.
- **🏢 Company**: Company name from various page elements
- **📍 Location**: "San Francisco, CA", "Remote", "New York, NY", etc.
- **📄 Description**: Job description paragraph(s)
- **📋 Requirements**: Required qualifications and experience
- **💰 Salary**: "$100,000 - $150,000", "$120k - $180k", etc.
- **💼 Employment Type**: Full-time, Part-time, Contract, etc.
- **📊 Experience Level**: Entry-level, Mid-level, Senior-level, etc.
- **🏷️ Skills**: React, JavaScript, Python, etc.

## 🔧 **Debugging Features**

The enhanced scraper includes comprehensive logging:

- Open browser DevTools (F12)
- Check Console tab while scraping
- See detailed extraction progress and results
- Identify any missing data or parsing issues

## 📝 **Notes**

- Some job sites may have anti-scraping measures
- Results may vary based on site structure changes
- The scraper works best with public job postings
- LinkedIn jobs may require login for full access
- Company career pages have varied structures

## 🎯 **Testing Workflow**

1. **Test URL Scraping**: Try different job URLs to see extraction quality
2. **Auto-Redirect**: Verify automatic navigation to Review section
3. **Data Accuracy**: Check if extracted data matches the original posting
4. **Field Mapping**: Ensure data appears in correct form fields
5. **Skills Extraction**: Verify skills are properly identified and added
6. **Salary Parsing**: Test various salary formats (ranges, single values, k notation)

## 💡 **Pro Tips**

- Use direct job posting URLs (not search results pages)
- Try URLs from different job boards to test compatibility
- Check console logs for detailed extraction information
- Edit any incorrect data in the Review step before publishing