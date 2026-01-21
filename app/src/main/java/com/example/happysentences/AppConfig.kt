package com.example.happysentences

object AppConfig {
    /**
     * 앱이 로드할 기본 URL
     * - DEBUG: 에뮬레이터에서 PC의 localhost:3000 접근
     * - RELEASE: Vercel 배포 URL
     */
    val BASE_URL: String
        get() = try {
            BuildConfig.BASE_URL
        } catch (e: Exception) {
            // BuildConfig 생성 전 폴백
            "https://happy-sentences.vercel.app"
        }

    /**
     * 디버그 모드 여부
     */
    val IS_DEBUG: Boolean
        get() = try {
            BuildConfig.IS_DEBUG
        } catch (e: Exception) {
            false
        }

    /**
     * 캐시 무효화를 위한 타임스탬프 쿼리스트링
     * DEBUG에서만 사용하여 매번 최신 버전을 로드
     */
    fun getUrlWithCacheBuster(): String {
        return if (IS_DEBUG) {
            "$BASE_URL/?v=${System.currentTimeMillis()}"
        } else {
            BASE_URL
        }
    }

    /**
     * 개발용: 직접 URL 지정
     * Gradle Sync 전이나 로컬 서버 문제 시 사용
     */
    fun getDirectUrl(): String {
        // 일단 Vercel URL로 직접 로드 (확실한 방법)
        return "https://happy-sentences.vercel.app"
    }
}

