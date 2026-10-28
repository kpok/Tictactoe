# Threefold → Google Play Internal Testing: krok po kroku

Instrukcja dla **publicznego** repozytorium `kpok/Tictactoe`. Sprawdzono 2026-10-27 względem aktualnego workflow [google-play-internal.yml](../.github/workflows/google-play-internal.yml). Nazwy ekranów Console mogą zmieniać się lub występować po polsku.

Cel: instalacja gry przez Google Play przez wybranych testerów, **bez wydania produkcyjnego**. Nie jest to Internal app sharing ani test zamknięty. Internal Testing nie zastępuje odrębnych wymagań dostępu do produkcji dla danego konta.

Najprostsza droga: **A–F: pierwsza paczka ręcznie**, potem opcjonalnie **G: kolejne wydania z GitHub Actions**. Ta instrukcja niczego sama nie uruchamia, nie tworzy kluczy i nie publikuje.

## 0. Co może być publiczne, a czego nie udostępniać

| Element | Gdzie go trzymać | Czy może trafić do repo/issue/logu? |
|---|---|---|
| Kod, workflow, ta instrukcja, nazwy sekretów | Repo | Tak, bez rzeczywistych wartości sekretów |
| `com.kpok.threefold`, nazwa gry, versionCode | Repo/Console | Tak |
| Publiczny certyfikat i jego SHA-256 | Console / lokalnie | To nie klucz prywatny; certyfikat może zawierać dane wydawcy |
| AdMob App ID i identyfikator jednostki reklamowej | Konfiguracja aplikacji | Nie są hasłami; nie aktywuj reklam w ramach tej instrukcji |
| Keystore `.jks` / `.keystore` z prywatnym kluczem | Prywatny folder poza checkoutem + zaszyfrowana kopia | **Nie** |
| Hasła keystore/klucza | Menedżer haseł i GitHub Environment secrets | **Nie** |
| Keystore zakodowany base64 | Wyłącznie odpowiedni GitHub secret / chwilowo lokalny schowek | **Nie. Base64 nie jest szyfrowaniem** |
| JSON klucza konta usługowego Google, jego `private_key` | Prywatny folder / GitHub Environment secret | **Nie** |
| Token GitHub PAT, hasła kont Google, kody odzyskiwania | Menedżer haseł | **Nie; pipeline ich nie potrzebuje** |
| APK/AAB i logi/artefakty tego repo | GitHub Actions | **Traktuj jako publicznie dostępne**; nie mogą zawierać sekretów |
| E-maile testerów, dokumenty tożsamości, dane rozliczeń | Play Console / prywatnie | **Nie** |

Nie wklejaj sekretów do czatu, commit message, README, issues, PR, screenshotów, `workflow_dispatch` inputs, YAML ani poleceń z jawnymi hasłami. GitHub maskuje część sekretów, ale to nie gwarantuje ochrony po przekształceniu, podziale czy zapisaniu w artefakcie. Retencja artefaktu 3 dni nie czyni go prywatnym.

`.gitignore` blokuje część typowych nazw, ale nie zastępuje kontroli: plik `credentials.json` o innej nazwie może zostać dodany. Ignorowanie nie usuwa pliku, który już był śledzony. Wszystkie klucze twórz **poza folderem repo**. Nie kopiuj kluczy z `daily_logic`.

## A. Przygotuj konto i aplikację Google Play

1. Zaloguj się do [Play Console](https://play.google.com/console) na swoim koncie właściciela. Dokończ wymagane przez Google sprawdzenie konta, urządzenia i danych. Dokumenty przesyłaj tylko w Console.
2. Wybierz **Create app / Utwórz aplikację**. Ustaw nazwę `Threefold`, język domyślny, typ **Game / Gra**, model cenowy zgodny z planem i wymagane oświadczenia.
3. Pakiet naszej gry to **`com.kpok.threefold`**. Zostanie odczytany z pierwszej paczki. Jeśli ten pakiet jest już zajęty albo przypisany do innej aplikacji/konta, zatrzymaj się; nie podpisuj losowo zmienionego pakietu. Zmiana identyfikatora oznacza osobną tożsamość aplikacji.
4. Znajdź **Test and release → Testing → Internal testing**. Sprawdzaj nazwę ścieżki również tuż przed końcowym zatwierdzeniem.
5. Uzupełniaj pozycje wymagane przez aktualny ekran Console: kontakt, dostęp do aplikacji, klasyfikację treści, odbiorców, prywatność i dane. Internal test może być dostępny przed pełnym ukończeniem konfiguracji; nie oznacza to gotowości do produkcji.

**Paczka Internal Testing używa reklam TESTOWYCH Google, bez zarobków.** CI jawnie wymusza `adsMode=test`; debug APK pozostaje bez reklam. Dzieci i nieznany wiek nadal są bez reklam. Przed testem reklam na telefonie wykonaj [konfigurację Internal Testing w ADS.md](ADS.md#internal-testing--reklamy-testowe): publiczne repository variables `ADMOB_APP_ID` i `ADS_PRIVACY_URL` oraz komunikaty UMP w AdMob. Sample App ID pozwala budować bez konta, ale nie gwarantuje emisji ani poprawnego UMP. Gra zawiera SDK AdMob/UMP, dlatego deklaracje oceniaj dla faktycznej paczki i zachowania SDK; tryb testowy nie oznacza automatycznie „brak danych”. Nie deklaruj odbiorców wyłącznie dorosłych — planujemy również dzieci. Nie promuj tej paczki z testową jednostką do produkcji.

## B. Zabezpiecz GitHub przed dodaniem sekretów

1. Sprawdź [instrukcję bezpieczeństwa Actions](WORKFLOW_SECURITY_PL.md). W **Settings → Actions → General** ustaw zatwierdzanie workflowów dla **wszystkich zewnętrznych współtwórców**, token domyślnie tylko do odczytu i brak pozwolenia na tworzenie/zatwierdzanie PR-ów przez Actions. Nie wyłączaj całego Actions.
2. Zweryfikuj, kto/aplikacja ma prawo zapisu do `main`. Osoba mogąca zmienić zaufany workflow może również napisać kod wykradający sekrety. Warunki `if` i CODEOWNERS same nie zastępują kontroli dostępu i reguł gałęzi.
3. Otwórz [Settings → Environments](https://github.com/kpok/Tictactoe/settings/environments). Utwórz środowisko o **dokładnej nazwie `google-play-internal`**.
4. **Przed dodaniem sekretów** ustaw **Deployment branches and tags → Selected branches and tags**. Dodaj regułę typu **Branch** o dokładnej nazwie **`main`**. Usuń szerokie wzorce; tag o nazwie `main` nie jest gałęzią.
5. Jeśli plan konta udostępnia **Required reviewers**, wskaż siebie. W jednoosobowym projekcie nie włączaj zakazu samodzielnego zatwierdzania własnego deploymentu, jeśli uniemożliwi to jego obsługę. Zachowaj inne celowo ustawione zabezpieczenia.
6. Sekrety dodawaj w tym środowisku przez **Environment secrets → Add secret**. Nie jako Variables, nie do plików i nie do ogólnych Repository secrets.

| Dokładna nazwa Environment secret | Wartość |
|---|---|
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | Base64 całego pliku upload keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Hasło magazynu keystore |
| `ANDROID_KEY_ALIAS` | W tej instrukcji `threefold-upload` |
| `ANDROID_KEY_PASSWORD` | Hasło wpisu prywatnego klucza |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Pełny oryginalny JSON; **dopiero w etapie G** |

Na pierwsze podpisanie wystarczą **cztery pierwsze sekrety**. Przy `publish=false` konto usługowe nie jest wymagane. Nie dodawaj administracyjnego PAT do repo ani sekretów workflowa.

## C. Utwórz upload key lokalnie — Windows / PowerShell

Jeżeli ta aplikacja ma już zarejestrowany upload key, **użyj istniejącego**. Nie generuj nowego przy każdym wydaniu. Reset klucza to osobna procedura w Play Console.

Dla nowej aplikacji:

1. Zainstaluj JDK (np. używane w projekcie JDK21) lub użyj narzędzi JDK z Android Studio. Sprawdź w PowerShell: `keytool -help`.
2. Otwórz zwykły PowerShell. Poniższe polecenia zapisują klucz poza checkoutem, w lokalnym profilu użytkownika. Nie używają jawnych haseł:

```powershell
$keyDirectory = Join-Path $env:LOCALAPPDATA 'ThreefoldSigning'
New-Item -ItemType Directory -Force -Path $keyDirectory | Out-Null
$keyPath = Join-Path $keyDirectory 'threefold-upload.jks'
if (Test-Path $keyPath) { throw 'Keystore already exists. Do not overwrite it.' }
keytool -genkeypair -storetype JKS -keystore "$keyPath" -alias threefold-upload -keyalg RSA -keysize 2048 -validity 10000
```

3. Keytool interaktywnie zapyta o hasło magazynu, dane certyfikatu i hasło klucza. Zapisz hasła w menedżerze haseł. Przy wspólnym haśle wpisz tę samą wartość do obu sekretów hasłowych. Podano jawny format **JKS**, żeby uniknąć różnic obsługi dwóch haseł w PKCS12.
4. Dane certyfikatu podpisu będą możliwe do odczytania z podpisanej paczki. Nie traktuj ich jak poufnego formularza; nie umieszczaj niepotrzebnych prywatnych informacji. Podawaj dane zgodne z wymaganiami narzędzia i Twoją tożsamością wydawcy.
5. Wykonaj zaszyfrowaną kopię `threefold-upload.jks` poza tym komputerem. Upewnij się, że znasz hasło i możesz odczytać kopię. Sam folder LocalAppData nie zapewnia kopii zapasowej ani ochrony przed dostępem innego procesu na komputerze.
6. Zweryfikuj wpis; hasło ponownie zostanie odczytane interaktywnie:

```powershell
keytool -list -v -keystore "$keyPath" -alias threefold-upload
```

7. Aby ustawić `ANDROID_UPLOAD_KEYSTORE_BASE64`, skopiuj base64 bez tworzenia pliku tekstowego i bez wyświetlania wartości w terminalu:

```powershell
Set-Clipboard -Value ([Convert]::ToBase64String([IO.File]::ReadAllBytes($keyPath)))
```

8. Wklej zawartość tylko do pola wartości odpowiedniego **Environment secret** na GitHubie. Zapisz. Nie wklejaj jej tutaj do rozmowy.
9. Wyczyść bieżący schowek:

```powershell
Set-Clipboard -Value ''
```

Jeśli używasz historii/synchronizacji schowka, wyłącz je przed operacją lub usuń również poufny wpis z historii Windows/menedżera schowka. Samo zastąpienie bieżącej zawartości nie czyści historii. Uzupełnij pozostałe trzy sekrety.

Na Linux/macOS również użyj `keytool` w prywatnym folderze poza repo. Jeżeli tworzysz pomocniczy plik base64, traktuj go jak prywatny klucz, ogranicz dostęp i usuń po dodaniu sekretu; zachowaj właściwy keystore i jego zaszyfrowaną kopię.

**Upload key a app signing key:** nasz klucz służy do podpisania wysyłanego AAB. Dla nowej aplikacji w Play App Signing możesz pozwolić Google wygenerować klucz podpisujący APK dostarczane testerom. To odrębne role. Pipeline potrzebuje upload key, nie prywatnego klucza podpisującego zarządzanego przez Google.

## D. Zbuduj pierwsze podpisane AAB, bez uploadu

1. Otwórz [Actions → Google Play · Internal Testing](https://github.com/kpok/Tictactoe/actions/workflows/google-play-internal.yml).
2. Kliknij **Run workflow**. Upewnij się, że jesteś `kpok` i wybierasz gałąź **`main`**.
3. Ustaw:

| Pole | Pierwsza próba |
|---|---|
| `version_code` | `1`, **wyłącznie jeśli nigdy nie wysłałeś paczki z tym lub wyższym kodem** |
| `publish` | **false / niezaznaczone** |
| `release_status` | **draft** |

4. Uruchom. Przebieg ma przejść: walidacja → pełne CI dla tego samego SHA (Node, Playwright, build Androida, emulator, walidacja release i aktualizacji) → `sign-and-publish`. Sekrety trafiają tylko do ostatniego joba w chronionym środowisku; reusable CI ich nie dziedziczy.
5. Jeżeli pojawi się **Review deployments**, sprawdź commit i wyniki, potem zatwierdź `google-play-internal`. Nie zatwierdzaj niespodziewanego uruchomienia.
6. Z zielonego runu pobierz artefakt **`threefold-signed-aab-1`** (numer odpowiada wejściu). Rozpakuj ZIP **poza repo**. W środku jest **`threefold.aab`**.
7. Do Play nie wysyłaj `app-debug.apk`, instrumentation APK ani `app-release-unsigned.aab`. Podpisany plik jest właściwym artefaktem.
8. Opcjonalnie lokalnie sprawdź podpis:

```powershell
jarsigner -verify -verbose -certs 'C:\SCIEZKA-POZA-REPO\threefold.aab'
```

Dla poprawnej paczki narzędzie powinno potwierdzić podpis; ostrzeżenie o certyfikacie self-signed może wystąpić przy własnym upload key. Nie ignoruj błędów naruszenia integralności czy braku podpisu. Fingerprint upload certificate możesz porównać przez `keytool -printcert -jarfile` z wynikiem `keytool -list`. Po aktywacji App Signing certyfikat APK zainstalowanego z Play może być inny niż upload certificate — to spodziewane.

Pipeline dodatkowo odczytuje manifest rzeczywistego AAB i sprawdza certyfikat podpisu względem Twojego upload key. Próba aktualizacji używa osobnego jednorazowego klucza CI — nie pobieraj z niej paczek do Play.

Pipeline sprawdza SHA źródeł i hash **niepodpisanego** artefaktu przed podpisaniem. Podpisanie zmienia plik, więc hash końcowego AAB nie będzie równy hash niepodpisanego AAB.

**Zatrzymanie kontrolne:** na tym etapie nic nie zostało wysłane do Google Play. Nazwa joba `sign-and-publish` nie oznacza uploadu, gdy `publish=false`. Podpisany AAB jest jednak publicznym artefaktem GitHuba (retencja3 dni).

## E. Pierwszy upload ręcznie, tylko Internal Testing

1. W Play Console wybierz **właściwą aplikację** i **Internal testing**.
2. Przejdź do wydań i wybierz utworzenie nowego wydania. Skonfiguruj **Play App Signing** zgodnie z ekranem Console; dla nowej aplikacji możesz wybrać klucz podpisu generowany przez Google.
3. Wgraj **`threefold.aab`** pobrane z etapu D. Sprawdź wykryty pakiet **`com.kpok.threefold`**, versionCode i versionName. VersionName bierze się z `package.json`; nie wpisuje się go jako wejścia workflowa.
4. Uzupełnij nazwę wydania i opis zmian, np. „Pierwszy test: AI, lokalne PvP, języki i zapis gry”. Nazwa/opis mogą być widoczne testerom.
5. Napraw błędy wskazane przez Console. Nie zmieniaj deklaracji odbiorców lub danych tylko po to, żeby ominąć walidację. Google może poprosić o dalsze ustawienia lub weryfikację.
6. Na ekranie podsumowania sprawdź jeszcze raz **Internal testing / Testy wewnętrzne**. Zatwierdź udostępnienie na tej ścieżce zgodnie z aktualnym interfejsem.
7. **Nie wybieraj Production, Promote to production, open testing ani innej ścieżki.** Gdy ekran mówi o produkcji, wycofaj się i sprawdź lokalizację.

Pierwszy ręczny upload rejestruje pakiet dla używanej przez nas akcji API. Nie próbujemy tworzyć aplikacji samym API. Uruchomienie CI ponownie z `publish=false` nie zużywa kodu wersji w Play; upload do Play już tak.

## F. Dodaj testerów i zainstaluj grę przez Play

1. W sekcji testerów Internal testing utwórz listę e-mail albo użyj właściwej grupy Google. Dodaj swoje konto Google z telefonu oraz wybranych testerów. Nie commituj listy e-maili.
2. Zapisz listę/wybór testerów. Skopiuj link do dołączenia do testu i przekaż go prywatnie właściwym osobom.
3. Tester otwiera link, będąc zalogowany na **konto dodane do listy**, akceptuje udział i przechodzi do instalacji przez Google Play. Sam link nie zastępuje przypisania konta do testu. Publikacja/link mogą wymagać czasu na przetworzenie.
4. Jeśli wcześniej masz debug APK z GitHuba z tym samym pakietem, instalacja wersji Play może kolidować z innym podpisem. Zapisz potrzebne wyniki gry i odinstaluj debugową wersję przed instalacją Play — odinstalowanie usuwa lokalne dane.
5. Sprawdź pierwszy start, AI, lokalne PvP, limit3 znaków/FIFO, języki, zapis/wznowienie po zamknięciu aplikacji, Wstecz i układ ekranu. Włącz tryb samolotowy i sprawdź lokalną grę. Przy kolejnym wydaniu sprawdź aktualizację **bez odinstalowania** i zachowanie danych.
6. Potwierdź, że w tym wydaniu reklamy są wyłączone. Gra online nie jest dostępna w natywnym v1; backend online i iOS są osobnym etapem.

## G. Opcjonalnie: kolejne wydania automatycznie przez API

Ten etap nie jest potrzebny do pierwszego ręcznego testu. Nie dodawaj długowiecznego klucza „na zapas”.

1. W [Google Cloud Console](https://console.cloud.google.com) wybierz lub utwórz projekt i włącz **Google Play Android Developer API** (`androidpublisher.googleapis.com`). Samo włączenie API nie nadaje praw do aplikacji.
2. W **IAM & Admin → Service Accounts** utwórz dedykowane konto, np. `threefold-internal-publisher`. Nie przyznawaj projektu Cloud roli Owner/Editor.
3. W Play Console → **Users and permissions → Invite new users** dodaj adres e-mail tego konta usługowego. W **App permissions** wybierz wyłącznie Threefold. Nie nadawaj dostępu do wszystkich obecnych/przyszłych aplikacji.
4. Nadaj minimalnie odczyt informacji aplikacji i **Release to testing tracks**. Zarządzanie testerami nadaj tylko gdy potrzebne, a edycję draft app tylko gdy wymaga tego stan aplikacji/API. **Nie nadawaj Admin, produkcyjnych wydań, finansów ani rozliczeń.** Uprawnienie testowych wydań obejmuje ścieżki testowe — nie jest samo w sobie ograniczeniem tylko do internal; dodatkowo nasz YAML ustawia na sztywno `tracks: internal`.
5. Na koncie usługowym → **Keys → Add key → Create new key → JSON** wygeneruj klucz. Jeśli polityka Cloud zabrania tworzenia kluczy, zatrzymaj się; nie osłabiaj jej automatycznie. Obecny pipeline używa JSON; WIF/OIDC wymagałby osobnej zmiany.
6. Pobrany JSON przenieś do prywatnego folderu poza repo. Wklej **całą oryginalną zawartość JSON**, nie base64, do Environment secret **`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`** w `google-play-internal`. Usuń zbędne kopie z Downloads/schowka; zachowaj klucz zgodnie ze swoją bezpieczną procedurą lub usuń lokalną kopię po skutecznym ustawieniu. Nie wysyłaj pliku na GitHub jako załącznika.
7. Uruchom workflow na `main` z **nowym, większym `version_code`**, np. `2` po uploadzie `1`, i **`publish=true`**.
8. Wybierz `release_status` świadomie:

| Status | Efekt na ścieżce internal |
|---|---|
| `draft` | Upload i zapis wydania roboczego; nie udostępnia go jeszcze testerom |
| `completed` | Udostępnia wydanie testerom, o ile pozwala stan aplikacji/Console; **nie oznacza produkcji** |

Gdy aplikacja ma stan draft, zacznij od `draft`; później dokończ ją w Console. Wgrany kod wersji nie nadaje się do ponownego nowego uploadu tylko dlatego, że wydanie pozostaje draft. Do kolejnego uploadu używaj wartości większej od najwyższej użytej w Play. Zakres pipeline’u: `1..2100000000`.

9. Po zielonym runie potwierdź w Console **pakiet, versionCode, ścieżkę internal i status**. Nie traktuj samego zielonego builda albo zielonego draftu jako potwierdzenia dostępności dla testerów.
10. Zaktualizuj grę przez Play i wykonaj test z etapu F. Nie ponawiaj w ciemno uploadu z tym samym versionCode po timeoutcie — najpierw sprawdź, czy Google już go przyjęło.

## H. Kontrola przed każdym commitem i wydaniem

W folderze repo, przed zatwierdzeniem:

```sh
git status --short
git diff --cached --name-only
git diff --cached --stat
```

Sprawdź listę plików, a następnie lokalnie ich rzeczywistą zawartość. Nie publikuj wyników zawierających sekrety. Używaj `git add` z konkretnymi plikami zamiast bezmyślnego `git add .`. Nie używaj `git add -f` dla kluczy. Pobierane paczki, klucze i JSON-y przechowuj poza checkoutem.

Lista przed wydaniem:

- [ ] Wybrany `main` i znany/przejrzany commit; testy dla wydawanego SHA przeszły.
- [ ] `google-play-internal` ograniczone do gałęzi main; sekrety tylko w Environment secrets.
- [ ] Upload key znany, backup sprawdzony, hasła zapisane prywatnie.
- [ ] Żaden klucz/hasło/JSON nie jest śledzony, w commicie, artefakcie ani w logach.
- [ ] Pierwszy build: `publish=false`; dopiero świadomy upload API: `publish=true`.
- [ ] Właściwy podpisany AAB, pakiet `com.kpok.threefold`, poprawny versionCode.
- [ ] Ekran Google Play wskazuje **Internal testing**, nie produkcję.
- [ ] Tester używa właściwego konta Google; lista i link są zapisane.
- [ ] Deklaracje odpowiadają paczce; reklamy domyślnie wyłączone.

## I. Błędy i przypadkowe ujawnienie

| Problem | Co zrobić |
|---|---|
| Joby skipped | Sprawdź konto `kpok`, main i osobę ponawiającą run; inny aktor nie jest dopuszczony |
| Waiting for review / środowisko blokuje | Sprawdź reviewerów oraz regułę **Branch main**, nie znosząc ochrony tylko dla obejścia błędu |
| Actions unavailable / action is not allowed | [Diagnostyka repo](WORKFLOW_SECURITY_PL.md); nie dodawaj PAT ani sekretów do listy dozwolonych akcji |
| Missing environment secret | Dodaj dokładną nazwę w odpowiednim środowisku; nie drukuj wartości |
| Błędne hasło / alias | Sprawdź interaktywnie przez keytool lokalnie; nie dopisuj haseł do YAML |
| Package not found | Ręczny pierwszy upload i zgodność pakietu/konta Play |
| 403 od Play API | Sprawdź włączenie API i uprawnienia konta do **tej aplikacji**; uwzględnij propagację. Nie nadawaj automatycznie Admin |
| Zajęty versionCode | Nowy wyższy kod; sprawdź też uploady do innych ścieżek |
| Draft app wymaga draft | Wybierz draft lub dokończ konfigurację Console |
| Testy czerwone | Nie pomijaj testów; podpisywanie/upload są blokowane |
| Tester nie widzi gry | Sprawdź konto Google, zapis listy, rollout internal i czas przetwarzania |
| APK debug koliduje z Play | Różne podpisy; odinstaluj debug po zabezpieczeniu potrzebnych danych |

**Jeśli sekret trafił do publicznego repo, traktuj go jako ujawniony nawet po usunięciu pliku.**

1. Zatrzymaj publikowanie i nie przesyłaj ponownie sekretu w zgłoszeniu problemu.
2. Dla klucza konta usługowego wyłącz/usuń ujawniony klucz w Google Cloud, sprawdź aktywność i uprawnienia, utwórz nowy tylko w razie potrzeby, zaktualizuj secret.
3. Dla upload keystore zgłoś/resetuj upload key przez procedurę Play App Signing; sama zmiana hasła lokalnego pliku nie unieważnia skradzionej kopii. Zaktualizuj pipeline i backup po rejestracji nowego certyfikatu.
4. Usuń niebezpieczne artefakty/logi/kopie i dopiero po unieważnieniu poświadczeń oczyść historię Git zgodnie z procedurą incydentu. Sam `.gitignore`, nowy commit lub przepisanie historii nie usuwa cudzych kopii.
5. Sprawdź uruchomienia Actions i zmiany w Play/Cloud. Nie obracaj bez potrzeby właściwego app signing key — to inna operacja niż reset upload key.

## Źródła i zakres weryfikacji

Instrukcja odzwierciedla kod pipeline’u i oficjalne źródła sprawdzone 2026-10-27:

- [Konfiguracja testów i testerów](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Play App Signing i upload key](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Podpisywanie Android](https://developer.android.com/studio/publish/app-signing)
- [Google Play Developer API i konto usługowe](https://developers.google.com/android-publisher/getting_started)
- [Uprawnienia do konkretnej aplikacji](https://developers.google.com/android-publisher/api-ref/rest/v3/grants)
- [Akcja uploadu — dokładna przypięta wersja](https://github.com/r0adkll/upload-google-play/tree/e738b9dd8f2476ea806d921b64aacd24f34515a5)

Nie odczytano Twoich sekretów, nie sprawdzono zawartości Twojego konta Play, nie wygenerowano klucza i nie wykonano podpisania/uploadu w ramach przygotowania instrukcji. Gotowy workflow nie jest dowodem udanego wydania. Rzeczywisty wynik wymaga wykonania powyższych kroków przez właściciela.
