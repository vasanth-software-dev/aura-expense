import 'package:flutter/material.dart';
import '../../core/services/sms_sync_service.dart';
import '../../core/services/email_sync_service.dart';
import '../../core/services/transaction_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';

class SyncLabScreen extends StatefulWidget {
  final int initialTabIndex;

  const SyncLabScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<SyncLabScreen> createState() => _SyncLabScreenState();
}

class _SyncLabScreenState extends State<SyncLabScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // SMS State
  bool _hasSmsPermission = false;
  bool _isCheckingPermission = true;
  String _selectedSmsPreset = 'HDFC Debit';
  final TextEditingController _smsController = TextEditingController();
  ParsedSmsTransaction? _parsedSms;
  bool _isScanningInbox = false;
  List<ParsedSmsTransaction> _inboxTransactions = [];

  // Email State
  String _selectedEmailPreset = 'HDFC NetBanking Alert';
  final TextEditingController _emailSubjectController = TextEditingController();
  final TextEditingController _emailBodyController = TextEditingController();
  ParsedEmailTransaction? _parsedEmail;
  final TextEditingController _backendUrlController = TextEditingController();
  String? _backendHealthStatus;
  bool _isTestingBackend = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );

    // Initial SMS Preset
    _smsController.text = SmsSyncService.presetTemplates[_selectedSmsPreset] ?? '';
    _parsedSms = SmsSyncService.parseSms(_smsController.text);

    // Initial Email Preset
    final firstEmail = EmailSyncService.presetEmailTemplates[_selectedEmailPreset];
    if (firstEmail != null) {
      _emailSubjectController.text = firstEmail.subject;
      _emailBodyController.text = firstEmail.body;
      _parsedEmail = EmailSyncService.parseEmail(
        subject: firstEmail.subject,
        body: firstEmail.body,
      );
    }
    _backendUrlController.text = EmailSyncService.backendUrl;

    _checkPermissions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _smsController.dispose();
    _emailSubjectController.dispose();
    _emailBodyController.dispose();
    _backendUrlController.dispose();
    super.dispose();
  }

  Future<void> _checkPermissions() async {
    final granted = await SmsSyncService.checkPermissions();
    if (mounted) {
      setState(() {
        _hasSmsPermission = granted;
        _isCheckingPermission = false;
      });
    }
  }

  Future<void> _requestPermissions() async {
    HapticsHelper.medium();
    final granted = await SmsSyncService.requestPermissions();
    if (mounted) {
      setState(() => _hasSmsPermission = granted);
      if (granted) {
        HapticsHelper.success();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ SMS permissions granted! Real-time background sync is active.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _scanInbox() async {
    HapticsHelper.medium();
    setState(() => _isScanningInbox = true);
    final results = await SmsSyncService.readRecentBankSms(limit: 25);
    if (mounted) {
      setState(() {
        _inboxTransactions = results;
        _isScanningInbox = false;
      });
      HapticsHelper.success();
      if (results.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No bank SMS found in recent inbox messages.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Found ${results.length} bank SMS in your inbox!'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _parseSmsInput() {
    HapticsHelper.light();
    final result = SmsSyncService.parseSms(_smsController.text);
    setState(() => _parsedSms = result);
    if (result == null) {
      HapticsHelper.warning();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not detect bank transaction patterns. Try a preset or bank alert format.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _parseEmailInput() {
    HapticsHelper.light();
    final result = EmailSyncService.parseEmail(
      subject: _emailSubjectController.text,
      body: _emailBodyController.text,
    );
    setState(() => _parsedEmail = result);
    if (result == null) {
      HapticsHelper.warning();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not detect bank patterns in this email.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _importSmsToTransactions(ParsedSmsTransaction sms) {
    TransactionRepository.instance.importFromSms(sms);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ Added ${CurrencyFormatter.format(sms.amount)} (${sms.merchant}) to transactions!'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _importEmailToTransactions(ParsedEmailTransaction email) {
    TransactionRepository.instance.importFromEmail(email);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ Added ${CurrencyFormatter.format(email.amount)} (${email.merchant}) to transactions!'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _testBackendServer() async {
    HapticsHelper.medium();
    setState(() {
      _isTestingBackend = true;
      _backendHealthStatus = null;
    });

    final isOk = await EmailSyncService.testBackendConnection(_backendUrlController.text);
    if (mounted) {
      setState(() {
        _isTestingBackend = false;
        _backendHealthStatus = isOk ? 'Connected ✓ (API is healthy)' : 'Connection failed ✕ (Check IP & port)';
      });
      if (isOk) {
        EmailSyncService.backendUrl = _backendUrlController.text;
        HapticsHelper.success();
      } else {
        HapticsHelper.warning();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Live Sync Lab'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: isDark ? AppColors.darkAccent : AppColors.lightAccent,
          labelColor: isDark ? AppColors.darkAccent : AppColors.lightAccent,
          unselectedLabelColor: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          tabs: const [
            Tab(icon: Icon(Icons.sms_rounded), text: 'SMS Sync'),
            Tab(icon: Icon(Icons.email_rounded), text: 'Email Sync'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildSmsTab(isDark),
          _buildEmailTab(isDark),
        ],
      ),
    );
  }

  // ==========================================
  // SMS TAB
  // ==========================================
  Widget _buildSmsTab(bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // Live Interceptor Status Banner
        AppCard(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _hasSmsPermission
                      ? (isDark ? AppColors.darkIncome : AppColors.lightIncome)
                      : (isDark ? AppColors.darkWarning : AppColors.lightWarning),
                  boxShadow: [
                    BoxShadow(
                      color: (_hasSmsPermission ? Colors.green : Colors.orange).withOpacity(0.5),
                      blurRadius: 6,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _hasSmsPermission ? 'Real-Time SMS Listener Active' : 'SMS Permission Required',
                      style: AppTypography.headline.copyWith(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      _hasSmsPermission
                          ? 'Incoming bank SMS are intercepted and parsed automatically.'
                          : 'Grant permission to intercept real bank SMS on your phone.',
                      style: AppTypography.caption.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (!_hasSmsPermission && !_isCheckingPermission)
                AppButton(
                  text: 'Enable',
                  height: 32,
                  onPressed: _requestPermissions,
                ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Inbox Scan Button
        if (_hasSmsPermission) ...[
          AppButton(
            text: _isScanningInbox ? 'Scanning Phone Inbox...' : '📥 Scan Recent Bank SMS from Phone',
            variant: AppButtonVariant.secondary,
            width: double.infinity,
            isLoading: _isScanningInbox,
            onPressed: _scanInbox,
          ),
          const SizedBox(height: AppSpacing.md),
          if (_inboxTransactions.isNotEmpty) ...[
            Text(
              'Detected Bank SMS from Inbox (${_inboxTransactions.length})',
              style: AppTypography.sectionTitle.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            ..._inboxTransactions.take(3).map((item) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _buildParsedSmsCard(item, isDark),
            )),
            const SizedBox(height: AppSpacing.md),
          ],
        ],

        // Section Title: Live Simulator
        Text(
          'Instant SMS Simulator',
          style: AppTypography.sectionTitle.copyWith(
            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Select an Indian bank preset or paste any real bank SMS to test:',
          style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // Preset Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: SmsSyncService.presetTemplates.keys.map((key) {
              final isSelected = _selectedSmsPreset == key;
              return Padding(
                padding: const EdgeInsets.only(right: AppSpacing.xs),
                child: FilterChip(
                  label: Text(key),
                  selected: isSelected,
                  selectedColor: (isDark ? AppColors.darkAccent : AppColors.lightAccent).withOpacity(0.2),
                  checkmarkColor: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? (isDark ? AppColors.darkAccent : AppColors.lightAccent)
                        : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 12,
                  ),
                  onSelected: (val) {
                    HapticsHelper.light();
                    setState(() {
                      _selectedSmsPreset = key;
                      _smsController.text = SmsSyncService.presetTemplates[key] ?? '';
                      _parseSmsInput();
                    });
                  },
                ),
              );
            }).toList(),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // SMS Textarea
        AppCard(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _smsController,
                maxLines: 3,
                style: AppTypography.callout.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                ),
                decoration: InputDecoration(
                  hintText: 'Paste SMS alert here...',
                  border: InputBorder.none,
                  hintStyle: AppTypography.callout.copyWith(
                    color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () {
                      _smsController.clear();
                      setState(() => _parsedSms = null);
                    },
                    icon: const Icon(Icons.clear_rounded, size: 16),
                    label: const Text('Clear'),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  AppButton(
                    text: '⚡ Parse SMS',
                    height: 36,
                    onPressed: _parseSmsInput,
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Parsed Result Card
        if (_parsedSms != null) ...[
          Text(
            'Parsed Extraction Result',
            style: AppTypography.sectionTitle.copyWith(
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _buildParsedSmsCard(_parsedSms!, isDark),
        ],

        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }

  Widget _buildParsedSmsCard(ParsedSmsTransaction sms, bool isDark) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: (isDark ? AppColors.darkAccent : AppColors.lightAccent).withOpacity(0.12),
                      borderRadius: AppRadius.roundedPill,
                    ),
                    child: Text(
                      sms.bank,
                      style: AppTypography.caption.copyWith(
                        color: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: (sms.type == 'DEBIT' ? Colors.red : Colors.green).withOpacity(0.12),
                      borderRadius: AppRadius.roundedPill,
                    ),
                    child: Text(
                      sms.type,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: sms.type == 'DEBIT' ? Colors.red : Colors.green,
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                '${sms.type == 'DEBIT' ? '-' : '+'}${CurrencyFormatter.format(sms.amount)}',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: sms.type == 'DEBIT'
                      ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
                      : (isDark ? AppColors.darkIncome : AppColors.lightIncome),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
          const SizedBox(height: AppSpacing.md),
          _buildDetailRow('Merchant / Payee', sms.merchant, isDark),
          _buildDetailRow('Account', sms.account, isDark),
          _buildDetailRow('UPI / Reference', sms.upiRef, isDark),
          _buildDetailRow('Category', '${sms.iconEmoji} ${sms.category}', isDark),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            text: '✓ Add to My Transactions',
            width: double.infinity,
            height: 40,
            onPressed: () => _importSmsToTransactions(sms),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // EMAIL TAB
  // ==========================================
  Widget _buildEmailTab(bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // Backend API Host Configuration Card
        AppCard(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Backend API Connection',
                style: AppTypography.headline.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Connect to local backend server (e.g., http://192.168.1.X:8080/api/v1):',
                style: AppTypography.caption.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _backendUrlController,
                      style: AppTypography.callout.copyWith(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: AppRadius.small),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  AppButton(
                    text: 'Test',
                    isLoading: _isTestingBackend,
                    height: 38,
                    onPressed: _testBackendServer,
                  ),
                ],
              ),
              if (_backendHealthStatus != null) ...[
                const SizedBox(height: 6),
                Text(
                  _backendHealthStatus!,
                  style: TextStyle(
                    fontSize: 12,
                    color: _backendHealthStatus!.contains('✓') ? Colors.green : Colors.red,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Section Title: Email Simulator
        Text(
          'Email Notification Simulator',
          style: AppTypography.sectionTitle.copyWith(
            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Select bank email format or test custom bank alert email:',
          style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // Presets
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: EmailSyncService.presetEmailTemplates.keys.map((key) {
              final isSelected = _selectedEmailPreset == key;
              return Padding(
                padding: const EdgeInsets.only(right: AppSpacing.xs),
                child: FilterChip(
                  label: Text(key),
                  selected: isSelected,
                  selectedColor: (isDark ? AppColors.darkAccent : AppColors.lightAccent).withOpacity(0.2),
                  checkmarkColor: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? (isDark ? AppColors.darkAccent : AppColors.lightAccent)
                        : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 12,
                  ),
                  onSelected: (val) {
                    HapticsHelper.light();
                    setState(() {
                      _selectedEmailPreset = key;
                      final t = EmailSyncService.presetEmailTemplates[key];
                      if (t != null) {
                        _emailSubjectController.text = t.subject;
                        _emailBodyController.text = t.body;
                        _parseEmailInput();
                      }
                    });
                  },
                ),
              );
            }).toList(),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Subject & Body Fields
        AppCard(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _emailSubjectController,
                style: AppTypography.headline.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontWeight: FontWeight.w600,
                ),
                decoration: const InputDecoration(
                  labelText: 'Subject',
                  border: UnderlineInputBorder(),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              TextField(
                controller: _emailBodyController,
                maxLines: 4,
                style: AppTypography.callout.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                ),
                decoration: const InputDecoration(
                  labelText: 'Email Body',
                  border: InputBorder.none,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Align(
                alignment: Alignment.centerRight,
                child: AppButton(
                  text: '⚡ Parse Email',
                  height: 36,
                  onPressed: _parseEmailInput,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Parsed Email Result Card
        if (_parsedEmail != null) ...[
          Text(
            'Parsed Email Transaction',
            style: AppTypography.sectionTitle.copyWith(
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.12),
                            borderRadius: AppRadius.roundedPill,
                          ),
                          child: Text(
                            _parsedEmail!.bank,
                            style: const TextStyle(
                              color: Colors.blue,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: (_parsedEmail!.type == 'DEBIT' ? Colors.red : Colors.green).withOpacity(0.12),
                            borderRadius: AppRadius.roundedPill,
                          ),
                          child: Text(
                            _parsedEmail!.type,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: _parsedEmail!.type == 'DEBIT' ? Colors.red : Colors.green,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${_parsedEmail!.type == 'DEBIT' ? '-' : '+'}${CurrencyFormatter.format(_parsedEmail!.amount)}',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: _parsedEmail!.type == 'DEBIT'
                            ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
                            : (isDark ? AppColors.darkIncome : AppColors.lightIncome),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                const SizedBox(height: AppSpacing.md),
                _buildDetailRow('Merchant / Payee', _parsedEmail!.merchant, isDark),
                _buildDetailRow('Account', _parsedEmail!.account, isDark),
                _buildDetailRow('Reference No', _parsedEmail!.reference, isDark),
                _buildDetailRow('Category', '${_parsedEmail!.iconEmoji} ${_parsedEmail!.category}', isDark),
                const SizedBox(height: AppSpacing.md),
                AppButton(
                  text: '✓ Add to My Transactions',
                  width: double.infinity,
                  height: 40,
                  onPressed: () => _importEmailToTransactions(_parsedEmail!),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTypography.callout.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          Text(
            value,
            style: AppTypography.callout.copyWith(
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
