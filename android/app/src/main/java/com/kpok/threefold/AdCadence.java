package com.kpok.threefold;

/** Local-only budget; a fresh process conservatively starts another three-minute wait. */
final class AdCadence {
    static final int ROUNDS = 5;
    static final long INTERVAL_MS = 180000L;
    private int rounds;
    private String lastRound;
    private long lastShown;

    AdCadence(int rounds, String lastRound, long now) {
        this.rounds = Math.max(0, Math.min(ROUNDS, rounds));
        this.lastRound = lastRound;
        this.lastShown = now;
    }
    boolean complete(String id) {
        if (id == null || id.isEmpty() || id.equals(lastRound)) return false;
        lastRound = id;
        rounds = Math.min(ROUNDS, rounds + 1);
        return true;
    }
    boolean eligible(long now) {
        return rounds >= ROUNDS && now >= lastShown && now - lastShown >= INTERVAL_MS;
    }
    void impressed(long now) { rounds = 0; lastShown = now; }
    int rounds() { return rounds; }
    String lastRound() { return lastRound; }
}
