package com.kpok.threefold;

import android.os.SystemClock;
import android.webkit.WebView;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static androidx.test.espresso.web.webdriver.DriverAtoms.findElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webClick;
import static androidx.test.espresso.web.webdriver.Locator.CSS_SELECTOR;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

/** Functional tests exercise the installed APK's real Capacitor WebView, not a browser server. */
@RunWith(AndroidJUnit4.class)
public class GameE2ETest {
    private ActivityScenario<MainActivity> scenario;

    @Before public void startFresh() throws Exception {
        scenario = ActivityScenario.launch(MainActivity.class);
        ready();
        js("localStorage.clear(); sessionStorage.clear(); true");
        scenario.recreate();
        ready();
        language("en");
        click("[data-mode='local']");
    }

    @After public void close() {
        if (scenario != null) scenario.close();
    }

    private String js(String expression) throws Exception {
        CompletableFuture<String> result = new CompletableFuture<>();
        scenario.onActivity(activity -> {
            WebView view = activity.getBridge().getWebView();
            view.evaluateJavascript(expression, result::complete);
        });
        return result.get(5, TimeUnit.SECONDS);
    }

    private void await(String expression) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + 15000;
        while (SystemClock.elapsedRealtime() < deadline) {
            if ("true".equals(js("Boolean(" + expression + ")"))) return;
            SystemClock.sleep(80);
        }
        fail("WebView condition timed out: " + expression);
    }

    private void ready() throws Exception {
        await("document.querySelectorAll('#board button').length === 9");
    }

    private void click(String selector) {
        onWebView().withElement(findElement(CSS_SELECTOR, selector)).perform(webClick());
    }

    private void language(String code) throws Exception {
        js("document.getElementById('language').value='" + code + "'; document.getElementById('language').dispatchEvent(new Event('change')); true");
        await("document.documentElement.lang === '" + code + "'");
    }

    private void move(int square) throws Exception {
        click("#board button[data-index='" + square + "']");
        await("document.querySelectorAll('#board button')[" + square + "].dataset.mark !== ''");
    }

    @Test public void fifoRemovesOldestBeforeCheckingVictory() throws Exception {
        for (int square : new int[]{0,3,1,4,6,8,2}) move(square);
        assertEquals("true", js("document.querySelectorAll('#board button')[0].dataset.mark === ''"));
        assertEquals("true", js("document.querySelectorAll('#board button[data-mark=O]').length === 3 && document.getElementById('result').hidden"));
    }

    @Test public void victoryUpdatesScoreAndRematchStartsNewRound() throws Exception {
        for (int square : new int[]{0,3,1,4,2}) move(square);
        await("!document.getElementById('result').hidden && document.getElementById('o-score').textContent === '1'");
        click("#restart");
        await("document.querySelectorAll('#board button[data-mark=O]').length === 0 && document.getElementById('result').hidden");
    }

    @Test public void packagedAiWorkerRespondsOffline() throws Exception {
        click("[data-mode='ai']");
        move(4);
        await("document.querySelectorAll('#board button[data-mark=X]').length === 1");
        assertEquals("true", js("document.querySelectorAll('#board button')[4].dataset.mark === 'O'"));
    }

    @Test public void translationsFitAndUnavailableOnlineIsHidden() throws Exception {
        language("tl");
        assertEquals("true", js("parseFloat(getComputedStyle(document.querySelector('h1')).fontSize) <= 22"));
        language("id");
        assertEquals("true", js("document.documentElement.scrollWidth <= innerWidth"));
        assertEquals("true", js("document.querySelector('[data-mode=online]').hidden"));
        assertEquals("true", js("!navigator.serviceWorker.controller"));
    }

    @Test public void activityRestartPreservesGameLanguageAndFocusViewDoesNotReset() throws Exception {
        move(4);
        language("tl");
        scenario.moveToState(Lifecycle.State.CREATED);
        scenario.moveToState(Lifecycle.State.RESUMED);
        scenario.recreate();
        ready();
        await("document.documentElement.lang === 'tl' && document.querySelectorAll('#board button')[4].dataset.mark === 'O'");
        click("#fullscreen");
        await("document.body.classList.contains('focus-mode')");
        click("#fullscreen");
        await("!document.body.classList.contains('focus-mode')");
        assertEquals("true", js("document.querySelectorAll('#board button')[4].dataset.mark === 'O'"));
    }
}
