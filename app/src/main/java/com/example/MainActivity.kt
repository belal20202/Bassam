package com.example

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    // Immersive display & keep screen on during gameplay
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
    windowInsetsController.systemBarsBehavior =
      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())

    setContent {
      MyApplicationTheme {
        BassamGameApp()
      }
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun BassamGameApp() {
  var reloadKey by remember { mutableIntStateOf(0) }
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }
  val lifecycleOwner = LocalLifecycleOwner.current

  DisposableEffect(lifecycleOwner, webViewInstance) {
    val observer = LifecycleEventObserver { _, event ->
      when (event) {
        Lifecycle.Event.ON_RESUME -> webViewInstance?.onResume()
        Lifecycle.Event.ON_PAUSE -> webViewInstance?.onPause()
        Lifecycle.Event.ON_DESTROY -> {
          webViewInstance?.destroy()
          webViewInstance = null
        }
        else -> {}
      }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose {
      lifecycleOwner.lifecycle.removeObserver(observer)
      webViewInstance?.destroy()
      webViewInstance = null
    }
  }

  BackHandler(enabled = true) {
    val wv = webViewInstance
    if (wv != null && wv.canGoBack()) {
      wv.goBack()
    } else {
      wv?.evaluateJavascript(
        "if (window.game && window.game.state === 'playing') { window.game.pauseRun(); } else if (window.game && window.game.ui) { window.game.ui.closeAllModals(); }",
        null
      )
    }
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(androidx.compose.ui.graphics.Color(0xFF0B0F19))
      .testTag("bassam_game_container")
  ) {
    key(reloadKey) {
      AndroidView(
        modifier = Modifier
          .fillMaxSize()
          .testTag("bassam_game_webview"),
        factory = { context ->
          WebView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0B0F19"))
            // Using LAYER_TYPE_SOFTWARE prevents Mesa GPU rendernode crashes in emulators/cloud environments
            setLayerType(View.LAYER_TYPE_SOFTWARE, null)
            isFocusable = true
            isFocusableInTouchMode = true

            settings.apply {
              javaScriptEnabled = true
              domStorageEnabled = true
              databaseEnabled = true
              allowFileAccess = true
              allowContentAccess = true
              allowFileAccessFromFileURLs = true
              allowUniversalAccessFromFileURLs = true
              mediaPlaybackRequiresUserGesture = false
              cacheMode = WebSettings.LOAD_DEFAULT
              useWideViewPort = true
              loadWithOverviewMode = true
              setSupportZoom(false)
              displayZoomControls = false
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
              }
            }

            webViewClient = object : WebViewClient() {
              override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
              }

              override fun onRenderProcessGone(
                view: WebView?,
                detail: RenderProcessGoneDetail?
              ): Boolean {
                val didCrash = detail?.didCrash() ?: false
                Log.e("BassamWebView", "Render process gone (crashed=$didCrash). Recovering...")
                // Cleanup current instance to prevent leaking native resources
                view?.let { deadView ->
                  (deadView.parent as? ViewGroup)?.removeView(deadView)
                  try {
                    deadView.destroy()
                  } catch (_: Exception) {}
                }
                webViewInstance = null
                // Trigger Compose recreation of the WebView
                reloadKey++
                return true // Crucial: returning true prevents the entire app from terminating
              }
            }

            webChromeClient = object : WebChromeClient() {
              override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return super.onConsoleMessage(consoleMessage)
              }
            }

            loadUrl("file:///android_asset/index.html")
            webViewInstance = this
          }
        },
        update = { wv ->
          webViewInstance = wv
        }
      )
    }
  }
}
