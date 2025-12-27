# Contact Form Email Setup Guide

## ✅ Contact Details Updated!

The Contact page now shows your actual information:

- **Phone**: +91 97665 73966
- **Emails**: 
  - thecheesetown@gmail.com
  - pavanlambole578@gmail.com
- **Address**: 45, Prashant Nagar, Biladi Road, Near 12 Feet Hanuman Mandir, Deopur, Dhule, Maharashtra

## 📧 Email Form Setup (Required)

The contact form is ready but needs an API key to send emails. Here's how to set it up:

### Method 1: Web3Forms (Recommended - FREE)

1. **Go to**: https://web3forms.com
2. **Enter your email**: pavanlambole578@gmail.com
3. **Click "Get Access Key"**
4. **Copy the access key** you receive

5. **Update the code**: Edit `customerweb/src/pages/ContactPage.tsx` at line 34:
   ```typescript
   access_key: 'YOUR_WEB3FORMS_ACCESS_KEY', // Replace with your actual key
   ```

6. **That's it!** Messages will be sent to pavanlambole578@gmail.com

### Method 2: EmailJS (Alternative - FREE)

If you prefer EmailJS:

1. Go to https://www.emailjs.com/
2. Create a free account
3. Set up an email service (Gmail)
4. Create an email template
5. Get your:
   - Service ID
   - Template ID
   - Public Key

Then update ContactPage.tsx to use EmailJS instead.

### Method 3: Direct Backend Integration

For more control, you can create a backend API endpoint:

1. Create an Express or Next.js API route
2. Use Nodemailer to send emails
3. Update the form to POST to your API

## 🚀 Quick Setup (Web3Forms)

**Step 1**: Get your API key from https://web3forms.com

**Step 2**: Open `customerweb/src/pages/ContactPage.tsx`

**Step 3**: Find line 34 and replace:
```typescript
access_key: 'YOUR_WEB3FORMS_ACCESS_KEY',
```

With:
```typescript
access_key: 'your-actual-access-key-here',
```

**Step 4**: Save the file

**Step 5**: Test the contact form!

## 📋 What Happens When Users Submit the Form?

1. User fills out the contact form
2. Clicks "Send Message"
3. Form data is sent to Web3Forms API
4. Web3Forms forwards the email to: **pavanlambole578@gmail.com**
5. You receive an email with:
   - Sender's name
   - Sender's email
   - Sender's phone
   - Subject
   - Message 
   - All formatted nicely

## ✨ Features Already Implemented

- ✅ Contact details updated with your actual information
- ✅ Two email addresses shown
- ✅ Full address with proper formatting
- ✅ Phone number clickable (opens phone app)
- ✅ Email addresses clickable (opens email client)
- ✅ Contact form with validation
- ✅ Loading state ("Sending..." button)
- ✅ Success message after sending
- ✅ Error handling with user-friendly messages
- ✅ Form resets after successful submission
- ✅ Beautiful, responsive design

## 🎯 Form Fields

The contact form collects:
- **Name** (required)
- **Email** (required)
- **Phone** (optional)
- **Subject** (required)
- **Message** (required)

All data is sent directly to your email inbox!

## 🔒 Security & Privacy

- No data is stored on the website
- All emails go directly to your inbox
- Web3Forms is GDPR compliant
- Free tier: 250 emails per month
- No credit card required

## 🧪 Testing the Form

Before going live:

1. Get your Web3Forms API key
2. Update the code with the key
3. Open the contact page
4. Fill out the form
5. Submit
6. Check your email (pavanlambole578@gmail.com)
7. Verify you received the message

## 💡 Tips

- Check spam folder if you don't receive test emails
- Web3Forms sends emails instantly (usually within seconds)
- You can customize the email template at web3forms.com
- Set up email notifications on your phone for quick responses

## 📞 Current Status

✅ Contact details: **UPDATED**
⚠️ Email functionality: **NEEDS API KEY** (5-minute setup)

Just add the Web3Forms API key and you're done! 🎉

---

## Alternative: Simple mailto Link

If you don't want to use an email service, you can use a simple mailto link:

1. Edit ContactPage.tsx
2. Change the button to:
```tsx
<a href={`mailto:pavanlambole578@gmail.com?subject=${formData.subject}&body=${formData.message}`}>
  Send Email
</a>
```

This will open the user's default email client instead of sending directly.

**Pros**: No setup needed
**Cons**: User must have email client configured
