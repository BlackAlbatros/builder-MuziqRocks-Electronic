package com.fireappbuilder.android.MuziqRocksEDM;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.view.Gravity;
import android.webkit.WebView;
import android.widget.Toast;

import android.util.Log;
import com.getcapacitor.BridgeActivity;

import java.lang.reflect.*;
import java.util.*;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "EMAds";

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
      // Use reflection so the app compiles/builds even if the Engage SDK isn't present.
      ClassLoader cl = getClassLoader();

      Class<?> EMAdsModuleClass = Class.forName("com.engage.engageadssdk.module.EMAdsModule", false, cl);
      Class<?> EMAdsModuleInputBuilderClass = Class.forName("com.engage.engageadssdk.module.EMAdsModuleInputBuilder", false, cl);

      // Instantiate builder and chain configuration methods
      Object builder = EMAdsModuleInputBuilderClass.getDeclaredConstructor().newInstance();

      // Each setter returns the builder (fluent API). Invoke reflectively.
      EMAdsModuleInputBuilderClass.getMethod("isGdprApproved", boolean.class).invoke(builder, true);
      EMAdsModuleInputBuilderClass.getMethod("publisherId", String.class).invoke(builder, "a8ce40dc");
      EMAdsModuleInputBuilderClass.getMethod("channelId", String.class).invoke(builder, "62570352");
      EMAdsModuleInputBuilderClass.getMethod("context", android.content.Context.class).invoke(builder, getApplicationContext());
      EMAdsModuleInputBuilderClass.getMethod("isDebug", boolean.class).invoke(builder, true);
      EMAdsModuleInputBuilderClass.getMethod("isAutoPlay", boolean.class).invoke(builder, true);

      // Build the final input object
      Object input = EMAdsModuleInputBuilderClass.getMethod("build").invoke(builder);

      // Call EMAdsModule.init(input) - find any init method that accepts one parameter
      Method initMethod = null;
      for (Method m : EMAdsModuleClass.getMethods()) {
        if (m.getName().equals("init") && m.getParameterTypes().length == 1) {
          initMethod = m;
          break;
        }
      }
      if (initMethod != null) {
        initMethod.invoke(null, input);
      } else {
        Log.w(TAG, "EMAdsModule.init method not found via reflection");
      }

      Log.i(TAG, "EMAdsModule initialized (reflection)");
      showToast("EMAds SDK initialized (debug)");

      // Create EMAdView via reflection
      Class<?> EMAdViewClass = Class.forName("com.engage.engageadssdk.ui.EMAdView", false, cl);
      Object adView = EMAdViewClass.getConstructor(android.content.Context.class).newInstance(this);

      // Create and attach EmClientContentController via dynamic proxy
      Class<?> EmClientContentControllerClass = Class.forName("com.engage.engageadssdk.ui.EmClientContentController", false, cl);

      Object contentController = Proxy.newProxyInstance(cl, new Class[]{EmClientContentControllerClass}, new InvocationHandler() {
        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
          String name = method.getName();
          if ("pauseContent".equals(name)) {
            // Forward pause/resume requests to the web layer so the web app can pause the HTML5 video
            Log.i(TAG, "pauseContent requested by SDK, forwarding to web layer");
            sendEventToWeb("pauseContent", "{\"message\":\"pauseContent\"}");
            return null;
          } else if ("resumeContent".equals(name)) {
            Log.i(TAG, "resumeContent requested by SDK, forwarding to web layer");
            sendEventToWeb("resumeContent", "{\"message\":\"resumeContent\"}");
            return null;
          }
          return null;
        }
      });

      // Set content controller: adView.setContentController(controller)
      EMAdViewClass.getMethod("setContentController", EmClientContentControllerClass).invoke(adView, contentController);

      // Attach ad event listener via dynamic proxy for EMVideoPlayerListener
      try {
        Class<?> EMVideoPlayerListenerClass = Class.forName("com.engage.engageadssdk.EMVideoPlayerListener", false, cl);
        Object listenerProxy = Proxy.newProxyInstance(cl, new Class[]{EMVideoPlayerListenerClass}, new InvocationHandler() {
          @Override
          public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            String name = method.getName();
            switch (name) {
              case "onAdStarted":
                Log.i(TAG, "onAdStarted");
                showToast("EMAds: ad started");
                sendEventToWeb("adStarted", "{\"message\":\"ad started\"}");
                break;
              case "onAdLoading":
                Log.i(TAG, "onAdLoading");
                showToast("EMAds: loading ad");
                sendEventToWeb("adLoading", "{\"message\":\"loading ad\"}");
                break;
              case "onAdsLoaded":
                Log.i(TAG, "onAdsLoaded");
                showToast("EMAds: ads loaded");
                sendEventToWeb("adsLoaded", "{\"message\":\"ads loaded\"}");
                break;
              case "onAdEnded":
                Log.i(TAG, "onAdEnded");
                showToast("EMAds: ad ended");
                sendEventToWeb("adEnded", "{\"message\":\"ad ended\"}");
                break;
              case "onAdPaused":
                Log.i(TAG, "onAdPaused");
                showToast("EMAds: ad paused");
                sendEventToWeb("adPaused", "{\"message\":\"ad paused\"}");
                break;
              case "onAdResumed":
                Log.i(TAG, "onAdResumed");
                showToast("EMAds: ad resumed");
                sendEventToWeb("adResumed", "{\"message\":\"ad resumed\"}");
                break;
              case "onAdLoadError":
                Log.i(TAG, "onAdLoadError");
                if (args != null && args.length > 0 && args[0] instanceof String) {
                  String msg = (String) args[0];
                  showToast("EMAds: load error - " + msg);
                  sendEventToWeb("adLoadError", "{\"message\":\"" + msg.replace("\"", "\\\"") + "\"}");
                } else {
                  sendEventToWeb("adLoadError", "{\"message\":\"unknown\"}");
                }
                break;
              case "onAdTapped":
                Log.i(TAG, "onAdTapped");
                showToast("EMAds: ad tapped");
                sendEventToWeb("adTapped", "{\"message\":\"ad tapped\"}");
                break;
            }
            return null;
          }
        });

        EMAdViewClass.getMethod("setAdEventListener", EMVideoPlayerListenerClass).invoke(adView, listenerProxy);
      } catch (ClassNotFoundException cnfe) {
        // Listener interface not present; ignore
        Log.i(TAG, "EMVideoPlayerListener class not found (listener not attached)");
      }

      // Add view to layout
      ViewGroup root = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
      FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
      );
      lp.gravity = Gravity.BOTTOM;
      // root.addView(adView, lp); // can't add since adView is Object; use reflection
      // Try to set layout params if supported, then add the view instance to root
      try {
        EMAdViewClass.getMethod("setLayoutParams", android.view.ViewGroup.LayoutParams.class).invoke(adView, lp);
      } catch (NoSuchMethodException ignored) {}

      // Finally add the view instance to root
      try {
        root.addView((android.view.View) adView);
      } catch (ClassCastException cce) {
        // If adView isn't a View subclass, skip adding it
        Log.w(TAG, "adView is not a View instance, skipping addView: " + cce.getMessage());
      }

      // Call loadAd if present
      try {
        EMAdViewClass.getMethod("loadAd").invoke(adView);
      } catch (NoSuchMethodException ignored) {}

      // Attempt to explicitly request/show a debug ad via any debug-related reflective method
      try {
        boolean invoked = false;
        for (Method m : EMAdViewClass.getMethods()) {
          String n = m.getName().toLowerCase();
          if (n.contains("debug") && (n.contains("ad") || n.contains("play") || n.contains("show") || n.contains("request"))) {
            try {
              m.invoke(adView);
              Log.i(TAG, "Invoked debug method on EMAdView: " + m.getName());
              sendEventToWeb("debugAdRequested", "{\"method\":\"" + m.getName() + "\"}");
              invoked = true;
              break;
            } catch (Exception ex) {
              Log.w(TAG, "debug invoke failed on EMAdView method: " + m.getName(), ex);
            }
          }
        }
        if (!invoked) {
          // try module-level methods
          for (Method m : EMAdsModuleClass.getMethods()) {
            String n = m.getName().toLowerCase();
            if (n.contains("debug") && (n.contains("ad") || n.contains("request") || n.contains("play") || n.contains("show"))) {
              try {
                // try invoking with input if it accepts one param, otherwise no-arg
                if (m.getParameterTypes().length == 1) m.invoke(null, input);
                else m.invoke(null);
                Log.i(TAG, "Invoked debug method on EMAdsModule: " + m.getName());
                sendEventToWeb("debugAdRequested", "{\"method\":\"" + m.getName() + "\"}");
                invoked = true;
                break;
              } catch (Exception ex) {
                Log.w(TAG, "debug invoke failed on EMAdsModule method: " + m.getName(), ex);
              }
            }
          }
        }
        if (!invoked) {
          Log.i(TAG, "No explicit debug ad method found via reflection");
          sendEventToWeb("debugAdNotSupported", "{\"message\":\"no debug method found\"}");
        }
      } catch (Throwable t) {
        Log.e(TAG, "debug ad reflective call failed", t);
        sendEventToWeb("debugAdError", "{\"message\":\"" + t.getMessage().replace("\"", "\\\"") + "\"}");
      }

    } catch (ClassNotFoundException e) {
      Log.i(TAG, "EMAds SDK classes not found on classpath: " + e.getMessage());
      showToast("EMAds SDK not on classpath");
      // notify web layer that SDK is missing
      sendEventToWeb("sdkMissing", "{\"message\":\"EMAds SDK not on classpath\"}");
    } catch (InvocationTargetException | NoSuchMethodException | InstantiationException | IllegalAccessException e) {
      Log.e(TAG, "EMAds reflection/init error", e);
      showToast("EMAds init error: " + e.getMessage());
      sendEventToWeb("sdkError", "{\"message\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}");
    } catch (Throwable t) {
      Log.e(TAG, "Unexpected EMAds error", t);
      showToast("EMAds unexpected error: " + t.getMessage());
      sendEventToWeb("sdkError", "{\"message\":\"" + t.getMessage().replace("\"", "\\\"") + "\"}");
    }
  }

  private void showToast(final String message) {
    runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
  }

  private void sendEventToWeb(final String eventName, final String jsonPayload) {
    runOnUiThread(() -> {
      try {
        ViewGroup root = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
        WebView w = findWebView(root);
        if (w != null) {
          String js = "window.dispatchEvent(new CustomEvent('emads', { detail: { event: '" + eventName + "', payload: " + jsonPayload + " } } ));";
          w.evaluateJavascript(js, null);
          Log.i(TAG, "Dispatched emads event to web: " + eventName);
        } else {
          Log.w(TAG, "WebView not found, cannot dispatch emads event: " + eventName);
        }
      } catch (Exception ex) {
        Log.e(TAG, "sendEventToWeb failed: " + ex.getMessage(), ex);
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
}
