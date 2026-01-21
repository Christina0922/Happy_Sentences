import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    // ✅ Kotlin 2.0 + Compose 필수 플러그인
    id("org.jetbrains.kotlin.plugin.compose")
}

val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()

if (keystorePropertiesFile.exists()) {
    FileInputStream(keystorePropertiesFile).use { fis ->
        keystoreProperties.load(fis)
    }
}

android {
    namespace = "com.example.happysentences"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.happysentences"
        minSdk = 24
        targetSdk = 34

        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // ✅ BuildConfig에 값 생성(릴리즈 기본값)
        buildConfigField("String", "BASE_URL", "\"https://happy-sentences.vercel.app\"")
        buildConfigField("boolean", "IS_DEBUG", "false")
    }

    buildFeatures {
        // ✅ BuildConfig 생성
        buildConfig = true
        // ✅ Compose 사용
        compose = true
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            // ✅ debug 값 덮어쓰기
            buildConfigField("String", "BASE_URL", "\"https://happy-sentences.vercel.app\"")
            buildConfigField("boolean", "IS_DEBUG", "true")
        }

        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Compose를 쓰려면 activity-compose가 필요합니다.
    implementation("androidx.activity:activity-compose:1.9.2")

    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.06.00"))

    // Compose UI
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")

    // Material3 (Theme.kt에서 흔히 사용)
    implementation("androidx.compose.material3:material3")

    // Debug tooling
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    // 기본
    implementation("androidx.core:core-ktx:1.13.1")

    // Test
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
