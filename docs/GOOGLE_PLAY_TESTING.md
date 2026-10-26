# Google Play Internal Testing — instrukcja operatora

Repo jest PUBLICZNE. Nie commituj keystore, haseł, JSON konta usługowego ani google-services.json. Nie podawaj ich w issues, czacie, workflow inputs ani komendach z jawnymi hasłami. APK/AAB, certyfikat publiczny, kod aplikacji i raporty w artefaktach traktuj jako publiczne. Krótki retention nie zapewnia poufności. Klucz prywatny nigdy nie trafia do artefaktu.

## 1. Tożsamość i konto Play

- Utwórz aplikację Threefold w Play Console. Pakiet w tym projekcie to **com.kpok.threefold** — musi odpowiadać docelowej aplikacji; po pierwszym uploadzie nie da się go po prostu zmienić.
- Dokończ konfigurację aplikacji/konta i Play App Signing, treści, grupy docelowej, Data safety, prywatności i testerów według wymagań Console. Nie deklaruj braku danych wyłącznie na podstawie braku analityki; sprawdź również użyte usługi.
- To jest track **Internal testing**, nie Internal app sharing, closed testing ani publiczna produkcja. Internal testing nie zastępuje wymagań testów zamkniętych nowego konta osobistego.

## 2. Najpierw zabezpiecz GitHub Environment

Settings → Environments → utwórz **google-play-internal**.

**PRZED dodaniem sekretów** ustaw Deployment branches and tags → Selected branches and tags → branch `main` (nie wszystkie gałęzie i nie dowolne tagi). Możesz dodatkowo ustawić Required reviewers. Chroń main przed nieprzejrzanymi zmianami; osoba mogąca zmieniać zaufany kod wydawniczy może zmienić również workflow. Warunek `if` w YAML nie zastępuje ochrony środowiska.

Sekrety dodaj do tego środowiska, nie jako globalnie dostępne repo secrets:

| Secret | Zawartość |
|---|---|
| ANDROID_UPLOAD_KEYSTORE_BASE64 | Keystore upload key zakodowany base64 |
| ANDROID_KEYSTORE_PASSWORD | Hasło magazynu |
| ANDROID_KEY_ALIAS | Alias upload key |
| ANDROID_KEY_PASSWORD | Hasło klucza |
| GOOGLE_PLAY_SERVICE_ACCOUNT_JSON | Pełny JSON konta usługowego Play API; tylko gdy publish=true |

Nie kopiuj klucza ani konta usługowego z daily_logic. Dla istniejącej aplikacji użyj upload key powiązanego z tą aplikacją. Dla nowej utwórz swój klucz lokalnie, zachowaj zaszyfrowaną kopię poza repo:

```sh
keytool -genkeypair -keystore threefold-upload.jks -alias threefold-upload -keyalg RSA -keysize 2048 -validity 10000
```

Keytool zapyta interaktywnie o hasła i dane certyfikatu. Na Linuxie zapis base64 do pliku lokalnego można zrobić `base64 -w 0 threefold-upload.jks > threefold-upload.base64`; oba pliki są poufne, nie dodawaj ich do git. Wklej wartość tylko do sekretu GitHub, następnie usuń tymczasowy plik base64. Publiczny certyfikat podpisu nie jest kluczem prywatnym.

W repo: brak pull_request_target, brak workflow_run pobierającego obce artefakty, brak secrets: inherit do weryfikacji. Joby PR/testów nie mają sekretów wydawniczych. Zweryfikuj też ustawienie GitHub wymagające zatwierdzenia Actions od nowych zewnętrznych kontrybutorów.

## 3. Konto usługowe Google Play

W Google Cloud włącz Google Play Android Developer API i utwórz dedykowane konto usługowe. Nie wymaga ono roli Owner/Editor w całym projekcie. W Play Console → Users and permissions dodaj email konta usługowego z dostępem tylko do tej aplikacji i uprawnieniami do wyświetlania informacji oraz publikowania/zarządzania wydaniami na ścieżkach testowych. Nie przyznawaj produkcyjnych wydań ani administracji całym kontem. JSON klucza umieść tylko w GOOGLE_PLAY_SERVICE_ACCOUNT_JSON; rotuj/usuń go w razie ujawnienia. WIF/OIDC może później zastąpić długowieczny klucz; obecny pipeline obsługuje jawnie ten jeden sposób autoryzacji.

Pierwsza paczka zwykle musi zostać przesłana ręcznie w Console, aby pakiet istniał dla API. Pipeline ma do tego tryb build-only poniżej. Nie próbuj automatycznie tworzyć nowej aplikacji samym API uploadu.

## 4. Pierwsza podpisana paczka

Actions → **Google Play · Internal Testing** → Run workflow → main:

- version_code: np.1 tylko jeśli nigdy nie użyto tego ani większego kodu w Play.
- publish: **false**.
- release_status: draft.

Workflow: validate → pełne reusable CI (w tym Android build/emulator i Playwright) → środowisko google-play-internal → weryfikacja pochodzenia/hash → podpisanie niepodpisanego AAB bez przebudowy → artefakt `threefold-signed-aab-1`. Jeśli skonfigurowano reviewerów, zatwierdź dopiero po sprawdzeniu commitu i testów.

Pobierz `threefold.aab`, sprawdź dane i prześlij do Internal testing ręcznie, skonfiguruj Play App Signing i testerów. Artefakt podpisany upload key nie zawiera prywatnego klucza, ale w publicznym repo nie jest tajny.

## 5. Następne deploymenty przez API

Uruchom ten sam workflow z main, **nowym większym version_code**, publish=true. Wszystkie joby uruchamiają się dla tego samego SHA; pipeline nie pobiera paczki „ostatniego zielonego builda” innego commitu. AAB z tego przebiegu jest podpisywany, nie przebudowywany. Track jest na sztywno internal.

- draft: zapisuje robocze wydanie; nie udostępnia go testerom. Użyj, gdy aplikacja w Console nadal jest szkicem.
- completed: udostępnia wydanie w Internal testing, gdy stan aplikacji w Play na to pozwala. Nie oznacza publicznej produkcji.

Każdy upload do dowolnej ścieżki zużywa versionCode. Rerun z już przesłanym kodem może zostać odrzucony; użyj nowego większego kodu, nie próbuj nadpisywać istniejącego wydania. Zakres1..2100000000; brak automatycznego zgadywania wersji z run_number. Przebiegi wydawnicze są serializowane i nie przerywają aktywnego uploadu.

Zainstaluj grę przez link Internal testing na fizycznym telefonie i sprawdź pierwszy start offline, AI, zapis/wznowienie, języki, Wstecz, obrót i aktualizację poprzedniej wersji. Emulacja nie gwarantuje akceptacji sklepu ani poprawności na wszystkich urządzeniach.

## Diagnostyka i granice

- Brak sekretu → jasny błąd przed podpisaniem; normalne PR CI nadal działa.
- Package not found → bootstrap ręczny i zgodność com.kpok.threefold.
- Draft app wymaga draft → dokończ konfigurację Console lub wybierz draft.
- Zajęty versionCode → nowy wyższy kod.
- Błąd testów → podpisanie i upload zablokowane. Instrumentacja wymaga dokładnie5 udanych testów bez skipów.
- Keystore usuwany w kroku always, nie trafia do artefaktów; hasła przekazywane jarsigner przez env, nie argumenty z wartościami.
- Pipeline przygotowany do uploadu nie dowodzi udanego uploadu: do tego potrzebne są Twoje środowisko/secrets i stan aplikacji w Play.

Źródła: https://github.com/r0adkll/upload-google-play (przypięte v1.1.5), https://developers.google.com/android-publisher/getting_started, https://support.google.com/googleplay/android-developer/answer/9842756, https://capacitorjs.com/docs/android.
