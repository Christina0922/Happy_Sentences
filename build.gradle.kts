plugins {
    // Android Gradle Plugin
    id("com.android.application") version "8.5.2" apply false
    id("com.android.library") version "8.5.2" apply false

    // Kotlin 2.0.x
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false

    // ✅ Kotlin 2.0부터 Compose 사용 시 필수
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
}
