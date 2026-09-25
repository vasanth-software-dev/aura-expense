package com.aura.expense

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel
import java.util.Locale

class MainActivity: FlutterActivity() {
    companion object {
        private const val SMS_CHANNEL = "com.aura.expense/sms_channel"
        private const val SMS_STREAM = "com.aura.expense/sms_stream"
        private const val PERMISSION_REQUEST_CODE = 1001

        private var eventSink: EventChannel.EventSink? = null
        private var activityHandler: Handler? = null

        fun onSmsReceived(sender: String, body: String, timestamp: Long) {
            val map = HashMap<String, Any>()
            map["sender"] = sender
            map["body"] = body
            map["timestamp"] = timestamp
            activityHandler?.post {
                eventSink?.success(map)
            }
        }
    }

    private var permissionResultCallback: ((Boolean) -> Unit)? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        activityHandler = Handler(Looper.getMainLooper())

        // Stream for real-time incoming SMS events
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, SMS_STREAM).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    eventSink = events
                }

                override fun onCancel(arguments: Any?) {
                    eventSink = null
                }
            }
        )

        // MethodChannel for SMS queries, permissions & inbox scanning
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SMS_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "checkSmsPermissions" -> {
                    val hasReceive = checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
                    val hasRead = checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                    result.success(hasReceive && hasRead)
                }
                "requestSmsPermissions" -> {
                    val permissions = arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS)
                    permissionResultCallback = { granted ->
                        result.success(granted)
                    }
                    requestPermissions(permissions, PERMISSION_REQUEST_CODE)
                }
                "readRecentBankSms" -> {
                    val limit = (call.argument<Int>("limit") ?: 15)
                    try {
                        val messages = readInboxBankMessages(limit)
                        result.success(messages)
                    } catch (e: Exception) {
                        result.error("READ_SMS_FAILED", e.message, null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            permissionResultCallback?.invoke(allGranted)
            permissionResultCallback = null
        }
    }

    private fun readInboxBankMessages(limit: Int): List<Map<String, Any>> {
        val list = ArrayList<Map<String, Any>>()
        if (checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            return list
        }

        val uri = Uri.parse("content://sms/inbox")
        val projection = arrayOf("_id", "address", "body", "date")
        val cursor = contentResolver.query(uri, projection, null, null, "date DESC")

        cursor?.use {
            val addressIdx = it.getColumnIndex("address")
            val bodyIdx = it.getColumnIndex("body")
            val dateIdx = it.getColumnIndex("date")
            val idIdx = it.getColumnIndex("_id")

            var count = 0
            while (it.moveToNext() && count < limit) {
                val address = if (addressIdx != -1) it.getString(addressIdx) ?: "" else ""
                val body = if (bodyIdx != -1) it.getString(bodyIdx) ?: "" else ""
                val date = if (dateIdx != -1) it.getLong(dateIdx) else System.currentTimeMillis()
                val id = if (idIdx != -1) it.getString(idIdx) ?: "" else ""

                val bodyUpper = body.uppercase(Locale.ROOT)
                if (bodyUpper.contains("DEBITED") || bodyUpper.contains("CREDITED") ||
                    bodyUpper.contains("SPENT") || bodyUpper.contains("INR") ||
                    bodyUpper.contains("RS.") || bodyUpper.contains("UPI") ||
                    bodyUpper.contains("A/C") || bodyUpper.contains("BANK")) {
                    val msgMap = HashMap<String, Any>()
                    msgMap["id"] = id
                    msgMap["sender"] = address
                    msgMap["body"] = body
                    msgMap["timestamp"] = date
                    list.add(msgMap)
                    count++
                }
            }
        }
        return list
    }
}
