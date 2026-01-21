# 🔐 Keystore 설정 가이드

## ✅ 현재 상태
- ✅ `keystore.properties` 생성됨
- ✅ `.gitignore`에 keystore 파일 추가됨
- ✅ `app/build.gradle.kts`에 signing config 추가됨
- ⏳ keystore 파일 생성 필요

---

## 📋 Keystore 생성 방법

### **방법 1: Android Studio 사용 (권장)** 🎯

1. **Android Studio 열기**
   - `D:\1000_b_project\happy_sentences` 프로젝트 열기

2. **Build > Generate Signed Bundle / APK 클릭**
   
3. **"Android App Bundle" 또는 "APK" 선택**
   - APK 권장 (테스트용)

4. **"Create new..." 클릭**
   - **Key store path**: `D:\1000_b_project\happy_sentences\happy-sentences-release.keystore`
   - **Password**: `HappySentences2026!`
   - **Alias**: `happy-sentences`
   - **Alias password**: `HappySentences2026!`
   - **Validity (years)**: `25`
   - **Certificate**:
     - First and Last Name: `Happy Sentences`
     - Organizational Unit: `Development`
     - Organization: `Happy Sentences`
     - City or Locality: `Seoul`
     - State or Province: `Seoul`
     - Country Code: `KR`

5. **OK 클릭**
   - keystore 파일이 생성됩니다!

---

### **방법 2: 명령줄 사용 (수동)** 💻

JDK가 설치되어 있다면 다음 명령어를 실행하세요:

```bash
# PowerShell에서 실행
cd D:\1000_b_project\happy_sentences

# JDK 경로 확인 (Android Studio 포함)
# 예: C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe

# Keystore 생성
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v `
  -keystore happy-sentences-release.keystore `
  -alias happy-sentences `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass "HappySentences2026!" `
  -keypass "HappySentences2026!" `
  -dname "CN=Happy Sentences, OU=Development, O=Happy Sentences, L=Seoul, ST=Seoul, C=KR"
```

---

## 🔍 확인 방법

### **1. keystore 파일이 생성되었는지 확인**
```bash
ls D:\1000_b_project\happy_sentences\happy-sentences-release.keystore
```

### **2. keystore 정보 확인**
```bash
keytool -list -v -keystore happy-sentences-release.keystore -storepass "HappySentences2026!"
```

---

## 📦 Release APK 빌드

Keystore가 생성되면:

```bash
# PowerShell
cd D:\1000_b_project\happy_sentences
.\gradlew assembleRelease
```

빌드된 APK 위치:
```
app\build\outputs\apk\release\app-release.apk
```

---

## 🔐 보안 주의사항

### ⚠️ **절대 금지**
- ❌ keystore 파일을 Git에 커밋
- ❌ keystore 비밀번호를 공개 저장소에 업로드
- ❌ keystore 파일을 다른 사람과 공유

### ✅ **안전하게 보관**
- ✅ keystore 파일을 안전한 곳에 백업
- ✅ 비밀번호를 별도로 안전하게 보관
- ✅ `.gitignore`에 keystore 관련 파일 추가 (이미 완료)

### 📁 **백업 권장 위치**
- Google Drive (비공개)
- USB 드라이브
- 암호화된 외장 하드

---

## 📝 현재 Keystore 정보

| 항목 | 값 |
|------|-----|
| **파일명** | `happy-sentences-release.keystore` |
| **Alias** | `happy-sentences` |
| **Store Password** | `HappySentences2026!` |
| **Key Password** | `HappySentences2026!` |
| **Algorithm** | RSA 2048 |
| **Validity** | 10,000 days (~27 years) |

---

## 🚀 Google Play 업로드

1. **Release APK 빌드**
   ```bash
   .\gradlew bundleRelease
   ```

2. **AAB 파일 위치**
   ```
   app\build\outputs\bundle\release\app-release.aab
   ```

3. **Google Play Console에서**
   - Production > Create new release
   - Upload `app-release.aab`
   - 버전 정보 입력
   - Submit for review

---

## ❓ 문제 해결

### **"keytool을 찾을 수 없습니다"**
- Android Studio의 JDK 사용:
  ```
  C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe
  ```

### **"keystore가 손상되었습니다"**
- keystore 파일을 다시 생성하세요
- 백업이 있다면 복원하세요

### **"비밀번호가 틀립니다"**
- `keystore.properties` 파일 확인
- 비밀번호: `HappySentences2026!`

---

## ✅ 완료 체크리스트

- [ ] Keystore 파일 생성 (`happy-sentences-release.keystore`)
- [ ] Keystore 파일 백업
- [ ] Release APK 빌드 테스트
- [ ] `.gitignore`에 keystore 파일 있는지 확인
- [ ] Keystore 정보 안전하게 보관

---

**다음 단계**: Keystore 생성 후 `.\gradlew assembleRelease` 명령으로 Release APK를 빌드하세요! 🚀

