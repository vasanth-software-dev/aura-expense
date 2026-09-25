# Android & Google Play SMS Policy Compliance

## 1. Google Play SMS & Call Log Permissions Policy
Google Play strictly restricts the declaration of `READ_SMS` and `RECEIVE_SMS` permissions in the `AndroidManifest.xml`. Apps with broad SMS permissions face rejection unless they are the user's default SMS handling application.

### Permitted Financial Tracking Strategies:
1. **SMS User Consent API / SMS Retriever API**:
   - Google-approved mechanism for requesting consent on specific messages.
   - Does not require broad `READ_SMS` permission.
2. **Notification Listener Service**:
   - Captures transactional notifications posted by banking apps (e.g. Google Pay, PhonePe, Paytm, HDFC MobileBanking).
   - Compliant with Google Play policies when justified by core expense management functionality.
3. **Manual SMS / Text Import Fallback**:
   - Provides users with a dedicated clipboard paste interface where they can paste transaction alerts directly.
   - 100% policy compliant across all Android and iOS devices.

---

## 2. In-App Permission Disclosure & Consent
Before requesting notification or SMS access on Android:
- Display a full-screen, prominent in-app disclosure explaining:
  * Exactly what data is accessed (only financial sender IDs: HDFC, SBI, ICICI, AXIS, etc.).
  * That personal conversation messages are strictly ignored.
  * That OTPs, PINs, and passwords are never read or stored.
  * That all parsing occurs on-device or over encrypted HTTPS connections.
  * That users can revoke access at any time from Settings.
