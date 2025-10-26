package com.fireappbuilder.android.MuziqRocksEDM;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.view.Gravity;

import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Try to initialize Engage Ads SDK reflectively if it's available in classpath
    try {
      Class<?> emAdsModuleClass = Class.forName("com.engage.engageadssdk.EMAdsModule");
      Class<?> builderClass = Class.forName("com.engage.engageadssdk.input.EMAdsModuleInputBuilder");
      Object builder = builderClass.getConstructor().newInstance();

      try {
        // set builder fields/methods (best-effort, method names may vary)
        try { builderClass.getMethod("setIsGdprApproved", boolean.class).invoke(builder, true); } catch (NoSuchMethodException ignored) {}
        try { builderClass.getMethod("setPublisherId", String.class).invoke(builder, "a8ce40dc"); } catch (NoSuchMethodException ignored) {}
        try { builderClass.getMethod("setChannelId", String.class).invoke(builder, "62570352"); } catch (NoSuchMethodException ignored) {}
        try { builderClass.getMethod("setContext", android.content.Context.class).invoke(builder, getApplicationContext()); } catch (NoSuchMethodException ignored) {}
        try { builderClass.getMethod("setIsDebug", boolean.class).invoke(builder, true); } catch (NoSuchMethodException ignored) {}
        try { builderClass.getMethod("setIsAutoPlay", boolean.class).invoke(builder, true); } catch (NoSuchMethodException ignored) {}
      } catch (Exception ex) {
        // ignore builder set failures
      }

      // build input
      Object input = null;
      try {
        input = builderClass.getMethod("build").invoke(builder);
      } catch (NoSuchMethodException ns) {
        input = builder; // maybe builder is the input
      }

      // Try to get INSTANCE field (Kotlin object) or static init
      Object emAdsModuleInstance = null;
      try {
        emAdsModuleInstance = emAdsModuleClass.getField("INSTANCE").get(null);
      } catch (NoSuchFieldException ignored) {}

      try {
        if (emAdsModuleInstance != null) {
          emAdsModuleClass.getMethod("init", input.getClass()).invoke(emAdsModuleInstance, input);
        } else {
          // try static init
          emAdsModuleClass.getMethod("init", input.getClass()).invoke(null, input);
        }
      } catch (NoSuchMethodException ignored) {}

      // Create and attach ad view
      try {
        Class<?> emAdViewClass = Class.forName("com.engage.engageadssdk.ui.EMAdView");
        Object adViewObj = emAdViewClass.getConstructor(android.content.Context.class).newInstance(this);
        android.view.View adView = (android.view.View) adViewObj;

        // set content controller if available
        try {
          Class<?> controllerClass = Class.forName("com.engage.engageadssdk.controller.EmClientContentController");
          Object controller = java.lang.reflect.Proxy.newProxyInstance(
            controllerClass.getClassLoader(),
            new Class[]{controllerClass},
            (proxy, method, args) -> { return null; }
          );
          try { emAdViewClass.getMethod("setContentController", controllerClass).invoke(adViewObj, controller); } catch (NoSuchMethodException ignored) {}
        } catch (ClassNotFoundException ignored) {}

        // add to root
        ViewGroup root = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.gravity = Gravity.BOTTOM;
        root.addView(adView, lp);

        // call loadAd if present
        try { emAdViewClass.getMethod("loadAd").invoke(adViewObj); } catch (NoSuchMethodException ignored) {}
      } catch (ClassNotFoundException cnfe) {
        // SDK not available, skip
      }

    } catch (ClassNotFoundException e) {
      // Engage SDK not on classpath; ignore - app will run without ads
    } catch (Exception e) {
      // Any other reflection error - skip ads
      e.printStackTrace();
    }
  }
}
