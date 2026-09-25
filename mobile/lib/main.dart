import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/app_bottom_nav.dart';
import 'features/home/home_screen.dart';
import 'features/transactions/transactions_screen.dart';
import 'features/transactions/add_expense_screen.dart';
import 'features/transactions/transaction_detail_screen.dart';
import 'features/review_queue/review_queue_screen.dart';
import 'features/budgets/budgets_screen.dart';
import 'features/reports/reports_screen.dart';
import 'features/email_sync/email_sync_screen.dart';
import 'features/settings/settings_screen.dart';

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
      ),
      TransactionsScreen(
        onAddExpenseTap: _openAddExpense,
        onTransactionTap: _openTransactionDetail,
      ),
      const BudgetsScreen(),
      SettingsScreen(
        onEmailSyncTap: _openEmailSync,
        onBudgetsTap: () => setState(() => _currentIndex = 2),
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
