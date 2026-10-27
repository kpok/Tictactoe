# GitHub Actions tylko dla właściciela

Repozytorium: **kpok/Tictactoe**, ID `969630128`. Konto właściciela: **kpok**, ID `10676481`. Wzorzec: `kpok/cartoon_ai`, sprawdzony 2026-10-27.

## Zabezpieczenia zapisane w repo

Każdy z 8 jobów w 3 edytowalnych workflowach wymaga właściwej nazwy i ID repozytorium, ID właściciela i aktora, `actor=kpok`, `triggering_actor=kpok`, gałęzi `refs/heads/main` oraz dozwolonego zdarzenia. Inni użytkownicy i boty nie dostają wyjątku. Obcy re-run nie może wykorzystać uprawnień pierwotnego uruchomienia właściciela.

- **Build and test**: push właściciela na `main` lub ręczny run na `main`. Brak `pull_request` i `pull_request_target`.
- **Package web preview**: tylko ręcznie przez właściciela na `main`; nadal wyłącznie pakowanie.
- **Google Play Internal Testing**: tylko ręcznie przez właściciela na `main`; pełne CI pozostaje obowiązkowe, podpisywanie w środowisku `google-play-internal`, `publish=false` domyślnie. Testy nie dziedziczą sekretów. Reusable CI ocenia oryginalny kontekst wywołującego (push/dispatch), a nie osobne zdarzenie `workflow_call`.

Domyślne uprawnienia tokenu są puste; joby otrzymują tylko `contents:read`. Checkout wskazuje dokładny SHA i nie zachowuje tokenu w konfiguracji Git. Zewnętrzne akcje mają pełne SHA z [.github/action-pins.json](../.github/action-pins.json). Concurrency znajduje się za autoryzacją, osobno dla jobów/macierzowych wersji Node, bez anulowania działającego runu.

`npm run check:workflows` parsuje aktualny YAML i sprawdza rzeczywiste warunki dla poprawnych i niedozwolonych kontekstów. Testy mutacyjne odrzucają usunięcie kontroli aktora, re-run, fork, nieznane triggery, eskalację tokenu, ruchome wersje akcji oraz dziedziczenie sekretów. Kontrola jest częścią `npm run check` i `npm test`. CODEOWNERS wskazuje właściciela do review; sam nie wymusza zatwierdzenia.

## Obowiązkowe ustawienia administracyjne — wykonuje właściciel

Konektor użyty do tej zmiany nie udostępnia zapisu ustawień administracyjnych. Poniższych zmian **nie wykonano ani nie zweryfikowano**. Bez nich zabezpieczenia plików nie stanowią pełnej ochrony ustawień całego repo.

### 1. PR-y z forków

Otwórz [Settings → Actions → General](https://github.com/kpok/Tictactoe/settings/actions). W **Approval for running fork pull request workflows from contributors** wybierz **Require approval for all external contributors** i zapisz.

Nie ograniczaj zatwierdzania tylko do nowych kont/pierwszych PR-ów. Napastnik może dodać nowy workflow albo zmienić warunek w proponowanym PR-ze; brak triggera PR w naszych plikach nie jest blokadą ustawień całego repo. Nie zatwierdzaj obcego runu bez sprawdzenia workflowów, skryptów i zależności. Po przyszłym przyjęciu wkładu z zewnątrz ta osoba nadal ma wymagać zatwierdzenia.

### 2. Uprawnienia i dostęp

Na tej samej stronie w **Workflow permissions** wybierz **Read repository contents and packages permissions**, odznacz **Allow GitHub Actions to create and approve pull requests**, zapisz. W **Settings → Collaborators** pozostaw zapis/admin tylko dla świadomie zaufanych kont; dla polityki „tylko ja” usuń zbędne uprawnienia innych osób. Osoba lub aplikacja z prawem zmiany workflowów/main może zmienić same zabezpieczenia.

W regułach `main` zablokuj force-push i usuwanie gałęzi. Wymuszaj review właściciela, jeśli planujesz wpuszczać współpracowników. Dobierz bypass do własnego konta i używanego sposobu pracy; nie wymagaj drugiego recenzenta bez możliwości spełnienia tego warunku w jednoosobowym projekcie. CODEOWNERS działa jako egzekwowana blokada dopiero z odpowiednimi regułami. Zweryfikuj też instalacje aplikacji mających zapis.

### 3. Lista dozwolonych akcji

W **Actions permissions** wybierz **Allow kpok, and select non-kpok, actions and reusable workflows**, bez ogólnego zezwolenia na wszystkie akcje GitHuba/zweryfikowanych wydawców. Dopuść poniższe dokładne wersje; jeśli dostępne, włącz wymaganie pełnego SHA. Zachowaj możliwość użycia lokalnego reusable CI.

```text
actions/checkout@11d5960a326750d5838078e36cf38b85af677262,
actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020,
actions/setup-java@cf277c60eb25467037889841efdb72551f06f6c3,
actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02,
actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093,
android-actions/setup-android@9fc6c4e9069bf8d3d10b2204b1fb8f6ef7065407,
reactivecircus/android-emulator-runner@a421e43855164a8197daf9d8d40fe71c6996bb0d,
r0adkll/upload-google-play@e738b9dd8f2476ea806d921b64aacd24f34515a5
```

Po zmianie SHA zaktualizuj plik pinów, workflowy i listę administracyjną. GitHub może wymagać również dopuszczenia zależności akcji złożonych lub automatycznego Pages; sprawdzaj konkretne pochodzenie, nie zastępuj listy wildcardem `*`.

### 4. Google Play

W **Settings → Environments → google-play-internal** ogranicz **Deployment branches and tags** do reguły typu **Branch** o dokładnej nazwie `main` (bez tagu `main`, wildcardów i innych gałęzi). Ustaw wymagane zatwierdzenie przez `kpok`, jeżeli plan konta je udostępnia; self-review musi być możliwy dla jednoosobowej obsługi. Zachowaj istniejące mocniejsze zabezpieczenia. Sekrety podpisywania i Play przechowuj wyłącznie w tym środowisku. Nie dodawaj administracyjnego PAT do workflowów. Ta zmiana niczego nie wysyła do Google Play.

### 5. GitHub Pages i historyczne runy

W Actions repo ma również **pages build and deployment**, generowane przez GitHub przy publikacji z gałęzi. To nie jest `.github/workflows/deploy.yml`, który tylko pakuje podgląd. Generowanej definicji nie można zabezpieczyć naszym warunkiem joba.

Sprawdź **Settings → Pages**: publikacja z gałęzi powinna wskazywać tylko `main`, a zapis do niej musi mieć wyłącznie właściciel/zaufane aplikacje. Jeśli wymagasz identycznej jawnej autoryzacji także dla Pages, potrzebny jest osobny zabezpieczony workflow publikacji oraz przełączenie źródła na **GitHub Actions**. Samo przełączenie bez przygotowanego deploymentu zatrzyma aktualizacje strony. Nie zmieniono źródła ani istniejącej publikacji w tym zadaniu. Alternatywą przy bezwzględnym zakazie generowanych runów jest wyłączenie publikacji Pages.

Stare runy i stare gałęzie korzystają z dawnych definicji. Nie ponawiaj historycznych runów sprzed utwardzenia; w Actions wyłącz nieużywane dawne workflowy, jeśli interfejs to umożliwia. Nowy kod nie zabezpiecza ich wstecz. Gdy inni mają uprawnienia write, mogą uruchamiać stare definicje; ograniczenie Collaborators jest dlatego konieczne.

## Weryfikacja i granice

Uruchom ręcznie **Build and test** na `main` jako `kpok` i potwierdź Node, Playwright, build Androida i emulator. Ręczne pakowanie również powinno działać tylko na `main`. Wybór innej gałęzi spowoduje pominięcie zabezpieczonych jobów. Nie uruchamiaj Play bez potrzebnej konfiguracji tylko po to, by testować autoryzację; polityka testuje jego bramki bez używania sekretów.

W interfejsie mogą być widoczne wpisy workflow ze statusem skipped; bramka blokuje wykonanie jobów, nie samo utworzenie wpisu zdarzenia. Właściciel forka może zmienić i uruchomić kopię na swoich zasobach; publiczne repo nie daje możliwości zakazania tego. Artefakty i logi tego publicznego repo mogą być publicznie dostępne. Nie umieszczaj tam sekretów ani danych prywatnych.

Źródła GitHub:
- [Ustawienia Actions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
- [Kontekst aktora i re-run](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [Ponawianie runów](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)
- [Źródło GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
