package com.nextcity.worldclock;

import java.util.Calendar;
import java.util.TimeZone;

public class Next1111WidgetHelper {

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
        new TzSlot("Fernando de Noronha, Sydney, Melbourne", "Australia/Sydney", "UTC-2 / UTC+10"),
        new TzSlot("St. John's, Lord Howe Island", "Australia/Lord_Howe", "UTC-3:30 / UTC+10:30"),
        new TzSlot("Buenos Aires, São Paulo, Adelaide", "America/Argentina/Buenos_Aires", "UTC-3 / UTC+9:30"),
        new TzSlot("Halifax, Santiago, Tokyo, Seoul", "Asia/Tokyo", "UTC-4 / UTC+9"),
        new TzSlot("New York, Toronto, Miami, Lima, Singapore, Perth", "Asia/Singapore", "UTC-5 / UTC+8"),
        new TzSlot("Eucla", "Australia/Eucla", "UTC+8:45"),
        new TzSlot("Chicago, Mexico City, Bangkok, Jakarta", "Asia/Bangkok", "UTC-6 / UTC+7"),
        new TzSlot("Yangon", "Asia/Yangon", "UTC+6:30"),
        new TzSlot("Denver, Calgary, Dhaka", "Asia/Dhaka", "UTC-7 / UTC+6"),
        new TzSlot("New Delhi, Mumbai", "Asia/Kolkata", "UTC+5:30"),
        new TzSlot("Kabul", "Asia/Kabul", "UTC+4:30"),
        new TzSlot("Vancouver, Los Angeles, San Francisco, Dubai", "America/Vancouver", "UTC-8 / UTC+4")
    };

    public static class WidgetState {
        public String cityNames;
        public String gmtOffset;
        public String periodFormatted;
        public String shortCountdown;
        public String detailedCountdown;
    }

    public static WidgetState calculateNext1111() {
        long nowMs = System.currentTimeMillis();
        long minRemaining = Long.MAX_VALUE;
        TzSlot bestSlot = SLOTS[0];
        String periodFormatted = "11:11 AM";

        for (TzSlot slot : SLOTS) {
            TimeZone tz = TimeZone.getTimeZone(slot.tzId);
            Calendar cal = Calendar.getInstance(tz);

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

        long totalSeconds = Math.max(0, minRemaining / 1000);
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        WidgetState state = new WidgetState();
        state.cityNames = bestSlot.cityNames;
        state.gmtOffset = bestSlot.gmtOffset;
        state.periodFormatted = periodFormatted;

        if (hours > 0) {
            state.shortCountdown = String.format("in %dh %02dm", hours, minutes);
            state.detailedCountdown = String.format("⏳ Exact: in %dh %02dm %02ds", hours, minutes, seconds);
        } else {
            state.shortCountdown = String.format("in %d min", minutes);
            state.detailedCountdown = String.format("⏳ Exact: in %02dm %02ds", minutes, seconds);
        }

        return state;
    }
}
