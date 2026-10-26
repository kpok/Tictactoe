# Opcjonalne reklamy Android — 5 rund + 3 minuty

## Co jest zaimplementowane

- Własny plugin ThreefoldAds dla Capacitor8.5.3: Google Mobile Ads24.9.0, UMP4.0.0; bez mediacji i bez wrappera społecznościowego.
- Domyślnie **adsMode=disabled** we wszystkich buildach. Wersja web/PWA nie korzysta z reklam ani SDK.
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

## Konfiguracja i uruchamianie

Wersja bez reklam nie wymaga konta AdMob. Publiczne identyfikatory App ID/Ad unit ID NIE są kluczami podpisu ani credentialami Play.

Po `npm run android:sync`:

```sh
cd android
# Oficjalne identyfikatory TESTOWE Google, żadnych zarobków.
./gradlew :app:assembleDebug -PadsMode=test
```

Test mode używa wyłącznie oficjalnych test IDs zapisanych w Gradle. Brak poprawnej konfiguracji UMP dla wybranej aplikacji może uniemożliwić emisję; nie omijamy UMP po błędzie. Testy automatyczne używają deterministycznej atrapy mostka do sprawdzenia przepływu, a nie prawdziwych emisji sieciowych. Nie wolno klikać prawdziwych reklam podczas testów.

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

Po zmianie publicznej konfiguracji dotychczasowy pipeline buduje i testuje ten sam commit, następnie podpisuje AAB. Nie trzeba zmieniać workflowów Play ani dodawać sekretów reklamowych. Przy aktywnym trybie test/live automat instrumentacji wymaga ustawienia profilu unknown przed grą; domyślny CI disabled nie uruchamia sieci reklamowej.

Przed zarabianiem: konto AdMob, link do sklepu, app-ads.txt na witrynie dewelopera, zatwierdzenie aplikacji, komunikaty UMP, prawidłowa polityka i deklaracje danych. **Żadna z tych usług nie została włączona w tej dostawie.**

Źródła odczytane2026-10-26:
- https://support.google.com/googleplay/android-developer/answer/9893335
- https://support.google.com/admob/answer/15525707
- https://support.google.com/admob/answer/6223431
- https://developers.google.com/admob/android/privacy
- https://developers.google.com/admob/android/privacy/gdpr
- https://developers.google.com/admob/android/interstitial
