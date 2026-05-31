import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/vibes_screen.dart';
import 'screens/rides_screen.dart';
import 'screens/profile_screen.dart';
import 'widgets/bottom_nav.dart';
import 'models/models.dart';
import 'services/api_service.dart';

// Simple authentication/user state provider
class UserProvider extends ChangeNotifier {
  User? _user;
  User? get user => _user;

  void setUser(User? user) {
    _user = user;
    notifyListeners();
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  
  User? currentUser;
  if (token != null && token.isNotEmpty) {
    try {
      currentUser = await ApiService.getMe();
    } catch (e) {
      print('Session token validation failed: $e');
    }
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserProvider()..setUser(currentUser)),
      ],
      child: MyApp(hasSession: currentUser != null),
    ),
  );
}

class MyApp extends StatelessWidget {
  final bool hasSession;
  
  const MyApp({Key? key, required this.hasSession}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'nowhere nest',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF0A3B2A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0A3B2A),
          primary: const Color(0xFF0A3B2A),
          secondary: const Color(0xFF22C55E),
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        useMaterial3: true,
      ),
      initialRoute: hasSession ? '/main' : '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/main': (context) => const MainLayoutScreen(),
      },
    );
  }
}

// Shell layout managing tab index selection and FloatingBottomNav coordination
class MainLayoutScreen extends StatefulWidget {
  const MainLayoutScreen({Key? key}) : super(key: key);

  @override
  State<MainLayoutScreen> createState() => _MainLayoutScreenState();
}

class _MainLayoutScreenState extends State<MainLayoutScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomeScreen(),
    const VibesScreen(),
    const ProfileScreen(initialTab: 'history'), // Trips
    const RidesScreen(),
    const ProfileScreen(initialTab: 'settings'), // More
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Preserve tabs states via IndexedStack
          IndexedStack(
            index: _currentIndex,
            children: _pages,
          ),
          // Floating Bottom Navigation Dock placed over content
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: FloatingBottomNav(
              currentIndex: _currentIndex,
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
            ),
          ),
        ],
      ),
    );
  }
}
