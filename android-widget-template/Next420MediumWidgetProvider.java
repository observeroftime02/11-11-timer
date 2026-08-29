package com.nextcity.worldclock;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class Next420MediumWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
        Next1111WidgetHelper.scheduleWidgetUpdates(context);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        Next1111WidgetHelper.scheduleWidgetUpdates(context);
    }

    public static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        Next1111WidgetHelper.WidgetState state = Next1111WidgetHelper.calculateNext420();

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_medium_420);

            views.setTextViewText(R.id.medium_420_widget_cities, state.cityNames);
            views.setTextViewText(R.id.medium_420_widget_subinfo, state.periodFormatted + " • " + state.gmtOffset);
            views.setTextViewText(R.id.medium_420_widget_countdown_badge, state.shortCountdown);
            views.setTextViewText(R.id.medium_420_widget_bottom_timer, state.detailedCountdown);

            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context, 420002, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_medium_420_root, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
