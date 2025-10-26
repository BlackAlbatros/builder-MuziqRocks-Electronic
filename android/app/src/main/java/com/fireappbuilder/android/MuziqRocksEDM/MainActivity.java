package com.fireappbuilder.android.MuziqRocksEDM;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.view.Gravity;

import com.getcapacitor.BridgeActivity;

// Engage Ads SDK imports
import com.engage.engageadssdk.EMAdsModule;
import com.engage.engageadssdk.input.EMAdsModuleInputBuilder;
import com.engage.engageadssdk.ui.EMAdView;
import com.engage.engageadssdk.player.listener.EMVideoPlayerListener;
import com.engage.engageadssdk.controller.EmClientContentController;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initialize Engage Ads SDK
    EMAdsModule.INSTANCE.init(
      new EMAdsModuleInputBuilder()
        .setIsGdprApproved(true)
        .setPublisherId("a8ce40dc")
        .setChannelId("62570352")
        .setContext(getApplicationContext())
        .setIsDebug(false)
        .setIsAutoPlay(true)
        .build()
    );

    // Create and attach a bottom ad view overlaying the web content
    EMAdView adView = new EMAdView(this);
    adView.setContentController(new EmClientContentController() {
      @Override public void pauseContent() { }
      @Override public void resumeContent() { }
    });
    adView.setAdEventListener(new EMVideoPlayerListener() {
      @Override public void onAdStarted() { }
      @Override public void onAdLoading() { }
      @Override public void onAdsLoaded() { }
      @Override public void onAdEnded() { }
      @Override public void onAdPaused() { }
      @Override public void onAdResumed() { }
    });

    ViewGroup root = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
    FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    );
    lp.gravity = Gravity.BOTTOM;
    root.addView(adView, lp);
    adView.loadAd();
  }
}
