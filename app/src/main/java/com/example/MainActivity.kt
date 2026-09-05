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
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.example.ui.theme.MyApplicationTheme
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    // Immersive full-screen display & keep screen on during gameplay
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

class BassamBridge(private val onReady: () -> Unit) {
  @JavascriptInterface
  fun onGameReady() {
    onReady()
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun BassamGameApp() {
  var reloadKey by remember { mutableIntStateOf(0) }
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }
  var isGameReadyByBridge by remember { mutableStateOf(false) }
  var isPageFinished by remember { mutableStateOf(false) }
  var splashProgress by remember { mutableFloatStateOf(0.05f) }
  var showSplash by remember { mutableStateOf(true) }

  val lifecycleOwner = LocalLifecycleOwner.current

  // Progress simulation for the splash screen so the user sees an engaging loading experience
  LaunchedEffect(reloadKey) {
    splashProgress = 0.05f
    showSplash = true
    isGameReadyByBridge = false
    isPageFinished = false

    // Step through realistic loading milestones
    val steps = listOf(
      0.25f to 400L,
      0.55f to 500L,
      0.80f to 600L,
      0.95f to 500L,
      1.0f to 300L
    )

    for ((target, waitMs) in steps) {
      delay(waitMs)
      splashProgress = target
    }

    // Wait until at least 1.0f progress is reached and webview has loaded
    while (!isPageFinished && splashProgress < 1f) {
      delay(100)
    }

    // Brief settling time at 100%
    delay(350)
    showSplash = false
  }

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
            // Using SOFTWARE layer eliminates the Mesa GPU rendernode crash in container/emulator environments
            // while providing smooth, crash-free 2D canvas rendering
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

            addJavascriptInterface(
              BassamBridge {
                isGameReadyByBridge = true
              },
              "AndroidBridge"
            )

            webViewClient = object : WebViewClient() {
              override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
              }

              override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                isPageFinished = true
              }

              override fun onRenderProcessGone(
                view: WebView?,
                detail: RenderProcessGoneDetail?
              ): Boolean {
                val didCrash = detail?.didCrash() ?: false
                Log.e("BassamWebView", "Render process gone (crashed=$didCrash). Cleanly recreating WebView...")
                view?.let { deadView ->
                  (deadView.parent as? ViewGroup)?.removeView(deadView)
                  try {
                    deadView.destroy()
                  } catch (_: Exception) {}
                }
                webViewInstance = null
                if (reloadKey < 3) {
                  reloadKey++
                }
                return true
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

    // Native High-Fidelity Loading Screen
    AnimatedVisibility(
      visible = showSplash,
      exit = fadeOut(tween(durationMillis = 600, easing = FastOutSlowInEasing)),
      modifier = Modifier.fillMaxSize()
    ) {
      BassamLoadingScreen(progress = splashProgress)
    }
  }
}

@Composable
fun BassamLoadingScreen(progress: Float) {
  val animatedProgress by animateFloatAsState(
    targetValue = progress.coerceIn(0f, 1f),
    animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
    label = "splash_progress"
  )

  val infiniteTransition = rememberInfiniteTransition(label = "pulse_transition")
  val pulseScale by infiniteTransition.animateFloat(
    initialValue = 0.97f,
    targetValue = 1.03f,
    animationSpec = infiniteRepeatable(
      animation = tween(1000, easing = FastOutSlowInEasing),
      repeatMode = RepeatMode.Reverse
    ),
    label = "pulse_scale"
  )

  val currentMessage = when {
    animatedProgress < 0.25f -> "جاري تجهيز شوارع بغداد التراثية... 🏙️"
    animatedProgress < 0.55f -> "تحميل أزياء بسام والعملات الذهبية... 🪙"
    animatedProgress < 0.80f -> "«يا بسام... أسرع قبل ما يصيدك!» 💨"
    animatedProgress < 0.95f -> "ضبط المؤثرات الصوتية والعوائق... 🎵"
    else -> "جاهز للانطلاق! 🚀"
  }

  val bgBrush = Brush.verticalGradient(
    listOf(
      androidx.compose.ui.graphics.Color(0xFF0D1424),
      androidx.compose.ui.graphics.Color(0xFF0B0F19),
      androidx.compose.ui.graphics.Color(0xFF1E130B)
    )
  )

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(bgBrush)
      .testTag("bassam_loading_screen")
      .padding(24.dp),
    contentAlignment = Alignment.Center
  ) {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center,
      modifier = Modifier.fillMaxWidth()
    ) {
      // Character Avatar with glowing pulse
      Box(
        modifier = Modifier
          .size(130.dp)
          .scale(pulseScale)
          .shadow(24.dp, shape = CircleShape, ambientColor = androidx.compose.ui.graphics.Color(0xFFF57C00), spotColor = androidx.compose.ui.graphics.Color(0xFFFFB74D))
          .border(4.dp, Brush.linearGradient(listOf(androidx.compose.ui.graphics.Color(0xFFFFA000), androidx.compose.ui.graphics.Color(0xFFE65100))), CircleShape)
          .clip(CircleShape)
          .background(androidx.compose.ui.graphics.Color(0xFF1E293B)),
        contentAlignment = Alignment.Center
      ) {
        Image(
          painter = painterResource(id = R.drawable.bassam_icon),
          contentDescription = "بسام",
          contentScale = ContentScale.Crop,
          modifier = Modifier.fillMaxSize()
        )
      }

      Spacer(modifier = Modifier.height(24.dp))

      // Game Title
      Text(
        text = "بَسَّام",
        fontSize = 42.sp,
        fontWeight = FontWeight.Black,
        color = androidx.compose.ui.graphics.Color(0xFFFFA000),
        textAlign = TextAlign.Center,
        letterSpacing = 2.sp
      )

      Text(
        text = "BASSAM RUNNER • نحشة في الشوارع",
        fontSize = 14.sp,
        fontWeight = FontWeight.Bold,
        color = androidx.compose.ui.graphics.Color(0xFFFFD54F),
        textAlign = TextAlign.Center,
        letterSpacing = 1.sp
      )

      Spacer(modifier = Modifier.height(28.dp))

      // Speech bubble
      Box(
        modifier = Modifier
          .shadow(8.dp, RoundedCornerShape(16.dp))
          .background(androidx.compose.ui.graphics.Color(0xFF1E293B), RoundedCornerShape(16.dp))
          .border(1.dp, androidx.compose.ui.graphics.Color(0xFF334155), RoundedCornerShape(16.dp))
          .padding(horizontal = 20.dp, vertical = 12.dp)
      ) {
        Text(
          text = currentMessage,
          fontSize = 15.sp,
          fontWeight = FontWeight.SemiBold,
          color = androidx.compose.ui.graphics.Color(0xFFF1F5F9),
          textAlign = TextAlign.Center
        )
      }

      Spacer(modifier = Modifier.height(36.dp))

      // Progress Bar
      Column(
        modifier = Modifier
          .fillMaxWidth(0.85f)
          .padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
      ) {
        LinearProgressIndicator(
          progress = { animatedProgress },
          modifier = Modifier
            .fillMaxWidth()
            .height(10.dp)
            .clip(RoundedCornerShape(5.dp)),
          color = androidx.compose.ui.graphics.Color(0xFFF57C00),
          trackColor = androidx.compose.ui.graphics.Color(0xFF1E293B)
        )

        Spacer(modifier = Modifier.height(10.dp))

        Text(
          text = "${(animatedProgress * 100).toInt()}%",
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold,
          color = androidx.compose.ui.graphics.Color(0xFF94A3B8)
        )
      }
    }

    // Bottom Iraqi Made Badge
    Text(
      text = "صنع في العراق 🇮🇶 | 2026",
      fontSize = 12.sp,
      fontWeight = FontWeight.Medium,
      color = androidx.compose.ui.graphics.Color(0xFF64748B),
      modifier = Modifier
        .align(Alignment.BottomCenter)
        .padding(bottom = 12.dp)
    )
  }
}

