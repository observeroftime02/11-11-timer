package com.nextcity.worldclock;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class Next1111SquareWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_square_dial);
            Next1111WidgetHelper.WidgetState state = Next1111WidgetHelper.calculateNext1111();

            views.setTextViewText(R.id.square_widget_cities, state.cityNames);
            views.setTextViewText(R.id.square_widget_sub, state.periodFormatted + " • " + state.gmtOffset);
            views.setTextViewText(R.id.square_widget_countdown, state.shortCountdown);

            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_square_root, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
