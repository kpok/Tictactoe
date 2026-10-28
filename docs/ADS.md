# Opcjonalne reklamy Android — 5 rund + 3 minuty

## Co jest zaimplementowane

- Własny plugin ThreefoldAds dla Capacitor8.5.3: Google Mobile Ads24.9.0, UMP4.0.0; bez mediacji i bez wrappera społecznościowego.
- Lokalny Gradle domyślnie używa **adsMode=disabled**. CI buduje release z **adsMode=test** do Internal Testing, a debug nadal z **disabled**. Wersja web/PWA nie korzysta z reklam ani SDK.
- Maksymalnie1 gotowy interstitial po co najmniej5 ukończonych rundach i180 sekundach. Liczą się wygrane/przegrane/remisy, nie porzucone gry. Zakończenie ma zapisany roundId i zabezpieczenie przed ponownym zliczeniem po reloadzie.
- Próba wyłącznie przy przejściu z zakończonej partii do nowej. Nie czekamy na pobranie reklamy. Brak sieci/no-fill/błąd/niegotowa reklama → nowa partia bez reklamy.
- Native sprawdza licznik, elapsedRealtime, aktywność, wiek, konfigurację, świeży stan UMP i dostępność reklamy. Krótko ważny token granicy rund chroni przed spóźnionym wyświetleniem po wznowieniu gry. Preload/consent nigdy sam nie wyświetla reklamy.
- Budżet zużywa dopiero onAdShowedFullScreenContent. Licznik i ostatni roundId są lokalne w SharedPreferences. Nowa instancja pluginu konserwatywnie rozpoczyna nowy3-minutowy okres oczekiwania. Zmiana zegara systemowego nie skraca bieżącego limitu.
- Interfejs blokuje kolejne restarty/zmiany trybu/poziomu/czyszczenie w trakcie oczekiwania na zamknięcie faktycznie pokazanej reklamy. Watchdog nie pozwala na wieczne oczekiwanie na callback; nie dodajemy własnego przycisku nad reklamą Google.

## Dzieci i nieznany wiek

Neutralny ekran oferuje bez domyślnego wyboru: poniżej18,18+,wolę nie podawać. Nie zbieramy daty urodzenia, imienia ani dokumentów. Wybór jest lokalny i dostępny z „Reklamy i wiek”. Zamknięcie bez wyboru = brak inicjalizacji reklam. Zmiana wieku usuwa preload, unieważnia callbacki/generację i wymaga świeżego wyniku UMP. Zmiana na dziecko/unknown od razu nakłada restrykcyjne flagi na przyszłe żądania. Nie da się cofnąć już wysłanego żądania czy całkowicie „od-inicjalizować” działającego SDK.

**Dzieci/unknown są domyślnie bez reklam**, dopóki adsFamiliesReviewed nie jest true. To jest osobna bramka OPERACYJNA, nie certyfikat zgodności kodu. Przed jej ustawieniem właściciel musi sprawdzić:

1. Dokładną wersję SDK na aktualnej liście Families Self-Certified SDKs. Nie zakładamy certyfikacji wyłącznie z numeru wersji.
2. STANDARDOWĄ jednostkę interstitial AdMob, bez partner bidding, bez mediacji/niestandardowych sieci.
3. **High-engagement ads = OFF w AdMob Console.** Google dokumentuje wtedy czas do pominięcia interstitiala do5 sekund. Ustawienie domyślnie jest ON i nie obejmuje partner bidding. Tabela dopuszcza do2 kroków wyjścia, więc konieczne jest sprawdzenie rzeczywistego zamykania kreacji na urządzeniu.
4. Poprawną grupę docelową, deklarację reklam, Data safety i politykę prywatności w Play; konfigurację age/consent w AdMob.
5. Jeżeli rzeczywista kreacja nie spełnia wymagań zamykania Families — natychmiast wyłączyć ścieżkę dzieci/unknown i poprawić konfigurację dostawcy.

Dla dzieci/unknown: TFCD=true, TFUA=true, kategoria G, npa=1. UMP dostaje oddzielnie under-age=true (nie prosi dziecka o zgodę); dopiero udane świeże sprawdzenie i canRequestAds pozwala ładować. Przy błędzie/nieznanej kwalifikacji reklamy są pomijane. Dla dorosłych: UMP privacy/consent, canRequestAds, G i npa=1. Prywatność reklam jest dostępna z ustawień, jeśli UMP wymaga tego przycisku. Brak zgody/kwalifikacji nie blokuje gry.

Manifest merge usuwa AD_ID/AdServices identyfikatory i MobileAdsInitProvider, app measurement jest opóźnione. CI sprawdza faktyczny merged APK. Nie jest to obietnica, że każda wersja SDK nie przetwarza żadnych danych; przed live należy sprawdzić aktualne ujawnienia SDK i pomiary, a deklaracje Data safety obejmują również SDK.

## Internal Testing — reklamy testowe

Pipeline `Google Play · Internal Testing` podpisuje dokładnie AAB z pełnego CI, z włączonym **trybem testowym**, oficjalną jednostką interstitial Google i `adsFamiliesReviewed=false`. Dotyczy to również unsigned AAB z normalnego CI. Nie ma pola pozwalającego przełączyć ten pipeline na reklamy live. Testowe wyświetlenia **nie zarabiają**. Debug APK i oddzielne paczki testu aktualizacji pozostają bez reklam; web/PWA również.

Przed sprawdzaniem reklam na telefonie:

1. W AdMob dodaj aplikację Android o pakiecie `com.kpok.threefold`. Skopiuj **App ID** z separatorem `~`, nie jednostkę reklamową z `/`. To publiczna konfiguracja, nie klucz podpisu ani credential Play.
2. W AdMob **Privacy & messaging** skonfiguruj i opublikuj odpowiednie komunikaty zgody dla tej aplikacji, w tym dla EOG/Polski. Zapewnij opublikowaną politykę prywatności odpowiadającą działaniu SDK. Tryb testowy nie zastępuje tej konfiguracji.
3. W GitHub → repo → **Settings → Secrets and variables → Actions → Variables → Repository variables** dodaj `ADMOB_APP_ID` (Twój App ID) oraz `ADS_PRIVACY_URL` (publiczny adres HTTPS polityki). Użyj **repository variables**, nie environment variables/secrets: build bez sekretów i podpisanie muszą otrzymać te same wartości. Nie zmieniaj ich podczas trwania workflowu.
4. Bez `ADMOB_APP_ID` pipeline użyje oficjalnego sample App ID Google. To pozwala zbudować paczkę bez konta, ale **nie gwarantuje poprawnego wyniku UMP ani wyświetlenia reklamy**. W razie błędu zgody gra działa bez reklamy; aplikacja nie omija UMP. Własny App ID nadal używa wyłącznie oficjalnej **testowej jednostki** Google — nie dodawaj produkcyjnego Ad unit ID do tego pipelineu.
5. Uruchom workflow na `main` z nowym `version_code`, początkowo `publish=false`; pobierz podpisane AAB i postępuj według [instrukcji Play](GOOGLE_PLAY_TESTING.md). Zaktualizuj aplikację w Internal Testing. Istniejącej instalacji nie da się zmienić samym commitem: potrzebna jest nowa paczka i instalacja aktualizacji.
6. Na telefonie połącz się z internetem. W „Reklamy i wiek” sprawdź informację o trybie testowym. Dorosły tester wybiera swój rzeczywisty przedział **18+**, następnie przechodzi UMP, jeśli zostanie pokazany. Nie nakłaniaj dzieci do wyboru dorosłego profilu.
7. Ukończ co najmniej **5 rund** (wygrana/przegrana/remis) i pozostaw aplikację aktywną przez co najmniej **3 minuty** od uruchomienia. Dotknij „Nowa runda” po zakończeniu partii. Gotowa reklama może pojawić się tylko wtedy; brak gotowej reklamy/nofill/sieci/zgody oznacza natychmiastowe przejście do gry. Szukaj etykiety **Test Ad** Google. Uruchomienie aplikacji ponownie rozpoczyna konserwatywnie nowy okres 3 minut.
8. Sprawdź zamknięcie reklamy i dalszą grę, brak natychmiastowej kolejnej reklamy, grę offline oraz profile „poniżej18” i „wolę nie podawać” — te profile mają pozostać **bez reklam**. Udokumentuj wynik dla fizycznego urządzenia i wersji aplikacji. CI z atrapą mostka oraz offline emulator nie potwierdza prawdziwej emisji ani formularza UMP.

CI sprawdza wygenerowany `BuildConfig` release/debug oraz App ID w rzeczywistym manifeście AAB. Manifest pochodzenia artefaktu wiąże tryb, App ID, privacy URL i bramkę Families z hashami paczek; podpisanie odrzuci inną konfigurację. Zmiana zmiennych w trakcie przebiegu może więc zakończyć go błędem — wtedy uruchom od nowa. Nie dodano nowych sekretów i nie wykonano publikacji do Play ani zmian na koncie AdMob.

Aby zarabiać w późniejszej wersji, potrzebny jest osobny przegląd i jawna zmiana konfiguracji budowania, prawdziwa jednostka AdMob oraz kroki produkcyjne poniżej. Nie promuj tej testowej paczki do produkcji.

## Konfiguracja i uruchamianie

Wersja bez reklam nie wymaga konta AdMob. Publiczne identyfikatory App ID/Ad unit ID NIE są kluczami podpisu ani credentialami Play.

Po `npm run android:sync`:

```sh
cd android
# Oficjalne identyfikatory TESTOWE Google, żadnych zarobków.
./gradlew :app:assembleDebug -PdebugAdsMode=test
```

Debug APK jest domyślnie bez reklam, niezależnie od ustawień release, aby CI nigdy nie wyświetlało prawdziwych reklam. Tylko jawne debugAdsMode=test pozwala testować SDK w debug. Release używa adsMode=disabled/test/live. Test mode zawsze używa oficjalnego testowego AD UNIT ID Google. Opcjonalnie dodaj -PadmobAppId=TWÓJ_POPRAWNY_APP_ID, aby testować komunikaty UMP skonfigurowane dla własnej aplikacji; bez tego używany jest sample App ID. Własny App ID nie zmienia testowej jednostki reklamowej. Brak poprawnej konfiguracji UMP dla wybranej aplikacji może uniemożliwić emisję; nie omijamy UMP po błędzie. Testy automatyczne używają deterministycznej atrapy mostka do sprawdzenia przepływu, a nie prawdziwych emisji sieciowych. Nie wolno klikać prawdziwych reklam podczas testów.

Produkcyjna konfiguracja wymaga jawnych właściwości Gradle (można przechowywać niepoufne identyfikatory w android/gradle.properties po review):

```properties
adsMode=live
admobAppId=ca-app-pub-TWOJ_APP_ID
admobInterstitialId=ca-app-pub-TWOJ_AD_UNIT_ID
adsPrivacyUrl=https://twoja-strona/polityka-prywatnosci
adsLiveReviewed=true
# Dopiero po wykonaniu całej listy Families powyżej:
adsFamiliesReviewed=false
```

Placeholdery z przykładu celowo nie przechodzą walidacji. Live build odrzuca test IDs, brak prawdziwych ID, brak HTTPS privacy URL i brak adsLiveReviewed. Flagi review są potwierdzeniem właściciela, a nie automatycznym odczytem z Console. Bez adsFamiliesReviewed dzieci/unknown nadal nie uruchamiają SDK/UMP/żądań.

Po zmianie publicznej konfiguracji dotychczasowy pipeline buduje i testuje ten sam commit, następnie podpisuje AAB. Sekrety reklamowe nie są potrzebne. Obecny CI jawnie wymusza test; samo dodanie `adsMode=live` do gradle.properties nie zmieni paczki Internal Testing. Włączenie live wymaga osobnej zmiany pipelineu i jego polityki po review. Automat instrumentacji używa debug APK bez reklam nawet po aktywowaniu trybu release test/live. Osobne testy rzeczywistych emisji i formularzy na testowym urządzeniu wymagają ręcznego builda debugAdsMode=test i konta/komunikatów AdMob. Nie są zastępowane przez atrapę ani CI offline.

Przed zarabianiem: konto AdMob, link do sklepu, app-ads.txt na witrynie dewelopera, zatwierdzenie aplikacji, komunikaty UMP, prawidłowa polityka i deklaracje danych. **Żadna z tych usług nie została włączona w tej dostawie.**

Źródła odczytane2026-10-26:
- https://support.google.com/googleplay/android-developer/answer/9893335
- https://support.google.com/admob/answer/15525707
- https://support.google.com/admob/answer/6223431
- https://developers.google.com/admob/android/privacy
- https://developers.google.com/admob/android/privacy/gdpr
- https://developers.google.com/admob/android/interstitial

Źródła ponownie sprawdzone 2026-10-28 dla Internal Testing:
- https://developers.google.com/admob/android/test-ads — oficjalny testowy interstitial, brak przychodu/raportowanych wyświetleń testowych.
- https://developers.google.com/admob/android/privacy — App ID, komunikaty Privacy & messaging i canRequestAds.
