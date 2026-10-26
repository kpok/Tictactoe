package com.kpok.threefold;
final class AdAudience {
    static boolean child(String age) { return !"adult".equals(age); }
    // Privacy controls remain available after form errors or ad ineligibility.
    static boolean privacyOptions(String age,boolean allowed,boolean updated,boolean required) {
        return !child(age)&&allowed&&updated&&required;
    }
    static boolean allowed(String mode,String age,boolean familiesReviewed) {
        if(!"test".equals(mode)&&!"live".equals(mode))return false;
        if(!"adult".equals(age)&&!"under18".equals(age)&&!"unknown".equals(age))return false;
        return !child(age)||familiesReviewed;
    }
}
