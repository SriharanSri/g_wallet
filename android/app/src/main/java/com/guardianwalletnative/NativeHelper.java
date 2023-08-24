package com.guardianwalletnative;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import com.budiyev.android.codescanner.CodeScanner;
import com.budiyev.android.codescanner.CodeScannerView;
import com.budiyev.android.codescanner.DecodeCallback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.zxing.Result;

public class NativeHelper extends ReactContextBaseJavaModule {
    NativeHelper(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "QrModule";
    }
    @ReactMethod(isBlockingSynchronousMethod = true)
    public void openQrScanner() {
        Intent intent = new Intent(this.getReactApplicationContext(), QrScannerActivity.class);
        this.getReactApplicationContext().startActivityForResult(intent, 100, new Bundle());
    }
}