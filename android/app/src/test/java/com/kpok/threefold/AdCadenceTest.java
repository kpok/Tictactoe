package com.kpok.threefold;
import org.junit.Test;
import static org.junit.Assert.*;
public class AdCadenceTest {
    @Test public void roundsAndTimeAreBothRequired() {
        AdCadence p = new AdCadence(0, "", 0);
        for (int i=0;i<4;i++) p.complete("r"+i);
        assertFalse(p.eligible(180000));
        p.complete("r4");assertFalse(p.eligible(179999));assertTrue(p.eligible(180000));
    }
    @Test public void duplicateAndEmptyCompletionDoNotCount() {
        AdCadence p = new AdCadence(0, "", 0);
        assertTrue(p.complete("r1"));assertFalse(p.complete("r1"));assertFalse(p.complete(""));
        assertEquals(1,p.rounds());
    }
    @Test public void onlyImpressionConsumesBudgetAndRestartCannotBypassTime() {
        AdCadence p = new AdCadence(5, "r5", 0);
        assertTrue(p.eligible(180000));assertTrue(p.eligible(180001));
        p.impressed(180001);assertFalse(p.eligible(360001));
        for(int i=0;i<5;i++)p.complete("next"+i);
        assertFalse(p.eligible(180000));assertTrue(p.eligible(360001));
        AdCadence restored = new AdCadence(p.rounds(),p.lastRound(),400000);
        assertFalse(restored.eligible(400001));assertTrue(restored.eligible(580000));
    }
}
