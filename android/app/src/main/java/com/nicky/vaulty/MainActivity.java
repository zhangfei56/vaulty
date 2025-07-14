package com.nicky.vaulty;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "MainActivity";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    try {
      // 启用WebView调试（仅在调试模式下）
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
        WebView.setWebContentsDebuggingEnabled(true);
      }

      // 正确注册统计插件
      this.registerPlugin(AppUsagePlugin.class);
      Log.d(TAG, "Plugins registered successfully");
    } catch (Exception e) {
      Log.e("MainActivity", "Failed to register plugin", e);
    }

    super.onCreate(savedInstanceState);
    Log.d(TAG, "MainActivity onCreate called");
  }
}
