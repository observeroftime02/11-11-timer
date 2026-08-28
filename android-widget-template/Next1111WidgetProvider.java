package com.nextcity.worldclock;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * Native Android Home Screen Widget for Next 11:11 World Clock.
 * Calculates next simultaneous 11:11 worldwide event and updates every minute.
 */
public class Next1111WidgetProvider extends AppWidgetProvider {

    // Major reference timezone buckets
    private static class TzSlot {
        String cityNames;
        String tzId;
        String gmtOffset;

        TzSlot(String cityNames, String tzId, String gmtOffset) {
            this.cityNames = cityNames;
            this.tzId = tzId;
            this.gmtOffset = gmtOffset;
        }
    }

    private static final TzSlot[] SLOTS = new TzSlot[]{
        new TzSlot("Gambier, Athens, Cairo, Kyiv, Riyadh", "Europe/Athens", "UTC-9 / UTC+3"),
        new TzSlot("Marquesas, Tehran", "Pacific/Marquesas", "UTC-9:30 / UTC+3:30"),
        new TzSlot("Honolulu, Paris, Berlin, Rome, Lagos", "Europe/Paris", "UTC-10 / UTC+1"),
        new TzSlot("Midway, London, Dublin, Lisbon, Abidjan", "Europe/London", "UTC-11 / UTC+0"),
        new TzSlot("Chatham, Kathmandu", "Pacific/Chatham", "UTC+12:45 / UTC+5:45"),
        new TzSlot("Azores, Reykjavik, Auckland, Fiji", "Pacific/Auckland", "UTC-1 / UTC+12"),
        new TzSlot("Cape Verde, Nouméa, Norfolk Island", "Pacific/Noumea", "UTC-1 / UTC+11"),
        new TzSlot("Fernando de Noronha, Sydney, Melbourne, Brisbane", "Australia/Sydney", "UTC-2 / UTC+10"),
        new TzSlot("St. John's, Lord Howe Island", "Australia/Lord_Howe", "UTC-3:30 / UTC+10:30"),
        new TzSlot("Buenos Aires, São Paulo, Rio, Darwin, Adelaide", "America/Argentina/Buenos_Aires", "UTC-3 / UTC+9:30"),
        new TzSlot("Halifax, Santiago, Tokyo, Seoul", "Asia/Tokyo", "UTC-4 / UTC+9"),
        new TzSlot("New York, Toronto, Miami, Lima, Bogotá, Perth, Singapore, Beijing", "Asia/Singapore", "UTC-5 / UTC+8"),
        new TzSlot("Eucla", "Australia/Eucla", "UTC+8:45"),
        new TzSlot("Chicago, Mexico City, Bangkok, Jakarta", "Asia/Bangkok", "UTC-6 / UTC+7"),
        new TzSlot("Yangon", "Asia/Yangon", "UTC+6:30"),
        new TzSlot("Denver, Calgary, Dhaka", "Asia/Dhaka", "UTC-7 / UTC+6"),
        new TzSlot("New Delhi, Mumbai", "Asia/Kolkata", "UTC+5:30"),
        new TzSlot("Kabul", "Asia/Kabul", "UTC+4:30"),
        new TzSlot("Vancouver, Los Angeles, San Francisco, Seattle, Dubai, Baku", "America/Vancouver", "UTC-8 / UTC+4")
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_1111);

        long nowMs = System.currentTimeMillis();
        long minRemaining = Long.MAX_VALUE;
        TzSlot bestSlot = SLOTS[0];
        String periodFormatted = "11:11 AM";

        for (TzSlot slot : SLOTS) {
            TimeZone tz = TimeZone.getTimeZone(slot.tzId);
            Calendar cal = Calendar.getInstance(tz);

            int hour = cal.get(Calendar.HOUR_OF_DAY);
            int minute = cal.get(Calendar.MINUTE);

            // Targets: 11:11 and 23:11
            int[] targetHours = new int[]{11, 23};
            for (int tHour : targetHours) {
                Calendar target = (Calendar) cal.clone();
                target.set(Calendar.HOUR_OF_DAY, tHour);
                target.set(Calendar.MINUTE, 11);
                target.set(Calendar.SECOND, 0);
                target.set(Calendar.MILLISECOND, 0);

                if (target.getTimeInMillis() <= nowMs) {
                    target.add(Calendar.DAY_OF_YEAR, 1);
                }

                long diff = target.getTimeInMillis() - nowMs;
                if (diff > 0 && diff < minRemaining) {
                    minRemaining = diff;
                    bestSlot = slot;
                    periodFormatted = (tHour == 11) ? "11:11 AM" : "11:11 PM";
                }
            }
        }

        // Format countdown string
        long totalSeconds = Math.max(0, minRemaining / 1000);
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        String countdownText;
        if (hours > 0) {
            countdownText = String.format("%d h %02d min", hours, minutes);
        } else {
            countdownText = String.format("%d min %02d s", minutes, seconds);
        }

        // Apply text to remote views
        views.setTextViewText(R.id.widget_cities, bestSlot.cityNames);
        views.setTextViewText(R.id.widget_countdown, "in " + countdownText);
        views.setTextViewText(R.id.widget_subinfo, periodFormatted + " • " + bestSlot.gmtOffset);

        // Tap action: Launch the main app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
