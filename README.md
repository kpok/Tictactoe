# Threefold · Znikające trzy

Kółko i krzyżyk z limitem **trzech znaków na gracza**. Czwarty ruch usuwa najstarszy znak — obrona i zagrożenia zmieniają się z każdą turą.

Projekt pierwotnie powstał na smartfonie z Androidem, przy użyciu GitHub Mobile i ChatGPT. Mechanika FIFO istniała w historycznej wersji HTML (`a729775`), ale została pominięta przy nieukończonej migracji na Angular. Bieżąca wersja odtwarza ten pomysł jako niezależne moduły JavaScript, ze wspólnym silnikiem dla przeglądarki, AI i serwera.

[Zagraj w statyczne demo](https://kpok.github.io/Tictactoe/web/) — komputer i lokalne PvP; online wymaga serwera Node.

## Uruchomienie

Node.js 22 lub 24 (zalecany 24):

```sh
npm ci
npm start
```

Otwórz http://localhost:3000. Bez zależności runtime. `PORT` i `HOST` zmieniają adres nasłuchiwania. `npm run dev` uruchamia serwer z automatycznym restartem.

## Co jest gotowe

- Polska i angielska wersja, responsywna autorska oprawa SVG/CSS, klawiatura i ograniczenie animacji.
- Lokalna gra dwóch osób, 3 poziomy komputera w Web Workerze, wynik i kolejne rundy.
- Zapis lokalnej partii, ustawień i wyników; PWA z grą offline po pierwszym pełnym załadowaniu.
- Prywatne pokoje online: kod/link, oddzielne tokeny, autorytatywny serwer, reconnect po odświeżeniu tej samej karty, rewanż za zgodą obu osób.
- Testy zasad, API HTTP i Playwright; CI buduje i testuje przy pushu na `main` i w PR.

## Zasady

1. Pierwszą rundę zaczyna O. Następne rundy zmieniają rozpoczynającego. W trybie AI człowiek zawsze gra O.
2. Wybierasz pole puste **przed ruchem**. Nie możesz od razu zagrać na własnym znikającym znaku.
3. Gdy masz trzy znaki, najstarszy jest usuwany, nowy zostaje postawiony; dopiero wtedy sprawdzamy trzy w linii.
4. Przerywana obwódka i mała liczba wskazują wiek znaku. Oznaczenie nie opiera się wyłącznie na kolorze.
5. Trzecie wystąpienie tej samej pozycji (obie kolejki w kolejności wieku + gracz na ruchu) lub 100 półruchów daje remis. Wygrana ma pierwszeństwo przed remisem.
6. Trudny komputer ma ograniczony budżet przeszukiwania, nie obiecujemy, że jest niepokonany.

## Gra ze znajomym

Obie osoby muszą otworzyć **ten sam działający serwer**. Wybierz Online → Utwórz pokój → wyślij link lub kod. Druga osoba dołącza i otrzymuje miejsce X. Pokój ma dwa miejsca, bez kont, czatu, publicznego rankingu i matchmakingu.

Token gracza pozostaje w `sessionStorage`, nigdy w linku. Przeładowanie tej samej karty pozwala wrócić. Zamknięcie karty / usunięcie danych może oznaczać utratę miejsca. Link daje wyłącznie możliwość zajęcia wolnego miejsca; nie zawiera dostępu do istniejącej sesji. Nie otwieraj własnego linku w nowej karcie, jeżeli miejsce X ma zająć znajomy.

Stan jest w pamięci **jednego procesu**: restart usuwa pokoje. Bezczynność 30 minut (brak autoryzowanego pollingu lub akcji) lub wiek pokoju 24 godziny wygasza pokój. Limit 1000 pokojów; limit API 180 żądań/min/adres IP. Za reverse proxy adres może być wspólny dla klientów — przed większym wdrożeniem dostosuj zaufany proxy i rate limiting. Wieloinstancyjne hostowanie wymaga wspólnego magazynu i atomowych zmian.

Brak połączenia nie daje automatycznej przegranej. Interfejs pokazuje ponowne łączenie i pobiera stan; ruchy mają rewizję i identyfikator ponowienia, aby nie wykonać ich dwukrotnie.

## Weryfikacja i GitHub Actions

```sh
npm run check
npm test
npm run build
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

`npm run test:e2e:ui` otwiera interaktywny runner. Playwright automatycznie uruchamia serwer na `127.0.0.1:4173`. Projekty: desktop Chromium, viewport Android/Pixel, WebKit/iPhone. Emulacja przeglądarki nie zastępuje testów natywnych na telefonach.

Testy PWA symulują awarię przez zatrzymanie prawdziwego serwera, a reload wywołują tak jak użytkownik (`location.reload`). Unikają znanych problemów protokołu emulacji WebKit z service workerem. Tylko testy wstrzykiwania błędów HTTP wyłączają SW, aby routing Playwright mógł przechwycić żądania; testy PWA i rzeczywistego multiplayera używają SW.

Testy E2E obejmują FIFO i regresję fałszywej wygranej, wynik i rewanż, AI oraz anulowanie starego workera, język, klawiaturę, mały ekran, reduced motion, zapis/offline i dwóch izolowanych graczy online z reconnectem. Raport HTML, trace, wideo i screenshoty błędów zapisują się w `playwright-report/` oraz `test-results/`.

Workflow `Build and test`: Node 22/24, syntax + unit/HTTP + build, następnie Playwright z Chromium i WebKit. Artefakty: `threefold-web` i `playwright-report`. CI uznaje także flaky test (sukces dopiero po retry) za błąd. WebKit ma jeden worker, aby dwa nagrywane konteksty online nie konkurowały z innymi testami o zasoby renderowania. CI nie commituje zależności i nie wdraża automatycznie. Ręczny workflow `Package web preview` przygotowuje dodatkowy artefakt statyczny.

## Build i hosting

`npm run build` tworzy `dist/`. To samodzielna wersja web/PWA do hostingu statycznego, również w podkatalogu. **Hosting statyczny nie obsłuży pokojów online**; do całej gry użyj serwera Node lub kontenera:

```sh
docker build -t threefold .
docker run --rm -p 3000:3000 threefold
```

Publiczne uruchomienie wymaga HTTPS, reverse proxy i monitorowania. Ten commit nie provisionuje infrastruktury ani nie wdraża publicznego serwera. `/health` jest endpointem kontroli działania. API nie jest cache’owane przez service workera; tokeny i pokoje nie trafiają do cache offline. Serwer odrzuca obce originy, nielegalne tury, nieaktualne rewizje i nadmierne body; nie loguje tokenów. Przed większym ruchem potrzebne są testy obciążeniowe i trwałość pokojów.

## Android i iOS

`capacitor.config.json` i `dist/` przygotowują układ do opakowania mobilnego, **nie są gotowymi ani przetestowanymi projektami natywnymi**. Dalsze kroki opisuje [docs/MOBILE.md](docs/MOBILE.md). Gra lokalna i AI nie wymagają backendu; natywny online wymaga jeszcze skonfigurowania zaufanego API/originu i bezpiecznego przechowania sesji. Obecny klient online jest same-origin dla wersji web.

Brak reklam, płatności i analityki. Publikacja sklepowa, konta, podpisy, wymagane formularze, komercyjna polityka prywatności i akceptacja sklepów pozostają osobnym etapem. Nie ma prognozy przychodów.

## Źródła i dokumentacja

- `web/engine.js` — czyste reguły i walidacja zapisu.
- `web/ai.js`, `web/ai-worker.js` — komputer.
- `web/app.js`, `web/styles.css` — interfejs.
- `server/app.js` — serwer i API.
- `test/`, `e2e/` — weryfikacja.
- `.agentic/tasks/vanishing-v1/` — plan, decyzje, review i wyniki realizacji.
- [Analiza pierwotnego stanu](docs/ANALYSIS-2026-10-25.md).
