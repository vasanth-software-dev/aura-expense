import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/app_bottom_nav.dart';
import 'core/services/sms_sync_service.dart';
import 'core/services/transaction_repository.dart';
import 'features/home/home_screen.dart';
import 'features/transactions/transactions_screen.dart';
import 'features/transactions/add_expense_screen.dart';
import 'features/transactions/transaction_detail_screen.dart';
import 'features/review_queue/review_queue_screen.dart';
import 'features/budgets/budgets_screen.dart';
import 'features/reports/reports_screen.dart';
import 'features/email_sync/email_sync_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/sync_lab/sync_lab_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AuraExpenseApp());
}

class AuraExpenseApp extends StatefulWidget {
  const AuraExpenseApp({super.key});

  @override
  State<AuraExpenseApp> createState() => _AuraExpenseAppState();
}

class _AuraExpenseAppState extends State<AuraExpenseApp> {
  ThemeMode _themeMode = ThemeMode.system;

  void toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aura Expense',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: _themeMode,
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Start Android real-time SMS listener
    SmsSyncService.startRealtimeListener(
      onTransactionDetected: (sms) {
        TransactionRepository.instance.importFromSms(sms);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.bolt_rounded, color: Colors.amber, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '⚡ Real-time SMS Synced: Rs. ${sms.amount.toStringAsFixed(0)} (${sms.merchant})',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 4),
              action: SnackBarAction(
                label: 'View',
                textColor: Colors.amber,
                onPressed: () {
                  setState(() => _currentIndex = 1);
                },
              ),
            ),
          );
        }
      },
    );
  }

  @override
  void dispose() {
    SmsSyncService.stopRealtimeListener();
    super.dispose();
  }

  void _openSyncLab([int tabIndex = 0]) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (ctx) => SyncLabScreen(initialTabIndex: tabIndex)),
    );
  }

  void _openAddExpense() {
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (ctx) => AddExpenseScreen(
          onExpenseAdded: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✓ Expense recorded successfully'),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
      ),
    );
  }

  void _openReviewQueue() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (ctx) => const ReviewQueueScreen()),
    );
  }

  void _openEmailSync() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (ctx) => const EmailSyncScreen()),
    );
  }

  void _openReports() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (ctx) => const ReportsScreen()),
    );
  }

  void _openTransactionDetail(TransactionItemModel tx) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (ctx) => TransactionDetailScreen(
          transaction: tx,
          onDeleted: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Transaction deleted'),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      HomeScreen(
        onAddExpenseTap: _openAddExpense,
        onSeeAllTransactionsTap: () => setState(() => _currentIndex = 1),
        onReviewQueueTap: _openReviewQueue,
        onEmailSyncTap: _openEmailSync,
        onReportsTap: _openReports,
        onSyncLabTap: () => _openSyncLab(0),
      ),
      TransactionsScreen(
        onAddExpenseTap: _openAddExpense,
        onTransactionTap: _openTransactionDetail,
      ),
      const BudgetsScreen(),
      SettingsScreen(
        onEmailSyncTap: _openEmailSync,
        onBudgetsTap: () => setState(() => _currentIndex = 2),
        onSmsDetectionTap: () => _openSyncLab(0),
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _currentIndex,
        onTap: (idx) => setState(() => _currentIndex = idx),
        onAddTap: _openAddExpense,
      ),
    );
  }
}
