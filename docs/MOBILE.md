# Droga do sklepów mobilnych

Obecna dostawa: działająca aplikacja web/PWA z lokalną grą, AI i backendem pokojów. Nie zawiera podpisanych AAB/IPA ani zweryfikowanych projektów Android/iOS.

Konfiguracja Capacitor wskazuje `dist/` i proponowany identyfikator `com.kpok.threefold`. Przed publikacją sprawdź dostępność nazwy oraz zatwierdź identyfikator aplikacji.

## Następne kroki

1. Na osobnej gałęzi wybierz i przypnij wersje `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios` zgodne z lokalnymi SDK.
2. Zbuduj `npm run build`; wykonaj `npx cap add android` / `npx cap add ios`, następnie `npx cap sync`. iOS wymaga macOS/Xcode lub odpowiedniego środowiska CI.
3. Zweryfikuj w opakowaniu worker AI, storage, cykl życia, safe area, przycisk Back, dźwięk i resume. Service worker jest dla web/PWA; natywna aplikacja ma lokalny pakiet zasobów.
4. **Natywny online wymaga pracy integracyjnej:** klient musi używać wybranego HTTPS API zamiast względnego same-origin endpointu. Dodaj kontrolowaną listę dozwolonych originów natywnych, CSP `connect-src`, zaufane domeny oraz testy uprawnień. Nie używaj arbitralnego CORS `*`. Ustal docelowe przechowywanie tokenów i zachowanie po zamknięciu aplikacji. Obecnej konfiguracji nie przedstawiaj jako działającego natywnego multiplayera.
5. Przygotuj ikony rastrowe wymagane przez platformy z własnego `web/icon.svg`, splash, screenshoty urządzeń i metadane PL/EN.
6. Skonfiguruj signing, build release AAB/IPA, testy rzeczywistych telefonów i dystrybucję testową Play Console / TestFlight.
7. Przed sklepem zweryfikuj aktualne SDK/target API, polityki prywatności, klasyfikację wieku i dane przetwarzane przez wybrany hosting. Dodanie reklam/płatności zmienia te wymagania.

Brak publikacji, kosztów chmury ani zakupu kont w tej realizacji. Zasady sklepów i wersje SDK należy sprawdzić bezpośrednio przed wydaniem.

Źródła: https://capacitorjs.com/docs/getting-started oraz https://capacitorjs.com/docs/getting-started/environment-setup.
