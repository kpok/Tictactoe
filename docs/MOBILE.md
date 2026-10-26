# Android — build, emulator E2E i Google Play

Projekt `android/` jest zapisany w repo, bez generowania nowego projektu przy każdym CI. Identyfikator **com.kpok.threefold**, nazwa Threefold. Capacitor core/CLI/Android8.5.3 są przypięte w package-lock. Java21, Gradle8.14.3 (sprawdzany SHA256), compile/target SDK36, minSDK24. Nie ma projektu iOS.

## Build i testy

```sh
npm ci
npm run android:sync
cd android
./gradlew --no-daemon assembleDebug assembleDebugAndroidTest bundleRelease
```

Wymagane Android SDK z platform36 i build-tools36.0.0; SDK wskazuje ANDROID_HOME lub lokalny android/local.properties (nie commitować). Gradle `-PversionCode=42` ustawia kod wersji; versionName pochodzi z package.json.

`Build and test` ma osobne joby:

1. Node22/24: syntax, unit/API, build web.
2. Dotychczasowy Playwright: komputer, viewport Android, iPhone WebKit.
3. Android build: debug APK, instrumentation APK i **niepodpisany release AAB** z tego samego commitu, plus manifest SHA256.
4. Android emulator E2E: zależy od Android build, pobiera te konkretne APK, sprawdza SHA/wersję/hash i instaluje je na API35 google_apis x86_64. Uruchamia5 testów instrumentacyjnych prawdziwego WebView: FIFO, zwycięstwo/rewanż, worker AI offline, języki/layout, odtworzenie aktywności i partii/pełny ekran.

Emulator ma wyłączone Wi-Fi i dane po instalacji. Żaden lokalny serwer www nie dostarcza aplikacji. Testy używają Espresso-Web do kliknięć i WebView assertions dla stanu DOM; nie wywołują bezpośrednio silnika gry. Raport instrumentacji musi potwierdzić dokładnie5 udanych testów, bez skipów, awarii lub niepełnego wyniku; samo exit0 z adb nie wystarczy. WebView provider/version, wynik, logcat i screenshot trafiają do android-emulator-results. Timeouty chronią przed zawieszeniem.

Lokalnie po uruchomieniu emulatora i zebraniu artefaktów:

```sh
ANDROID_VERSION_CODE=1 GITHUB_SHA=$(git rev-parse HEAD) node scripts/android-artifacts.js
bash scripts/run-android-e2e.sh
```

Uwaga: skrypt wyłącza sieć emulatora; używać urządzenia testowego. Debug APK E2E i release AAB pochodzą z tego samego źródła/zasobów; to nie zastępuje instalacji paczki z Play i testów release na fizycznym telefonie.

## Zachowanie aplikacji

Pakiet zawiera lokalne HTML/CSS/JS, tłumaczenia i worker AI; działa offline od pierwszego startu. Natywna wersja v1 ma AI i lokalne PvP. Ukrywa tryb online, którego backend nie jest publicznie wdrożony, i nie rejestruje service workera PWA. Wersja web zachowuje online i PWA. Backup aplikacji Android jest wyłączony. Brak reklam, analityki, płatności i kont.

## Internal Testing

Instrukcja: [GOOGLE_PLAY_TESTING.md](GOOGLE_PLAY_TESTING.md). Workflow `Google Play · Internal Testing` jest ręczny, uruchamiany z main. Weryfikuje ponownie dokładnie wybrany commit przez reusable CI, następnie podpisuje wcześniej zbudowany AAB. Upload wymaga jawnego publish=true; track jest zawsze internal, nigdy production.

Brak sekretów/konfiguracji Play blokuje podpisanie/upload, ale nie blokuje normalnego CI i emulatora. Ten kod nie zakłada konta Play, nie tworzy kluczy produkcyjnych i nie publikuje automatycznie.
