package com.kpok.threefold;
import org.junit.Test;
import static org.junit.Assert.*;
public class AdAudienceTest {
    @Test public void unansweredAndDisabledNeverAllowRequests() {
        assertFalse(AdAudience.allowed("disabled","adult",true));
        assertFalse(AdAudience.allowed("test","",true));
        assertFalse(AdAudience.allowed("live","invalid",true));
    }
    @Test public void childAndUnknownRequireSeparateFamiliesReview() {
        for(String age:new String[]{"under18","unknown"}){
            assertTrue(AdAudience.child(age));
            assertFalse(AdAudience.allowed("test",age,false));
            assertTrue(AdAudience.allowed("test",age,true));
        }
        assertTrue(AdAudience.allowed("test","adult",false));
    }
}
