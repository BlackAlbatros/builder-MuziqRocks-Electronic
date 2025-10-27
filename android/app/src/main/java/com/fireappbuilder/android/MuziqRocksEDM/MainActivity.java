package com.fireappbuilder.android.MuziqRocksEDM;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.view.Gravity;
import android.webkit.WebView;
import android.widget.Toast;

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
      showToast("EMAds SDK initialized (debug)");

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
        @Override public void onAdStarted() { Log.i(TAG, "onAdStarted"); showToast("EMAds: ad started"); }
        @Override public void onAdLoading() { Log.i(TAG, "onAdLoading"); showToast("EMAds: loading ad"); }
        @Override public void onAdsLoaded() { Log.i(TAG, "onAdsLoaded"); showToast("EMAds: ads loaded"); }
        @Override public void onAdEnded() { Log.i(TAG, "onAdEnded"); showToast("EMAds: ad ended"); }
        @Override public void onAdPaused() { Log.i(TAG, "onAdPaused"); showToast("EMAds: ad paused"); }
        @Override public void onAdResumed() { Log.i(TAG, "onAdResumed"); showToast("EMAds: ad resumed"); }
        public void onAdLoadError(String message) { Log.i(TAG, "onAdLoadError: " + message); showToast("EMAds: load error - " + message); }
        public void onAdTapped() { Log.i(TAG, "onAdTapped"); showToast("EMAds: ad tapped"); }
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
      showToast("EMAds SDK not on classpath");
    } catch (Exception e) {
      Log.e(TAG, "EMAds init error", e);
      showToast("EMAds init error: " + e.getMessage());
    }
  }

  private void showToast(final String message) {
    runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
  }
}
