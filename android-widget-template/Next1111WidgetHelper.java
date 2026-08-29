package com.nextcity.worldclock;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * Helper class for Next 11:11 & Next 4:20 Android Home Screen Widgets.
 * Handles precise timezone arithmetic across all world timezones and
 * manages minute-by-minute AlarmManager widget refresh scheduling.
 */
public class Next1111WidgetHelper {

    public static final String ACTION_WIDGET_UPDATE = "com.nextcity.worldclock.ACTION_WIDGET_UPDATE";

    public static class TzSlot {
        public String cityNames;
        public String tzId;
        public String gmtOffset;

        public TzSlot(String cityNames, String tzId, String gmtOffset) {
            this.cityNames = cityNames;
            this.tzId = tzId;
            this.gmtOffset = gmtOffset;
        }
    }

    public static final TzSlot[] SLOTS = new TzSlot[]{
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
        new TzSlot("New York, Toronto, Miami, Lima, Bogotá, Singapore, Perth, Beijing", "Asia/Singapore", "UTC-5 / UTC+8"),
        new TzSlot("Eucla", "Australia/Eucla", "UTC+8:45"),
        new TzSlot("Chicago, Mexico City, Bangkok, Jakarta", "Asia/Bangkok", "UTC-6 / UTC+7"),
        new TzSlot("Yangon", "Asia/Yangon", "UTC+6:30"),
        new TzSlot("Denver, Calgary, Dhaka", "Asia/Dhaka", "UTC-7 / UTC+6"),
        new TzSlot("New Delhi, Mumbai", "Asia/Kolkata", "UTC+5:30"),
        new TzSlot("Kabul", "Asia/Kabul", "UTC+4:30"),
        new TzSlot("Vancouver, Los Angeles, San Francisco, Seattle, Dubai, Baku", "America/Vancouver", "UTC-8 / UTC+4")
    };

    public static class WidgetState {
        public String mode; // "1111" or "420"
        public String modeLabel; // "11:11" or "4:20"
        public String cityNames;
        public String gmtOffset;
        public String periodFormatted;
        public String shortCountdown;
        public String detailedCountdown;
        public long remainingMs;
        public boolean isHappeningNow;
    }

    /**
     * Calculates the next target moment (11:11 or 4:20) worldwide.
     */
    public static WidgetState calculateNextMoment(String mode) {
        boolean is420 = "420".equals(mode);
        int amHour = is420 ? 4 : 11;
        int pmHour = is420 ? 16 : 23;
        int targetMin = is420 ? 20 : 11;
        String modeLabel = is420 ? "4:20" : "11:11";

        long nowMs = System.currentTimeMillis();
        long minRemaining = Long.MAX_VALUE;
        TzSlot bestSlot = SLOTS[0];
        String periodFormatted = modeLabel + " AM";
        boolean isHappeningNow = false;

        for (TzSlot slot : SLOTS) {
            TimeZone tz = TimeZone.getTimeZone(slot.tzId);
            Calendar cal = Calendar.getInstance(tz);

            int currentHour = cal.get(Calendar.HOUR_OF_DAY);
            int currentMin = cal.get(Calendar.MINUTE);

            if ((currentHour == amHour || currentHour == pmHour) && currentMin == targetMin) {
                isHappeningNow = true;
            }

            int[] targetHours = new int[]{amHour, pmHour};
            for (int tHour : targetHours) {
                Calendar target = (Calendar) cal.clone();
                target.set(Calendar.HOUR_OF_DAY, tHour);
                target.set(Calendar.MINUTE, targetMin);
                target.set(Calendar.SECOND, 0);
                target.set(Calendar.MILLISECOND, 0);

                if (target.getTimeInMillis() <= nowMs) {
                    target.add(Calendar.DAY_OF_YEAR, 1);
                }

                long diff = target.getTimeInMillis() - nowMs;
                if (diff > 0 && diff < minRemaining) {
                    minRemaining = diff;
                    bestSlot = slot;
                    periodFormatted = (tHour == amHour) ? (modeLabel + " AM") : (modeLabel + " PM");
                }
            }
        }

        long totalSeconds = Math.max(0, minRemaining / 1000);
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        WidgetState state = new WidgetState();
        state.mode = mode;
        state.modeLabel = modeLabel;
        state.cityNames = bestSlot.cityNames;
        state.gmtOffset = bestSlot.gmtOffset;
        state.periodFormatted = periodFormatted;
        state.remainingMs = minRemaining;
        state.isHappeningNow = isHappeningNow;

        if (isHappeningNow) {
            state.shortCountdown = "LIVE NOW!";
            state.detailedCountdown = is420 ? "🌿 4:20 is happening right now!" : "✨ 11:11 is happening right now!";
        } else if (hours > 0) {
            state.shortCountdown = String.format("in %dh %02dm", hours, minutes);
            state.detailedCountdown = String.format("⏳ Exact: in %dh %02dm %02ds", hours, minutes, seconds);
        } else {
            state.shortCountdown = String.format("in %d min", minutes);
            state.detailedCountdown = String.format("⏳ Exact: in %02dm %02ds", minutes, seconds);
        }

        return state;
    }

    /**
     * Backward-compatible helper for 11:11
     */
    public static WidgetState calculateNext1111() {
        return calculateNextMoment("1111");
    }

    /**
     * Helper for 4:20
     */
    public static WidgetState calculateNext420() {
        return calculateNextMoment("420");
    }

    /**
     * Schedules minute-by-minute widget updates using AlarmManager.
     * Aligns with the 00 second mark of each minute.
     */
    public static void scheduleWidgetUpdates(Context context) {
        if (context == null) return;

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, Next1111WidgetReceiver.class);
        intent.setAction(ACTION_WIDGET_UPDATE);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 1111420, intent, flags);

        // Target the next whole minute (00 seconds)
        long now = System.currentTimeMillis();
        long triggerAtMillis = (now / 60000 + 1) * 60000;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC, triggerAtMillis, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.RTC, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC, triggerAtMillis, pendingIntent);
            }
        } catch (Exception e) {
            // Fallback for devices restricting exact alarms
            alarmManager.set(AlarmManager.RTC, triggerAtMillis, pendingIntent);
        }
    }

    /**
     * Cancels scheduled widget updates when all widgets are removed.
     */
    public static void cancelWidgetUpdates(Context context) {
        if (context == null) return;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, Next1111WidgetReceiver.class);
        intent.setAction(ACTION_WIDGET_UPDATE);

        int flags = PendingIntent.FLAG_NO_CREATE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 1111420, intent, flags);
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
    }

    /**
     * Checks if any of the 6 widget types are currently placed on the home screen.
     */
    public static boolean hasAnyActiveWidgets(Context context) {
        if (context == null) return false;
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] c11 = manager.getAppWidgetIds(new ComponentName(context, Next1111CompactWidgetProvider.class));
        if (c11 != null && c11.length > 0) return true;

        int[] m11 = manager.getAppWidgetIds(new ComponentName(context, Next1111MediumWidgetProvider.class));
        if (m11 != null && m11.length > 0) return true;

        int[] s11 = manager.getAppWidgetIds(new ComponentName(context, Next1111SquareWidgetProvider.class));
        if (s11 != null && s11.length > 0) return true;

        int[] c42 = manager.getAppWidgetIds(new ComponentName(context, Next420CompactWidgetProvider.class));
        if (c42 != null && c42.length > 0) return true;

        int[] m42 = manager.getAppWidgetIds(new ComponentName(context, Next420MediumWidgetProvider.class));
        if (m42 != null && m42.length > 0) return true;

        int[] s42 = manager.getAppWidgetIds(new ComponentName(context, Next420SquareWidgetProvider.class));
        return s42 != null && s42.length > 0;
    }

    /**
     * Refreshes all 6 widget types across 11:11 and 4:20.
     * If no widgets are present, cancels background alarms to preserve battery.
     */
    public static void updateAllWidgets(Context context) {
        if (context == null) return;

        if (!hasAnyActiveWidgets(context)) {
            cancelWidgetUpdates(context);
            return;
        }

        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        // 11:11 Widgets
        int[] compact1111Ids = manager.getAppWidgetIds(new ComponentName(context, Next1111CompactWidgetProvider.class));
        if (compact1111Ids != null && compact1111Ids.length > 0) {
            Next1111CompactWidgetProvider.updateWidgets(context, manager, compact1111Ids);
        }

        int[] medium1111Ids = manager.getAppWidgetIds(new ComponentName(context, Next1111MediumWidgetProvider.class));
        if (medium1111Ids != null && medium1111Ids.length > 0) {
            Next1111MediumWidgetProvider.updateWidgets(context, manager, medium1111Ids);
        }

        int[] square1111Ids = manager.getAppWidgetIds(new ComponentName(context, Next1111SquareWidgetProvider.class));
        if (square1111Ids != null && square1111Ids.length > 0) {
            Next1111SquareWidgetProvider.updateWidgets(context, manager, square1111Ids);
        }

        // 4:20 Widgets
        int[] compact420Ids = manager.getAppWidgetIds(new ComponentName(context, Next420CompactWidgetProvider.class));
        if (compact420Ids != null && compact420Ids.length > 0) {
            Next420CompactWidgetProvider.updateWidgets(context, manager, compact420Ids);
        }

        int[] medium420Ids = manager.getAppWidgetIds(new ComponentName(context, Next420MediumWidgetProvider.class));
        if (medium420Ids != null && medium420Ids.length > 0) {
            Next420MediumWidgetProvider.updateWidgets(context, manager, medium420Ids);
        }

        int[] square420Ids = manager.getAppWidgetIds(new ComponentName(context, Next420SquareWidgetProvider.class));
        if (square420Ids != null && square420Ids.length > 0) {
            Next420SquareWidgetProvider.updateWidgets(context, manager, square420Ids);
        }

        // Reschedule next tick
        scheduleWidgetUpdates(context);
    }
}
