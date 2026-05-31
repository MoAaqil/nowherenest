Write-Host "=============================================" -ForegroundColor Green
Write-Host "Nowhere Nest APK Compiler Assistant" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Verify if flutter is installed
$flutterCheck = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutterCheck) {
    Write-Host ""
    Write-Host "⚠️  Flutter SDK not detected in your PATH environment variables." -ForegroundColor Yellow
    Write-Host "To compile the Nowhere Nest mobile application APK, please make sure you have:"
    Write-Host "  1. Flutter SDK installed (https://docs.flutter.dev/get-started/install)"
    Write-Host "  2. Android SDK & Build Tools installed (via Android Studio)"
    Write-Host "  3. 'flutter' and 'dart' commands added to your system PATH."
    Write-Host ""
    Write-Host "You can run this script again once Flutter is installed locally."
    Write-Host "Or, you can execute these commands manually in your Flutter terminal:"
    Write-Host "  cd mobile_app"
    Write-Host "  flutter create --platforms=android ."
    Write-Host "  flutter pub get"
    Write-Host "  flutter build apk --release"
    Write-Host ""
    exit 1
}

Write-Host "✅ Flutter SDK detected." -ForegroundColor Green
Write-Host "Step 1: Generating Android platform wrapper project files..." -ForegroundColor Cyan
flutter create --platforms=android .

Write-Host "`nStep 2: Fetching dependencies from pub.dev..." -ForegroundColor Cyan
flutter pub get

Write-Host "`nStep 3: Compiling application and building release APK..." -ForegroundColor Cyan
flutter build apk --release

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "🎉 Compilation completed successfully!" -ForegroundColor Green
    Write-Host "Your release APK is located at:" -ForegroundColor Green
    Write-Host "  mobile_app/build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor White
    Write-Host "=============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Compilation failed. Please check build errors above." -ForegroundColor Red
}
