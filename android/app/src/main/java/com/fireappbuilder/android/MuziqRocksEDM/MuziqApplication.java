package com.fireappbuilder.android.MuziqRocksEDM;

import android.app.Application;
import com.engage.engageadssdk.EMAdsModule;
import com.engage.engageadssdk.EMAdsModuleInputBuilder;

public class MuziqApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize the Engage Ads SDK
        EMAdsModuleInputBuilder builder = new EMAdsModuleInputBuilder();
        builder.setIsGdprApproved(true);
        builder.setPublisherId("a8ce40dc");
        builder.setChannelId("62570352");
        builder.setContext(getApplicationContext());
        builder.setIsDebug(false);
        builder.setBundleId(null);
        builder.setIsAutoPlay(true);

        EMAdsModule.init(builder.build());
    }
}
