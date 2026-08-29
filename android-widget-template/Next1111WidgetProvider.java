package com.nextcity.worldclock;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/**
 * Universal Widget Provider alias for Next 11:11 World Clock.
 */
public class Next1111WidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        Next1111WidgetHelper.updateAllWidgets(context);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        Next1111WidgetHelper.scheduleWidgetUpdates(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (context == null) return;
        Next1111WidgetHelper.updateAllWidgets(context);
    }
}
