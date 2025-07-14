package com.nicky.vaulty;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "AppUsage")
public class AppUsagePlugin extends Plugin {
    private static final String TAG = "AppUsagePlugin";
    private static final int REQUEST_USAGE_ACCESS = 123;

    @PluginMethod
    public void hasUsagePermission(PluginCall call) {
        boolean hasPermission = checkUsageStatsPermission();
        JSObject result = new JSObject();
        result.put("value", hasPermission);
        call.resolve(result);
    }

    @PluginMethod
    public void requestUsagePermission(PluginCall call) {
        if (checkUsageStatsPermission()) {
            // 已经有权限
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } else {
            // 没有权限，跳转到系统设置页面
            saveCall(call);
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            getBridge().getActivity().startActivityForResult(intent, REQUEST_USAGE_ACCESS);
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_USAGE_ACCESS) {
            PluginCall savedCall = getSavedCall();
            if (savedCall == null) {
                return;
            }

            boolean hasPermission = checkUsageStatsPermission();
            JSObject result = new JSObject();
            result.put("value", hasPermission);
            savedCall.resolve(result);
        }
    }

    @PluginMethod
    public void queryEvents(PluginCall call) {
        if (!checkUsageStatsPermission()) {
            call.reject("权限不足，无法访问使用情况数据");
            return;
        }

        long startTime = call.getLong("startTime");
        long endTime = call.getLong("endTime");

        UsageStatsManager usageStatsManager = (UsageStatsManager) getContext()
                .getSystemService(Context.USAGE_STATS_SERVICE);

        UsageEvents usageEvents = usageStatsManager.queryEvents(startTime, endTime);
        UsageEvents.Event event = new UsageEvents.Event();

        JSObject result = new JSObject();
        JSArray eventsArray = new JSArray();

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event);

            // 只关注应用进入前台和退出前台的事件
            if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED ||
                    event.getEventType() == UsageEvents.Event.ACTIVITY_PAUSED) {

                JSObject eventObject = new JSObject();
                eventObject.put("packageName", event.getPackageName());
                eventObject.put("className", event.getClassName());
                eventObject.put("timestamp", event.getTimeStamp());

                // 事件类型
                String eventType = "";
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    eventType = "ACTIVITY_RESUMED";
                } else if (event.getEventType() == UsageEvents.Event.ACTIVITY_PAUSED) {
                    eventType = "ACTIVITY_PAUSED";
                }
                eventObject.put("eventType", eventType);

                eventsArray.put(eventObject);
            }
        }

        result.put("events", eventsArray);
        call.resolve(result);
    }

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        String packageName = call.getString("packageName");

        if (packageName == null || packageName.isEmpty()) {
            call.reject("包名不能为空");
            return;
        }

        PackageManager packageManager = getContext().getPackageManager();
        try {
            ApplicationInfo appInfo = packageManager.getApplicationInfo(packageName, 0);
            JSObject result = createAppInfoObject(packageManager, appInfo, true);
            call.resolve(result);
        } catch (PackageManager.NameNotFoundException e) {
            // 对于找不到的应用，返回一个基本的应用信息对象而不是抛出错误
            Log.w(TAG, "应用未找到，返回基本信息: " + packageName);

            JSObject result = new JSObject();
            result.put("packageName", packageName);
            result.put("appName", generateDisplayNameFromPackage(packageName));
            result.put("versionName", "未知");
            result.put("versionCode", 0);
            result.put("firstInstallTime", 0);
            result.put("lastUpdateTime", 0);
            result.put("isSystemApp", true); // 假设是系统应用
            result.put("icon", null);

            call.resolve(result);
        }
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        boolean includeIcons = call.getBoolean("includeIcons", false);

        PackageManager packageManager = getContext().getPackageManager();
        List<ApplicationInfo> installedApps = packageManager.getInstalledApplications(PackageManager.GET_META_DATA);

        JSObject result = new JSObject();
        JSArray appsArray = new JSArray();

        for (ApplicationInfo appInfo : installedApps) {
            // 跳过系统应用（可选）
            // if ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0) {
            // continue;
            // }

            try {
                JSObject appObject = createAppInfoObject(packageManager, appInfo, includeIcons);
                appsArray.put(appObject);
            } catch (Exception e) {
                Log.e(TAG, "Error processing app: " + appInfo.packageName, e);
            }
        }

        result.put("apps", appsArray);
        call.resolve(result);
    }

    private JSObject createAppInfoObject(PackageManager packageManager, ApplicationInfo appInfo, boolean includeIcon) {
        JSObject appObject = new JSObject();
        appObject.put("packageName", appInfo.packageName);
        
        // 优先使用系统获取的应用名称，如果是英文则尝试使用中文映射
        String systemAppName = packageManager.getApplicationLabel(appInfo).toString();
        String chineseAppName = generateDisplayNameFromPackage(appInfo.packageName);
        
        // 如果中文名称不同于包名处理结果，且不是纯英文，则使用中文名称
        if (!chineseAppName.equals(appInfo.packageName) && 
            !chineseAppName.matches("^[a-zA-Z\\s]+$")) {
            appObject.put("appName", chineseAppName);
        } else {
            appObject.put("appName", systemAppName);
        }

        try {
            String versionName = packageManager.getPackageInfo(appInfo.packageName, 0).versionName;
            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = packageManager.getPackageInfo(appInfo.packageName, 0).getLongVersionCode();
            } else {
                versionCode = packageManager.getPackageInfo(appInfo.packageName, 0).versionCode;
            }
            long firstInstallTime = packageManager.getPackageInfo(appInfo.packageName, 0).firstInstallTime;
            long lastUpdateTime = packageManager.getPackageInfo(appInfo.packageName, 0).lastUpdateTime;

            appObject.put("versionName", versionName);
            appObject.put("versionCode", versionCode);
            appObject.put("firstInstallTime", firstInstallTime);
            appObject.put("lastUpdateTime", lastUpdateTime);
            appObject.put("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);

            // 获取应用图标（可选，因为可能会影响性能）
            if (includeIcon) {
                Drawable icon = packageManager.getApplicationIcon(appInfo);
                String iconBase64 = drawableToBase64(icon);
                appObject.put("icon", iconBase64);
            }
        } catch (PackageManager.NameNotFoundException e) {
            Log.e(TAG, "Error getting app info: " + appInfo.packageName, e);
        }

        return appObject;
    }

    private String drawableToBase64(Drawable drawable) {
        try {
            Bitmap bitmap;
            if (drawable instanceof BitmapDrawable) {
                bitmap = ((BitmapDrawable) drawable).getBitmap();
            } else {
                bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(),
                        drawable.getIntrinsicHeight(),
                        Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                drawable.draw(canvas);
            }

            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 70, stream);
            byte[] byteArray = stream.toByteArray();
            return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.DEFAULT);
        } catch (Exception e) {
            Log.e(TAG, "Error converting drawable to base64", e);
            return null;
        }
    }

    private boolean checkUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getContext()
                .getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(), getContext().getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    /**
     * 从包名生成显示名称
     */
    private String generateDisplayNameFromPackage(String packageName) {
        // 处理特殊情况 - 优先使用中文名称
        Map<String, String> specialCases = new HashMap<>();
        
        // 中文应用名称映射
        specialCases.put("com.tencent.mm", "微信");
        specialCases.put("com.tencent.mobileqq", "QQ");
        specialCases.put("com.tencent.tim", "TIM");
        specialCases.put("com.ss.android.ugc.aweme", "抖音");
        specialCases.put("com.ss.android.ugc.trill", "TikTok");
        specialCases.put("com.sina.weibo", "微博");
        specialCases.put("com.eg.android.AlipayGphone", "支付宝");
        specialCases.put("com.taobao.taobao", "淘宝");
        specialCases.put("com.tmall.wireless", "天猫");
        specialCases.put("com.jingdong.app.mall", "京东");
        specialCases.put("com.pinduoduo.android", "拼多多");
        specialCases.put("com.meituan.android", "美团");
        specialCases.put("com.sankuai.meituan", "美团");
        specialCases.put("com.dianping.v1", "大众点评");
        specialCases.put("com.ele.me", "饿了么");
        specialCases.put("com.baidu.BaiduMap", "百度地图");
        specialCases.put("com.autonavi.minimap", "高德地图");
        specialCases.put("com.baidu.searchbox", "百度");
        specialCases.put("com.netease.cloudmusic", "网易云音乐");
        specialCases.put("com.kugou.android", "酷狗音乐");
        specialCases.put("com.kuwo.kwmusic", "酷我音乐");
        specialCases.put("com.ting.mp3.android", "QQ音乐");
        specialCases.put("com.zhihu.android", "知乎");
        specialCases.put("tv.danmaku.bili", "哔哩哔哩");
        specialCases.put("com.youku.phone", "优酷");
        specialCases.put("com.iqiyi.i18n", "爱奇艺");
        specialCases.put("com.qiyi.video", "爱奇艺");
        specialCases.put("com.tencent.qqlive", "腾讯视频");
        specialCases.put("com.hunantv.imgo.activity", "芒果TV");
        specialCases.put("com.ss.android.article.news", "今日头条");
        specialCases.put("com.phoenix.newsclient", "凤凰新闻");
        specialCases.put("com.netease.newsreader.activity", "网易新闻");
        specialCases.put("com.sohu.newsclient", "搜狐新闻");
        specialCases.put("com.tencent.news", "腾讯新闻");
        specialCases.put("com.UCMobile", "UC浏览器");
        specialCases.put("com.qihoo.browser", "360浏览器");
        specialCases.put("com.baidu.browser.apps", "百度浏览器");
        specialCases.put("com.android.browser", "浏览器");
        specialCases.put("com.tencent.androidqqmail", "QQ邮箱");
        specialCases.put("com.netease.mail", "网易邮箱");
        specialCases.put("com.yy.hiyo", "YY");
        specialCases.put("com.immomo.momo", "陌陌");
        specialCases.put("com.tantan.app", "探探");
        specialCases.put("com.jiayuan.app", "世纪佳缘");
        specialCases.put("com.baihe.app", "百合网");
        specialCases.put("com.didi.passenger", "滴滴出行");
        specialCases.put("com.sdu.didi.psnger", "滴滴出行");
        specialCases.put("com.cainiao.wireless", "菜鸟");
        specialCases.put("com.sf.activity", "顺丰速运");
        specialCases.put("com.jd.jdlite", "京东极速版");
        specialCases.put("com.xunmeng.pinduoduo", "拼多多");
        specialCases.put("com.wandoujia.phoenix2", "豌豆荚");
        specialCases.put("com.qihoo360.mobilesafe", "360手机卫士");
        specialCases.put("com.tencent.qqpimsecure", "腾讯手机管家");
        specialCases.put("com.cleanmaster.mguard", "猎豹清理大师");
        specialCases.put("com.duokan.phone.remotecontroller", "万能遥控");
        specialCases.put("com.miui.calculator", "计算器");
        specialCases.put("com.android.calculator2", "计算器");
        specialCases.put("com.miui.notes", "便签");
        specialCases.put("com.miui.compass", "指南针");
        specialCases.put("com.miui.weather2", "天气");
        specialCases.put("com.android.deskclock", "时钟");
        specialCases.put("com.miui.clock", "时钟");
        specialCases.put("com.android.calendar", "日历");
        specialCases.put("com.miui.calendar", "日历");
        specialCases.put("com.android.contacts", "通讯录");
        specialCases.put("com.miui.contacts", "通讯录");
        specialCases.put("com.android.mms", "短信");
        specialCases.put("com.miui.mms", "短信");
        specialCases.put("com.android.dialer", "电话");
        specialCases.put("com.miui.dialer", "电话");
        specialCases.put("com.android.camera", "相机");
        specialCases.put("com.miui.camera", "相机");
        specialCases.put("com.android.gallery3d", "相册");
        specialCases.put("com.miui.gallery", "相册");
        specialCases.put("com.android.fileexplorer", "文件管理");
        specialCases.put("com.miui.fileexplorer", "文件管理");
        specialCases.put("com.android.settings", "设置");
        specialCases.put("com.miui.securitycenter", "手机管家");
        specialCases.put("com.xiaomi.market", "应用商店");
        specialCases.put("com.miui.miuibrowser", "浏览器");
        specialCases.put("com.miui.player", "音乐");
        specialCases.put("com.miui.video", "视频");
        
        // 国际应用的中文名称
        specialCases.put("com.google.android.apps.nexuslauncher", "Nexus启动器");
        specialCases.put("com.google.android.launcher", "Google启动器");
        specialCases.put("com.android.launcher", "Android启动器");
        specialCases.put("com.google.android.gm", "Gmail");
        specialCases.put("com.google.android.youtube", "YouTube");
        specialCases.put("com.google.android.apps.maps", "谷歌地图");
        specialCases.put("com.google.android.apps.translate", "谷歌翻译");
        specialCases.put("com.google.android.apps.photos", "Google相册");
        specialCases.put("com.google.android.calendar", "Google日历");
        specialCases.put("com.google.android.contacts", "Google通讯录");
        specialCases.put("com.whatsapp", "WhatsApp");
        specialCases.put("com.instagram.android", "Instagram");
        specialCases.put("com.facebook.katana", "Facebook");
        specialCases.put("com.twitter.android", "Twitter");
        specialCases.put("com.snapchat.android", "Snapchat");
        specialCases.put("com.linkedin.android", "LinkedIn");
        specialCases.put("com.spotify.music", "Spotify");
        specialCases.put("com.netflix.mediaclient", "Netflix");
        specialCases.put("com.amazon.mShop.android.shopping", "Amazon");
        specialCases.put("com.ebay.mobile", "eBay");
        specialCases.put("com.paypal.android.p2pmobile", "PayPal");
        specialCases.put("com.skype.raider", "Skype");
        specialCases.put("com.viber.voip", "Viber");
        specialCases.put("com.telegram.messenger", "Telegram");
        specialCases.put("com.discord", "Discord");
        specialCases.put("com.slack", "Slack");
        specialCases.put("com.microsoft.teams", "Microsoft Teams");
        specialCases.put("com.zoom.us", "Zoom");
        specialCases.put("us.zoom.videomeetings", "Zoom");
        specialCases.put("com.adobe.reader", "Adobe Reader");
        specialCases.put("com.microsoft.office.word", "Microsoft Word");
        specialCases.put("com.microsoft.office.excel", "Microsoft Excel");
        specialCases.put("com.microsoft.office.powerpoint", "Microsoft PowerPoint");
        specialCases.put("com.dropbox.android", "Dropbox");
        specialCases.put("com.google.android.apps.docs", "Google文档");
        specialCases.put("com.reddit.frontpage", "Reddit");
        specialCases.put("com.pinterest", "Pinterest");
        specialCases.put("com.tumblr", "Tumblr");
        specialCases.put("com.medium.reader", "Medium");
        specialCases.put("com.duolingo", "Duolingo");
        specialCases.put("com.king.candycrushsaga", "糖果传奇");
        specialCases.put("com.supercell.clashofclans", "部落冲突");
        specialCases.put("com.tencent.tmgp.sgame", "王者荣耀");
        specialCases.put("com.tencent.tmgp.pubgmhd", "绝地求生");
        specialCases.put("com.netease.dwrg", "第五人格");
        specialCases.put("com.netease.hyxd", "荒野行动");
        specialCases.put("com.miHoYo.GenshinImpact", "原神");
        specialCases.put("com.miHoYo.bh3.oversea", "崩坏3");

        // 精确匹配包名
        if (specialCases.containsKey(packageName)) {
            return specialCases.get(packageName);
        }

        // 模糊匹配包名中的关键词
        for (Map.Entry<String, String> entry : specialCases.entrySet()) {
            if (packageName.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        // 通用处理：移除常见前缀并格式化
        String displayName = packageName
                .replaceFirst("^com\\.", "")
                .replaceFirst("^android\\.", "")
                .replaceFirst("^org\\.", "");

        // 将点号替换为空格，并将每个单词首字母大写
        String[] parts = displayName.split("\\.");
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0)
                result.append(" ");
            String part = parts[i];
            if (part.length() > 0) {
                result.append(Character.toUpperCase(part.charAt(0)));
                if (part.length() > 1) {
                    result.append(part.substring(1));
                }
            }
        }

        return result.length() > 0 ? result.toString() : packageName;
    }
}
