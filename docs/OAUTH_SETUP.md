# Real OAuth Integration Guide: Google & Microsoft

Aura Expense integrates with official Google Gmail and Microsoft Graph APIs without ever accessing user passwords.

---

## 1. Google Cloud Console (Gmail API)

### Step 1: Create Project & Enable API
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `Aura Expense`.
3. Go to **APIs & Services** > **Library**.
4. Search for **Gmail API** and click **Enable**.

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. App name: `Aura Expense`.
4. User support email: `your-email@example.com`.
5. Under **Scopes**, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/gmail.readonly` (Read-only access to messages)
   - `https://www.googleapis.com/auth/userinfo.email` (User identity verification)
6. Add your personal Google account under **Test users** while in development mode.

### Step 3: Create OAuth 2.0 Client ID
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Aura Expense Backend`.
5. Authorized redirect URIs:
   - `http://localhost:8080/api/v1/email-accounts/gmail/callback` (for local development)
   - `https://api.yourdomain.com/api/v1/email-accounts/gmail/callback` (for production)
6. Copy the **Client ID** and **Client Secret** into your `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/email-accounts/gmail/callback
   ```

---

## 2. Microsoft Azure Portal (Microsoft Graph API)

### Step 1: Register Application
1. Navigate to the [Azure Portal](https://portal.azure.com/) > **Microsoft Entra ID** (Azure AD).
2. Go to **App registrations** > **New registration**.
3. Name: `Aura Expense`.
4. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (`common`).
5. Redirect URI:
   - Web: `http://localhost:8080/api/v1/email-accounts/outlook/callback`

### Step 2: Configure API Permissions
1. Go to **API permissions** > **Add a permission**.
2. Choose **Microsoft Graph** > **Delegated permissions**.
3. Select:
   - `Mail.Read` (Read mail in user mailboxes)
   - `offline_access` (Maintain access to data you have given it access to)
   - `User.Read` (Sign in and read user profile)

### Step 3: Generate Client Secret
1. Go to **Certificates & secrets** > **New client secret**.
2. Add description `Aura Expense Backend Secret` and choose expiration.
3. Copy the **Secret Value** immediately and set in `.env`:
   ```env
   MICROSOFT_CLIENT_ID=your_application_client_id
   MICROSOFT_CLIENT_SECRET=your_secret_value
   MICROSOFT_TENANT_ID=common
   MICROSOFT_REDIRECT_URI=http://localhost:8080/api/v1/email-accounts/outlook/callback
   ```
