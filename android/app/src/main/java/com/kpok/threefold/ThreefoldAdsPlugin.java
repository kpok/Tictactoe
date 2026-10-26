package com.kpok.threefold;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import androidx.annotation.NonNull;
import androidx.lifecycle.Lifecycle;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.ads.mediation.admob.AdMobAdapter;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

@CapacitorPlugin(name = "ThreefoldAds")
public class ThreefoldAdsPlugin extends Plugin {
    private final Handler main = new Handler(Looper.getMainLooper());
    private SharedPreferences prefs;
    private AdCadence cadence;
    private ConsentInformation consent;
    private InterstitialAd ad;
    private String age = "";
    private int generation = 0;
    private boolean initialized, initializing, consentFresh, consentUpdated, loading, showing, refreshing, privacyBusy;
    private int requests;
    private PluginCall pendingShow;
    private long loadedAt;
    private String boundaryToken="";
    private long boundaryExpires;

    @Override public void load() {
        prefs = getContext().getSharedPreferences("threefold.ads.v1", Context.MODE_PRIVATE);
        age = prefs.getString("age", "");
        cadence = new AdCadence(prefs.getInt("rounds",0), prefs.getString("lastRound", ""), SystemClock.elapsedRealtime());
        main.post(this::refreshConsent);
    }
    private boolean enabled() { return !"disabled".equals(BuildConfig.ADS_MODE); }
    private boolean child() { return AdAudience.child(age); }
    private boolean allowed() { return AdAudience.allowed(BuildConfig.ADS_MODE,age,BuildConfig.ADS_FAMILIES_REVIEWED); }
    private boolean active() { return getActivity() != null && getActivity().getLifecycle().getCurrentState().isAtLeast(Lifecycle.State.RESUMED); }
    @SuppressWarnings("deprecation") private boolean online() {
        ConnectivityManager cm=(ConnectivityManager)getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info=cm.getActiveNetworkInfo();
        return info!=null && info.isConnected();
    }
    private void persist() {
        prefs.edit().putInt("rounds",cadence.rounds()).putString("lastRound",cadence.lastRound()).apply();
    }
    private void invalidate() { invalidate(false); }
    private void invalidate(boolean keepProfile) {
        generation++;ad=null;loading=false;consentFresh=false;refreshing=false;boundaryToken="";
        if(!keepProfile)consentUpdated=false;
    }
    @SuppressWarnings("deprecation") private void restrictRequests() {
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
            .setTagForChildDirectedTreatment(child()?RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE:RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
            .setTagForUnderAgeOfConsent(child()?RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE:RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G).build());
    }
    private void refreshConsent() {
        if (!allowed() || !active() || showing || privacyBusy || refreshing || !online()) return;
        final int token=++generation;
        ad=null;loading=false;consentFresh=false;refreshing=true;
        // Both SDKs need their own age restriction; UMP does not forward its TFUA tag.
        try {
        restrictRequests();
        consent=UserMessagingPlatform.getConsentInformation(getContext());
        ConsentRequestParameters params=new ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(child()).build();
        consent.requestConsentInfoUpdate(getActivity(),params,()->{
            if(token!=generation||!allowed()||!active())return;
            consentUpdated=true;
            if(child()) consentFinished(token);
            else if(consent.getConsentStatus()==ConsentInformation.ConsentStatus.REQUIRED){
                UserMessagingPlatform.loadConsentForm(getContext(),form->{
                    if(token!=generation||!allowed()||child()||!active())return;
                    privacyBusy=true;
                    form.show(getActivity(),error->{privacyBusy=false;if(error==null)consentFinished(token);else if(token==generation)refreshing=false;});
                },error->{if(token==generation)refreshing=false;});
            } else consentFinished(token);
        },error->{if(token==generation)refreshing=false; /* Never reuse another age profile's cached consent. */ });
        } catch(RuntimeException error){refreshing=false;consentFresh=false;}
    }
    private void consentFinished(int token) {
        if(token==generation)refreshing=false;
        if(token!=generation||!allowed()||!active()||!consent.canRequestAds())return;
        consentFresh=true;
        if(initialized){preload();return;}
        if(initializing)return;
        initializing=true;
        try {MobileAds.initialize(getContext(),status->main.post(()->{
            initializing=false;initialized=true;
            if(token==generation&&consentFresh&&allowed()&&active())preload();
        }));}catch(RuntimeException error){initializing=false;consentFresh=false;}
    }
    private void preload() {
        if(!initialized||!consentFresh||!allowed()||!active()||!online()||loading||showing||privacyBusy||ad!=null)return;
        final int token=generation;
        loading=true;requests++;
        Bundle extras=new Bundle();extras.putString("npa","1");
        AdRequest request=new AdRequest.Builder().addNetworkExtrasBundle(AdMobAdapter.class,extras).build();
        try {InterstitialAd.load(getContext(),BuildConfig.ADS_UNIT_ID,request,new InterstitialAdLoadCallback(){
            @Override public void onAdLoaded(@NonNull InterstitialAd loaded){
                if(token!=generation||!allowed()||!consentFresh||!active())return;
                loading=false;ad=loaded;loadedAt=SystemClock.elapsedRealtime();
                // Loading never displays an ad. Only an explicit completed-round restart can show it.
            }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error){if(token==generation){loading=false;ad=null;}}
        });}catch(RuntimeException error){loading=false;ad=null;}
    }
    private JSObject state() {
        JSObject out=new JSObject();out.put("mode",BuildConfig.ADS_MODE);out.put("age",age);
        out.put("familiesReady",BuildConfig.ADS_FAMILIES_REVIEWED);out.put("allowed",allowed());out.put("initialized",initialized);
        out.put("privacyBusy",privacyBusy);out.put("requests",requests);out.put("rounds",cadence.rounds());out.put("privacyUrl",BuildConfig.ADS_PRIVACY_URL);
        out.put("privacyOptions",AdAudience.privacyOptions(age,allowed(),consentUpdated,consent!=null&&consent.getPrivacyOptionsRequirementStatus()==ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED));
        return out;
    }
    @PluginMethod public void getState(PluginCall call){main.post(()->call.resolve(state()));}
    @PluginMethod public void setAge(PluginCall call){main.post(()->{
        String next=call.getString("age","");
        if(!next.equals("adult")&&!next.equals("under18")&&!next.equals("unknown")){call.reject("Invalid age group");return;}
        if(showing||privacyBusy){call.reject("Privacy or ad operation is pending");return;}
        invalidate();age=next;prefs.edit().putString("age",age).apply();
        if(initialized||initializing)restrictRequests();
        call.resolve(state());refreshConsent();
    });}
    @PluginMethod public void completeRound(PluginCall call){main.post(()->{
        String id=call.getString("roundId","");
        if(id.length()>80||!id.matches("[a-zA-Z0-9-]+")){call.reject("Invalid round ID");return;}
        cadence.complete(id);persist();call.resolve();
    });}
    private void finishShow(PluginCall expected, boolean displayed){
        if(pendingShow==null||pendingShow!=expected)return;
        PluginCall call=pendingShow;pendingShow=null;showing=false;
        JSObject out=new JSObject();out.put("shown",displayed);call.resolve(out);
        if(active())refreshConsent();
    }
    @PluginMethod public void beginBoundary(PluginCall call){main.post(()->{
        if(showing||!call.getString("roundId","").equals(cadence.lastRound())){call.resolve();return;}
        boundaryToken=java.util.UUID.randomUUID().toString();boundaryExpires=SystemClock.elapsedRealtime()+3000;
        call.resolve(new JSObject().put("boundaryToken",boundaryToken));
    });}
    @PluginMethod public void showBetweenRounds(PluginCall call){main.post(()->{
        String id=call.getString("roundId","");long now=SystemClock.elapsedRealtime();
        boolean boundary=!boundaryToken.isEmpty()&&boundaryToken.equals(call.getString("boundaryToken",""))&&now<=boundaryExpires;
        boundaryToken="";
        if(!boundary||showing||privacyBusy||!id.equals(cadence.lastRound())||!cadence.eligible(now)||!allowed()||!consentFresh||consent==null||!consent.canRequestAds()||!active()||!online()||ad==null||now-loadedAt>3300000){
            if(ad!=null&&now-loadedAt>3300000)ad=null;
            call.resolve(new JSObject().put("shown",false));
            if(allowed()&&active()&&!showing){if(consentFresh)preload();else refreshConsent();}
            return;
        }
        InterstitialAd ready=ad;ad=null;showing=true;pendingShow=call;
        final boolean[] displayed={false};
        ready.setFullScreenContentCallback(new FullScreenContentCallback(){
            @Override public void onAdShowedFullScreenContent(){if(pendingShow!=call||displayed[0])return;displayed[0]=true;cadence.impressed(SystemClock.elapsedRealtime());persist();}
            @Override public void onAdDismissedFullScreenContent(){finishShow(call,displayed[0]);}
            @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error){finishShow(call,false);}
        });
        main.postDelayed(()->{if(pendingShow==call)finishShow(call,displayed[0]);},120000);
        try{ready.show(getActivity());}catch(RuntimeException error){finishShow(call,false);}
    });}
    @PluginMethod public void privacyOptions(PluginCall call){main.post(()->{
        if(!allowed()||child()||!active()||!consentUpdated||consent==null||showing||privacyBusy){call.resolve();return;}
        invalidate(true);privacyBusy=true;
        try{UserMessagingPlatform.showPrivacyOptionsForm(getActivity(),error->{privacyBusy=false;refreshConsent();call.resolve();});}
        catch(RuntimeException error){privacyBusy=false;call.resolve();}
    });}
    @PluginMethod public void reset(PluginCall call){main.post(()->{
        if(showing||privacyBusy){call.reject("Privacy or ad operation is pending");return;}
        invalidate();age="";if(initialized||initializing)restrictRequests();
        if(consent!=null)consent.reset();prefs.edit().clear().apply();
        cadence=new AdCadence(0,"",SystemClock.elapsedRealtime());call.resolve(state());
    });}
    @Override protected void handleOnPause(){main.post(()->{if(!showing)invalidate(true);});}
    @Override protected void handleOnResume(){main.post(()->{if(!showing)refreshConsent();});}
    @Override protected void handleOnDestroy(){main.post(()->{invalidate();finishShow(pendingShow,false);});}
}
