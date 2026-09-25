package com.aura.expense

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
            for (sms in messages) {
                if (sms == null) continue
                val sender = sms.displayOriginatingAddress ?: sms.originatingAddress ?: "Unknown"
                val body = sms.displayMessageBody ?: sms.messageBody ?: ""
                val timestamp = sms.timestampMillis

                MainActivity.onSmsReceived(sender, body, timestamp)
            }
        }
    }
}
