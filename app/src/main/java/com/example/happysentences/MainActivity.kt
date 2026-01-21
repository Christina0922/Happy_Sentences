package com.example.happysentences

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private val TAG = "HappySentencesWebView"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // WebView 생성
        webView = WebView(this).apply {
            // WebViewClient 설정 (외부 브라우저로 열리지 않게)
            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    Log.d(TAG, "✅ Page started loading: $url")
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.d(TAG, "✅ Page finished loading: $url")
                }

                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    Log.e(TAG, "❌ WebView Error: $errorCode - $description")
                    Log.e(TAG, "❌ Failing URL: $failingUrl")
                }
            }
            
            // WebChromeClient 설정 (JavaScript alert/confirm 등 지원)
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    super.onProgressChanged(view, newProgress)
                    Log.d(TAG, "Loading progress: $newProgress%")
                }

                override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                    Log.d(TAG, "JS Console: ${consoleMessage?.message()}")
                    return true
                }
            }

            // WebSettings 설정
            settings.apply {
                // JavaScript 활성화 (필수)
                javaScriptEnabled = true
                
                // DOM Storage 활성화 (localStorage 사용)
                domStorageEnabled = true
                
                // 캐시 모드: 캐시 사용 안 함 (항상 최신 버전 로드)
                cacheMode = WebSettings.LOAD_NO_CACHE
                
                // 줌 컨트롤 비활성화
                builtInZoomControls = false
                displayZoomControls = false
                
                // 뷰포트 설정 (모바일 최적화)
                useWideViewPort = true
                loadWithOverviewMode = true
                
                // 미디어 자동 재생 허용
                mediaPlaybackRequiresUserGesture = false
                
                // 파일 접근 비활성화 (보안)
                allowFileAccess = false
                allowContentAccess = false
            }
        }

        // 기존 캐시 완전 삭제
        webView.clearCache(true)
        webView.clearHistory()
        webView.clearFormData()

        setContentView(webView)

        // URL 로드 (개발용: 직접 Vercel URL 사용)
        val url = AppConfig.getDirectUrl()
        Log.d(TAG, "=== WebView Loading START ===")
        Log.d(TAG, "Loading URL: $url")
        Log.d(TAG, "Base URL: ${AppConfig.BASE_URL}")
        Log.d(TAG, "Is Debug: ${AppConfig.IS_DEBUG}")
        Log.d(TAG, "=============================")
        
        webView.loadUrl(url)

        // 뒤로가기 버튼 처리
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    override fun onDestroy() {
        super.onDestroy()
        
        // WebView 정리
        webView.apply {
            stopLoading()
            clearCache(true)
            clearHistory()
            removeAllViews()
            destroy()
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
}
