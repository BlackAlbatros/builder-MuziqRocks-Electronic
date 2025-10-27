package com.fireappbuilder.android.MuziqRocksEDM;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.view.Gravity;
import android.webkit.WebView;

import android.util.Log;
import com.getcapacitor.BridgeActivity;

// Direct Engage SDK imports
import com.engage.engageadssdk.module.EMAdsModule;
import com.engage.engageadssdk.module.EMAdsModuleInputBuilder;
import com.engage.engageadssdk.ui.EMAdView;
import com.engage.engageadssdk.EMVideoPlayerListener;
import com.engage.engageadssdk.ui.EmClientContentController;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "EMAds";

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
      // Initialize Engage Ads SDK using builder
      EMAdsModule.init(
        new EMAdsModuleInputBuilder()
          .isGdprApproved(true)
          .publisherId("a8ce40dc")
          .channelId("62570352")
          .context(getApplicationContext())
          .isDebug(true)
          .isAutoPlay(true)
          .build()
      );
      Log.i(TAG, "EMAdsModule initialized");

      // Create and attach EMAdView
      EMAdView adView = new EMAdView(this);

      // Implement a content controller that pauses/resumes any WebView found in the view hierarchy
      EmClientContentController controller = new EmClientContentController() {
        @Override
        public void pauseContent() {
          runOnUiThread(() -> {
            try {
              WebView w = findWebView((ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content));
              if (w != null) {
                w.onPause();
                Log.i(TAG, "WebView paused by EMAds controller");
              }
            } catch (Exception ex) {
              Log.i(TAG, "pauseContent failed: " + ex.getMessage());
            }
          });
        }

        @Override
        public void resumeContent() {
          runOnUiThread(() -> {
            try {
              WebView w = findWebView((ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content));
              if (w != null) {
                w.onResume();
                Log.i(TAG, "WebView resumed by EMAds controller");
              }
            } catch (Exception ex) {
              Log.i(TAG, "resumeContent failed: " + ex.getMessage());
            }
          });
        }

        private WebView findWebView(ViewGroup root) {
          if (root == null) return null;
          for (int i = 0; i < root.getChildCount(); i++) {
            android.view.View v = root.getChildAt(i);
            if (v instanceof WebView) return (WebView) v;
            if (v instanceof ViewGroup) {
              WebView w = findWebView((ViewGroup) v);
              if (w != null) return w;
            }
          }
          return null;
        }
      };

      adView.setContentController(controller);

      adView.setAdEventListener(new EMVideoPlayerListener() {
        @Override public void onAdStarted() { Log.i(TAG, "onAdStarted"); }
        @Override public void onAdLoading() { Log.i(TAG, "onAdLoading"); }
        @Override public void onAdsLoaded() { Log.i(TAG, "onAdsLoaded"); }
        @Override public void onAdEnded() { Log.i(TAG, "onAdEnded"); }
        @Override public void onAdPaused() { Log.i(TAG, "onAdPaused"); }
        @Override public void onAdResumed() { Log.i(TAG, "onAdResumed"); }
        public void onAdLoadError(String message) { Log.i(TAG, "onAdLoadError: " + message); }
        public void onAdTapped() { Log.i(TAG, "onAdTapped"); }
      });

      ViewGroup root = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
      FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
      );
      lp.gravity = Gravity.BOTTOM;
      root.addView(adView, lp);
      adView.loadAd();

    } catch (NoClassDefFoundError e) {
      // SDK not present on classpath
      Log.i(TAG, "EMAds SDK not on classpath: " + e.getMessage());
    } catch (Exception e) {
      Log.e(TAG, "EMAds init error", e);
    }
  }
}
