package com.nextcity.worldclock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * BroadcastReceiver triggered by AlarmManager, TIME_TICK, TIMEZONE_CHANGED, and BOOT_COMPLETED.
 * Refreshes all 11:11 and 4:20 widgets every minute.
 */
public class Next1111WidgetReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null) return;
        Next1111WidgetHelper.updateAllWidgets(context);
    }
}
