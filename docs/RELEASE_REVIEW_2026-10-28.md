# Threefold — pełny przegląd gotowości wydania Google Play

Data: 2026-10-28. Status: **Internal Testing — akceptacja warunkowa; publiczna premiera — HOLD**.

Przegląd dotyczy `kpok/Tictactoe`, zdalnego `main` na `08403ebb1e1b923b552a0edb5f27e530d0ce57f7` (lokalne `b7606f0`, identyczne drzewo). Kod wykonywalny był testowany w rewizji `a9e5a70076fa7b7619cd56c019b311ec6b0efc67`; późniejszy commit zawierał wyłącznie zapis wyników. Ten raport nie zmienia kodu aplikacji ani konfiguracji kont.

## Decyzja rady: DEC-PLAY-READY-001

Pytanie: czy obecne rozwiązanie nadaje się do pierwszego Internal Testing oraz do publicznego wydania Android offline v1, również dla dzieci?

Cztery niezależne przeglądy agentowe sprawdziły kod, testy i granice wydania. To nie jest certyfikat akceptacji sklepu. Każdy ekspert otrzymał ten sam zakres i rewizję, bez nakazu potwierdzenia wcześniejszych decyzji. Po ocenach początkowych porównano warunki; nie było merytorycznego sprzeciwu wobec poniższej granicy.

| Rola / uczestnik | Internal Testing | Publiczna premiera obecnej paczki | Główne warunki |
|---|---|---|---|
| Gra, frontend, zapis i AI — `release_game_review` | ACCEPT WITH CONDITIONS | HOLD | Fizyczny release, poprawne teksty prywatności, uczciwy opis funkcji |
| Android, lifecycle, build i podpis — `release_android_review` | ACCEPT WITH CONDITIONS | HOLD | Instalacja rzeczywistej paczki przez Play i próby UMP/reklamy/urządzeń |
| Security, CI i granica zaufania — `release_security_review` | ACCEPT WITH CONDITIONS | HOLD | Weryfikacja ustawień właściciela i rzeczywistego procesu wydania |
| Google Play, reklamy, dzieci i prywatność — `release_play_ads_review` | ACCEPT WITH CONDITIONS | HOLD | Polityka prywatności, Console, docelowy profil reklam i testy |

**Nie wykryto potwierdzonego krytycznego defektu gry Android blokującego rozpoczęcie testów wewnętrznych.** Brak wykrytego defektu nie dowodzi braku wszystkich błędów. Gotowość builda nie jest równoznaczna z gotowym kontem, listingiem, polityką ani akceptacją Google.

Właściciel potwierdził, że nie wysyłał jeszcze żadnej paczki do Play. Najbliższa granica to pierwsze podpisane AAB z `publish=false`, ręczny upload do Internal Testing oraz fizyczny test. Nie potrzeba przed tym dopisywać multiplayera, kont ani iOS.

## Sprawdzony zakres

- Reguły FIFO, wygrana po usunięciu najstarszego znaku, remisy, serializacja i walidacja zapisu.
- AI/Worker, anulowanie starych obliczeń, lokalna gra, odtworzenie danych, 16 katalogów językowych, PWA i web online.
- Projekt Capacitor/Android, manifest, konfiguracja SDK, natywna integracja AdMob/UMP i lifecycle.
- Zakończone rundy, limit reklam, wiek, zgoda, błędy i brak sieci, test/live/disabled.
- Workflowy, owner gates, uprawnienia, przypięte akcje, sekrety, artefakty, podpis i aktualizacja.
- Instrukcje wydania, bieżące wymagania Play z oficjalnych źródeł i audyt npm.

Nie wykonywano zmian kont, odczytu sekretów, podpisu prawdziwym upload key, publikacji, fizycznego testu sieciowego AdMob ani pełnego skanu historii git lub całego grafu bibliotek Maven pod kątem podatności. Ustawienia administracyjne GitHub i stan Console pozostają niezweryfikowane.

## Dowody testowe i rzeczywista paczka

[CI 40751579227](https://github.com/kpok/Tictactoe/actions/runs/40751579227): **SUCCESS** dla dokładnej rewizji runtime.

| Dowód | Wynik | Granica dowodu |
|---|---|---|
| Node22 i24 | 42 testy Node, 17 Python; syntax/workflow/build PASS | Logika, narzędzia, konfiguracja i zabezpieczenia |
| Playwright Chromium / mobile Chromium / iPhone WebKit | 84 PASS | Testy web oraz atrapa mostka reklam; nie prawdziwa emisja |
| Build Androida | SUCCESS; natywne unit testy, release manifest, generated BuildConfig PASS | Rzeczywista konfiguracja AAB i debug APK |
| Emulator Android15 | 5 testów PASS | Zainstalowany debug APK, offline i bez reklam |
| Podpis i aktualizacja release | 1001 → 1002 PASS, zachowana partia i Tagalog, kolejny ruch działa | Jednorazowy klucz CI, osobne paczki z reklamami disabled |
| Ponowna lokalna kontrola podczas tego review | check, 42 Node i17 Python PASS | Bieżące niezmienione źródła |
| Niezależny przegląd gry | 1000 legalnych partii, 13188 odczytanych stanów JSON, 621 legalnych ruchów AI PASS; 11 Chromium game E2E PASS | Dodatkowy eksperyment kontrolny, nie wyczerpujący dowód wszystkich pozycji |
| Niezależny security review | 16 testów workflow/provenance/server PASS | Kontrole źródeł; nie ustawienia administracyjne |

Dodatkowo pobrano **rzeczywisty** artefakt `threefold-android-a9e5a70076fa7b7619cd56c019b311ec6b0efc67`, ID `12843084178`. Sprawdzono SHA256 archiwum względem digestu Actions oraz hashe wszystkich trzech paczek względem `manifest.json`.

- `app-release-unsigned.aab`: 6633329 bajtów, pakiet `com.kpok.threefold`, versionCode1.
- `app-debug.apk`: 8572280 bajtów; `app-debug-androidTest.apk`: 795283 bajty.
- We wszystkich trzech archiwach **brak plików `.so`**. Nie znaleziono więc w tej paczce problemu wyrównania bibliotek NDK do16KB. Nie należy zgłaszać hipotetycznej niezgodności16KB jako wykrytego defektu. Testy zgodności urządzeń nadal są zalecane; nowe zależności wymagają ponownej analizy.
- Profil AAB: `mode=test`, oficjalny sample App ID i testowy interstitial Google, `privacyUrl=""`, `familiesReviewed=false`, debug `disabled`.
- To oznacza, że przebieg dowodowy zbudował sample konfigurację. Nie potwierdza konfiguracji własnego App ID/UMP ani opublikowanej polityki poza repo.

Target SDK36 w `android/variables.gradle:3–4` odpowiada obecnemu wymaganiu nowych aplikacji od31.08.2026. Sam target nie zastępuje próby na Android16/API36.

## Ustalenia i warunki zamknięcia

Priorytet P1 poniżej oznacza warunek konkretnej granicy wydania; nie jest automatycznie potwierdzoną luką bezpieczeństwa.

### RR-01 — P1, obecny profil to QA, nie publiczna monetyzacja

Dowód: `.github/workflows/ci-pipeline.yml:151`, `scripts/internal-ads.js:12`, rzeczywisty manifest pochodzenia AAB. CI jawnie wymusza test i oficjalną jednostkę demo; własny App ID nie zmienia jednostki. Nie promować tej paczki jako gotowej wersji zarabiającej.

Zamknięcie przed produkcją: wybrać jawny profil **bez reklam** albo przejrzeć i wdrożyć osobny profil **live dla dorosłych**, z prawdziwą jednostką, UMP i deklaracjami. Testowe wyświetlenia nie generują przychodu. To nie wymaga odblokowania reklam dla dzieci.

### RR-02 — P1, pełna polityka prywatności nie została przedstawiona

Dowód: `scripts/internal-ads.js:6` dopuszcza pusty URL, `web/app.js:68–72` wtedy ukrywa link; rzeczywisty AAB ma pusty URL. W repo nie znaleziono samodzielnej, pełnej polityki aplikacji. Nie przesądza to, że właściciel nie ma dokumentu poza repo.

Zamknięcie: opublikowany, dostępny adres polityki zgodnej z faktycznymi danymi SDK, kontaktem właściciela, lokalnym przechowywaniem i odbiorcami; link w aplikacji i w Console. Ustawić publiczną repository variable `ADS_PRIVACY_URL`. Krótki tekst w dialogu nie zastępuje pełnej polityki. Dla sprawdzenia zgody skonfigurować własny `ADMOB_APP_ID` i opublikowane komunikaty AdMob Privacy & messaging. Brak poprawnego UMP ma nadal oznaczać grę bez reklam, nie obejście zgody.

### RR-03 — P1, brakuje rzeczywistego testu release / reklamy / zgody

Dowód: `scripts/run-android-e2e.sh:6–15`, `scripts/build-release-smoke.sh:17`, `e2e/ads.spec.js`. Instrumentacja jest offline i ads-disabled; E2E reklam ma atrapę. Kontrola manifestu potwierdza konfigurację, nie udane pokazanie i zamknięcie reklamy.

Zamknięcie przed publiczną premierą: instalacja z **Play Internal Testing na fizycznym telefonie**, z zapisanym numerem wersji i wynikiem. Sprawdzić zimny start/offline, AI hard, zapis, restart procesu, powrót z tła, obrót i dużą czcionkę; w realnym przepływie UMP wybór/odmowę/zmianę ustawień, ładowanie/reklamę/zamknięcie/dalszą grę oraz tło podczas formularza/reklamy. Dla under18 i unknown potwierdzić brak żądań. Sprawdzić limit5 rund AND180s i no-fill/offline. **Internal Testing jest właściwym miejscem wykonania tych prób**, a nie etapem wymagającym wcześniejszego ich zaliczenia.

### RR-04 — P2, potwierdzone niespójne informacje o reklamach

Dowód:

- `web/locales/en.js:128`, `web/locales/pl.js:128` i odpowiedniki w katalogach mówią, że reklamy są domyślnie wyłączone; `web/app.js:72` pokazuje ten tekst w native niezależnie od rzeczywistego profilu.
- `docs/GOOGLE_PLAY_TESTING.md:152` każe sprawdzać brak reklam, a `:199` nadal zawiera checklistę reklam wyłączonych; `:37` prawidłowo opisuje test-enabled.
- `docs/MOBILE.md:36`, `README.md:94` nie rozróżniają lokalnego Gradle disabled od CI release test. `README.md:26` nadal wspomina uruchomienia PR, których aktualna polityka celowo nie dopuszcza.

Zamknięcie: spójny tekst zależny od profilu albo precyzyjnie opisujący bramki wieku i zgody, poprawiona instrukcja oczekiwanych wyników. Poprawić przed przekazaniem scenariusza QA testerom; nie zmieniać bramek ani odblokowywać reklam dzieciom. Raport rejestruje uwagi — nie oznacza, że zostały już naprawione.

### RR-05 — P1 przed sekretami, ustawienia administracyjne wymagają potwierdzenia

Dowód: owner gates i12 definicji jobów przechodzą kontrolę. `docs/WORKFLOW_SECURITY_PL.md` rozróżnia YAML i ustawienia repo. Nie sprawdzono reguł main, aplikacji/collaboratorów, approval forków ani branch rule `google-play-internal`. Reguły YAML nie bronią przed podmiotem, który może je zmienić, i nie przejmują automatycznego Pages ani historycznych definicji.

Zamknięcie: właściciel potwierdza instrukcję bezpieczeństwa, dostęp i ograniczenie środowiska do main **przed dodaniem prawdziwych sekretów**. Podpis tylko w tym środowisku; pierwszy przebieg `publish=false`. Brak dowodu ustawień nie jest potwierdzonym wykryciem niewłaściwej konfiguracji.

### RR-06 — P2, jeden umiarkowany advisory w narzędziu deweloperskim

Niezależny i ponowny audyt npm: produkcyjne `npm audit --omit=dev` — **0**; pełny audit — **3 moderate nodes**, jedna ścieżka `@capacitor/cli8.5.3 → xcode3.0.1 → uuid7.0.3`, GHSA-w5hq-g745-h8pq / CVE-2026-41907. Nie są to trzy niezależne luki w aplikacji. Advisory dotyczy API UUID v3/v5/v6 z buforem; obserwowany `xcode/lib/pbxProject.js:90` używa v4. Nie odtworzono podatnej ścieżki w Android runtime.

Zamknięcie: osobna kontrolowana aktualizacja zgodnych wersji Capacitor i retest; audit wskazuje CLI8.6.0 jako możliwość naprawy. Zweryfikować docelową wersję w momencie zmiany; bez ślepego `npm audit fix --force`. Nie blokuje pierwszego Android Internal Testing na podstawie zebranych dowodów. Audyt npm nie obejmuje całego grafu Maven.

### RR-07 — P2, pokrycie zgodności Android wymaga rozszerzenia

CI wykonuje API35/x86_64, target jest36, a minSDK24. Brakuje fizycznego ARM64/API36 i sensownego starszego wspieranego Android/WebView. Nie wykryto niezgodności; rzeczywisty AAB nie zawiera `.so` (wątpliwość NDK16KB sprawdzona, nie blocker).

Zamknięcie: próby na fizycznym ARM64, szczególnie API36 oraz starszym urządzeniu, i przegląd raportów dostępnych dla przesłanej paczki w Console. Przy dodaniu natywnych bibliotek ponownie sprawdzić16KB. Nie wymaga uruchamiania ogromnej macierzy emulatorów przed pierwszym testem wewnętrznym.

### RR-08 — P3, lokalny kolektor może oznaczyć disabled jako test

Dowód: `scripts/android-artifacts.js` zapisuje profil `internalAds()` bez sprawdzenia natywnego outputu. Lokalna instrukcja `docs/MOBILE.md:28` następuje po domyślnym Gradle disabled. Może więc wytworzyć lokalny opis artefaktu twierdzący test przy disabled AAB.

Zamknięcie: doprecyzować lokalne instrukcje lub wymagać tej samej kontroli generated BuildConfig przed kolekcją. **Obecny CI nie ma tego problemu**: najpierw uruchamia `check-internal-ads.py`, potem kolektor i weryfikację podpisywanego artefaktu. Nie jest to obejście aktualnego pipelineu wydawniczego.

### RR-09 — P2 dla przyszłego online, nie dla Android offline

Dowód: `server/app.js:79–85` identyfikuje klienta limitera przez `socket.remoteAddress`; polling `web/app.js:204` odbywa się co sekundę. Typowy reverse proxy powoduje wspólny limit180/min dla klientów. Eksperyment kontrolny z limitem3 i czterema różnymi X-Forwarded-For dał404,404,404,429, potwierdzając brak rozdzielenia takich klientów. Ograniczenie jest już opisane w README.

Zamknięcie przed hostingiem online: świadoma granica zaufanego proxy/edge rate limiting i test obciążenia. Nie ufać dowolnemu XFF. Android v1 ukrywa online, więc nie wymaga to prac przed jego premierą. Listing nie może obiecywać internetowego multiplayera.

## Co działa i nie wymaga przebudowy

Mechanika odpowiada pomysłowi: maksymalnie3 O i3 X, usunięcie najstarszego przed sprawdzeniem wygranej; walidacja zapisów odrzuca niespójne tury, kolejki i wyniki. AI ma ograniczony budżet, a stary worker jest anulowany. Testy obejmują grę lokalną, offline, lokalizację, odtworzenie i web online.

Reklamy wymagają neutralnego wyboru wieku i świeżego UMP/canRequestAds. Ładowanie nie wyświetla reklamy. Pokazanie wymaga zakończonej rundy, krótkiej granicy restartu, aktywności, gotowej reklamy oraz limitu5 rund i180s. Dzieci i unknown są blokowane przez osobną bramkę; można pozostawić je bez reklam także w produkcji. Nie ma potrzeby uruchamiać ścieżki Families, aby wydać grę mixed-audience z reklamami wyłącznie dla kwalifikujących się dorosłych.

CI ma przypięte akcje, read-only tokeny, checkout wybranego SHA bez zapisanych credentiali i owner gates. Podpisuje wcześniej sprawdzony AAB; nie przebudowuje go z sekretami. Kontrolowane są hashe, wersje, profil reklam, manifest i certyfikat. Upload jest opt-in i ograniczony do internal.

## Kolejność dalszych prac

1. Poprawić RR-04 i doprecyzować lokalne artefakty RR-08. Aktualizację narzędzi RR-06 wykonać jako osobną małą zmianę z testami, bez przebudowy całej gry.
2. Potwierdzić administracyjne zabezpieczenia repo/środowiska RR-05. Opublikować pełną politykę; skonfigurować publiczne `ADMOB_APP_ID`, `ADS_PRIVACY_URL` oraz komunikaty UMP. Materiał podpisu przechowywać wyłącznie według instrukcji, poza git.
3. Zbudować pierwsze podpisane AAB: `main`, `version_code=1` tylko jeśli nadal żaden kod nie został użyty w Play, `publish=false`. Ręcznie przesłać do **Internal Testing**, skonfigurować testerów i opt-in. Szczegóły: [GOOGLE_PLAY_TESTING.md](GOOGLE_PLAY_TESTING.md), [ADS.md](ADS.md).
4. Wykonać i zapisać RR-03/RR-07 na paczce z Play. To jest najważniejszy kolejny dowód, zamiast dalszego rozbudowywania funkcji.
5. Przygotować listing dla **AI i lokalnego PvP**: opisy, ikonę sklepu512×512, screenshoty, kontakt, klasyfikację treści, target audience, deklarację reklam i Data safety właściwą dla końcowej paczki/SDK.
6. Sprawdzić typ i datę konta. Dla osobistego konta utworzonego po13.11.2023: **closed testing, minimum12 testerów zapisanych przez14 kolejnych dni**, następnie wniosek o dostęp do produkcji. Internal nie zastępuje tego etapu. Nie zakładamy, że wymóg dotyczy tego konkretnego konta bez sprawdzenia.
7. Wybrać i osobno zweryfikować profil publicznego wydania (bez reklam lub live dorosłych), zakończyć wymagane testy/deklaracje i dopiero podjąć decyzję o premierze. Obecny pipeline celowo nie publikuje do production.

Internal Testing może wystartować przed pełnym ukończeniem konfiguracji listingu, do100 testerów. Aplikacja **wyłącznie** na Internal Testing jest zwolniona z formularza Data safety; to nie jest ogólne zwolnienie z obowiązków prywatności ani podstawa do błędnych deklaracji. Przed closed/open/production uwzględnić również dane SDK.

## Źródła pierwotne sprawdzone 2026-10-28

- [Internal / closed / open testing](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en).
- [Nowe osobiste konta i wymagania testowania](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
- [App content, prywatność, odbiorcy i reklamy](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en).
- [Data safety, SDK i wyjątek exclusive internal](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
- [Target API36](https://developer.android.com/google/play/requirements/target-sdk).
- [Weryfikacja bibliotek i16KB](https://developer.android.com/guide/practices/page-sizes).
- [Test ads i oficjalne jednostki demo](https://developers.google.com/admob/android/test-ads).
- [UMP i komunikaty aplikacji](https://developers.google.com/admob/android/privacy).
- [Families](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en).
- [Assety listingu](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).
- [Advisory uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

Wymagania usług mogą się zmieniać; przed faktycznym zgłoszeniem należy ponownie sprawdzić komunikaty właściwego konta i paczki w Console. Żadne konto ani produkcja nie zostały zmienione podczas review.
